/**
 * Produce a reviewable, feature-oriented split of the legacy in-game bundle.
 *
 * This is an exploration tool. It preserves source order and bytes exactly;
 * it never changes Vite inputs or production assets.
 *
 * Usage: node scripts/group-ingame.js
 */

import * as fs from "node:fs";
import * as path from "node:path";
import * as acorn from "acorn";
import { displayPath, options, projectPath } from "./lib/asset-workflow.js";

const args = options({
  input: "resources/js/ingame/e7c74974620fa35b197315ebdbb8c2.js",
  output: "tmp/ingame-grouped-chunks",
  plan: "tmp/ingame-module-plan.json",
});
const INPUT = projectPath(args.input, "input");
const OUTPUT_DIR = projectPath(args.output, "output");
const PLAN = projectPath(args.plan, "plan");
const MANIFEST = path.join(OUTPUT_DIR, "manifest.json");

const rules = [
  ["fleet", /(fleet|ship|expedition|jumpgate|phalanx|missile|recycle|espionage)/i],
  ["alliance", /(alliance|buddy|diplomac|union)/i],
  ["marketplace", /(marketplace|trader|resource.?package|buyresource|itemactivation)/i],
  ["combat", /(combat|battle|simulat|participant|rounddata)/i],
  ["galaxy", /(galaxy|planet|moon|debris|spaceobject)/i],
  ["empire", /(empire|imperium|buildlist|research|technology|techtree)/i],
  ["messages", /(message|chat|bbcode|notification|report)/i],
  ["lifeforms", /(lifeform|characterclass|graveyard|exodus|rewarding)/i],
  ["events", /(eventbox|countdown|timer|movement)/i],
  ["ui", /(overlay|tooltip|dialog|slider|sortable|paginat|loading|form|menu|tab)/i],
  ["resources", /(resource|production|energy|metal|crystal|deuterium)/i],
];

const code = fs.readFileSync(INPUT, "utf8");
const ast = acorn.parse(code, {
  ecmaVersion: 2020,
  sourceType: "script",
  locations: true,
  ranges: true,
  allowReserved: true,
  allowReturnOutsideFunction: true,
  allowImportExportEverywhere: true,
  allowHashBang: true,
});

function memberName(node) {
  if (node.type === "Identifier") return node.name;
  if (node.type === "MemberExpression") {
    const object = memberName(node.object);
    const property = node.property.type === "Identifier" ? node.property.name : "computed";
    return object ? object + "." + property : property;
  }
  return "";
}

function symbolFor(statement) {
  if (statement.type === "FunctionDeclaration") return statement.id?.name ?? "anonymous";
  if (statement.type === "VariableDeclaration") {
    return statement.declarations
      .map((declaration) => declaration.id.type === "Identifier" ? declaration.id.name : "variable")
      .join(", ");
  }
  if (statement.type === "ExpressionStatement" && statement.expression.type === "AssignmentExpression") {
    return memberName(statement.expression.left);
  }
  if (statement.type === "ExpressionStatement" && statement.expression.type === "CallExpression") {
    return "initialization";
  }
  return statement.type;
}

function classify(symbol, source) {
  for (const [feature, pattern] of rules) {
    if (pattern.test(symbol)) return feature;
  }

  const nearbySource = source.slice(0, 500);
  for (const [feature, pattern] of rules) {
    if (pattern.test(nearbySource)) return feature;
  }
  return "core";
}

function directIifeStatements(statement) {
  if (statement.type !== "ExpressionStatement") return null;

  let expression = statement.expression;
  if (expression.type === "UnaryExpression") expression = expression.argument;
  if (expression?.type !== "CallExpression") return null;

  const callee = expression.callee;
  if (callee?.type !== "FunctionExpression" || callee.body?.type !== "BlockStatement") return null;

  return callee.body.body;
}

// The source has many legacy IIFEs. Inspect their direct statements so the
// feature classifier sees real function and assignment names, but do not move
// nested code or alter execution order.
const candidateStatements = ast.body.flatMap((statement) => directIifeStatements(statement) ?? [statement]);

const statements = candidateStatements.map((statement) => {
  const symbol = symbolFor(statement);
  return {
    symbol,
    start: statement.start,
    end: statement.end,
    startLine: statement.loc.start.line,
    endLine: statement.loc.end.line,
    feature: classify(symbol, code.slice(statement.start, statement.end)),
  };
});

// Attach short unclassified bridge statements to their surrounding feature. This
// changes only the label, never execution order.
for (let index = 0; index < statements.length; index++) {
  const item = statements[index];
  if (item.feature !== "core" || item.endLine - item.startLine > 12) continue;

  const previous = statements[index - 1];
  const next = statements[index + 1];
  if (previous?.feature && previous.feature !== "core" && previous.feature === next?.feature) {
    item.feature = previous.feature;
  }
}

const groups = [];
for (const statement of statements) {
  const current = groups.at(-1);
  if (current && current.feature === statement.feature) {
    current.end = statement.end;
    current.endLine = statement.endLine;
    current.symbols.push(statement.symbol);
    current.statementCount++;
    continue;
  }

  groups.push({
    feature: statement.feature,
    start: statement.start,
    end: statement.end,
    startLine: statement.startLine,
    endLine: statement.endLine,
    symbols: [statement.symbol],
    statementCount: 1,
  });
}

const featureDescriptions = {
  alliance: "alliance and diplomacy interactions",
  combat: "combat simulation and battle presentation",
  core: "legacy bootstrap and shared compatibility code",
  empire: "empire, construction, and technology screens",
  events: "timers, event boxes, and movement updates",
  fleet: "fleet dispatch, templates, and fleet actions",
  galaxy: "galaxy, planets, moons, and debris fields",
  lifeforms: "lifeforms, classes, rewards, and graveyard screens",
  marketplace: "marketplace, items, and resource trading",
  messages: "messages, reports, chat, and notifications",
  resources: "resource display and production interactions",
  ui: "overlays, menus, forms, and reusable interface behavior",
};

function slug(value) {
  const normalized = value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
  return normalized || "legacy-section";
}

function moduleCandidates(group) {
  const ignored = new Set([
    "initialization", "expressionstatement", "ifstatement", "emptystatement",
    "variabledeclaration", "returnstatement", "function", "var", "this",
  ]);
  const sourceNames = code
    .slice(group.start, group.end)
    .match(/[A-Za-z_$][A-Za-z0-9_$]{2,}/g) ?? [];

  return [...group.symbols, ...sourceNames]
    .map(slug)
    .filter((name) => name && !ignored.has(name));
}

const usedPaths = new Set();
for (const group of groups) {
  const candidates = moduleCandidates(group);
  let moduleName = candidates[0] ?? group.feature + "-legacy";
  let pathCandidate = group.feature + "/" + moduleName + ".js";

  for (const candidate of candidates) {
    const candidatePath = group.feature + "/" + candidate + ".js";
    if (!usedPaths.has(candidatePath)) {
      moduleName = candidate;
      pathCandidate = candidatePath;
      break;
    }
  }

  // A repeated legacy fragment is uncommon. Keep the name understandable while
  // ensuring the manifest can retain execution order without numeric filenames.
  if (usedPaths.has(pathCandidate)) {
    const suffixes = ["legacy", "handlers", "integration", "helpers", "extensions"];
    const suffix = suffixes.find((value) => !usedPaths.has(group.feature + "/" + moduleName + "-" + value + ".js"));
    pathCandidate = group.feature + "/" + moduleName + "-" + (suffix ?? "fragment") + ".js";
  }

  group.module = moduleName;
  group.responsibility = featureDescriptions[group.feature];
  group.path = pathCandidate;
  usedPaths.add(pathCandidate);
}

fs.rmSync(OUTPUT_DIR, { recursive: true, force: true });
fs.mkdirSync(OUTPUT_DIR, { recursive: true });

let cursor = 0;
for (const group of groups) {
  group.source = code.slice(cursor, group.end);
  fs.mkdirSync(path.dirname(path.join(OUTPUT_DIR, group.path)), { recursive: true });
  fs.writeFileSync(path.join(OUTPUT_DIR, group.path), group.source);
  cursor = group.end;
}
if (cursor < code.length) {
  groups.at(-1).source += code.slice(cursor);
  fs.appendFileSync(path.join(OUTPUT_DIR, groups.at(-1).path), code.slice(cursor));
}

const manifest = {
  description: "Feature-oriented, source-order-preserving in-game JavaScript split",
  source: displayPath(INPUT),
  chunks: groups.map(({ source, symbols, ...group }) => ({
    ...group,
    symbols: symbols.slice(0, 30),
  })),
};
fs.writeFileSync(MANIFEST, JSON.stringify(manifest, null, 2));

const plan = {
  source: displayPath(INPUT),
  generatedAt: new Date().toISOString(),
  grouping: "AST top-level statements, symbol names, and feature keyword rules",
  caveat: "This is a review aid. Groups preserve order and may repeat when a feature is interleaved.",
  groups: manifest.chunks,
};
fs.mkdirSync(path.dirname(PLAN), { recursive: true });
fs.writeFileSync(PLAN, JSON.stringify(plan, null, 2));

const totals = new Map();
for (const group of groups) totals.set(group.feature, (totals.get(group.feature) ?? 0) + 1);
console.log("Generated " + groups.length + " ordered feature groups:");
for (const [feature, count] of [...totals.entries()].sort()) console.log("  " + feature.padEnd(14) + count);
console.log("Review plan: " + PLAN);
console.log("Chunks: " + OUTPUT_DIR);

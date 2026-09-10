import * as path from "node:path";

export function options(defaults) {
  const values = { ...defaults };
  const argumentsList = process.argv.slice(2);

  for (let index = 0; index < argumentsList.length; index++) {
    const argument = argumentsList[index];
    if (!argument.startsWith("--")) continue;

    const [key, inlineValue] = argument.slice(2).split("=", 2);
    const value = inlineValue ?? argumentsList[index + 1];
    if (inlineValue === undefined && value && !value.startsWith("--")) index++;
    values[key] = value ?? true;
  }

  return values;
}

export function projectPath(value, label) {
  const root = process.cwd();
  const resolved = path.resolve(root, value);
  const prefix = root.endsWith(path.sep) ? root : root + path.sep;

  if (resolved !== root && !resolved.startsWith(prefix)) {
    throw new Error(label + " must stay inside the project directory: " + value);
  }

  return resolved;
}

export function assetType(input, explicitType) {
  if (explicitType) return explicitType;
  if (input.endsWith(".css")) return "css";
  if (input.endsWith(".js")) return "javascript";
  return "text";
}

export function displayPath(value) {
  return path.relative(process.cwd(), value) || ".";
}

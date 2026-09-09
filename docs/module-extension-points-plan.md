# Module extension points — plan

Status: Draft

This document proposes a small set of **generic integration points** so that
modules can react to and extend core gameplay **without editing core files**.
It deliberately does not cover any specific module; it defines the reusable
mechanisms every module can build on.

The two hard requirements for everything below are:

1. **Developer experience first.** A module author should reach for one obvious,
   documented mechanism, register it in their provider with a couple of lines,
   and be done.
2. **Core must stay intact.** With no modules enabled, the game must behave
   byte-for-byte as it does today. Every mechanism must be additive, opt-in, and
   have a trivial no-op path.

---

## 1. Current state

The module system already ships:

- `nwidart/laravel-modules` v13 discovery and enable/disable state.
- Per-module routes, views, config, migrations, commands, schedules, and tests.
- A single view slot (`admin.nav`) via `OGame\Services\ModuleSlotService`.

The gaps are:

- There is **one** extension point (`admin.nav`). Nothing else exists.
- Core gameplay moments are not observable: `app/Events/` contains a single
  event (`ChatMessageSent`).
- Modules that need to act on game state have no supported place to do so, so
  the only fallback is editing core code or polling the database from a
  scheduled command.

---

## 2. Design principles

These apply to every mechanism in this plan.

1. **Reuse Laravel primitives.** Use native events/listeners and Blade wherever
   possible instead of inventing a custom hook framework. Module authors already
   know these; no new concepts to learn.
2. **Additive only.** Mechanisms observe or append. They never remove, replace,
   or reorder core behavior.
3. **Opt-in and explicit.** Nothing happens unless a module registers for it.
   Core code only ever *dispatches* or *renders*; it never knows which modules
   exist.
4. **Curated and documented.** Every extension point is a first-class, named,
   documented contract. There is no generic "hook anything anywhere" API.
5. **Stable.** Once shipped, an extension point's name and payload are backward
   compatible. New optional payload fields may be added; existing ones are not
   removed or re-typed without a deprecation path.
6. **Small surface.** Add an extension point only when there is a concrete need.
   A speculative hook framework is explicitly out of scope.

---

## 3. Proposed integration points

Three mechanisms, in order of priority. Only the third introduces genuinely new
infrastructure. A fourth category — content & domain extension points for adding
brand-new gameplay — is riskier and is covered separately in section 4.

### 3.1 Core domain events

**What.** Core code dispatches named events at well-defined gameplay moments.
Modules listen using Laravel's normal `Event::listen()` / `$listen` mechanism.

**Why this first.** It is the simplest and safest extension point:

- Zero new infrastructure: the dispatcher already exists.
- Non-breaking by construction: dispatching an event with no listeners is a
  no-op.
- Excellent DX: one `Event::listen(Event::class, Listener::class)` call in the
  module provider.

**Contract.** Every event is a plain value object in `app/Events/` (or a
sub-namespace such as `app/Events/Game/`) carrying the relevant entity IDs and,
where useful, a small payload snapshot. Events are fired **after** the state
change is committed, and listeners run synchronously inside the same request or
queue job.

**Initial set.** Ship the core set now; add the rest on demand (add the event
class and its `dispatch` call only when a module actually needs it).

**Ship now (Phase 0).**

| Event | Dispatched after | Payload |
| --- | --- | --- |
| `PlayerCreated` | a user account and its initial data exist | `User` id |
| `PlanetCreated` | a planet (or moon) is created | `Planet` id, owner id |
| `BuildingCompleted` | a building level finishes | planet id, object id, level |
| `ResearchCompleted` | a research level finishes | player id, object id, level |
| `FleetMissionArrived` | a mission reaches its destination | mission id, type |
| `BattleResolved` | a combat round/encounter concludes | mission id |

**Add on demand.**

| Event | Dispatched after | Payload |
| --- | --- | --- |
| `PlanetDestroyed` | a planet/moon is permanently removed | planet id, owner id |
| `BuildingQueued` | a building is added to the queue | planet id, object id, level |
| `ResearchQueued` | a research is added to the queue | player id, object id, level |
| `UnitQueued` | a ship/defense is added to a queue | planet id, object id, amount |
| `UnitCompleted` | a ship/defense order finishes | planet id, object id, amount |
| `FleetMissionDispatched` | a fleet mission is launched | mission id, type |
| `MessageReceived` | an in-game message is delivered | message id, recipient id |

`ChatMessageSent` stays as-is. `MessageReceived` complements it for the
recipient side.

**Out of scope for this phase.** Events for every field-level mutation
(resource deltas per tick, queue reorder, etc.). These are noisy, and modules
that need them can derive them from the coarser events plus current state.

**Naming and payload rules.**

- Past tense for "it happened" events (`PlanetCreated`), present tense only for
  the pre-existing style (`ChatMessageSent`).
- Prefer IDs over full Eloquent models in the payload so listeners never touch
  stale object state and the contract stays cheap to serialize.
- Document each event in `docs/modules.md` with its trigger point and payload.

### 3.2 Curated view slots

**What.** Extend the existing `ModuleSlotService::SLOTS` list with a small,
documented set of generic slots. No new API — modules keep calling
`ModuleSlotService::register('slot.name', fn)`.

**Why.** `admin.nav` proved the pattern. Adding more named slots is low risk and
immediately useful for admin and in-game UI extensions.

**Decision (minimal).** Ship no new slots now. The mechanism is already general:
adding a name to `ModuleSlotService::SLOTS` plus one `@moduleSlot(...)` call is
trivial and safe, so slots are added one at a time when a module actually needs
one. First candidate: `admin.dashboard` (additive cards on the admin overview).
In-game slots (e.g. `ingame.overview`) wait for a concrete need and a clean,
stable template boundary. Slots remain **append-only, HTML-only, no script
injection**, matching the existing contract.

### 3.3 Module metadata on core entities

**What.** A generic, append-only key/value store so a module can attach its own
data to core entities (players, planets, …) without touching core schema or
core model code.

**Why.** Modules frequently need to persist a small amount of state tied to a
core entity. Today the only options are:

- `ALTER` core tables in a module migration (fragile, couples module to core
  schema), or
- a module-owned lookup table keyed by entity id (works, but every module
  reinvents it).

A shared mechanism removes both problems.

**Proposed design (keep it tiny).**

- One table: `module_entity_data` with columns
  `id`, `entity_type` (e.g. `player`, `planet`), `entity_id`, `module`
  (lowercase alias), `key`, `value` (JSON), timestamps, and a unique index on
  `(entity_type, entity_id, module, key)`.
- Two helpers, exposed as an Eloquent relationship or a small service:

  ```php
  $user->moduleData('myfeature')->get('key');      // mixed|null
  $user->moduleData('myfeature')->set('key', $v);  // upsert
  $user->moduleData('myfeature')->forget('key');   // delete
  ```

- Data is namespaced by module alias, so modules can never collide or read each
  other's keys.
- Core never reads this data. It is purely a module-owned scratchpad attached to
  a core entity. This keeps the mechanism generic and non-breaking: core models
  gain a read-through helper only, no behavior.

**Decision.** Implement the helper as a small trait on the core models
(`$user->moduleData(...)`) for DX. Entity types: start with `player` and
`planet`; add `moon`, `alliance`, etc. only when needed.

**Alternative considered and rejected.** A fully generic "hooks anywhere" or
"pipeline/event-sourcing" layer. Too much machinery, too much risk, and it
violates the curated/stable principle.

---

## 4. Content & domain extension points (new gameplay features)

The mechanisms in section 3 let modules *observe* gameplay and *attach UI or
state*. They are **not** enough to add a brand-new gameplay feature — a new
resource, a new building/technology category, or a new game system. Supporting
that requires the core to expose its **content and rules** as extensible data,
not just fire events.

This is higher risk and deliberately kept out of Phases 0–2.

### 4.1 What the code currently hardcodes

These are the concrete obstacles found in core today:

- **Game objects are a closed set.** `ObjectService::getObjects()` concatenates
  six static lists (`BuildingObjects`, `StationObjects`, `ResearchObjects`,
  `MilitaryShipObjects`, `CivilShipObjects`, `DefenseObjects`). A module cannot
  register a new building, research, or unit.
- **Resource types are a closed enum.** `ResourceType` only knows
  metal/crystal/deuterium, and `Resources` is a fixed value object
  (metal/crystal/deuterium/energy). A new resource cannot be added.
- **Object types are a closed enum.** `GameObjectType` only knows
  building/station/ship/defense/research.
- **Bonuses are hardcoded.** `PlanetService::calculatePlanetBonuses()` applies a
  fixed set of position bonuses. There is no place for module-defined modifiers
  on production, cost, build time, or unit stats.
- **The in-game menu is hardcoded** in
  `resources/views/ingame/layouts/main.blade.php`. There is no registry or slot
  for adding a new page/menu entry.

### 4.2 Proposed extension points (future work, one at a time)

1. **Game-object registry.** Let modules register `GameObject`s that flow into
   `ObjectService` automatically. Needs stable, namespaced object IDs so module
   objects never collide with core IDs.
2. **Modifier / bonus pipeline.** A single, additive place where modules return
   percentage/absolute modifiers for production, cost, time, or stats. Identity
   by default (no module = no change). Riskiest item; needs a strict, additive,
   documented contract.
3. **Extensible resources.** The hardest. `Resources` and `ResourceType` become
   data-driven (or gain an "extra" bag) so modules can add a resource that
   storage, production, and UI treat generically.
4. **In-game navigation registry.** Structured menu-item registration (label,
   route, icon, order) instead of the hardcoded menu or raw HTML slots.

These are not scheduled. They are listed so the trade-offs are explicit and each
can be designed, reviewed, and shipped independently — the non-breaking
guarantee is hardest here and must be proven per extension point.

---

## 5. Developer experience

The goal is that a module author's mental model is:

> "To react to gameplay, listen to an event. To add UI, register a slot. To
> store per-entity state, use module data. Anything else means we need to add a
> new, documented extension point — not patch core."

Concrete DX requirements:

- **One registration site.** All extension-point wiring happens in the module's
  service provider (`boot()`), matching the `HelloWorld` reference.
- **Generated scaffolding.** `php artisan module:make MyFeature` already creates
  the provider. Add commented examples for registering an event listener and a
  slot so new modules start with the pattern visible.
- **One documentation page.** Extend `docs/modules.md` with an "Extension
  points" section listing every event, slot, and the metadata helper. The plan
  is to keep a single source of truth.
- **Discoverability.** `php artisan module:list` (or a new
  `php artisan ogamex:module:extension-points` command) prints the supported
  events and slots, so authors don't have to grep core code.
- **Safe failures.** Registering for an unknown slot already throws with a clear
  message listing valid slots. Keep that behavior and mirror it for any new
  registry.

---

## 6. Non-breaking guarantees

How we keep core intact while shipping these:

1. **Events.** Dispatching is the only core change. With no listeners, `dispatch`
   is a no-op. Existing code paths only gain a `->dispatch(...)` call after the
   state change is committed; no logic moves or changes.
2. **Slots.** Adding names to `ModuleSlotService::SLOTS` does not change how
   existing slots render. Empty slots render an empty string. The core template
   change is one `@moduleSlot('...')` call in an additive position.
3. **Metadata.** The new table is write-only from core's perspective. Core models
   gain an opt-in read helper; no core query, index, or behavior depends on it.
4. **Migration discipline.** The metadata table is a single new migration. No
   existing migration is edited.
5. **Rollback.** Every mechanism is removed by disabling the module. There is no
   persistent core-state change from merely installing a module.

---

## 7. Implementation phases

Ship in small, independently reviewable steps.

**Phase 0 — Events foundation (recommended first).**
Ship the six core events, wire their `dispatch` calls at the documented points,
add a `HelloWorld` listener example, and cover each event with a test asserting
it fires with the right payload. No module behavior depends on them yet.

**Phase 1 — Entity metadata.**
Add the `module_entity_data` migration + the model trait, and a `HelloWorld`
example that reads/writes a value. This is the only phase with new persistence.

**Phase 2 — Discoverability (optional).**
Add the extension-points listing command and fold the event/slot docs into
`docs/modules.md`.

**Later — Content & domain extension points.**
Design each item in section 4 separately; they are higher risk and are not
scheduled yet.

Each phase lands on its own so reviewers can validate the non-breaking
guarantees in isolation.

---

## 8. Testing strategy

- **No-op tests.** For every event and slot, a core test proves that with no
  module enabled, behavior is unchanged (e.g. empty slot output, event dispatch
  with no listeners does not error).
- **Dispatch tests.** Each event has a test that triggers the core path and
  asserts the event fired with the expected payload.
- **Module tests.** `HelloWorld` (or a dedicated fixture module) registers one
  listener and one slot; a module test asserts the listener runs and the slot
  renders. Follow the existing isolated-status-file pattern so the tracked
  `modules_statuses.json` is never modified by a test.
- **Metadata tests.** Cover upsert, overwrite, namespacing (two modules cannot
  collide), and delete.

---

## 9. Decisions

Resolved with the minimal, most-effective options:

1. **Slots.** No new slots ship now; add them on demand. First candidate:
   `admin.dashboard`.
2. **Metadata entity types.** Start with `player` and `planet`.
3. **Metadata helper.** Trait on the model (`$user->moduleData(...)`).
4. **`BattleResolved` payload.** Carry the mission id only; add a summary only
   if a listener actually needs it.
5. **Docs.** Extend `docs/modules.md` with an "Extension points" section. No
   separate events page for now.

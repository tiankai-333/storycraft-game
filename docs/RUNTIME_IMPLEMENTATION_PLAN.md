# Phase 2A Runtime Implementation Plan

## Purpose

This document is the decision-complete plan for Phase 2B: the minimum non-AI runtime implementation for **The Last Bell at Frostmere House**.

Phase 2B should make one complete session playable through code-level APIs and tests. It should not build a web UI, connect AI, introduce a database, implement saving/loading, or generalize into a reusable engine.

## Non-Goals

Phase 2B must not include:

- AI integration.
- Web frontend.
- Database.
- Save/load persistence.
- Generic engine extraction.
- Multi-adventure authoring tools.
- Runtime package publishing.
- Asset pipeline work.
- Parent workspace changes.

## Technical Choices

### Language and Runtime

Use TypeScript for `packages/shared` and `packages/game-runtime`.

Reason:

- The project architecture already names TypeScript-friendly package boundaries.
- Shared contracts and runtime state benefit from static typing.
- The future web app can consume the same types.

### Package Manager and Workspace

Use the repo's existing package manager and workspace style if already present at Phase 2B start.

If no workspace is present, Phase 2B should add a minimal root package setup only if required to run TypeScript tests. The smallest acceptable setup is:

- root `package.json`
- root `tsconfig.json`
- package-local `package.json` files only if needed by the chosen workspace style

Do not introduce a monorepo framework.

Reason:

- Phase 2B needs tests to run, but should avoid project scaffolding beyond what runtime implementation requires.

### Test Runner

Prefer the Node built-in test runner with TypeScript executed through the minimal necessary TypeScript runner/transpilation path.

If the repo already has Vitest configured by the time Phase 2B starts, use Vitest instead of adding a second test system.

Decision:

- First choice: Node test runner.
- Fallback: Vitest only if already established or if Node test runner creates more setup than Vitest in this repo.

Reason:

- The runtime is pure logic and does not need browser-like test features.
- Fewer dependencies are better for the first deterministic slice.

### Content Encoding

Encode the Phase 1A demo as a static TypeScript object in `packages/game-runtime/src/content/frostmere.ts`.

Reason:

- Strong type checking against shared contracts.
- No parser dependency.
- Easy to import in tests.
- Close to the runtime while the game shape is still small.

Do not create JSON, YAML, Markdown-derived data, or a database in Phase 2B.

## Planned File Structure

Phase 2B should only create files under `packages/shared` and `packages/game-runtime`, plus minimal root config files if needed for tests.

### `packages/shared`

Planned files:

- `packages/shared/src/ids.ts`
- `packages/shared/src/types.ts`
- `packages/shared/src/commands.ts`
- `packages/shared/src/events.ts`
- `packages/shared/src/state.ts`
- `packages/shared/src/index.ts`

Purpose:

- `ids.ts`: string literal ID unions or branded string aliases.
- `types.ts`: common primitives such as `EvidenceStrength`, `TrustLevel`, condition descriptors.
- `commands.ts`: command input/output contracts.
- `events.ts`: event and consequence contracts.
- `state.ts`: `WorldState`, visible state, quest and objective state contracts.
- `index.ts`: public exports.

Keep shared free of Frostmere-specific content if practical, except type unions may initially be broad string aliases to avoid over-design.

### `packages/game-runtime`

Planned files:

- `packages/game-runtime/src/content/frostmere.ts`
- `packages/game-runtime/src/createInitialState.ts`
- `packages/game-runtime/src/executeCommand.ts`
- `packages/game-runtime/src/getVisibleState.ts`
- `packages/game-runtime/src/commands/look.ts`
- `packages/game-runtime/src/commands/go.ts`
- `packages/game-runtime/src/commands/search.ts`
- `packages/game-runtime/src/commands/take.ts`
- `packages/game-runtime/src/commands/talk.ts`
- `packages/game-runtime/src/commands/use.ts`
- `packages/game-runtime/src/commands/inventory.ts`
- `packages/game-runtime/src/commands/accuse.ts`
- `packages/game-runtime/src/rules/conditions.ts`
- `packages/game-runtime/src/rules/endings.ts`
- `packages/game-runtime/src/rules/events.ts`
- `packages/game-runtime/src/rules/turns.ts`
- `packages/game-runtime/src/index.ts`
- `packages/game-runtime/test/runtime.test.ts`
- `packages/game-runtime/test/frostmere-paths.test.ts`

Purpose:

- `content/frostmere.ts`: static content object for rooms, exits, interactives, NPCs, items, clues, endings, and initial state.
- `createInitialState.ts`: build a fresh runtime state from content.
- `executeCommand.ts`: public command entry point and dispatcher.
- `getVisibleState.ts`: derive player-facing state from full world state.
- `commands/*`: one resolver per formal command.
- `rules/conditions.ts`: deterministic condition helpers.
- `rules/endings.ts`: ending selection and forced dawn checks.
- `rules/events.ts`: event creation helpers.
- `rules/turns.ts`: meaningful action and turn-spend helpers.
- `index.ts`: public exports.
- tests: minimum behavior and full-path coverage.

Do not create files under `apps/web`, `packages/ai-narrative`, parent directories, or old prototypes.

## Public API

Phase 2B should expose a small runtime API from `packages/game-runtime/src/index.ts`.

### `createInitialState`

Signature shape:

```text
createInitialState(adventure?: AdventureDefinition): WorldState
```

Behavior:

- Uses Frostmere content by default.
- Sets `currentRoomId` to `room_great_hall`.
- Sets `turnsRemaining` to `8`.
- Initializes inventory, clue ledger, consequence ledger, objectives, trust, NPC locations, and event log.
- Does not emit AI narration.

### `executeCommand`

Signature shape:

```text
executeCommand(state: WorldState, input: CommandInput, adventure?: AdventureDefinition): CommandResult
```

Behavior:

- Treats input as already minimally parsed into command verb and arguments.
- Validates the command.
- Applies deterministic state transitions.
- Emits structured events.
- Returns the next state plus a plain text fallback response.
- Does not mutate the input state in place.

### `getVisibleState`

Signature shape:

```text
getVisibleState(state: WorldState, adventure?: AdventureDefinition): VisibleState
```

Behavior:

- Derives what the player should see from full `WorldState`.
- Includes current room, visible exits, visible interactives, present NPCs, inventory, clues, trust, turns remaining, consequences, quest/objective status, and ending if complete.
- Does not reveal hidden culprit facts, private pressures, undiscovered clues, or unavailable items.

### Optional helper: `parseCommand`

Phase 2B may include a minimal parser if needed for tests:

```text
parseCommand(raw: string): CommandInput
```

Decision:

- Keep parser minimal and non-clever.
- Do not build natural language understanding.
- Tests can call `executeCommand` with structured input directly.

## Shared Contracts

Minimum contract shapes:

```text
CommandVerb = "look" | "go" | "search" | "take" | "talk" | "use" | "inventory" | "accuse"

CommandInput:
  verb
  target?
  topic?
  item?
  npc?
  theory?
  mode?

CommandResult:
  state
  events
  visibleState
  message
  ok
  turnSpent
```

`WorldState` minimum:

- `adventureId`
- `turnIndex`
- `turnsRemaining`
- `currentRoomId`
- `visitedRoomIds`
- `searchedInteractiveIds`
- `discoveredItemIds`
- `inventoryItemIds`
- `discoveredCluesById`
- `trustByNpcId`
- `npcRoomById`
- `questStatesById`
- `objectiveStatesById`
- `flags`
- `consequenceIds`
- `eventLog`
- `endingId`
- `isComplete`

`VisibleState` minimum:

- `currentRoom`
- `visibleExits`
- `visibleInteractives`
- `presentNpcs`
- `inventory`
- `clues`
- `trust`
- `turnsRemaining`
- `consequences`
- `objectives`
- `ending`

## Static Content Plan

Phase 2B should encode Frostmere content as one typed object:

```text
frostmereAdventure:
  meta
  rooms
  exits
  interactives
  npcs
  topicGates
  items
  clues
  quests
  objectives
  endings
  initialState
```

### Required Content IDs

Rooms:

- `room_great_hall`
- `room_study`
- `room_servants_hall`
- `room_bell_tower`
- `room_winter_garden`
- `room_coach_yard`
- `room_gatehouse`

NPCs:

- `npc_mina_arlen`
- `npc_theo_rusk`
- `npc_captain_vale`

Items:

- `item_brass_service_key`
- `item_torn_ledger_page`
- `item_soot_stained_gloves`
- `item_vial_laudanum`
- `item_cracked_bell_clapper`

Clues:

- `clue_watch_stopped_1147`
- `clue_servant_bell_after_death`
- `clue_stolen_design_motive`
- `clue_soot_marked_garden_route`
- `clue_drugged_before_fall`

Endings:

- `ending_bell_rings_true`
- `ending_snow_covers_tracks`
- `ending_apprentice_confession`

Consequences:

- `conseq_broke_mina_trust`
- `conseq_tipped_off_theo`
- `conseq_captain_rushed_case`
- `conseq_used_private_key`
- `conseq_spent_dawn_turn`
- `conseq_made_public_accusation`
- `conseq_offered_theo_mercy`

### Content Rule Style

Use named rule IDs or small condition descriptors for content-driven checks.

Examples:

- `requiresTrustAtLeast:npc_mina_arlen:2`
- `requiresItem:item_brass_service_key`
- `revealsClue:clue_watch_stopped_1147:standard`
- `recordsConsequence:conseq_tipped_off_theo`

Do not embed broad custom scripts in content for Phase 2B. If a unique rule is required, implement it as a named runtime rule and test it.

## Command Behavior

### `look`

Input:

- `{ verb: "look" }`

Execution:

- Derive visible state for current room.
- Return room description, visible exits, visible interactives, present NPCs, and immediate status.

Turn cost:

- Free.

Events:

- `looked`.

State changes:

- None, except optional event log append.

### `go`

Input:

- `{ verb: "go", target: directionOrRoomAlias }`

Execution:

- Resolve target against exits from `currentRoomId`.
- If no exit matches, return invalid movement message.
- If exit is locked, return lock reason.
- If valid, update `currentRoomId` and add to `visitedRoomIds`.

Turn cost:

- Free.

Events:

- `room_entered` on success.
- `command_rejected` or equivalent on invalid target.

State changes:

- Current room and visited rooms only.

### `search`

Input:

- `{ verb: "search", target: interactiveOrAreaAlias }`

Execution:

- Resolve target in current room.
- If target is absent, invalid, or exhausted, return no-new-information message.
- Apply target's search result.

Key Phase 2B search results:

- Great Hall body reveals `clue_watch_stopped_1147`.
- Study desk reveals `item_torn_ledger_page` and `clue_stolen_design_motive`.
- Study fireplace reveals supporting ash only if ledger page is discovered; otherwise no major clue.
- Servants' Hall private search reveals `item_brass_service_key` and records `conseq_broke_mina_trust`.
- Servants' Hall bell board reveals `clue_servant_bell_after_death`.
- Winter Garden trail reveals `clue_soot_marked_garden_route` and `item_soot_stained_gloves`.
- Coach Yard snowbank reveals `item_vial_laudanum` and `clue_drugged_before_fall` at `standard`, unless `conseq_tipped_off_theo` exists; then reveal weakened clue at `weak`.
- Bell Tower clapper mount reveals `item_cracked_bell_clapper` and staging clue.

Turn cost:

- Costs 1 turn only when valid and meaningful.

Events:

- `search_resolved`.
- `item_discovered` as needed.
- `clue_discovered` or `clue_strength_changed` as needed.
- `consequence_recorded` as needed.
- `turn_spent` when meaningful.

### `take`

Input:

- `{ verb: "take", target: itemAlias }`

Execution:

- Resolve target against discovered carryable items.
- If valid, add item to inventory.
- If already carried, return already-have message.
- If not discovered or not carryable, reject without cost.

Turn cost:

- Free.

Events:

- `item_taken` on success.

State changes:

- Inventory only, plus event log.

### `talk`

Input:

- `{ verb: "talk", npc: npcAlias, topic?: topicAlias }`

Execution:

- NPC must be present in current room.
- Resolve topic gate.
- If no topic is provided, return available basic topics or a default response without cost.
- If topic gate is valid and meaningful, apply its effects.

Minimum Phase 2B topic gates:

- Mina about Alden: raises Mina trust from 0 to 1.
- Mina about bell: requires Mina trust at least 1 or watch clue; at trust 2 reveals `clue_servant_bell_after_death`; if trust 1, gives hint but no clue.
- Mina about key: if trust 2, reveals or grants access to tower without recording stolen-key consequence.
- Theo about designs: can raise Theo trust to 1 and hints at Study safe.
- Theo about ledger or gloves before drugging clue: records `conseq_tipped_off_theo`, moves Theo toward Gatehouse, and weakens later laudanum discovery.
- Theo at Gatehouse with enough clues: enables private confession path.
- Vale about body: can reveal bruising hint or strengthen formal path.
- Vale about report: if enough clues shared, can support formal ending; otherwise can record pressure/rush consequence.

Turn cost:

- Costs 1 turn only when valid and meaningful.

Events:

- `npc_talked`.
- `trust_changed` as needed.
- `clue_discovered` as needed.
- `consequence_recorded` as needed.
- `turn_spent` when meaningful.

### `use`

Input:

- `{ verb: "use", item: itemAlias, target?: targetAlias }`

Execution:

- Item must be in inventory unless the use rule explicitly allows discovered evidence.
- Apply item-target rule.

Minimum Phase 2B use rules:

- Brass service key on tower door/service stair sets `flags.towerUnlocked = true`.
- Torn ledger page with Theo before enough evidence records `conseq_tipped_off_theo`.
- Soot-stained gloves with Theo before motive may record `conseq_tipped_off_theo`.
- Evidence with Vale may improve formal credibility if enough clues exist.

Turn cost:

- Costs 1 turn only when valid and meaningful.

Events:

- `item_used`.
- `access_unlocked`, `consequence_recorded`, `trust_changed`, or `clue_strength_changed` as needed.
- `turn_spent` when meaningful.

### `inventory`

Input:

- `{ verb: "inventory" }`

Execution:

- Return visible inventory/status snapshot.

Turn cost:

- Free.

Events:

- Optional `inventory_checked`.

State changes:

- None, except optional event log append.

### `accuse`

Input:

- `{ verb: "accuse", npc: npcAlias, theory?: theoryText, mode?: "public" | "private" | "mercy" }`

Execution:

- Resolve NPC.
- If public accusation, record `conseq_made_public_accusation`.
- Evaluate ending rules.
- If private/mercy accusation of Theo at Gatehouse with enough clues, resolve confession ending.
- If wrong NPC, insufficient evidence, or time pressure failure, resolve weak ending.

Turn cost:

- Costs 1 turn when valid and meaningful.

Events:

- `accusation_made`.
- `consequence_recorded`.
- `ending_resolved`.
- `turn_spent` if the command resolves through a valid accusation path.

## State Transition Rules

### General

All command resolvers must:

- Treat the input state as immutable.
- Return a new state object.
- Emit deterministic events.
- Never call AI.
- Never rely on generated prose to determine facts.

### Turn Spending

When a meaningful turn-costing command succeeds:

1. Increment `turnIndex`.
2. Decrement `turnsRemaining`.
3. Emit `turn_spent`.
4. Apply any after-turn pressure rules.
5. If no ending is resolved and `turnsRemaining <= 0`, resolve forced dawn failure.

### Room Movement

Room movement:

- Does not spend a turn.
- Must validate exits from current room.
- Must check lock/access conditions.
- Great Hall/Bell Tower access requires `flags.towerUnlocked` or Mina trust at least 2.

### Searching

Search:

- Must validate the interactive is present in current room.
- Must avoid duplicate clue/item discovery.
- Repeated exhausted searches are free.
- Private search in Servants' Hall records `conseq_broke_mina_trust`.

### Taking Items

Take:

- Requires discovered item.
- Requires carryable item.
- Adds item to inventory once.
- Does not spend a turn.

### Dialogue

Talk:

- Requires NPC in current room.
- Resolves known topic gates only.
- Repeated exhausted topics are free.
- Trust remains clamped from 0 to 2.
- Topic results may reveal clues, change trust, move NPCs, or record consequences.

### Using Items

Use:

- Requires item in inventory for tool-like use.
- Evidence presentation can be modeled as use if Phase 2B chooses, but must stay deterministic.
- Valid use can unlock room access, record consequences, or strengthen evidence.

### Accusation

Accuse:

- Valid accusation is a meaningful action.
- Public accusation records `conseq_made_public_accusation`.
- Ending checks happen immediately.
- Once `isComplete` is true, later commands should be rejected or treated as post-game review only.

## Ending Resolution

Ending resolution should be centralized in `rules/endings.ts`.

Priority order:

1. Private Theo mercy/confession ending.
2. Formal Theo success ending.
3. Weak/failure ending.

### Ending A: `ending_bell_rings_true`

Trigger:

- Public `accuse` of Theo.

Required:

- Accused NPC is `npc_theo_rusk`.
- At least 4 clues at `standard` or `strong`.
- `clue_stolen_design_motive` at least `standard`.
- Staging clue from Bell Tower at least `standard`.
- Either `clue_drugged_before_fall` at least `standard` or Theo confession/culpability evidence at `strong`.

Effects:

- `endingId = ending_bell_rings_true`.
- `isComplete = true`.
- quest complete.
- emit `ending_resolved`.

### Ending B: `ending_snow_covers_tracks`

Trigger:

- Time reaches 0 with no ending.
- Accuse wrong NPC.
- Public accusation with fewer than 3 usable clues.
- Public accusation that lacks required motive/staging proof.

Required:

- Any failure trigger above.

Effects:

- `endingId = ending_snow_covers_tracks`.
- `isComplete = true`.
- quest failed or weak-complete.
- emit `ending_resolved`.

### Ending C: `ending_apprentice_confession`

Trigger:

- Private/mercy accusation or final talk with Theo at Gatehouse.

Required:

- Current room is `room_gatehouse`.
- Theo is present.
- No prior public accusation of Theo.
- At least 4 usable clues.
- `clue_stolen_design_motive` at least `standard`.
- Staging clue at least `standard`.
- Player chooses mercy/private mode.

Effects:

- record `conseq_offered_theo_mercy`.
- strengthen Theo culpability/confession evidence.
- `endingId = ending_apprentice_confession`.
- `isComplete = true`.
- quest complete with ambiguous resolution.
- emit `ending_resolved`.

## Event and Consequence Ledger Plan

Every command result should include the events emitted by that command and append them to `state.eventLog`.

Event IDs can be deterministic within a session:

```text
evt_<turnIndex>_<sequence>_<eventType>
```

Examples:

- `evt_1_1_search_resolved`
- `evt_1_2_clue_discovered`
- `evt_1_3_turn_spent`

Consequence policy:

- Consequences are stored once.
- Re-record attempts should emit no duplicate consequence.
- Consequence events should point to the existing consequence if repeated.

Command event expectations:

- `look`: `looked`.
- `go`: `room_entered` on success.
- `search`: `search_resolved`, clue/item events, consequences, `turn_spent`.
- `take`: `item_taken`.
- `talk`: `npc_talked`, trust/clue/consequence events, `turn_spent`.
- `use`: `item_used`, access/consequence/clue events, `turn_spent`.
- `inventory`: optional `inventory_checked`.
- `accuse`: `accusation_made`, consequences, `turn_spent`, `ending_resolved`.

## Tests Required for Phase 2B

### Initial State

Test:

- Starts in Great Hall.
- `turnsRemaining` is 8.
- no inventory.
- no clues.
- Mina, Theo, and Vale have expected starting rooms/trust.
- quest is active and incomplete.

### Visible State

Test:

- `getVisibleState` in Great Hall shows room name, valid exits, body/stair/tower door, and Captain Vale.
- Hidden/private facts are not exposed.

### Movement

Test:

- `go east` moves from Great Hall to Study for free.
- invalid movement is rejected and does not spend a turn.
- Bell Tower is blocked before key/trust unlock.
- Bell Tower becomes reachable after Mina trust/access or key use.

### Search and Clues

Test:

- `search body` reveals watch clue and spends 1 turn.
- repeated `search body` does not spend another turn.
- `search desk` reveals ledger item and motive clue.
- `search snowbank` reveals vial and drugging clue normally.
- if Theo is tipped off first, `search snowbank` produces weak drugging clue.

### Inventory

Test:

- `take torn ledger page` after discovery is free.
- taking undiscovered item fails free.
- taking already carried item is free and does not duplicate inventory.

### Trust and Topics

Test:

- talking to Mina about Alden raises trust.
- gated Mina bell topic reveals servant bell clue only when conditions are met.
- talking to Theo with incriminating evidence too early records `conseq_tipped_off_theo`.
- trust values clamp between 0 and 2.

### Use

Test:

- using brass key on tower door unlocks tower and spends 1 turn.
- using unavailable item fails free.
- using ledger/gloves with Theo too early records tip-off consequence.

### Turn Policy

Test:

- `look`, `go`, `take`, `inventory` are free.
- valid meaningful `search`, `talk`, `use`, `accuse` spend turns.
- invalid or exhausted meaningful commands do not spend turns.
- forced dawn weak ending occurs when turns reach 0 without another ending.

### Events and Consequences

Test:

- each meaningful command returns events and appends them to event log.
- consequences are recorded once.
- `conseq_broke_mina_trust`, `conseq_tipped_off_theo`, `conseq_used_private_key`, `conseq_made_public_accusation`, and `conseq_offered_theo_mercy` are reachable through intended paths.

### Ending Paths

Test:

- best formal route reaches `ending_bell_rings_true`.
- wrong accusation reaches `ending_snow_covers_tracks`.
- time-out reaches `ending_snow_covers_tracks`.
- private Theo Gatehouse route reaches `ending_apprentice_confession`.
- at least two endings are reachable from test playthroughs; all three should be covered if feasible.

### Public API

Test:

- `createInitialState` returns a fresh independent state each time.
- `executeCommand` does not mutate input state.
- `getVisibleState` is deterministic for the same state.

## Minimum Playthroughs for Tests

### Formal Success Route

1. `search body`
2. `go servants hall`
3. `talk mina alden`
4. `talk mina bell`
5. `go study`
6. `search desk`
7. `take torn ledger page`
8. `go winter garden`
9. `search snow trail`
10. `take soot-stained gloves`
11. `go coach yard`
12. `search snowbank`
13. `take vial of laudanum`
14. `go bell tower`
15. `search clapper mount`
16. `take cracked bell clapper`
17. `accuse theo staged murder`

Expected:

- 8 meaningful turns spent by final accusation.
- Ending A.

### Failure Route

1. `accuse mina murder`

Expected:

- Ending B.

### Mercy Route

1. Gather at least 4 usable clues.
2. Move to Gatehouse.
3. Ensure Theo is present through tip-off or late pressure rule.
4. `accuse theo mercy` or final private Theo talk.

Expected:

- Ending C.
- `conseq_offered_theo_mercy`.

## Acceptance Criteria for Phase 2B

The non-AI runtime is acceptable when:

- The runtime can start a new Frostmere session through `createInitialState`.
- All 8 commands are executable through `executeCommand`.
- `getVisibleState` exposes enough facts for a future UI or CLI harness.
- The game can be completed without AI.
- At least two endings are reachable; all three are preferred and covered by tests.
- State changes are deterministic and testable.
- The runtime owns all facts and command legality.
- Event log and consequence ledger update during play.
- Turn cost policy matches Phase 1B.
- Invalid commands and exhausted repeats do not unfairly spend turns.
- Tests cover initial state, command behavior, turn costs, clues, inventory, trust, consequences, and endings.

## Phase 2B Implementation Order

1. Add minimal package/test setup only if missing.
2. Define shared contracts.
3. Encode Frostmere static content.
4. Implement `createInitialState`.
5. Implement `getVisibleState`.
6. Implement command dispatcher and free commands.
7. Implement `search`, clue discovery, item discovery, and turn spending.
8. Implement `take`.
9. Implement `talk`, trust, and topic gates.
10. Implement `use` and tower unlock.
11. Implement `accuse` and ending resolution.
12. Add full path tests and edge-case tests.
13. Tighten public exports and documentation comments only where useful.

Stop after the non-AI runtime is testable. Do not start web or AI work in Phase 2B.

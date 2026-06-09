# Worklog: Phase 1B Data Structure Draft

Date: 2026-06-09

## Goal

Translate the Phase 1A paper design into a data structure draft that can guide a later deterministic runtime implementation.

This round was limited to documentation. It did not enter Phase 2A, write runtime code, build frontend UI, install dependencies, or create source/data files.

## This Round's Outputs

Created:

- `docs/DATA_MODEL_PHASE1.md`
- `docs/worklogs/2026-06-09_phase1b_data_model.md`

## Files Involved

Read for project and design context:

- `docs/GAME_DESIGN_PHASE1.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `AGENTS.md`

Written:

- `docs/DATA_MODEL_PHASE1.md`
- `docs/worklogs/2026-06-09_phase1b_data_model.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### Runtime Authority

The draft makes the runtime the sole authority for facts, legality, resource changes, quest state, and endings.

Reason:

- This follows the project rule that AI expression comes after deterministic state changes.
- It keeps the first playable slice testable without AI.

### AI Boundary

The draft limits future AI narrative to consuming `WorldState` snapshots and emitted `Event` records.

Reason:

- This gives AI meaningful context later.
- It prevents AI from inventing exits, inventory, quest progress, NPC state, or endings.

### Static TypeScript Object Recommendation

The draft recommends a static TypeScript object for the eventual first implementation, but does not create one.

Reason:

- It fits a TypeScript runtime and allows type checking.
- It avoids adding YAML or Markdown parsing before the game is playable.
- It keeps Phase 2 implementation simple and close to tests.

### Evidence Strength

The draft introduces `none`, `weak`, `standard`, and `strong`.

Reason:

- Phase 1A already has full and weakened clue variants, especially the laudanum clue.
- Ending checks need more nuance than discovered or not discovered.

### Turn Cost Policy

The draft keeps `go`, `look`, `take`, and `inventory` free.

It makes `search`, `talk`, `use`, and `accuse` cost a turn only when valid and meaningful.

Reason:

- This matches the Phase 1A review fix.
- It prevents parser mistakes and exhausted repeated actions from unfairly spending the dawn clock.

### No `wait` Command

The draft explicitly excludes `wait` from the first command set.

Reason:

- Review feedback required exactly 8 formal commands.
- Delay can still happen through other meaningful actions without adding a ninth command.

## Tradeoffs

### Typed Object vs. JSON/YAML

Typed object:

- Better for type checking and early tests.
- Less portable for non-developer content editing.

JSON/YAML:

- More portable as data.
- Requires validation and parsing choices earlier.

Decision:

- Recommend static TypeScript object later, while keeping this round document-only.

### Declarative Conditions vs. Custom Logic

Declarative condition descriptors:

- Easier to inspect, serialize, and test.
- May feel verbose for ending rules.

Custom logic:

- Flexible.
- Easier to hide behavior in code.

Decision:

- Prefer simple named/declarative conditions first. If custom logic is needed, name it as a runtime rule and test it directly.

### Clue Strength Enum vs. Numeric Score

Enum:

- Easier to read in design and tests.
- Less convenient for arithmetic.

Numeric score:

- Easier for scoring.
- Less expressive in logs and UI.

Decision:

- Recommend enum strings for the first demo.

## Validation Method

Validated the draft against the requested Phase 1B coverage list:

- Entity ID naming rules.
- Room, Exit, and Interactive.
- NPC, Trust, and Topic gate.
- Item and Inventory behavior.
- Clue and Evidence strength.
- Quest, Objective, and Ending condition.
- Exactly 8 commands: `look`, `go`, `search`, `take`, `talk`, `use`, `inventory`, `accuse`.
- WorldState snapshot.
- Event and Consequence ledger.
- Turn cost policy.
- Content encoding recommendation.
- Runtime owns facts.
- AI narrative later consumes state/events without mutation.
- First version has no `wait`, no database, and no AI.

Also checked that this round stayed documentation-only and did not create `.ts` or `.tsx` source files.

## Result

Phase 1B data structure draft is complete and ready for review.

Acceptance checklist result:

- Entity IDs: Pass.
- Room / Exit / Interactive: Pass.
- NPC / Trust / Topic gate: Pass.
- Item / Inventory behavior: Pass.
- Clue / Evidence strength: Pass.
- Quest / Objective / Ending condition: Pass.
- Exactly 8-command spec: Pass.
- WorldState snapshot: Pass.
- Event / Consequence ledger: Pass.
- Turn cost policy: Pass.
- Content encoding approach: Pass.
- Runtime authority boundary: Pass.
- AI boundary: Pass.
- No `wait`, no database, no AI: Pass.
- Documentation-only scope: Pass.

## Remaining Questions

- Should Phase 2 encode conditions as pure declarative descriptors, typed predicate functions, or a hybrid?
- Should clue strength be stored directly on clue state or derived from supporting evidence items/events?
- Should hidden consequences be visible in the UI immediately, delayed until discovery, or only visible in debug/test output?
- Should item-taking consequences remain free in every case, or should a later implementation add a distinct "force/search private" action?
- Should content IDs include the adventure prefix, such as `frostmere.room_great_hall`, before the project supports multiple adventures?

## Acceptance Criteria

This round should be accepted if:

- `docs/DATA_MODEL_PHASE1.md` gives enough structure for a later runtime implementation plan.
- The draft does not implement runtime behavior.
- The draft preserves exactly 8 first-version commands and excludes `wait`.
- The draft states the no database and no AI limits.
- The draft keeps AI narrative downstream from runtime-owned facts.
- The worklog records goal, output, involved files, validation, result, open questions, next recommendation, design decisions, tradeoffs, and acceptance criteria.

## Next Step Recommendation

Stop here for review.

After acceptance, the next implementation-planning step can define Phase 2A tasks for the non-AI runtime. Do not start Phase 2A until this data structure draft is accepted.

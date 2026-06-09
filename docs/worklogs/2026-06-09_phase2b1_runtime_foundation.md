# Worklog: Phase 2B-1 Runtime Foundation + Passive Navigation Slice

Date: 2026-06-09

## Goal

Start the deterministic non-AI runtime with the smallest foundation slice:

- TypeScript and test configuration.
- Minimal shared contracts.
- Frostmere static content subset.
- Initial world state.
- Visible state derivation.
- Base command dispatcher.
- Implement only `look`, `go`, and `inventory`.
- Tests for initial state, visible state, passive commands, and free navigation.

This round did not implement the full game.

## This Round's Changes and Outputs

Added root configuration:

- `package.json`
- `package-lock.json`
- `tsconfig.json`

Added shared runtime contracts:

- `packages/shared/src/ids.ts`
- `packages/shared/src/types.ts`
- `packages/shared/src/events.ts`
- `packages/shared/src/state.ts`
- `packages/shared/src/commands.ts`
- `packages/shared/src/index.ts`

Added game runtime foundation:

- `packages/game-runtime/src/content/frostmere.ts`
- `packages/game-runtime/src/createInitialState.ts`
- `packages/game-runtime/src/getVisibleState.ts`
- `packages/game-runtime/src/events.ts`
- `packages/game-runtime/src/executeCommand.ts`
- `packages/game-runtime/src/commands/look.ts`
- `packages/game-runtime/src/commands/go.ts`
- `packages/game-runtime/src/commands/inventory.ts`
- `packages/game-runtime/src/index.ts`

Added tests:

- `packages/game-runtime/test/runtime-foundation.test.ts`

Added this worklog:

- `docs/worklogs/2026-06-09_phase2b1_runtime_foundation.md`

## Files Involved

Read for context:

- `AGENTS.md`
- `docs/RUNTIME_IMPLEMENTATION_PLAN.md`
- `docs/DATA_MODEL_PHASE1.md`
- `docs/GAME_DESIGN_PHASE1.md`

Written:

- `package.json`
- `package-lock.json`
- `tsconfig.json`
- `packages/shared/src/ids.ts`
- `packages/shared/src/types.ts`
- `packages/shared/src/events.ts`
- `packages/shared/src/state.ts`
- `packages/shared/src/commands.ts`
- `packages/shared/src/index.ts`
- `packages/game-runtime/src/content/frostmere.ts`
- `packages/game-runtime/src/createInitialState.ts`
- `packages/game-runtime/src/getVisibleState.ts`
- `packages/game-runtime/src/events.ts`
- `packages/game-runtime/src/executeCommand.ts`
- `packages/game-runtime/src/commands/look.ts`
- `packages/game-runtime/src/commands/go.ts`
- `packages/game-runtime/src/commands/inventory.ts`
- `packages/game-runtime/src/index.ts`
- `packages/game-runtime/test/runtime-foundation.test.ts`
- `docs/worklogs/2026-06-09_phase2b1_runtime_foundation.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### TypeScript with Node Test Runner

Used TypeScript plus Node's built-in test runner.

Reason:

- Matches the Phase 2A plan.
- Keeps the runtime pure and small.
- Avoids Vitest or another external test framework.

### Minimal Dev Dependencies

Added only:

- `typescript`
- `@types/node`

Reason:

- `typescript` is required for typecheck/build scripts.
- `@types/node` is required so TypeScript can type `node:test` and `node:assert/strict`.

`package-lock.json` was included after review so future installs are reproducible and first-time `npm install` does not create an extra dirty file.

### Static Frostmere Content Subset

Encoded the first runnable content subset in `packages/game-runtime/src/content/frostmere.ts`.

Included:

- 7 room IDs and descriptions.
- Initial room.
- Basic exits.
- 5 item IDs.
- 3 NPC IDs.
- Visible interactives for passive `look`.

Reason:

- Gives navigation and visible state real content.
- Keeps search/take/talk/use/accuse details out of this foundation slice.

### Dispatcher Scope

Implemented `look`, `go`, and `inventory`.

The remaining formal commands are recognized by the type system but rejected as not implemented in this foundation slice.

Reason:

- Preserves the exact 8-command vocabulary.
- Avoids accidentally entering full gameplay implementation.

### Free Command Policy

`look`, `go`, and `inventory` do not spend investigation turns.

Reason:

- Matches Phase 1B turn policy.
- Supports passive navigation and state inspection without punishing the player.

### Immutable State Results

Command execution returns a new `WorldState` rather than mutating the input state.

Reason:

- Makes runtime behavior deterministic and testable.
- Keeps future UI integration simpler.

## Tradeoffs

### Root Config Only

Used root `package.json` and `tsconfig.json` rather than package-local configs.

Tradeoff:

- Simpler for this tiny first slice.
- Less package isolation for now.

Decision:

- Keep root-only config until package boundaries need separate build settings.

### Event Log for Passive Commands

`look`, `inventory`, valid `go`, and invalid `go` append events but do not spend turns.

Tradeoff:

- Event log records passive observations and rejected commands.
- Event log can grow from non-turn actions.

Decision:

- Keep passive events because future AI narration and debugging can consume them, while turn counters remain unchanged.

### Locked Bell Tower Exit Present but Not Unlockable

The Bell Tower exit exists and appears locked in the content, but unlock behavior is not implemented.

Tradeoff:

- The map is truthful to Phase 1A.
- Unlocking is deferred until `use`/trust mechanics arrive.

Decision:

- Keep locked exit data now; implement unlock rules later.

## Validation Commands

Installed the minimal local dev dependencies and generated a reproducible lockfile:

```text
npm install
```

Ran typecheck:

```text
npm run typecheck
```

Ran full check:

```text
npm run check
```

The full check runs:

```text
npm run typecheck
npm test
```

`npm test` runs:

```text
npm run build
node --test dist/packages/game-runtime/test/runtime-foundation.test.js
```

## Validation Results

Result: Pass.

TypeScript:

- `npm run typecheck` passed.

Build:

- `npm run build` passed through `npm test`.

Tests:

- 6 tests passed.
- 0 tests failed.

Covered:

- `createInitialState` returns independent fresh states.
- Initial visible state is Great Hall.
- `look` does not consume an investigation turn.
- `inventory` starts empty and does not consume an investigation turn.
- `go` to a valid exit changes `currentRoomId` and does not consume an investigation turn.
- `go` to an invalid exit fails and does not change room.

## Result

Phase 2B-1 foundation slice is complete and ready for review.

Implemented:

- Minimal Node/TypeScript test setup.
- Shared contracts.
- Minimal Frostmere static content.
- `createInitialState`.
- `getVisibleState`.
- `executeCommand` dispatcher.
- `look`, `go`, and `inventory`.
- Required tests.

Not implemented:

- AI.
- Web/frontend.
- Database.
- Save/load.
- `search`.
- `take`.
- `talk`.
- `use`.
- `accuse`.
- Full ending resolution.
- Generic engine abstraction.

## Remaining Questions

- Should future slices keep passive command events in the persistent event log, or return them only in `CommandResult`?
- Should locked exits be visible by default, as they are now, or visible with a separate `blockedReason` field?
- Should Phase 2B-2 implement `search` and `take` together, since search reveals items and take is free?
- Should root-only TypeScript config remain, or should package-local configs be added once more packages become active?

## Acceptance Criteria

This round should be accepted if:

- `createInitialState` returns fresh independent state.
- Initial visible state is Great Hall.
- `look`, `go`, and `inventory` run through `executeCommand`.
- `look`, `go`, and `inventory` do not consume investigation turns.
- Valid `go` changes rooms.
- Invalid `go` fails without changing rooms.
- The content subset includes 7 rooms, 5 items, and 3 NPCs.
- Tests pass.
- Typecheck/build check passes.
- No AI, web, database, save/load, or full gameplay commands were implemented.

## Next Step Recommendation

Stop here for review.

After acceptance, Phase 2B-2 should likely implement `search` and `take`, because those commands are tightly coupled through clue and item discovery. Do not proceed until this foundation slice is accepted.

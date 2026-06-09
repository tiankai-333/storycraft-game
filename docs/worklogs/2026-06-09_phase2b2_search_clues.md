# Worklog: Phase 2B-2 Search Command + Clue Discovery Slice

Date: 2026-06-09

## Goal

Implement only the `search` command as the first meaningful investigation action in the deterministic non-AI runtime.

This slice should let the player search visible interactives in the current room, discover clues, reveal item IDs for later `take`, spend investigation turns on first meaningful searches, and preserve the existing `look`, `go`, and `inventory` behavior.

## This Round's Changes and Outputs

Extended shared contracts:

- Added `ClueDefinition`.
- Added `SearchOutcome`.
- Added optional `searchOutcome` to `InteractiveDefinition`.
- Added `clues` to `AdventureDefinition`.
- Added search-related event types.

Extended Frostmere content:

- Added clue definitions.
- Added searchable outcomes to key interactives.
- Search outcomes can reveal clues and discovered item IDs.

Implemented runtime behavior:

- Added `packages/game-runtime/src/commands/search.ts`.
- Routed `search` through `executeCommand`.
- Kept `take`, `talk`, `use`, and `accuse` unimplemented.

Updated tests:

- Added `packages/game-runtime/test/search.test.ts`.
- Updated `package.json` test script to run both foundation and search test files.

Added this worklog:

- `docs/worklogs/2026-06-09_phase2b2_search_clues.md`

## Files Involved

Read for context:

- `AGENTS.md`
- `docs/RUNTIME_IMPLEMENTATION_PLAN.md`
- `docs/DATA_MODEL_PHASE1.md`
- `docs/GAME_DESIGN_PHASE1.md`
- `packages/game-runtime/src/*`
- `packages/shared/src/*`

Modified:

- `package.json`
- `packages/shared/src/types.ts`
- `packages/shared/src/events.ts`
- `packages/game-runtime/src/content/frostmere.ts`
- `packages/game-runtime/src/events.ts`
- `packages/game-runtime/src/executeCommand.ts`

Added:

- `packages/game-runtime/src/commands/search.ts`
- `packages/game-runtime/test/search.test.ts`
- `docs/worklogs/2026-06-09_phase2b2_search_clues.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### Interactive-Owned Search Outcomes

Search outcomes live directly on `InteractiveDefinition`.

Reason:

- This keeps the first clue-discovery slice simple.
- It avoids building a generic rule engine or content editor before the game is playable.
- The current need is a small deterministic content object, not a reusable authoring system.

### First Successful Search Costs One Turn

A first meaningful search increments `turnIndex`, decrements `turnsRemaining`, and returns `turnSpent: true`.

Reason:

- This matches the Phase 1B turn policy.
- It gives investigation its first real resource cost.

### Repeat Searches Are Free

Repeating an already searched interactive returns a factual already-searched message and does not spend a turn.

Reason:

- Repeating exhausted actions should not punish the player.
- The state remains stable after the first discovery.

### Current-Room Visibility Gate

`search` only resolves visible interactives in the current room.

Reason:

- The runtime owns command legality.
- Cross-room searches should not discover facts or spend turns.

### Zero-Turn Rejection

If `turnsRemaining` is already `0`, meaningful search is rejected before clue or item discovery.

Reason:

- The dawn clock must gate investigation progress.
- This avoids late-state mutation after time has run out.

### Item Discovery Without Take

Search can add IDs to `discoveredItemIds`, but never to `inventoryItemIds`.

Reason:

- This prepares `take` for the next slice without implementing it early.
- It preserves this round's boundary.

## Tradeoffs

### Six Clue Definitions Instead of Exactly Five

The content now includes the five Phase 1A clue-list clues plus `clue_tower_staged` for Bell Tower search.

Tradeoff:

- It slightly exceeds the minimum clue count.
- It gives the tower search a clear deterministic clue ID instead of overloading another clue.

Decision:

- Keep the extra tower-staging clue because it matches the paper design's ending requirements.

### Events for Rejected and Repeat Search

Rejected and repeated searches append events but do not spend turns or alter clue state.

Tradeoff:

- The event log records failed/passive actions.
- The event log may grow from non-progress actions.

Decision:

- Keep event logging consistent with the foundation slice.

### No Search Result Abstraction Layer

The implementation directly applies clue and item IDs from `SearchOutcome`.

Tradeoff:

- Less flexible than a rule engine.
- Much easier to test and understand for the first playable slice.

Decision:

- Avoid a generic engine abstraction until the full demo needs more complexity.

## Validation Commands

Ran the full check:

```text
npm run check
```

This runs:

```text
npm run typecheck
npm test
```

`npm test` runs:

```text
npm run build
node --test dist/packages/game-runtime/test/runtime-foundation.test.js dist/packages/game-runtime/test/search.test.js
```

## Validation Results

Result: Pass.

TypeScript:

- `npm run typecheck` passed.

Build:

- `npm run build` passed through `npm test`.

Tests:

- 12 tests passed.
- 0 tests failed.

Covered:

- The previous 6 foundation tests still pass.
- Valid current-room search discovers a clue and spends 1 investigation turn.
- Repeated search does not spend another turn or duplicate clue changes.
- Missing target search fails without spending a turn.
- Non-current-room interactive search fails.
- Search at `turnsRemaining = 0` is rejected before clue discovery.
- Search can reveal an item ID without adding it to inventory.

## Result

Phase 2B-2 search/clue discovery slice is complete and ready for review.

Implemented:

- Minimal clue definitions.
- Minimal search outcomes on content interactives.
- `search` command.
- Clue discovery.
- Item ID discovery for future `take`.
- Search events and turn spending.
- Search tests.

Not implemented:

- AI.
- Web/frontend.
- Database.
- Save/load.
- `take`.
- `talk`.
- `use`.
- `accuse`.
- Generic content editor or generalized engine abstraction.

## Remaining Questions

- Should Phase 2B-3 implement `take` next, now that search can reveal item IDs?
- Should repeated search events stay in the persistent event log, or should they be transient command results only?
- Should `clue_tower_staged` remain as a sixth clue ID, or should it be folded into an existing clue before ending logic arrives?
- Should future search outcomes support weakened clues now, or wait until Theo/tip-off behavior is implemented?

## Acceptance Criteria

This round should be accepted if:

- `search` is implemented through `executeCommand`.
- `search` only resolves current-room visible interactives.
- First meaningful search discovers clue state and spends 1 turn.
- Repeat search is free and does not duplicate discovery.
- Invalid search is free and does not change clue state.
- Cross-room search is rejected.
- Zero-turn meaningful search is rejected before discovery.
- `look`, `go`, and `inventory` behavior remains intact.
- `take`, `talk`, `use`, and `accuse` remain unimplemented.
- `npm run check` passes.

## Next Step Recommendation

Stop here for review.

After acceptance, Phase 2B-3 should likely implement `take`, because `search` now reveals item IDs and the inventory loop is the smallest next deterministic gameplay step.

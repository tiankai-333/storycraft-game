# Worklog: Phase 2B-3 Take Command + Inventory Acquisition Slice

Date: 2026-06-09

## Goal

Implement only the `take` command so the runtime has a minimal item loop:

```text
search discovers item id -> take adds item to inventory -> inventory displays item
```

This round did not implement `talk`, `use`, or `accuse`, and did not add AI, frontend, database, save/load, or generic content tooling.

## This Round's Changes and Outputs

Implemented runtime behavior:

- Added `packages/game-runtime/src/commands/take.ts`.
- Routed `take` through `executeCommand`.
- Added `item_taken` as an event type.

Content adjustment:

- Marked `item_cracked_bell_clapper` as `carryable: false` so the slice has an existing non-carryable evidence item for validation.

Updated tests:

- Added `packages/game-runtime/test/take.test.ts`.
- Updated `package.json` test script to run foundation, search, and take tests.

Added this worklog:

- `docs/worklogs/2026-06-09_phase2b3_take_inventory.md`

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
- `packages/shared/src/events.ts`
- `packages/game-runtime/src/content/frostmere.ts`
- `packages/game-runtime/src/executeCommand.ts`

Added:

- `packages/game-runtime/src/commands/take.ts`
- `packages/game-runtime/test/take.test.ts`
- `docs/worklogs/2026-06-09_phase2b3_take_inventory.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### Reuse Existing Inventory State

The slice reused:

- `discoveredItemIds`
- `inventoryItemIds`
- `ItemDefinition.carryable`

Reason:

- These fields already match the Phase 1B data model.
- No new shared inventory shape was needed.

### Take Is Free

Successful `take`, failed `take`, and repeated `take` do not spend investigation turns.

Reason:

- This follows the Phase 1B turn policy.
- The cost is in discovering the item through `search`, not moving it into the inventory ledger.

### Discovered Items Stay Discovered

Taking an item leaves its ID in `discoveredItemIds` and also adds it to `inventoryItemIds`.

Reason:

- Discovery and possession are separate facts.
- This keeps state easy to inspect and avoids losing the item's discovery provenance.

### Duplicate Take Is Idempotent

Taking an item already in inventory returns a factual message and does not duplicate inventory state.

Reason:

- Repeated non-progress commands should be harmless.
- This mirrors the repeated-search policy.

### Existing Non-Carryable Item

`item_cracked_bell_clapper` is now `carryable: false`.

Reason:

- The request required a non-carryable item test.
- Using an existing evidence item avoided adding new content or expanding gameplay.
- The clapper can remain evidence the player records without physically carrying in this slice.

## Tradeoffs

### Item Resolution By Alias Across All Content

`take` resolves item aliases across the adventure's item definitions, then checks discovery.

Tradeoff:

- This is simple and keeps parser behavior narrow.
- It can tell the player an item is undiscovered if the alias exists in content.

Decision:

- Keep this approach until a richer parser or visible-item model is needed.

### Repeated Take Emits `item_taken`

Repeated take currently emits an `item_taken` event even though state does not change.

Tradeoff:

- The event type records the attempted inventory interaction.
- It may be worth splitting into a passive/rejected event later.

Decision:

- Keep the event behavior simple and consistent with the current event-log style.

### No Sensitive Item Consequences Yet

`take` does not record consequences for private/sensitive evidence in this slice.

Tradeoff:

- It keeps the command small.
- Future slices will need consequence rules for private evidence.

Decision:

- Defer sensitive evidence consequences until the relevant content branch or trust mechanics exist.

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
node --test dist/packages/game-runtime/test/runtime-foundation.test.js dist/packages/game-runtime/test/search.test.js dist/packages/game-runtime/test/take.test.js
```

## Validation Results

Result: Pass.

TypeScript:

- `npm run typecheck` passed.

Build:

- `npm run build` passed through `npm test`.

Tests:

- 18 tests passed.
- 0 tests failed.

Covered:

- The previous 12 foundation/search tests still pass.
- Search desk then take torn ledger page succeeds.
- Inventory displays the taken item.
- Taking an undiscovered item fails.
- Taking an already carried item does not duplicate inventory.
- Taking does not consume investigation turns.
- Taking a non-carryable discovered item fails.
- Empty take target fails without changing state.

## Result

Phase 2B-3 take/inventory acquisition slice is complete and ready for review.

Implemented:

- `take` command.
- Inventory acquisition from discovered items.
- Inventory visibility through existing `inventory`.
- `item_taken` event type.
- Take tests.

Not implemented:

- AI.
- Web/frontend.
- Database.
- Save/load.
- `talk`.
- `use`.
- `accuse`.
- Generic content editor or generalized engine abstraction.

## Remaining Questions

- Should repeated take emit `item_taken`, `inventory_checked`, or a new passive event type?
- Should non-carryable evidence be displayed in a future evidence ledger separate from inventory?
- Should private/sensitive item consequences be handled in `take`, `search`, or later `use/talk` interactions?
- Should Phase 2B-4 implement `use` next for key/tower access, or `talk` next for trust and topic gates?

## Acceptance Criteria

This round should be accepted if:

- `take` is implemented through `executeCommand`.
- `take` only succeeds for discovered items.
- `take` only succeeds for carryable items.
- Successful `take` adds the item to `inventoryItemIds`.
- Successful `take` does not remove the item from `discoveredItemIds`.
- Repeated `take` does not duplicate inventory.
- Failed `take` does not change item state.
- `take` never spends investigation turns in this slice.
- `inventory` displays taken items.
- `search` behavior remains unchanged.
- `talk`, `use`, and `accuse` remain unimplemented.
- `npm run check` passes.

## Next Step Recommendation

Stop here for review.

After acceptance, Phase 2B-4 should likely implement either `use` for key/tower access or `talk` for Mina trust gates. Do not proceed until this slice is accepted.

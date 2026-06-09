import test from "node:test";
import assert from "node:assert/strict";
import { createInitialState, executeCommand } from "../src";
import type { WorldState } from "../src";

test("search desk then take torn ledger page makes inventory show it", () => {
  const studyState = executeCommand(createInitialState(), {
    verb: "go",
    target: "east"
  }).state;
  const searched = executeCommand(studyState, {
    verb: "search",
    target: "desk"
  }).state;
  const taken = executeCommand(searched, {
    verb: "take",
    target: "torn ledger page"
  });
  const inventory = executeCommand(taken.state, { verb: "inventory" });

  assert.equal(taken.ok, true);
  assert.equal(taken.turnSpent, false);
  assert.deepEqual(taken.state.discoveredItemIds, ["item_torn_ledger_page"]);
  assert.deepEqual(taken.state.inventoryItemIds, ["item_torn_ledger_page"]);
  assert.deepEqual(
    inventory.visibleState.inventory.map((item) => item.id),
    ["item_torn_ledger_page"]
  );
  assert.match(inventory.message, /Torn Ledger Page/);
});

test("taking an undiscovered item fails without changing inventory", () => {
  const state = createInitialState();
  const result = executeCommand(state, {
    verb: "take",
    target: "torn ledger page"
  });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.deepEqual(result.state.discoveredItemIds, []);
  assert.deepEqual(result.state.inventoryItemIds, []);
});

test("taking an item already in inventory does not duplicate it", () => {
  const state: WorldState = {
    ...createInitialState(),
    discoveredItemIds: ["item_torn_ledger_page"],
    inventoryItemIds: ["item_torn_ledger_page"]
  };
  const result = executeCommand(state, {
    verb: "take",
    target: "ledger page"
  });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, false);
  assert.deepEqual(result.state.inventoryItemIds, ["item_torn_ledger_page"]);
  assert.match(result.message, /already/i);
});

test("take does not consume an investigation turn", () => {
  const state: WorldState = {
    ...createInitialState(),
    turnIndex: 2,
    turnsRemaining: 6,
    discoveredItemIds: ["item_torn_ledger_page"]
  };
  const result = executeCommand(state, {
    verb: "take",
    target: "ledger page"
  });

  assert.equal(result.ok, true);
  assert.equal(result.turnSpent, false);
  assert.equal(result.state.turnIndex, 2);
  assert.equal(result.state.turnsRemaining, 6);
});

test("taking a non-carryable discovered item fails", () => {
  const state: WorldState = {
    ...createInitialState(),
    discoveredItemIds: ["item_cracked_bell_clapper"]
  };
  const result = executeCommand(state, {
    verb: "take",
    target: "bell clapper"
  });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.deepEqual(result.state.discoveredItemIds, ["item_cracked_bell_clapper"]);
  assert.deepEqual(result.state.inventoryItemIds, []);
  assert.match(result.message, /not something you can carry/i);
});

test("empty take target fails without changing state", () => {
  const state = createInitialState();
  const result = executeCommand(state, { verb: "take" });

  assert.equal(result.ok, false);
  assert.equal(result.turnSpent, false);
  assert.deepEqual(result.state.discoveredItemIds, []);
  assert.deepEqual(result.state.inventoryItemIds, []);
});

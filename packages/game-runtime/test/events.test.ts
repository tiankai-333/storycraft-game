import { describe, it, assert, s, cmd, run, stateWithItems } from "./helpers";
import { createEvent, appendEvents } from "../src/events";

// ===========================================================================
// createEvent
// ===========================================================================
describe("createEvent", () => {
  it("creates event with correct type and sourceCommand", () => {
    const state = s();
    const evt = createEvent(state, "looked", "look", "test message");
    assert.equal(evt.type, "looked");
    assert.equal(evt.sourceCommand, "look");
  });

  it("uses current state's roomId", () => {
    const state = s();
    const evt = createEvent(state, "looked", "look", "msg");
    assert.equal(evt.roomId, "room_great_hall");
  });

  it("uses current state's turnIndex", () => {
    const state = { ...s(), turnIndex: 3 };
    const evt = createEvent(state, "looked", "look", "msg");
    assert.equal(evt.turnIndex, 3);
  });

  it("includes provided message", () => {
    const state = s();
    const evt = createEvent(state, "looked", "look", "a specific message");
    assert.equal(evt.message, "a specific message");
  });

  it("generates event IDs based on eventLog length", () => {
    const state = s();
    const evt1 = createEvent(state, "looked", "look", "msg", 1);
    const evt2 = createEvent(state, "looked", "look", "msg", 2);
    assert.ok(evt1.id.includes("looked"));
    assert.ok(evt2.id.includes("looked"));
    assert.notEqual(evt1.id, evt2.id);
  });
});

// ===========================================================================
// appendEvents
// ===========================================================================
describe("appendEvents", () => {
  it("appends events to eventLog", () => {
    const state = s();
    const events = [createEvent(state, "looked", "look", "msg")];
    const next = appendEvents(state, events);
    assert.equal(next.eventLog.length, 1);
    assert.equal(next.eventLog[0].type, "looked");
  });

  it("returns new state object (immutable)", () => {
    const state = s();
    const events = [createEvent(state, "looked", "look", "msg")];
    const next = appendEvents(state, events);
    assert.notEqual(state, next);
    assert.equal(state.eventLog.length, 0, "original should not be mutated");
  });

  it("returns same state when events array is empty", () => {
    const state = s();
    const next = appendEvents(state, []);
    assert.equal(state, next, "should return same reference for empty events");
  });
});

// ===========================================================================
// Event logging — per command integration
// ===========================================================================
describe("Event logging — per command integration", () => {
  it("look produces a 'looked' event", () => {
    const result = run(s(), cmd("look"));
    assert.equal(result.events[0].type, "looked");
  });

  it("go produces a 'room_entered' event", () => {
    const result = run(s(), cmd("go", { target: "east" }));
    assert.equal(result.events[0].type, "room_entered");
  });

  it("search produces search_resolved, clue_discovered, turn_spent events", () => {
    const result = run(s(), cmd("search", { target: "body" }));
    const types = result.events.map(e => e.type);
    assert.ok(types.includes("search_resolved"));
    assert.ok(types.includes("clue_discovered"));
    assert.ok(types.includes("turn_spent"));
  });

  it("take produces an 'item_taken' event", () => {
    let state = run(s(), cmd("go", { target: "east" })).state;
    state = run(state, cmd("search", { target: "desk" })).state;
    const result = run(state, cmd("take", { target: "ledger page" }));
    assert.equal(result.events[0].type, "item_taken");
  });

  it("inventory produces 'inventory_checked' event", () => {
    const result = run(s(), cmd("inventory"));
    assert.equal(result.events[0].type, "inventory_checked");
  });

  it("talk produces 'npc_talked' event", () => {
    let state = run(s(), cmd("go", { target: "west" })).state;
    const result = run(state, cmd("talk", { npc: "mina", topic: "alden" }));
    const types = result.events.map(e => e.type);
    assert.ok(types.includes("npc_talked"));
    assert.ok(types.includes("turn_spent"));
  });

  it("use produces 'item_used', 'turn_spent', and optionally 'access_unlocked' events", () => {
    const state = stateWithItems("item_brass_service_key");
    const result = run(state, cmd("use", { item: "key", target: "tower door" }));
    const types = result.events.map(e => e.type);
    assert.ok(types.includes("item_used"));
    assert.ok(types.includes("turn_spent"));
    assert.ok(types.includes("access_unlocked"));
  });

  it("accuse produces 'accusation_made', 'turn_spent', 'ending_resolved' events", () => {
    const result = run(s(), cmd("accuse", { npc: "mina" }));
    const types = result.events.map(e => e.type);
    assert.ok(types.includes("accusation_made"));
    assert.ok(types.includes("turn_spent"));
    assert.ok(types.includes("ending_resolved"));
  });

  it("command_rejected events are produced for failed commands", () => {
    const result = run(s(), cmd("go", { target: "up" }));
    assert.equal(result.events[0].type, "command_rejected");
  });

  it("eventLog accumulates across multiple commands", () => {
    let state = s();
    state = run(state, cmd("look")).state;
    assert.equal(state.eventLog.length, 1);
    state = run(state, cmd("go", { target: "east" })).state;
    assert.equal(state.eventLog.length, 2);
    state = run(state, cmd("look")).state;
    assert.equal(state.eventLog.length, 3);
  });

  it("event IDs are unique across the entire session", () => {
    let state = s();
    state = run(state, cmd("look")).state;
    state = run(state, cmd("look")).state;
    state = run(state, cmd("look")).state;
    const ids = state.eventLog.map(e => e.id);
    const uniqueIds = new Set(ids);
    assert.equal(ids.length, uniqueIds.size, "all event IDs should be unique");
  });
});

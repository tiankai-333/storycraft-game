import { describe, it, assert, s } from "./helpers";
import {
  recordConsequence,
  hasConsequence,
  createConsequenceEvent
} from "../src/rules/consequences";

// ===========================================================================
// recordConsequence
// ===========================================================================
describe("recordConsequence", () => {
  it("adds consequence to consequenceIds array", () => {
    const state = s();
    const next = recordConsequence(state, "conseq_tipped_off_theo" as any);
    assert.deepEqual(next.consequenceIds, ["conseq_tipped_off_theo"]);
  });

  it("does not duplicate an existing consequence", () => {
    const state = { ...s(), consequenceIds: ["conseq_tipped_off_theo" as any] };
    const next = recordConsequence(state, "conseq_tipped_off_theo" as any);
    assert.deepEqual(next.consequenceIds, ["conseq_tipped_off_theo"]);
  });

  it("returns new state object (immutable)", () => {
    const state = s();
    const next = recordConsequence(state, "conseq_tipped_off_theo" as any);
    assert.notEqual(state, next);
    assert.deepEqual(state.consequenceIds, [], "original state should not be mutated");
  });

  it("appends to end of existing array", () => {
    const state = { ...s(), consequenceIds: ["conseq_a" as any] };
    const next = recordConsequence(state, "conseq_b" as any);
    assert.deepEqual(next.consequenceIds, ["conseq_a", "conseq_b"]);
  });
});

// ===========================================================================
// hasConsequence
// ===========================================================================
describe("hasConsequence", () => {
  it("returns true when consequence exists", () => {
    const state = { ...s(), consequenceIds: ["conseq_tipped_off_theo" as any] };
    assert.equal(hasConsequence(state, "conseq_tipped_off_theo" as any), true);
  });

  it("returns false when consequence does not exist", () => {
    const state = s();
    assert.equal(hasConsequence(state, "conseq_tipped_off_theo" as any), false);
  });
});

// ===========================================================================
// createConsequenceEvent
// ===========================================================================
describe("createConsequenceEvent", () => {
  it("creates event with type consequence_recorded", () => {
    const state = s();
    const evt = createConsequenceEvent(state, "conseq_tipped_off_theo" as any, 1);
    assert.equal(evt.type, "consequence_recorded");
  });

  it("uses correct sourceCommand and message", () => {
    const state = s();
    const evt = createConsequenceEvent(state, "conseq_tipped_off_theo" as any, 1);
    assert.equal(evt.sourceCommand, "search");
    assert.equal(evt.message, "conseq_tipped_off_theo");
  });
});

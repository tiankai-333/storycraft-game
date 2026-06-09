import { describe, it, assert, frostmereAdventure, s } from "./helpers";
import {
  evaluateCondition,
  evaluateAll,
  countCluesAtLeast
} from "../src/rules/conditions";
import type { TopicCondition, WorldState, EvidenceStrength, TrustLevel } from "../../shared/src";

// Helper to build a minimal WorldState with overrides
function state(overrides: Partial<WorldState> = {}): WorldState {
  return { ...s(), ...overrides };
}

// ===========================================================================
// evaluateCondition — trust_at_least
// ===========================================================================
describe("evaluateCondition — trust_at_least", () => {
  it("returns true when trust meets minimum", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 1 } as Record<string, TrustLevel>
    });
    const cond: TopicCondition = { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 1 };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns true when trust exceeds minimum", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 2 } as Record<string, TrustLevel>
    });
    const cond: TopicCondition = { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 1 };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when trust is below minimum", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 0 } as Record<string, TrustLevel>
    });
    const cond: TopicCondition = { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 1 };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when npcId is null", () => {
    const ws = state();
    const cond: TopicCondition = { kind: "trust_at_least", npcId: null as any, minTrust: 0 };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns true when minTrust is 0 and trust is 0", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 0 } as Record<string, TrustLevel>
    });
    const cond: TopicCondition = { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 0 };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });
});

// ===========================================================================
// evaluateCondition — has_clue
// ===========================================================================
describe("evaluateCondition — has_clue", () => {
  it("returns true when clue is discovered at any strength", () => {
    const ws = state({
      discoveredCluesById: { clue_watch_stopped_1147: "standard" } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = { kind: "has_clue", clueId: "clue_watch_stopped_1147" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when clue is not discovered", () => {
    const ws = state({ discoveredCluesById: {} });
    const cond: TopicCondition = { kind: "has_clue", clueId: "clue_watch_stopped_1147" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when clueId is undefined", () => {
    const ws = state();
    const cond: TopicCondition = { kind: "has_clue", clueId: undefined as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns true when clue strength meets minStrength", () => {
    const ws = state({
      discoveredCluesById: { clue_watch_stopped_1147: "standard" } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "has_clue",
      clueId: "clue_watch_stopped_1147" as any,
      minStrength: "standard"
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when clue strength is below minStrength", () => {
    const ws = state({
      discoveredCluesById: { clue_watch_stopped_1147: "weak" } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "has_clue",
      clueId: "clue_watch_stopped_1147" as any,
      minStrength: "standard"
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("strength ordering: weak < standard < strong", () => {
    const wsWeak = state({
      discoveredCluesById: { clue_x: "weak" } as Record<string, EvidenceStrength>
    });
    const wsStrong = state({
      discoveredCluesById: { clue_x: "strong" } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "has_clue",
      clueId: "clue_x" as any,
      minStrength: "standard"
    };
    assert.equal(evaluateCondition(cond, wsWeak, frostmereAdventure), false);
    assert.equal(evaluateCondition(cond, wsStrong, frostmereAdventure), true);
  });
});

// ===========================================================================
// evaluateCondition — has_item
// ===========================================================================
describe("evaluateCondition — has_item", () => {
  it("returns true when item is in inventory", () => {
    const ws = state({
      inventoryItemIds: ["item_brass_service_key"] as any[]
    });
    const cond: TopicCondition = { kind: "has_item", itemId: "item_brass_service_key" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when item is not in inventory", () => {
    const ws = state({ inventoryItemIds: [] });
    const cond: TopicCondition = { kind: "has_item", itemId: "item_brass_service_key" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when itemId is undefined", () => {
    const ws = state();
    const cond: TopicCondition = { kind: "has_item", itemId: undefined as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateCondition — has_consequence
// ===========================================================================
describe("evaluateCondition — has_consequence", () => {
  it("returns true when consequence is recorded", () => {
    const ws = state({
      consequenceIds: ["conseq_tipped_off_theo"] as any[]
    });
    const cond: TopicCondition = { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when consequence is not recorded", () => {
    const ws = state({ consequenceIds: [] });
    const cond: TopicCondition = { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when consequenceId is undefined", () => {
    const ws = state();
    const cond: TopicCondition = { kind: "has_consequence", consequenceId: undefined as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateCondition — not_has_consequence
// ===========================================================================
describe("evaluateCondition — not_has_consequence", () => {
  it("returns true when consequence is NOT recorded", () => {
    const ws = state({ consequenceIds: [] });
    const cond: TopicCondition = { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when consequence IS recorded", () => {
    const ws = state({
      consequenceIds: ["conseq_tipped_off_theo"] as any[]
    });
    const cond: TopicCondition = { kind: "not_has_consequence", consequenceId: "conseq_tipped_off_theo" as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateCondition — flag_equals
// ===========================================================================
describe("evaluateCondition — flag_equals", () => {
  it("returns true when flag matches expected value", () => {
    const ws = state({ flags: { towerUnlocked: true } });
    const cond: TopicCondition = { kind: "flag_equals", flagKey: "towerUnlocked", flagValue: true };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when flag does not match", () => {
    const ws = state({ flags: { towerUnlocked: false } });
    const cond: TopicCondition = { kind: "flag_equals", flagKey: "towerUnlocked", flagValue: true };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when flag is not set (undefined vs false default)", () => {
    const ws = state({ flags: {} });
    const cond: TopicCondition = { kind: "flag_equals", flagKey: "towerUnlocked", flagValue: true };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("defaults flagValue to false when not specified", () => {
    const ws = state({ flags: {} });
    // flagValue defaults to false, state.flags["towerUnlocked"] is undefined,
    // and undefined !== false → false
    const cond: TopicCondition = { kind: "flag_equals", flagKey: "towerUnlocked" };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns true when flagKey is set but flagValue omitted (both false)", () => {
    const ws = state({ flags: { towerUnlocked: false } });
    const cond: TopicCondition = { kind: "flag_equals", flagKey: "towerUnlocked" };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when flagKey is null", () => {
    const ws = state({ flags: {} });
    const cond: TopicCondition = { kind: "flag_equals", flagKey: null as any, flagValue: false };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateCondition — clue_count_at_least
// ===========================================================================
describe("evaluateCondition — clue_count_at_least", () => {
  it("returns true when enough clues at minStrength or above", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "standard",
        clue_b: "standard",
        clue_c: "strong"
      } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "clue_count_at_least",
      minStrength: "standard",
      minClueCount: 3
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when not enough clues", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "standard",
        clue_b: "standard"
      } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "clue_count_at_least",
      minStrength: "standard",
      minClueCount: 3
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("defaults minStrength to standard", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "weak",
        clue_b: "standard"
      } as Record<string, EvidenceStrength>
    });
    // minStrength defaults to "standard", so only clue_b counts → count=1
    const cond: TopicCondition = {
      kind: "clue_count_at_least",
      minClueCount: 2
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("defaults minClueCount to 0 (always true)", () => {
    const ws = state({ discoveredCluesById: {} });
    const cond: TopicCondition = { kind: "clue_count_at_least" };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("counts weak clues when minStrength is weak", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "weak",
        clue_b: "standard"
      } as Record<string, EvidenceStrength>
    });
    const cond: TopicCondition = {
      kind: "clue_count_at_least",
      minStrength: "weak",
      minClueCount: 2
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });
});

// ===========================================================================
// evaluateCondition — npc_in_room
// ===========================================================================
describe("evaluateCondition — npc_in_room", () => {
  it("returns true when NPC is in specified room", () => {
    const ws = state({
      npcRoomById: { npc_mina_arlen: "room_servants_hall" } as Record<string, any>
    });
    const cond: TopicCondition = {
      kind: "npc_in_room",
      npcId: "npc_mina_arlen" as any,
      roomId: "room_servants_hall" as any
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns true when NPC is in current room (roomId omitted)", () => {
    const ws = state({
      currentRoomId: "room_great_hall",
      npcRoomById: { npc_captain_vale: "room_great_hall" } as Record<string, any>
    });
    const cond: TopicCondition = {
      kind: "npc_in_room",
      npcId: "npc_captain_vale" as any
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), true);
  });

  it("returns false when NPC is in different room", () => {
    const ws = state({
      npcRoomById: { npc_mina_arlen: "room_servants_hall" } as Record<string, any>
    });
    const cond: TopicCondition = {
      kind: "npc_in_room",
      npcId: "npc_mina_arlen" as any,
      roomId: "room_study" as any
    };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });

  it("returns false when npcId is undefined", () => {
    const ws = state();
    const cond: TopicCondition = { kind: "npc_in_room", npcId: undefined as any };
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateCondition — unknown kind
// ===========================================================================
describe("evaluateCondition — unknown kind", () => {
  it("returns false for unrecognized condition kind", () => {
    const ws = state();
    const cond = { kind: "totally_fake_kind" } as any as TopicCondition;
    assert.equal(evaluateCondition(cond, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// evaluateAll
// ===========================================================================
describe("evaluateAll", () => {
  it("returns true for empty conditions array", () => {
    assert.equal(evaluateAll([], s(), frostmereAdventure), true);
  });

  it("returns true for undefined conditions", () => {
    assert.equal(evaluateAll(undefined, s(), frostmereAdventure), true);
  });

  it("returns true when all conditions pass", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 2 } as Record<string, TrustLevel>,
      consequenceIds: ["conseq_tipped_off_theo"] as any[]
    });
    const conditions: TopicCondition[] = [
      { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 2 },
      { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" as any }
    ];
    assert.equal(evaluateAll(conditions, ws, frostmereAdventure), true);
  });

  it("returns false when any condition fails", () => {
    const ws = state({
      trustByNpcId: { npc_mina_arlen: 1 } as Record<string, TrustLevel>,
      consequenceIds: [] as any[]
    });
    const conditions: TopicCondition[] = [
      { kind: "trust_at_least", npcId: "npc_mina_arlen" as any, minTrust: 2 },
      { kind: "has_consequence", consequenceId: "conseq_tipped_off_theo" as any }
    ];
    assert.equal(evaluateAll(conditions, ws, frostmereAdventure), false);
  });
});

// ===========================================================================
// countCluesAtLeast
// ===========================================================================
describe("countCluesAtLeast", () => {
  it("counts clues at standard or above", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "standard",
        clue_b: "strong",
        clue_c: "weak"
      } as Record<string, EvidenceStrength>
    });
    assert.equal(countCluesAtLeast(ws, "standard"), 2);
  });

  it("returns 0 when no clues discovered", () => {
    const ws = state({ discoveredCluesById: {} });
    assert.equal(countCluesAtLeast(ws, "standard"), 0);
  });

  it("counts weak clues when minStrength is weak", () => {
    const ws = state({
      discoveredCluesById: {
        clue_a: "weak",
        clue_b: "standard",
        clue_c: "none"
      } as Record<string, EvidenceStrength>
    });
    assert.equal(countCluesAtLeast(ws, "weak"), 2);
  });
});

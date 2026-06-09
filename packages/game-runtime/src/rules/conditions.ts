import type {
  AdventureDefinition,
  EvidenceStrength,
  TopicCondition,
  WorldState
} from "../../../shared/src";

const STRENGTH_ORDER: EvidenceStrength[] = ["none", "weak", "standard", "strong"];

function strengthRank(s: EvidenceStrength): number {
  return STRENGTH_ORDER.indexOf(s);
}

export function evaluateCondition(
  condition: TopicCondition,
  state: WorldState,
  _adventure: AdventureDefinition
): boolean {
  switch (condition.kind) {
    case "trust_at_least":
      return (
        condition.npcId != null &&
        (state.trustByNpcId[condition.npcId] ?? 0) >= (condition.minTrust ?? 0)
      );

    case "has_clue": {
      if (!condition.clueId) return false;
      const strength = state.discoveredCluesById[condition.clueId];
      if (strength === undefined) return false;
      if (condition.minStrength) {
        return strengthRank(strength) >= strengthRank(condition.minStrength);
      }
      return true;
    }

    case "has_item":
      return (
        condition.itemId != null &&
        state.inventoryItemIds.includes(condition.itemId)
      );

    case "has_consequence":
      return (
        condition.consequenceId != null &&
        state.consequenceIds.includes(condition.consequenceId)
      );

    case "not_has_consequence":
      return (
        condition.consequenceId != null &&
        !state.consequenceIds.includes(condition.consequenceId)
      );

    case "flag_equals":
      return (
        condition.flagKey != null &&
        state.flags[condition.flagKey] === (condition.flagValue ?? false)
      );

    case "clue_count_at_least": {
      const minStrength = condition.minStrength ?? "standard";
      const minCount = condition.minClueCount ?? 0;
      const count = Object.values(state.discoveredCluesById).filter(
        (s) => strengthRank(s) >= strengthRank(minStrength)
      ).length;
      return count >= minCount;
    }

    case "npc_in_room":
      return (
        condition.npcId != null &&
        state.npcRoomById[condition.npcId] === (condition.roomId ?? state.currentRoomId)
      );

    default:
      return false;
  }
}

export function evaluateAll(
  conditions: TopicCondition[] | undefined,
  state: WorldState,
  adventure: AdventureDefinition
): boolean {
  if (!conditions || conditions.length === 0) return true;
  return conditions.every((c) => evaluateCondition(c, state, adventure));
}

export function countCluesAtLeast(
  state: WorldState,
  minStrength: EvidenceStrength
): number {
  return Object.values(state.discoveredCluesById).filter(
    (s) => strengthRank(s) >= strengthRank(minStrength)
  ).length;
}

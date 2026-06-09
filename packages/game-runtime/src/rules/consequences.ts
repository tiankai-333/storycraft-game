import type {
  ConsequenceId,
  WorldState
} from "../../../shared/src";
import { createEvent } from "../events";

export function recordConsequence(
  state: WorldState,
  consequenceId: ConsequenceId
): WorldState {
  if (state.consequenceIds.includes(consequenceId)) {
    return state;
  }
  return {
    ...state,
    consequenceIds: [...state.consequenceIds, consequenceId]
  };
}

export function hasConsequence(
  state: WorldState,
  consequenceId: ConsequenceId
): boolean {
  return state.consequenceIds.includes(consequenceId);
}

export function createConsequenceEvent(
  state: WorldState,
  consequenceId: ConsequenceId,
  sequence: number
) {
  return createEvent(state, "consequence_recorded", "search", consequenceId, sequence);
}

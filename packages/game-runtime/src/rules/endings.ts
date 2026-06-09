import type {
  AdventureDefinition,
  EndingId,
  NpcId,
  WorldState
} from "../../../shared/src";
import { evaluateAll } from "./conditions";

export interface EndingResolution {
  endingId: EndingId;
  isComplete: boolean;
}

export function evaluateAccusation(
  state: WorldState,
  adventure: AdventureDefinition,
  accusedNpcId: NpcId,
  mode?: string
): EndingResolution | null {
  const endings = adventure.endings;
  if (!endings) return null;

  // Try endings in priority order (lower priority number = higher priority)
  const sortedEndings = Object.values(endings).sort(
    (a, b) => a.priority - b.priority
  );

  for (const ending of sortedEndings) {
    if (ending.requiresNpcId && ending.requiresNpcId !== accusedNpcId) {
      continue;
    }
    if (ending.requiresMode && ending.requiresMode !== mode) {
      continue;
    }
    if (ending.requiresRoomId && ending.requiresRoomId !== state.currentRoomId) {
      continue;
    }
    if (evaluateAll(ending.conditions, state, adventure)) {
      return { endingId: ending.id, isComplete: true };
    }
  }

  return null;
}

export function resolveEnding(
  state: WorldState,
  endingId: EndingId,
  adventure: AdventureDefinition
): WorldState {
  const ending = adventure.endings?.[endingId];
  let nextState = {
    ...state,
    endingId,
    isComplete: true
  };

  // Apply ending consequence IDs
  if (ending?.consequenceIds) {
    for (const cId of ending.consequenceIds) {
      if (!nextState.consequenceIds.includes(cId)) {
        nextState = {
          ...nextState,
          consequenceIds: [...nextState.consequenceIds, cId]
        };
      }
    }
  }

  // Apply ending flag changes
  if (ending?.flagChanges) {
    nextState = {
      ...nextState,
      flags: { ...nextState.flags, ...ending.flagChanges }
    };
  }

  return nextState;
}

export function evaluateDawnForcing(state: WorldState): boolean {
  return state.turnsRemaining <= 0 && !state.endingId && !state.isComplete;
}

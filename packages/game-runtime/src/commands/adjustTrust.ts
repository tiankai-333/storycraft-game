import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  NpcId,
  TrustLevel,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeAdjustTrust(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  const npcId = input.npcId as NpcId | undefined;
  const delta = input.trustDelta;

  if (!npcId || adventure.npcs[npcId] === undefined || typeof delta !== "number") {
    return rejectAdjustTrust(state, adventure, "Invalid trust adjustment.");
  }

  const currentTrust = state.trustByNpcId[npcId] ?? 0;
  const newTrust = Math.max(0, Math.min(2, currentTrust + delta)) as TrustLevel;

  let nextState = state;
  if (newTrust !== currentTrust) {
    nextState = {
      ...state,
      trustByNpcId: {
        ...state.trustByNpcId,
        [npcId]: newTrust
      }
    };
  }

  const npcName = adventure.npcs[npcId]?.name ?? npcId;
  const message = `${npcName} trust is now ${newTrust}.`;
  const events = [createEvent(nextState, "trust_changed", "adjust_trust", message)];
  nextState = appendEvents(nextState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: false
  };
}

function rejectAdjustTrust(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "adjust_trust", message)];
  const nextState = appendEvents(state, events);
  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: false,
    turnSpent: false
  };
}

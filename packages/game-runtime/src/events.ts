import type { CommandVerb, RuntimeEvent, WorldState } from "../../shared/src";

export function createEvent(
  state: WorldState,
  type: RuntimeEvent["type"],
  sourceCommand: CommandVerb,
  message: string
): RuntimeEvent {
  return {
    id: `evt_${state.eventLog.length + 1}_${type}`,
    type,
    sourceCommand,
    roomId: state.currentRoomId,
    turnIndex: state.turnIndex,
    message
  };
}

export function appendEvents(
  state: WorldState,
  events: RuntimeEvent[]
): WorldState {
  if (events.length === 0) {
    return state;
  }

  return {
    ...state,
    eventLog: [...state.eventLog, ...events]
  };
}

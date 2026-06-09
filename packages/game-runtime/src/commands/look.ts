import type {
  AdventureDefinition,
  CommandResult,
  WorldState
} from "../../../shared/src";
import { createEvent, appendEvents } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeLook(
  state: WorldState,
  adventure: AdventureDefinition
): CommandResult {
  const visibleState = getVisibleState(state, adventure);
  const exits = visibleState.visibleExits
    .map((exit) => exit.direction)
    .join(", ");
  const npcs = visibleState.presentNpcs.map((npc) => npc.name).join(", ");
  const messageParts = [
    visibleState.currentRoom.description,
    `Exits: ${exits || "none"}.`
  ];

  if (npcs) {
    messageParts.push(`Present: ${npcs}.`);
  }

  const message = messageParts.join(" ");
  const events = [createEvent(state, "looked", "look", message)];
  const nextState = appendEvents(state, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: false
  };
}

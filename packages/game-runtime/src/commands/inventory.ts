import type {
  AdventureDefinition,
  CommandResult,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeInventory(
  state: WorldState,
  adventure: AdventureDefinition
): CommandResult {
  const visibleState = getVisibleState(state, adventure);
  const itemNames = visibleState.inventory.map((item) => item.name);
  const message =
    itemNames.length === 0
      ? "You are carrying nothing."
      : `You are carrying: ${itemNames.join(", ")}.`;
  const events = [createEvent(state, "inventory_checked", "inventory", message)];
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

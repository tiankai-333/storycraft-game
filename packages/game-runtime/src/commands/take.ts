import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  ItemDefinition,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeTake(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  const target = normalize(input.target);
  const item = findItemByAlias(adventure, target);

  if (!target || !item) {
    return rejectTake(
      state,
      adventure,
      "You need to name a known item to take."
    );
  }

  if (!state.discoveredItemIds.includes(item.id)) {
    return rejectTake(
      state,
      adventure,
      `You have not discovered ${item.name} yet.`
    );
  }

  if (!item.carryable) {
    return rejectTake(
      state,
      adventure,
      `${item.name} is evidence to note, not something you can carry.`
    );
  }

  if (state.inventoryItemIds.includes(item.id)) {
    const message = `You already have ${item.name}.`;
    const events = [createEvent(state, "item_taken", "take", message)];
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

  const takenState: WorldState = {
    ...state,
    inventoryItemIds: [...state.inventoryItemIds, item.id]
  };
  const message = `You take ${item.name}.`;
  const events = [createEvent(takenState, "item_taken", "take", message)];
  const nextState = appendEvents(takenState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: false
  };
}

function rejectTake(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "take", message)];
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

function findItemByAlias(
  adventure: AdventureDefinition,
  target: string
): ItemDefinition | undefined {
  return Object.values(adventure.items).find((item) =>
    item.aliases.some((alias) => normalize(alias) === target)
  );
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

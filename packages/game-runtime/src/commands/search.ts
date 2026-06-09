import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  InteractiveDefinition,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeSearch(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  const target = normalize(input.target);
  const interactive = findVisibleInteractiveInCurrentRoom(
    state,
    adventure,
    target
  );

  if (!target || !interactive) {
    return rejectSearch(
      state,
      adventure,
      "You do not see anything like that to search here."
    );
  }

  if (!interactive.searchOutcome) {
    return rejectSearch(
      state,
      adventure,
      `Searching ${interactive.name} reveals nothing useful right now.`
    );
  }

  if (state.searchedInteractiveIds.includes(interactive.id)) {
    const message = interactive.searchOutcome.alreadySearchedMessage;
    const events = [createEvent(state, "search_resolved", "search", message)];
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

  if (state.turnsRemaining <= 0) {
    return rejectSearch(
      state,
      adventure,
      "Dawn has arrived; there is no time left for another meaningful search."
    );
  }

  const outcome = interactive.searchOutcome;
  const discoveredCluesById = { ...state.discoveredCluesById };
  const discoveredItemIds = [...state.discoveredItemIds];

  for (const clueId of outcome.clueIds ?? []) {
    const clue = adventure.clues[clueId];
    if (!clue) {
      throw new Error(`Unknown clue in search outcome: ${clueId}`);
    }
    discoveredCluesById[clueId] = clue.defaultStrength;
  }

  for (const itemId of outcome.revealedItemIds ?? []) {
    if (!adventure.items[itemId]) {
      throw new Error(`Unknown item in search outcome: ${itemId}`);
    }
    if (!discoveredItemIds.includes(itemId)) {
      discoveredItemIds.push(itemId);
    }
  }

  const searchedState: WorldState = {
    ...state,
    turnIndex: state.turnIndex + 1,
    turnsRemaining: state.turnsRemaining - 1,
    searchedInteractiveIds: [...state.searchedInteractiveIds, interactive.id],
    discoveredCluesById,
    discoveredItemIds
  };

  const events = [
    createEvent(searchedState, "search_resolved", "search", outcome.message, 1),
    ...(outcome.clueIds ?? []).map((clueId, index) =>
      createEvent(
        searchedState,
        "clue_discovered",
        "search",
        adventure.clues[clueId].title,
        index + 2
      )
    ),
    ...(outcome.revealedItemIds ?? []).map((itemId, index) =>
      createEvent(
        searchedState,
        "item_discovered",
        "search",
        adventure.items[itemId].name,
        index + 2 + (outcome.clueIds?.length ?? 0)
      )
    ),
    createEvent(
      searchedState,
      "turn_spent",
      "search",
      "The search spends one investigation turn.",
      2 + (outcome.clueIds?.length ?? 0) + (outcome.revealedItemIds?.length ?? 0)
    )
  ];
  const nextState = appendEvents(searchedState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message: outcome.message,
    ok: true,
    turnSpent: true
  };
}

function rejectSearch(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "search", message)];
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

function findVisibleInteractiveInCurrentRoom(
  state: WorldState,
  adventure: AdventureDefinition,
  target: string
): InteractiveDefinition | undefined {
  const room = adventure.rooms[state.currentRoomId];
  return room.interactiveIds
    .map((interactiveId) => adventure.interactives[interactiveId])
    .filter((interactive) => interactive.visibleFromStart)
    .find((interactive) =>
      interactive.aliases.some((alias) => normalize(alias) === target)
    );
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

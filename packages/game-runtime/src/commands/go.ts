import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";

export function executeGo(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  const target = normalize(input.target);
  const room = adventure.rooms[state.currentRoomId];
  const exit = room.exitIds
    .map((exitId) => adventure.exits[exitId])
    .find((candidate) =>
      candidate.aliases.some((alias) => normalize(alias) === target)
    );

  if (!target || !exit) {
    const message = "You cannot go that way from here.";
    const events = [createEvent(state, "command_rejected", "go", message)];
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

  if (exit.locked && !isTowerAccessible(state, exit.id)) {
    const message = exit.failureText ?? "That way is locked.";
    const events = [createEvent(state, "command_rejected", "go", message)];
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

  const movedState: WorldState = {
    ...state,
    currentRoomId: exit.toRoomId,
    visitedRoomIds: state.visitedRoomIds.includes(exit.toRoomId)
      ? [...state.visitedRoomIds]
      : [...state.visitedRoomIds, exit.toRoomId]
  };
  const destination = adventure.rooms[exit.toRoomId];
  const message = `You enter ${destination.name}.`;
  const events = [createEvent(movedState, "room_entered", "go", message)];
  const nextState = appendEvents(movedState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: false
  };
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

const TOWER_EXIT_IDS = [
  "exit_great_hall_to_bell_tower",
  "exit_servants_hall_to_bell_tower"
];

function isTowerAccessible(state: WorldState, exitId: string): boolean {
  if (!TOWER_EXIT_IDS.includes(exitId)) return false;
  return state.flags.towerUnlocked === true || state.flags.minaGrantedAccess === true;
}

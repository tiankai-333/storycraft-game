import type {
  AdventureDefinition,
  VisibleExit,
  VisibleInteractive,
  VisibleItem,
  VisibleNpc,
  VisibleState,
  WorldState
} from "../../shared/src";
import { frostmereAdventure } from "./content/frostmere";

export function getVisibleState(
  state: WorldState,
  adventure: AdventureDefinition = frostmereAdventure
): VisibleState {
  const room = adventure.rooms[state.currentRoomId];
  if (!room) {
    throw new Error(`Unknown current room: ${state.currentRoomId}`);
  }

  const visibleExits: VisibleExit[] = room.exitIds
    .map((exitId) => adventure.exits[exitId])
    .filter((exit) => exit.visible)
    .map((exit) => ({
      id: exit.id,
      direction: exit.direction,
      toRoomId: exit.toRoomId,
      locked: exit.locked ?? false
    }));

  const visibleInteractives: VisibleInteractive[] = room.interactiveIds
    .map((interactiveId) => adventure.interactives[interactiveId])
    .filter((interactive) => interactive.visibleFromStart)
    .map((interactive) => ({
      id: interactive.id,
      name: interactive.name
    }));

  const presentNpcs: VisibleNpc[] = Object.values(adventure.npcs)
    .filter((npc) => state.npcRoomById[npc.id] === state.currentRoomId)
    .map((npc) => ({
      id: npc.id,
      name: npc.name,
      role: npc.role
    }));

  const inventory: VisibleItem[] = state.inventoryItemIds.map((itemId) => {
    const item = adventure.items[itemId];
    return {
      id: item.id,
      name: item.name,
      description: item.description
    };
  });

  return {
    currentRoom: {
      id: room.id,
      name: room.name,
      description: room.description
    },
    visibleExits,
    visibleInteractives,
    presentNpcs,
    inventory,
    clues: { ...state.discoveredCluesById },
    trust: { ...state.trustByNpcId },
    turnsRemaining: state.turnsRemaining,
    consequences: [...state.consequenceIds],
    objectives: { ...state.objectiveStatesById },
    ending: state.endingId
  };
}

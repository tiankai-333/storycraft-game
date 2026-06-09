import type { AdventureDefinition, WorldState } from "../../shared/src";
import { frostmereAdventure } from "./content/frostmere";

export function createInitialState(
  adventure: AdventureDefinition = frostmereAdventure
): WorldState {
  const trustByNpcId = Object.fromEntries(
    Object.values(adventure.npcs).map((npc) => [npc.id, npc.initialTrust])
  );
  const npcRoomById = Object.fromEntries(
    Object.values(adventure.npcs).map((npc) => [npc.id, npc.initialRoomId])
  );

  return {
    adventureId: adventure.meta.id,
    turnIndex: 0,
    turnsRemaining: adventure.meta.initialTurnsRemaining,
    currentRoomId: adventure.meta.initialRoomId,
    visitedRoomIds: [adventure.meta.initialRoomId],
    searchedInteractiveIds: [],
    discoveredItemIds: [],
    inventoryItemIds: [],
    discoveredCluesById: {},
    trustByNpcId,
    npcRoomById,
    questStatesById: Object.fromEntries(
      Object.keys(adventure.quests ?? {}).map(id => [id, "active" as const])
    ),
    objectiveStatesById: {},
    flags: {},
    consequenceIds: [],
    eventLog: [],
    endingId: null,
    isComplete: false
  };
}

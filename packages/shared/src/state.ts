import type {
  ClueId,
  ConsequenceId,
  EndingId,
  InteractiveId,
  ItemId,
  NpcId,
  ObjectiveId,
  QuestId,
  RoomId
} from "./ids";
import type {
  EvidenceStrength,
  ExitDefinition,
  InteractiveDefinition,
  ItemDefinition,
  NpcDefinition,
  ObjectiveStatus,
  QuestStatus,
  RoomDefinition,
  TrustLevel
} from "./types";
import type { RuntimeEvent } from "./events";

export interface WorldState {
  adventureId: string;
  turnIndex: number;
  turnsRemaining: number;
  currentRoomId: RoomId;
  visitedRoomIds: RoomId[];
  searchedInteractiveIds: InteractiveId[];
  discoveredItemIds: ItemId[];
  inventoryItemIds: ItemId[];
  discoveredCluesById: Record<ClueId, EvidenceStrength>;
  trustByNpcId: Record<NpcId, TrustLevel>;
  npcRoomById: Record<NpcId, RoomId>;
  questStatesById: Record<QuestId, QuestStatus>;
  objectiveStatesById: Record<ObjectiveId, ObjectiveStatus>;
  flags: Record<string, boolean>;
  consequenceIds: ConsequenceId[];
  eventLog: RuntimeEvent[];
  endingId: EndingId | null;
  isComplete: boolean;
}

export type VisibleRoom = Pick<RoomDefinition, "id" | "name" | "description">;

export type VisibleExit = Pick<
  ExitDefinition,
  "id" | "direction" | "toRoomId" | "locked"
>;

export type VisibleInteractive = Pick<InteractiveDefinition, "id" | "name">;

export type VisibleNpc = Pick<NpcDefinition, "id" | "name" | "role">;

export type VisibleItem = Pick<ItemDefinition, "id" | "name" | "description">;

export interface VisibleState {
  currentRoom: VisibleRoom;
  visibleExits: VisibleExit[];
  visibleInteractives: VisibleInteractive[];
  presentNpcs: VisibleNpc[];
  inventory: VisibleItem[];
  clues: Record<ClueId, EvidenceStrength>;
  trust: Record<NpcId, TrustLevel>;
  turnsRemaining: number;
  consequences: ConsequenceId[];
  objectives: Record<ObjectiveId, ObjectiveStatus>;
  ending: EndingId | null;
}

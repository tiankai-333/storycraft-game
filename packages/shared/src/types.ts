import type {
  ExitId,
  InteractiveId,
  ItemId,
  NpcId,
  RoomId
} from "./ids";

export type EvidenceStrength = "none" | "weak" | "standard" | "strong";
export type QuestStatus = "inactive" | "active" | "complete" | "failed";
export type ObjectiveStatus = "hidden" | "active" | "complete" | "failed";
export type TrustLevel = 0 | 1 | 2;

export interface RoomDefinition {
  id: RoomId;
  name: string;
  description: string;
  exitIds: ExitId[];
  interactiveIds: InteractiveId[];
  tags?: string[];
}

export interface ExitDefinition {
  id: ExitId;
  fromRoomId: RoomId;
  toRoomId: RoomId;
  direction: string;
  aliases: string[];
  visible: boolean;
  locked?: boolean;
  failureText?: string;
}

export interface InteractiveDefinition {
  id: InteractiveId;
  roomId: RoomId;
  name: string;
  aliases: string[];
  visibleFromStart: boolean;
}

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  initialRoomId: RoomId;
  initialTrust: TrustLevel;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  aliases: string[];
  carryable: boolean;
}

export interface AdventureDefinition {
  meta: {
    id: string;
    title: string;
    initialRoomId: RoomId;
    initialTurnsRemaining: number;
  };
  rooms: Record<RoomId, RoomDefinition>;
  exits: Record<ExitId, ExitDefinition>;
  interactives: Record<InteractiveId, InteractiveDefinition>;
  npcs: Record<NpcId, NpcDefinition>;
  items: Record<ItemId, ItemDefinition>;
}

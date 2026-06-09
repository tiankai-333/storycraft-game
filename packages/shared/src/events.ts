import type { EventId, RoomId } from "./ids";
import type { CommandVerb } from "./commands";

export type EventType =
  | "looked"
  | "room_entered"
  | "inventory_checked"
  | "search_resolved"
  | "clue_discovered"
  | "item_discovered"
  | "item_taken"
  | "turn_spent"
  | "command_rejected"
  | "npc_talked"
  | "trust_changed"
  | "item_used"
  | "access_unlocked"
  | "consequence_recorded"
  | "accusation_made"
  | "ending_resolved"
  | "objective_updated"
  | "clue_strength_changed";

export interface RuntimeEvent {
  id: EventId;
  type: EventType;
  sourceCommand: CommandVerb;
  roomId: RoomId;
  turnIndex: number;
  message: string;
}

import type { EventId, RoomId } from "./ids";
import type { CommandVerb } from "./commands";

export type EventType =
  | "looked"
  | "room_entered"
  | "inventory_checked"
  | "search_resolved"
  | "clue_discovered"
  | "item_discovered"
  | "turn_spent"
  | "command_rejected";

export interface RuntimeEvent {
  id: EventId;
  type: EventType;
  sourceCommand: CommandVerb;
  roomId: RoomId;
  turnIndex: number;
  message: string;
}

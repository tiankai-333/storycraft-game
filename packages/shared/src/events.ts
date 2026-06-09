import type { EventId, RoomId } from "./ids";
import type { CommandVerb } from "./commands";

export type EventType =
  | "looked"
  | "room_entered"
  | "inventory_checked"
  | "command_rejected";

export interface RuntimeEvent {
  id: EventId;
  type: EventType;
  sourceCommand: CommandVerb;
  roomId: RoomId;
  turnIndex: number;
  message: string;
}

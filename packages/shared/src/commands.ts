import type { RuntimeEvent } from "./events";
import type { VisibleState, WorldState } from "./state";

export type CommandVerb =
  | "look"
  | "go"
  | "search"
  | "take"
  | "talk"
  | "use"
  | "inventory"
  | "accuse";

export interface CommandInput {
  verb: CommandVerb;
  target?: string;
  topic?: string;
  item?: string;
  npc?: string;
  theory?: string;
  mode?: string;
}

export interface CommandResult {
  state: WorldState;
  events: RuntimeEvent[];
  visibleState: VisibleState;
  message: string;
  ok: boolean;
  turnSpent: boolean;
}

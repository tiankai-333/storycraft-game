import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  WorldState
} from "../../shared/src";
import { executeGo } from "./commands/go";
import { executeInventory } from "./commands/inventory";
import { executeLook } from "./commands/look";
import { frostmereAdventure } from "./content/frostmere";
import { appendEvents, createEvent } from "./events";
import { getVisibleState } from "./getVisibleState";

export function executeCommand(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition = frostmereAdventure
): CommandResult {
  switch (input.verb) {
    case "look":
      return executeLook(state, adventure);
    case "go":
      return executeGo(state, input, adventure);
    case "inventory":
      return executeInventory(state, adventure);
    case "search":
    case "take":
    case "talk":
    case "use":
    case "accuse":
      return rejectUnimplemented(state, input, adventure);
    default:
      return assertNever(input.verb);
  }
}

function rejectUnimplemented(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  const message = `The ${input.verb} command is not implemented in this foundation slice.`;
  const events = [createEvent(state, "command_rejected", input.verb, message)];
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

function assertNever(value: never): never {
  throw new Error(`Unsupported command verb: ${value}`);
}

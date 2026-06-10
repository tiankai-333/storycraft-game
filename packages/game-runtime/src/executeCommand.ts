import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  WorldState
} from "../../shared/src";
import { executeAdjustTrust } from "./commands/adjustTrust";
import { executeAccuse, applyDawnEnding } from "./commands/accuse";
import { executeGo } from "./commands/go";
import { executeInventory } from "./commands/inventory";
import { executeLook } from "./commands/look";
import { executeSearch } from "./commands/search";
import { executeTake } from "./commands/take";
import { executeTalk } from "./commands/talk";
import { executeUse } from "./commands/use";
import { frostmereAdventure } from "./content/frostmere";
import { createEvent, appendEvents } from "./events";
import { getVisibleState } from "./getVisibleState";

export function executeCommand(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition = frostmereAdventure
): CommandResult {
  // Post-game: only allow free review commands
  if (state.isComplete && input.verb !== "look" && input.verb !== "inventory") {
    const message = "The investigation is over. You can only look around or check your inventory.";
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

  let result: CommandResult;

  switch (input.verb) {
    case "look":
      result = executeLook(state, adventure);
      break;
    case "go":
      result = executeGo(state, input, adventure);
      break;
    case "inventory":
      result = executeInventory(state, adventure);
      break;
    case "search":
      result = executeSearch(state, input, adventure);
      break;
    case "take":
      result = executeTake(state, input, adventure);
      break;
    case "talk":
      result = executeTalk(state, input, adventure);
      break;
    case "use":
      result = executeUse(state, input, adventure);
      break;
    case "accuse":
      result = executeAccuse(state, input, adventure);
      break;
    case "adjust_trust":
      result = executeAdjustTrust(state, input, adventure);
      break;
    default:
      result = assertNever(input.verb);
  }

  // After any turn-spending command, check for forced dawn
  if (
    result.turnSpent &&
    result.state.turnsRemaining <= 0 &&
    !result.state.endingId
  ) {
    result = applyDawnEnding(result.state, adventure);
  }

  return result;
}

function assertNever(value: never): never {
  throw new Error(`Unsupported command verb: ${value}`);
}

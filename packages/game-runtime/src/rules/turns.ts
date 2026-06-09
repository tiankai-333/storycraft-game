import type { CommandVerb, WorldState } from "../../../shared/src";

export function spendTurn(state: WorldState): WorldState {
  return {
    ...state,
    turnIndex: state.turnIndex + 1,
    turnsRemaining: Math.max(0, state.turnsRemaining - 1)
  };
}

export function isTurnBearingCommand(verb: CommandVerb): boolean {
  return verb === "search" || verb === "talk" || verb === "use" || verb === "accuse";
}

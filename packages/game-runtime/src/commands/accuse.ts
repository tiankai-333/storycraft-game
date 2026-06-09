import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  NpcId,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";
import { recordConsequence } from "../rules/consequences";
import { evaluateAccusation, resolveEnding } from "../rules/endings";

export function executeAccuse(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  if (state.isComplete) {
    return rejectAccuse(state, adventure, "The investigation is already over.");
  }

  // Resolve NPC
  const npcId = resolveNpc(input.npc, adventure);
  if (!npcId) {
    return rejectAccuse(state, adventure, "You do not know anyone by that name.");
  }

  // Check turns remaining
  if (state.turnsRemaining <= 0) {
    return rejectAccuse(
      state,
      adventure,
      "Dawn has arrived; it is too late for an accusation."
    );
  }

  // Determine mode
  const mode = normalize(input.mode);
  const isPublic = mode !== "mercy" && mode !== "private";

  // Spend turn
  let nextState: WorldState = {
    ...state,
    turnIndex: state.turnIndex + 1,
    turnsRemaining: state.turnsRemaining - 1
  };

  // Record public accusation consequence
  if (isPublic) {
    nextState = recordConsequence(nextState, "conseq_made_public_accusation");
  }

  // Record private accusation consequence
  if (mode === "private") {
    nextState = recordConsequence(nextState, "conseq_made_private_accusation");
  }

  // Mark as having accused
  nextState = {
    ...nextState,
    flags: { ...nextState.flags, accused: true }
  };

  // Evaluate ending
  const ending = evaluateAccusation(nextState, adventure, npcId, mode);

  if (ending) {
    nextState = resolveEnding(nextState, ending.endingId, adventure);

    // Mark game complete
    nextState = {
      ...nextState,
      flags: { ...nextState.flags, gameComplete: true }
    };

    const endingDef = adventure.endings?.[ending.endingId];
    const message = endingDef
      ? `${endingDef.title}: ${endingDef.summary}`
      : "The investigation reaches its conclusion.";

    const events = [
      createEvent(nextState, "accusation_made", "accuse", `You accuse ${adventure.npcs[npcId]?.name ?? "the suspect"}.`, 1),
      createEvent(nextState, "turn_spent", "accuse", "The accusation spends one investigation turn.", 2),
      createEvent(nextState, "ending_resolved", "accuse", message, 3)
    ];

    nextState = appendEvents(nextState, events);

    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: true
    };
  }

  // No ending matched — default to failure ending
  nextState = resolveEnding(nextState, "ending_snow_covers_tracks", adventure);
  nextState = {
    ...nextState,
    flags: { ...nextState.flags, gameComplete: true }
  };

  const fallbackDef = adventure.endings?.ending_snow_covers_tracks;
  const message = fallbackDef
    ? `${fallbackDef.title}: ${fallbackDef.summary}`
    : "Your accusation fails to convince. The case goes unresolved.";

  const events = [
    createEvent(nextState, "accusation_made", "accuse", `You accuse ${adventure.npcs[npcId]?.name ?? "the suspect"}, but the evidence is insufficient.`, 1),
    createEvent(nextState, "turn_spent", "accuse", "The accusation spends one investigation turn.", 2),
    createEvent(nextState, "ending_resolved", "accuse", message, 3)
  ];

  nextState = appendEvents(nextState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: true
  };
}

/**
 * Apply forced dawn ending when turns run out without resolution.
 */
export function applyDawnEnding(
  state: WorldState,
  adventure: AdventureDefinition
): CommandResult {
  let nextState = recordConsequence(state, "conseq_spent_dawn_turn");
  nextState = resolveEnding(nextState, "ending_dawn_breaks_unanswered", adventure);
  nextState = {
    ...nextState,
    flags: { ...nextState.flags, gameComplete: true }
  };

  const dawnDef = adventure.endings?.ending_dawn_breaks_unanswered;
  const message = dawnDef
    ? `${dawnDef.title}: ${dawnDef.summary}`
    : "Dawn breaks through the frost. The suspects scatter. The case goes unresolved.";

  const events = [
    createEvent(nextState, "ending_resolved", "accuse", message, 1)
  ];

  nextState = appendEvents(nextState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message,
    ok: true,
    turnSpent: false
  };
}

function rejectAccuse(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "accuse", message)];
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

function resolveNpc(
  npcInput: string | undefined,
  adventure: AdventureDefinition
): NpcId | undefined {
  if (!npcInput) return undefined;
  const normalized = npcInput.trim().toLowerCase();
  for (const npcId of Object.keys(adventure.npcs) as NpcId[]) {
    const npc = adventure.npcs[npcId];
    if (
      npc.name.toLowerCase().includes(normalized) ||
      npc.name.toLowerCase().split(" ")[0] === normalized
    ) {
      return npcId;
    }
  }
  return undefined;
}

function normalize(value: string | undefined): string {
  return value?.trim().toLowerCase() ?? "";
}

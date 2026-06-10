import type {
  AdventureDefinition,
  CommandInput,
  CommandResult,
  NpcId,
  TopicGateDefinition,
  TrustLevel,
  WorldState
} from "../../../shared/src";
import { appendEvents, createEvent } from "../events";
import { getVisibleState } from "../getVisibleState";
import { evaluateAll } from "../rules/conditions";
import { recordConsequence } from "../rules/consequences";

export function executeTalk(
  state: WorldState,
  input: CommandInput,
  adventure: AdventureDefinition
): CommandResult {
  if (state.isComplete) {
    return rejectTalk(state, adventure, "The investigation is over. There is nothing more to discuss.");
  }

  // Resolve NPC
  const npcId = resolveNpc(input.npc, state, adventure);
  if (!npcId) {
    return rejectTalk(state, adventure, "You do not see anyone by that name here.");
  }

  // Check NPC is present in current room
  if (state.npcRoomById[npcId] !== state.currentRoomId) {
    const npc = adventure.npcs[npcId];
    return rejectTalk(
      state,
      adventure,
      `${npc?.name ?? "They"} is not present in this room.`
    );
  }

  // No topic provided — return default greeting
  if (!input.topic) {
    const greetingGate = findGreetingGate(npcId, adventure);
    if (greetingGate) {
      const message = isTopicExhausted(state, greetingGate)
        ? greetingGate.repeatedResponse
        : greetingGate.response;
      const events = [createEvent(state, "npc_talked", "talk", message)];
      const nextState = appendEvents(state, events);
      return {
        state: nextState,
        events,
        visibleState: getVisibleState(nextState, adventure),
        message,
        ok: true,
        turnSpent: false
      };
    }
    const npc = adventure.npcs[npcId];
    const message = `${npc?.name ?? "They"} looks at you expectantly.`;
    const events = [createEvent(state, "npc_talked", "talk", message)];
    const nextState = appendEvents(state, events);
    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: false
    };
  }

  // Resolve topic gate
  const topicGate = resolveTopic(npcId, input.topic, adventure);
  if (!topicGate) {
    return rejectTalk(
      state,
      adventure,
      "You cannot discuss that topic with them."
    );
  }

  // Check if topic is already exhausted (repeated)
  if (isTopicExhausted(state, topicGate)) {
    const message = topicGate.repeatedResponse;
    const events = [createEvent(state, "npc_talked", "talk", message)];
    const nextState = appendEvents(state, events);
    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: false
    };
  }

  // Check conditions
  if (!evaluateAll(topicGate.requires, state, adventure)) {
    const message = topicGate.blockedResponse;
    const events = [createEvent(state, "npc_talked", "talk", message)];
    const nextState = appendEvents(state, events);
    return {
      state: nextState,
      events,
      visibleState: getVisibleState(nextState, adventure),
      message,
      ok: true,
      turnSpent: false
    };
  }

  // Check turns remaining for meaningful talk
  if (state.turnsRemaining <= 0) {
    return rejectTalk(
      state,
      adventure,
      "Dawn has arrived; there is no time left for another conversation."
    );
  }

  // Apply effects
  let nextState: WorldState = {
    ...state,
    turnIndex: state.turnIndex + 1,
    turnsRemaining: state.turnsRemaining - 1
  };

  // Discover clues
  const discoveredCluesById = { ...nextState.discoveredCluesById };
  for (const clueId of topicGate.revealsClueIds ?? []) {
    const clue = adventure.clues[clueId];
    if (clue && !discoveredCluesById[clueId]) {
      discoveredCluesById[clueId] = clue.defaultStrength;
    }
  }
  nextState = { ...nextState, discoveredCluesById };

  // Discover items
  const discoveredItemIds = [...nextState.discoveredItemIds];
  for (const itemId of topicGate.revealsItemIds ?? []) {
    if (!discoveredItemIds.includes(itemId)) {
      discoveredItemIds.push(itemId);
    }
  }
  nextState = { ...nextState, discoveredItemIds };

  // Grant items directly into inventory. Granted items are also considered discovered.
  if (topicGate.grantsItemIds && topicGate.grantsItemIds.length > 0) {
    const grantedDiscoveredItemIds = [...nextState.discoveredItemIds];
    const inventoryItemIds = [...nextState.inventoryItemIds];
    for (const itemId of topicGate.grantsItemIds) {
      if (!grantedDiscoveredItemIds.includes(itemId)) {
        grantedDiscoveredItemIds.push(itemId);
      }
      if (!inventoryItemIds.includes(itemId)) {
        inventoryItemIds.push(itemId);
      }
    }
    nextState = {
      ...nextState,
      discoveredItemIds: grantedDiscoveredItemIds,
      inventoryItemIds
    };
  }

  // Change trust (clamped 0-2)
  if (topicGate.trustDelta) {
    const currentTrust = nextState.trustByNpcId[npcId] ?? 0;
    const newTrust = Math.max(0, Math.min(2, currentTrust + topicGate.trustDelta)) as TrustLevel;
    const trustByNpcId = { ...nextState.trustByNpcId, [npcId]: newTrust };
    nextState = { ...nextState, trustByNpcId };
  }

  // Record consequences
  for (const cId of topicGate.consequenceIds ?? []) {
    nextState = recordConsequence(nextState, cId);
  }

  // Set flags
  if (topicGate.flagChanges) {
    nextState = {
      ...nextState,
      flags: { ...nextState.flags, ...topicGate.flagChanges }
    };
  }

  // Move NPC
  if (topicGate.movesNpcToRoomId) {
    const npcRoomById = {
      ...nextState.npcRoomById,
      [npcId]: topicGate.movesNpcToRoomId
    };
    nextState = { ...nextState, npcRoomById };
  }

  // Mark topic as exhausted via flag
  const talkFlag = `talked_${topicGate.id}`;
  nextState = {
    ...nextState,
    flags: { ...nextState.flags, [talkFlag]: true }
  };

  // Build events
  const events = [
    createEvent(nextState, "npc_talked", "talk", topicGate.response, 1),
    ...(topicGate.revealsClueIds ?? []).map((clueId, i) =>
      createEvent(nextState, "clue_discovered", "talk", adventure.clues[clueId].title, i + 2)
    ),
    ...(topicGate.revealsItemIds ?? []).map((itemId, i) =>
      createEvent(nextState, "item_discovered", "talk", adventure.items[itemId].name, i + 2 + (topicGate.revealsClueIds?.length ?? 0))
    ),
    ...(topicGate.grantsItemIds ?? []).map((itemId, i) =>
      createEvent(
        nextState,
        "item_obtained",
        "talk",
        adventure.items[itemId].name,
        i + 2 + (topicGate.revealsClueIds?.length ?? 0) + (topicGate.revealsItemIds?.length ?? 0)
      )
    ),
    createEvent(
      nextState,
      "turn_spent",
      "talk",
      "The conversation spends one investigation turn.",
      2 + (topicGate.revealsClueIds?.length ?? 0) + (topicGate.revealsItemIds?.length ?? 0) + (topicGate.grantsItemIds?.length ?? 0)
    )
  ];

  nextState = appendEvents(nextState, events);

  return {
    state: nextState,
    events,
    visibleState: getVisibleState(nextState, adventure),
    message: topicGate.response,
    ok: true,
    turnSpent: true
  };
}

function rejectTalk(
  state: WorldState,
  adventure: AdventureDefinition,
  message: string
): CommandResult {
  const events = [createEvent(state, "command_rejected", "talk", message)];
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
  state: WorldState,
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

function resolveTopic(
  npcId: NpcId,
  topicInput: string,
  adventure: AdventureDefinition
): TopicGateDefinition | undefined {
  const gates = adventure.topicGates;
  if (!gates) return undefined;

  const normalized = topicInput.trim().toLowerCase();
  for (const gate of Object.values(gates)) {
    if (gate.npcId !== npcId) continue;
    if (gate.topicAliases.some((a) => a.toLowerCase() === normalized)) {
      return gate;
    }
  }
  return undefined;
}

function findGreetingGate(
  npcId: NpcId,
  adventure: AdventureDefinition
): TopicGateDefinition | undefined {
  const gates = adventure.topicGates;
  if (!gates) return undefined;
  return Object.values(gates).find(
    (g) => g.npcId === npcId && g.topicAliases.includes("greeting")
  );
}

function isTopicExhausted(
  state: WorldState,
  gate: TopicGateDefinition
): boolean {
  return state.flags[`talked_${gate.id}`] === true;
}

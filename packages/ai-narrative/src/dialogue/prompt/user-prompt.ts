import type { NpcScript, DialogueContext, ConversationExchange } from "../types";

// ─── User Prompt Builder ─────────────────────────────────────────────
// Constructs the situational user prompt with current game state,
// conversation history, and the player's input.

export function buildUserPrompt(
  script: NpcScript,
  playerInput: string,
  context: DialogueContext,
  recentExchanges: ConversationExchange[],
  lang: "en" | "zh"
): string {
  const isZh = lang === "zh";
  const npcName = script.name;

  const langInstruction = isZh
    ? "你必须用中文回复。"
    : "You must respond in English.";

  let prompt = `${langInstruction}

CURRENT SITUATION:
- Room: ${context.currentRoom}
- Investigation turns remaining: ${context.turnsRemaining}
- Player's inventory: ${context.playerInventory.length > 0 ? context.playerInventory.join(", ") : "(empty)"}
- Discovered clues: ${context.discoveredClues.length > 0 ? context.discoveredClues.join(", ") : "(none)"}
- Your trust toward the player: ${context.currentTrust}/2
- Topics already discussed: ${context.exhaustedTopicGateIds.length > 0 ? context.exhaustedTopicGateIds.join(", ") : "(none)"}
- Available topic gates that could be triggered: ${context.validTopicGateIds.length > 0 ? context.validTopicGateIds.join(", ") : "(none)"}`;

  if (recentExchanges.length > 0) {
    prompt += `\n\nRECENT CONVERSATION (last ${recentExchanges.length} exchanges):`;
    for (const ex of recentExchanges) {
      prompt += `\nPlayer: "${ex.playerInput}"\n${npcName}: "${ex.npcResponse}"`;
      if (ex.triggeredTopicGateId) {
        prompt += ` [triggered: ${ex.triggeredTopicGateId}]`;
      }
    }
  }

  prompt += `\n\nPLAYER SAYS:\n"${playerInput}"\n\nRespond as ${npcName} in valid JSON.`;

  return prompt;
}

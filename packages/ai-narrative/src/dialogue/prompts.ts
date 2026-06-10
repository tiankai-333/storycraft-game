import type { NpcScript, DialogueContext, ConversationExchange } from "./types";
import { buildSystemPromptEn, buildSystemPromptZh } from "./prompt/system-prompt";
import { buildUserPrompt } from "./prompt/user-prompt";

// ─── NPC Dialogue Prompt Builder (Facade) ────────────────────────────
// Delegates to prompt/ sub-modules for system prompt, user prompt,
// and gated secret formatting. External callers only need this file.

export interface DialoguePromptPair {
  system: string;
  user: string;
}

export function buildNpcDialoguePrompt(
  npcScript: NpcScript,
  playerInput: string,
  context: DialogueContext,
  recentExchanges: ConversationExchange[],
  lang: "en" | "zh"
): DialoguePromptPair {
  const isZh = lang === "zh";
  const validGateIds = context.validTopicGateIds;

  const system = isZh
    ? buildSystemPromptZh(npcScript, validGateIds, context.currentTrust)
    : buildSystemPromptEn(npcScript, validGateIds, context.currentTrust);

  const user = buildUserPrompt(npcScript, playerInput, context, recentExchanges, lang);

  return { system, user };
}

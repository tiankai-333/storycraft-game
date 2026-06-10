// ─── Dialogue Module ─────────────────────────────────────────────────
// AI-driven NPC free-form dialogue system.

export type {
  NpcScript,
  NpcKnowledgeEntry,
  NpcSecret,
  ConversationExchange,
  DialogueAiResponse,
  DialogueContext,
  DialogueRequest,
  DialogueResult,
} from "./types";

export { DialogueEngine } from "./engine";
export type { DialogueEngineConfig } from "./engine";

export { buildNpcDialoguePrompt } from "./prompts";
export type { DialoguePromptPair } from "./prompts";

export { parseAiJson } from "./parse";
export { validateDialogueResponse } from "./schema";
export { reviewGateTrigger, expandKeywordsBilingually } from "./gate-review";

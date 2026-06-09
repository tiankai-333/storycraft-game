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
export { parseAiJson, validateDialogueResponse, reviewGateTrigger, sanitizeDialogueLeakage } from "./validation";

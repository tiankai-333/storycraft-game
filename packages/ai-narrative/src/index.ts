// ─── Provider ───────────────────────────────────────────────────────
export type { NarrativeProvider } from "./provider";
export { PassthroughProvider } from "./provider";
export { OpenAICompatibleProvider } from "./providers/openai-compatible";
export { loadConfigFromEnv } from "./providers/config";
export type { ProviderConfig } from "./providers/config";

// ─── Shared Types (used by dialogue engine) ─────────────────────────
export type {
  ProviderStatus,
  ProviderState,
  ProviderRawResponse,
  AuditRecord,
  AuditStats,
} from "./types";

// ─── Shared Audit (used by dialogue engine) ─────────────────────────
export { AuditLog } from "./audit";

// ─── Dialogue Module (AI-driven NPC free-form conversation) ──────────
export { DialogueEngine } from "./dialogue/engine";
export type { DialogueEngineConfig } from "./dialogue/engine";
export { parseAiJson } from "./dialogue/parse";
export { validateDialogueResponse } from "./dialogue/schema";
export { reviewGateTrigger, expandKeywordsBilingually } from "./dialogue/gate-review";
export type {
  NpcScript,
  NpcKnowledgeEntry,
  NpcSecret,
  ConversationExchange,
  DialogueAiResponse,
  DialogueContext,
  DialogueRequest,
  DialogueResult,
} from "./dialogue/types";

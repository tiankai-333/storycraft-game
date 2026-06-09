// ─── Types ──────────────────────────────────────────────────────────
export type {
  NarrativeRequest,
  NarrativeResponse,
  ValidationResult,
  ConstraintViolation,
  GroundingData,
  NarrativeEngineConfig,
  EngineStatus,
  ProviderStatus,
  ProviderState,
  ProviderRawResponse,
  AuditRecord,
  AuditFilter,
  AuditStats,
} from "./types";

export {
  NarrativeRequestSchema,
  NarrativeTextSchema,
  DEFAULT_ENGINE_CONFIG,
  NarrativeError,
} from "./types";

// ─── Engine ─────────────────────────────────────────────────────────
export { NarrativeEngine } from "./engine";

// ─── Provider ───────────────────────────────────────────────────────
export type { NarrativeProvider } from "./provider";
export { PassthroughProvider } from "./provider";
export { OpenAICompatibleProvider } from "./providers/openai-compatible";
export { loadConfigFromEnv } from "./providers/config";
export type { ProviderConfig } from "./providers/config";

// ─── Validation ─────────────────────────────────────────────────────
export {
  validateNarrativeResponse,
  validateStructure,
  checkConstraints,
} from "./validation";

// ─── Audit ──────────────────────────────────────────────────────────
export { AuditLog } from "./audit";

// ─── Prompts (for advanced customization) ───────────────────────────
export { buildNarrationPrompt, buildDialoguePrompt } from "./prompts";

// ─── Dialogue Module (AI-driven NPC free-form conversation) ──────────
export { DialogueEngine } from "./dialogue/engine";
export type { DialogueEngineConfig } from "./dialogue/engine";
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

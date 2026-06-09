import { z } from "zod";
import type { RuntimeEvent, VisibleState, TrustLevel } from "../../shared/src";

// ─── Provider State Machine ─────────────────────────────────────────

export type ProviderState =
  | "uninitialized"
  | "initializing"
  | "ready"
  | "degraded"
  | "failed"
  | "disposed";

export interface ProviderStatus {
  state: ProviderState;
  providerId: string;
  lastHealthCheck: number;
  consecutiveFailures: number;
  lastError?: string;
  configRedacted: { baseUrl: string; model: string };
}

// ─── Grounding Data ─────────────────────────────────────────────────
// Known facts sent to the AI to constrain its output.

export interface GroundingData {
  currentRoomName: string;
  visibleExits: string[];
  presentNpcNames: string[];
  inventoryItemNames: string[];
  discoveredClueNames: string[];
  knownConsequences: string[];
  turnsRemaining: number;
}

// ─── Narrative Request ──────────────────────────────────────────────
// Structured input to the narrative pipeline.

export interface NarrativeRequest {
  id: string;
  type: "narration" | "dialogue";
  turnIndex: number;

  events: RuntimeEvent[];
  commandMessage: string;
  visibleState: VisibleState;

  dialogueContext?: {
    npcId: string;
    npcName: string;
    npcRole: string;
    topic: string;
    topicResponse: string;
    trustLevel: TrustLevel;
    recentEvents: RuntimeEvent[];
  };

  grounding: GroundingData;

  timestamp: number;
  lang: "en" | "zh";
}

export const NarrativeRequestSchema = z.object({
  id: z.string().min(1),
  type: z.enum(["narration", "dialogue"]),
  turnIndex: z.number().int().min(0),
  events: z.array(
    z.object({
      id: z.string(),
      type: z.string(),
      sourceCommand: z.string(),
      roomId: z.string(),
      turnIndex: z.number(),
      message: z.string(),
    })
  ),
  commandMessage: z.string().min(1),
  visibleState: z.any(), // Validated by shared types at construction time
  dialogueContext: z
    .object({
      npcId: z.string(),
      npcName: z.string(),
      npcRole: z.string(),
      topic: z.string(),
      topicResponse: z.string(),
      trustLevel: z.number().min(0).max(2),
      recentEvents: z.array(z.any()),
    })
    .optional(),
  grounding: z.object({
    currentRoomName: z.string(),
    visibleExits: z.array(z.string()),
    presentNpcNames: z.array(z.string()),
    inventoryItemNames: z.array(z.string()),
    discoveredClueNames: z.array(z.string()),
    knownConsequences: z.array(z.string()),
    turnsRemaining: z.number().int().min(0),
  }),
  timestamp: z.number().positive(),
  lang: z.enum(["en", "zh"]),
});

// ─── Validation Result ──────────────────────────────────────────────

export interface ConstraintViolation {
  rule: string;
  detail: string;
  severity: "error" | "warning";
}

export interface ValidationResult {
  passed: boolean;
  structuralValid: boolean;
  constraintViolations: ConstraintViolation[];
  warningNotes: string[];
}

// ─── Narrative Response ─────────────────────────────────────────────
// Output with provenance — the core design: every response declares its source.

export interface NarrativeResponse {
  requestId: string;
  text: string;

  source: "ai" | "passthrough";

  aiMeta?: {
    providerId: string;
    model: string;
    latencyMs: number;
    promptTokenCount?: number;
    completionTokenCount?: number;
  };

  validation: ValidationResult;
  timestamp: number;
}

export const NarrativeTextSchema = z
  .string()
  .min(1, "AI returned empty response")
  .max(2000, "AI response exceeds maximum length")
  .refine(
    (s) => !s.trim().startsWith("```"),
    "AI response contains markdown code block formatting"
  );

// ─── Audit ──────────────────────────────────────────────────────────

export interface AuditRecord {
  requestId: string;
  turnIndex: number;
  requestType: "narration" | "dialogue";

  eventTypes: string[];
  commandVerb: string;

  responseSource: "ai" | "passthrough";
  responseTextPreview: string;
  validationPassed: boolean;
  constraintViolations: string[];

  providerState: ProviderState;
  providerId: string;

  promptStructure: {
    systemPromptHash: string;
    groundingFactCount: number;
    eventCount: number;
  };

  latencyMs: number;
  timestamp: number;
}

export interface AuditFilter {
  source?: "ai" | "passthrough";
  minTurnIndex?: number;
  maxTurnIndex?: number;
  requestType?: "narration" | "dialogue";
  validationPassed?: boolean;
}

export interface AuditStats {
  totalRequests: number;
  aiSuccessCount: number;
  passthroughCount: number;
  aiFailureCount: number;
  validationFailureCount: number;
  constraintViolationCount: number;
  averageLatencyMs: number;
  byProvider: Record<string, { calls: number; failures: number }>;
}

// ─── Engine Config ──────────────────────────────────────────────────

export interface NarrativeEngineConfig {
  lang: "en" | "zh";
  maxRetries: number;
  retryDelayMs: number;
  healthCheckIntervalMs: number;
  auditLogMaxEntries: number;
  failOpen: boolean;
}

export const DEFAULT_ENGINE_CONFIG: NarrativeEngineConfig = {
  lang: "en",
  maxRetries: 1,
  retryDelayMs: 1000,
  healthCheckIntervalMs: 30000,
  auditLogMaxEntries: 1000,
  failOpen: true,
};

// ─── Engine Status ──────────────────────────────────────────────────

export interface EngineStatus {
  initialized: boolean;
  providerStatus: ProviderStatus;
  config: NarrativeEngineConfig;
  auditStats: AuditStats;
}

// ─── Provider Raw Response ──────────────────────────────────────────

export interface ProviderRawResponse {
  text: string;
  model: string;
  latencyMs: number;
  promptTokenCount?: number;
  completionTokenCount?: number;
}

// ─── Error Types ────────────────────────────────────────────────────

export class NarrativeError extends Error {
  constructor(
    message: string,
    public readonly code:
      | "not_initialized"
      | "provider_failed"
      | "validation_failed"
      | "disposed",
    public readonly cause?: unknown
  ) {
    super(message);
    this.name = "NarrativeError";
  }
}

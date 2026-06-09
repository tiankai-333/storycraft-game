import type { NarrativeProvider } from "./provider";
import type {
  NarrativeRequest,
  NarrativeResponse,
  EngineStatus,
  AuditRecord,
  NarrativeEngineConfig,
} from "./types";
import { DEFAULT_ENGINE_CONFIG, NarrativeError } from "./types";
import { buildDialoguePrompt, buildNarrationPrompt, hashPrompt } from "./prompts";
import { validateNarrativeResponse } from "./validation";
import { AuditLog } from "./audit";

// ─── NarrativeEngine ────────────────────────────────────────────────
// Top-level narration engine. Takes game events + command, produces
// narrated text via AI or passthrough.

export class NarrativeEngine {
  private provider: NarrativeProvider;
  private auditLog: AuditLog;
  private config: NarrativeEngineConfig;
  private lang: "en" | "zh";
  private initialized = false;

  constructor(provider: NarrativeProvider, config?: Partial<NarrativeEngineConfig>) {
    this.provider = provider;
    this.config = { ...DEFAULT_ENGINE_CONFIG, ...config };
    this.lang = this.config.lang;
    this.auditLog = new AuditLog(this.config.auditLogMaxEntries);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;
    await this.provider.initialize();
    this.initialized = true;
  }

  async dispose(): Promise<void> {
    await this.provider.dispose();
    this.initialized = false;
  }

  // ─── Core API ──────────────────────────────────────────────────────

  async narrate(
    events: NarrativeRequest["events"],
    commandMessage: string,
    visibleState: NarrativeRequest["visibleState"],
    grounding: NarrativeRequest["grounding"],
    dialogueContext?: NarrativeRequest["dialogueContext"]
  ): Promise<NarrativeResponse> {
    if (!this.initialized) throw new NarrativeError("Engine not initialized", "not_initialized");

    const request = this.buildNarrationRequest(events, commandMessage, visibleState, grounding, dialogueContext);

    const startTime = Date.now();
    const { system, user } = request.type === "dialogue"
      ? buildDialoguePrompt(request)
      : buildNarrationPrompt(request);

    let rawText: string;
    try {
      const raw = await this.provider.call(request, system, user);
      rawText = raw.text;
    } catch {
      if (this.config.failOpen) {
        return this.buildPassthroughResponse(request, startTime);
      }
      throw new NarrativeError("Provider call failed", "provider_failed");
    }

    const validation = validateNarrativeResponse(rawText, request);
    const latencyMs = Date.now() - startTime;

    const response: NarrativeResponse = {
      requestId: request.id,
      text: rawText,
      source: "ai",
      validation,
      timestamp: Date.now(),
    };

    this.recordAudit(request, response, latencyMs);
    return response;
  }

  // ─── Status ────────────────────────────────────────────────────────

  getConfig(): NarrativeEngineConfig {
    return { ...this.config };
  }

  setLang(lang: "en" | "zh"): void {
    this.lang = lang;
    this.config = { ...this.config, lang };
  }

  getStatus(): EngineStatus {
    return {
      initialized: this.initialized,
      providerStatus: this.provider.getStatus(),
      config: this.getConfig(),
      auditStats: this.auditLog.stats(),
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private buildNarrationRequest(
    events: NarrativeRequest["events"],
    commandMessage: string,
    visibleState: NarrativeRequest["visibleState"],
    grounding: NarrativeRequest["grounding"],
    dialogueContext?: NarrativeRequest["dialogueContext"]
  ): NarrativeRequest {
    return {
      id: `nr_${Date.now().toString(36)}`,
      type: dialogueContext ? "dialogue" : "narration",
      turnIndex: grounding.turnsRemaining,
      events,
      commandMessage,
      visibleState,
      dialogueContext,
      grounding,
      timestamp: Date.now(),
      lang: this.lang,
    };
  }

  private buildPassthroughResponse(
    request: NarrativeRequest,
    startTime: number
  ): NarrativeResponse {
    const text = request.dialogueContext?.topicResponse ?? request.commandMessage;
    return {
      requestId: request.id,
      text,
      source: "passthrough",
      validation: { passed: true, structuralValid: true, constraintViolations: [], warningNotes: [] },
      timestamp: Date.now(),
    };
  }

  private recordAudit(
    request: NarrativeRequest,
    response: NarrativeResponse,
    latencyMs: number
  ): void {
    const record: AuditRecord = {
      requestId: request.id,
      turnIndex: request.turnIndex,
      requestType: request.type,
      eventTypes: request.events.map((e) => e.type),
      commandVerb: request.commandMessage.split(" ")[0],
      responseSource: response.source,
      responseTextPreview: response.text.slice(0, 100),
      validationPassed: response.validation.passed,
      constraintViolations: response.validation.constraintViolations.map((v) => v.rule),
      providerState: this.provider.getStatus().state as AuditRecord["providerState"],
      providerId: this.provider.getStatus().providerId,
      promptStructure: {
        systemPromptHash: hashPrompt(request.commandMessage),
        groundingFactCount: Object.values(request.grounding).flat().length,
        eventCount: request.events.length,
      },
      latencyMs,
      timestamp: Date.now(),
    };
    this.auditLog.append(record);
  }
}

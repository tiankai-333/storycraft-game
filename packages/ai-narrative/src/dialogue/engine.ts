import type { NarrativeProvider } from "../provider";
import type { AuditRecord } from "../types";
import { AuditLog } from "../audit";
import { buildNpcDialoguePrompt } from "./prompts";
import { parseAiJson, validateDialogueResponse, reviewGateTrigger, sanitizeDialogueLeakage, sanitizePrivateKnowledgeLeakage } from "./validation";
import type {
  NpcScript,
  DialogueAiResponse,
  DialogueRequest,
  DialogueResult,
} from "./types";

// ─── DialogueEngine ──────────────────────────────────────────────────
// Handles AI-driven free-form NPC dialogue.
// Reuses the existing NarrativeProvider.
// Does NOT modify game state — only returns candidate triggeredTopicGateId.

export interface DialogueEngineConfig {
  lang: "en" | "zh";
  maxConversationHistory: number;
  failOpen: boolean;
}

const DEFAULT_DIALOGUE_CONFIG: DialogueEngineConfig = {
  lang: "en",
  maxConversationHistory: 5,
  failOpen: true,
};

export class DialogueEngine {
  private provider: NarrativeProvider;
  private auditLog: AuditLog;
  private config: DialogueEngineConfig;
  private lang: "en" | "zh";
  private initialized = false;

  constructor(provider: NarrativeProvider, config?: Partial<DialogueEngineConfig>) {
    this.provider = provider;
    this.config = { ...DEFAULT_DIALOGUE_CONFIG, ...config };
    this.lang = this.config.lang;
    this.auditLog = new AuditLog(1000);
  }

  // ─── Lifecycle ─────────────────────────────────────────────────────

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Provider should already be initialized by the caller
    this.initialized = true;
  }

  async dispose(): Promise<void> {
    this.initialized = false;
  }

  isAiAvailable(): boolean {
    if (this.provider.id === "passthrough") return false;
    const status = this.provider.getStatus();
    return status.state === "ready" || status.state === "degraded";
  }

  // ─── Core API ──────────────────────────────────────────────────────

  async handleFreeFormDialogue(request: DialogueRequest): Promise<DialogueResult> {
    const startTime = Date.now();

    // If AI is not available, return passthrough
    if (!this.isAiAvailable()) {
      return {
        dialogue: this.buildPassthroughDialogue(request.npcScript),
        triggeredTopicGateId: null,
        trustDelta: 0,
        source: "passthrough",
        latencyMs: Date.now() - startTime,
      };
    }

    // Build prompt
    const { system, user } = buildNpcDialoguePrompt(
      request.npcScript,
      request.playerInput,
      request.context,
      request.context.recentExchanges.slice(-this.config.maxConversationHistory),
      this.lang
    );

    // Call provider
    let rawText: string;
    try {
      const narrativeRequest = this.buildMinimalRequest(request);
      const raw = await this.provider.call(narrativeRequest, system, user);
      rawText = raw.text;
    } catch {
      return {
        dialogue: this.buildPassthroughDialogue(request.npcScript),
        triggeredTopicGateId: null,
        trustDelta: 0,
        source: "passthrough",
        latencyMs: Date.now() - startTime,
      };
    }

    // Parse AI JSON
    let parsed: DialogueAiResponse;
    try {
      parsed = parseAiJson(rawText);
    } catch {
      // JSON parse failed — use raw text as dialogue, no gate trigger
      return {
        dialogue: rawText.slice(0, 1000) || "...",
        triggeredTopicGateId: null,
        trustDelta: 0,
        source: "ai",
        latencyMs: Date.now() - startTime,
      };
    }

    // Validate structure
    const validated = validateDialogueResponse(
      parsed,
      request.context,
      request.npcScript
    );

    // Gate trigger review
    const reviewed = reviewGateTrigger(
      validated,
      request.playerInput,
      request.npcScript,
      request.context
    );

    // Sanitize dialogue for leaked secret content
    const noSecretLeak = sanitizeDialogueLeakage(
      reviewed,
      request.npcScript,
      request.context.validTopicGateIds,
      this.lang
    );

    // Sanitize dialogue for private knowledge leakage at low trust
    const sanitized = sanitizePrivateKnowledgeLeakage(
      noSecretLeak,
      request.npcScript,
      request.context.currentTrust,
      this.lang
    );

    // Record audit
    this.recordAudit(request, sanitized, startTime);

    return {
      dialogue: sanitized.dialogue,
      triggeredTopicGateId: sanitized.triggeredTopicGateId,
      trustDelta: sanitized.trustDelta,
      source: "ai",
      latencyMs: Date.now() - startTime,
    };
  }

  // ─── Helpers ───────────────────────────────────────────────────────

  private buildPassthroughDialogue(script: NpcScript): string {
    const name = script.name ?? script.npcId;
    return `${name} looks at you but does not respond to that.`;
  }

  private buildMinimalRequest(request: DialogueRequest) {
    return {
      id: `dlg_${Date.now().toString(36)}`,
      type: "dialogue" as const,
      turnIndex: request.context.currentTurn,
      events: [],
      commandMessage: request.playerInput,
      visibleState: {} as any,
      grounding: {
        currentRoomName: request.context.currentRoom,
        visibleExits: [],
        presentNpcNames: [],
        inventoryItemNames: request.context.playerInventory,
        discoveredClueNames: request.context.discoveredClues,
        knownConsequences: [],
        turnsRemaining: request.context.turnsRemaining,
      },
      timestamp: Date.now(),
      lang: this.lang,
    };
  }

  private recordAudit(
    request: DialogueRequest,
    result: DialogueAiResponse,
    startTime: number
  ): void {
    const record: AuditRecord = {
      requestId: `dlg_audit_${Date.now().toString(36)}`,
      turnIndex: request.context.currentTurn,
      requestType: "dialogue",
      eventTypes: [],
      commandVerb: "talk",
      responseSource: "ai",
      responseTextPreview: result.dialogue.slice(0, 100),
      validationPassed: true,
      constraintViolations: [],
      providerState: this.provider.getStatus().state as AuditRecord["providerState"],
      providerId: this.provider.id,
      promptStructure: {
        systemPromptHash: "",
        groundingFactCount: 0,
        eventCount: 0,
      },
      latencyMs: Date.now() - startTime,
      timestamp: Date.now(),
    };
    this.auditLog.append(record);
  }
}

import type {
  NarrativeRequest,
  ProviderRawResponse,
  ProviderState,
  ProviderStatus,
} from "./types";

// ─── Narrative Provider Interface ───────────────────────────────────
// Replaces the old AIProvider. Key differences:
//   - Lifecycle: initialize() / dispose()
//   - Health: getStatus() / healthCheck()
//   - Single call method: unified interface for narration & dialogue
//   - Returns structured ProviderRawResponse, not bare string

export interface NarrativeProvider {
  readonly id: string;

  initialize(): Promise<void>;
  dispose(): Promise<void>;

  getStatus(): ProviderStatus;
  healthCheck(): Promise<boolean>;

  call(
    request: NarrativeRequest,
    systemPrompt: string,
    userPrompt: string
  ): Promise<ProviderRawResponse>;
}

// ─── Passthrough Provider ───────────────────────────────────────────
// Replaces FallbackProvider. Critical distinction:
//   - id is "passthrough" (not "fallback" — no implication it's substituting for AI)
//   - Always returns source-appropriate data
//   - Never calls any AI service
//   - Used when no AI provider is configured — the engine and caller always
//     know this is NOT AI output

export class PassthroughProvider implements NarrativeProvider {
  readonly id = "passthrough";

  private status: ProviderStatus = {
    state: "ready",
    providerId: "passthrough",
    lastHealthCheck: 0,
    consecutiveFailures: 0,
    configRedacted: { baseUrl: "(none)", model: "(none)" },
  };

  async initialize(): Promise<void> {
    this.status.state = "ready";
    this.status.lastHealthCheck = Date.now();
  }

  async dispose(): Promise<void> {
    this.status.state = "disposed";
  }

  getStatus(): ProviderStatus {
    return { ...this.status };
  }

  async healthCheck(): Promise<boolean> {
    return true; // Passthrough is always healthy — it does nothing
  }

  async call(request: NarrativeRequest, _systemPrompt: string, _userPrompt: string): Promise<ProviderRawResponse> {
    // For dialogue, return the topicResponse; for narration, return the commandMessage
    const text =
      request.type === "dialogue" && request.dialogueContext
        ? request.dialogueContext.topicResponse
        : request.commandMessage;

    return {
      text,
      model: "(passthrough)",
      latencyMs: 0,
    };
  }
}

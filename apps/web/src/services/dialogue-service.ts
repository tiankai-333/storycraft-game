import type { CommandInput, WorldState, VisibleState, AdventureDefinition } from "@shared";
import { executeCommand, getVisibleState, evaluateAll } from "@game-runtime";
import type { DialogueEngine, DialogueResult, ProviderStatus } from "@ai-narrative";
import type { NpcScript, DialogueContext, ConversationExchange } from "@ai-narrative";
import type { WorldPack } from "../world-registry";
import { classifyIntent } from "./dialogue-intent";
import type { DialogueIntent } from "./dialogue-intent";
import { reviewDialogueCandidates } from "./dialogue-policy";
import { devlog } from "./devlog";

// ─── Result Types ──────────────────────────────────────────────────

export interface GateEffects {
  clueIds: string[];
  revealedItemIds: string[];
  grantedItemIds: string[];
  trustChange: number;
  turnSpent: boolean;
}

export interface DialogueServiceResult {
  /** NPC response text (AI-generated). */
  dialogue: string;
  /** Whether the text came from AI or provider error. */
  source: "ai" | "error";
  /** The game state after this dialogue turn (may include gate effects + trust delta). */
  state: WorldState;
  /** Derived visible state matching the updated state. */
  visibleState: VisibleState;
  /** Gate that was triggered and applied via runtime, if any. */
  triggeredGateId: string | null;
  /** Summary of gate effects (clues, items, trust, turns) for UI rendering. */
  gateEffects: GateEffects | null;
  /** Trust delta applied by runtime effects. */
  trustDeltaApplied: number;
  /**
   * Runtime message is always null in the AI dialogue path.
   * AI dialogue IS the NPC voice.
   */
  runtimeMessage: string | null;
  /** Runtime message ok flag. */
  runtimeOk: boolean;
  /** Conversation exchange to record in history. */
  exchange: ConversationExchange;
  /** Whether the game has ended. */
  isComplete: boolean;
  /** Ending ID if game has ended. */
  endingId: string | null;
  /** Possible state claim detected in AI dialogue (Phase 5 audit). */
  possibleStateClaim: "item_given" | "access_granted" | null;
  /** Whether the runtime confirmed the state claim. */
  runtimeConfirmed: boolean;
  /** Policy audit trail. */
  policyNotes: string[];

  // ── Debug / dev-mode fields (from engine, for inline debug block) ──
  /** Raw AI output text before parsing. */
  rawAiText: string;
  /** Model identifier used for this call. */
  model: string;
  /** API latency in ms (from engine). */
  latencyMs: number;
  /** Prompt token count. */
  promptTokens?: number;
  /** Completion token count. */
  completionTokens?: number;
  /** Classified player intent. */
  intent: DialogueIntent;
  /** Gate confidence from AI. */
  gateConfidence: "low" | "medium" | "high";
  /** Gate evidence from AI. */
  gateEvidence: string;

  // ── Error diagnostics (only when source === "error") ──
  /** Diagnostic info for AI provider failures. */
  errorDiagnostics?: {
    /** Why the error occurred: "cooldown_active" | "provider_call_failed". */
    reason: string;
    /** Provider state at time of error. */
    providerState: string;
    /** Number of consecutive provider failures. */
    consecutiveFailures: number;
    /** Last error message from the provider, if any. */
    lastError?: string;
    /** Remaining cooldown in ms (only when reason is "cooldown_active"). */
    cooldownRemainingMs?: number;
  };
}

// ─── DialogueService ───────────────────────────────────────────────

/** Cooldown in ms after a provider failure before retrying. */
const PROVIDER_RETRY_COOLDOWN_MS = 30_000;

export class DialogueService {
  private engine: DialogueEngine;
  private getProviderStatus: (() => ProviderStatus) | undefined;
  private conversationHistory: Map<string, ConversationExchange[]>;
  private maxHistory = 5;
  /** Timestamp of last provider failure; used to avoid rapid retry hangs. */
  private lastProviderErrorAt = 0;

  constructor(engine: DialogueEngine, getProviderStatus?: () => ProviderStatus) {
    this.engine = engine;
    this.getProviderStatus = getProviderStatus;
    this.conversationHistory = new Map();
  }

  isAiAvailable(): boolean {
    return this.engine.isAiAvailable();
  }

  reset(): void {
    this.conversationHistory = new Map();
  }

  /**
   * Handle a complete AI/freeform NPC dialogue turn.
   *
   * Flow:
   * 1. Build DialogueContext from game state
   * 2. Call AI engine → get candidate signals
   * 3. Classify player intent (dialogue-intent.ts)
   * 4. Review candidates with DialoguePolicy
   * 5. Apply accepted gate via game-runtime
   * 6. Return structured result for UI
   * 7. Return structured result for UI
   */
  async handleDialogue(opts: {
    npcId: string;
    playerInput: string;
    state: WorldState;
    adventure: AdventureDefinition;
    pack: WorldPack;
  }): Promise<DialogueServiceResult> {
    const { npcId, playerInput, state, adventure, pack } = opts;

    const npcScript = pack.npcScripts?.[npcId];
    if (!npcScript) throw new Error("NPC script not found");

    const npcAlias = pack.meta.npcAliases[npcId] ?? npcId;
    const history = this.conversationHistory.get(npcId) ?? [];

    // Build dialogue context from game state
    const topicGates = adventure.topicGates ?? {};
    const validGateIds = Object.values(topicGates)
      .filter((g) => g.npcId === npcId)
      .filter((g) => !state.flags[`talked_${g.id}`])
      .filter((g) => evaluateAll(g.requires, state, adventure))
      .map((g) => g.id);
    const exhaustedGateIds = Object.values(topicGates)
      .filter((g) => g.npcId === npcId && state.flags[`talked_${g.id}`] === true)
      .map((g) => g.id);

    const context: DialogueContext = {
      currentRoom: adventure.rooms[state.currentRoomId as keyof typeof adventure.rooms]?.name ?? "",
      currentTurn: state.turnIndex,
      turnsRemaining: state.turnsRemaining,
      playerInventory: state.inventoryItemIds.map(
        (id) => adventure.items[id as keyof typeof adventure.items]?.name ?? id,
      ),
      discoveredClues: Object.keys(state.discoveredCluesById).map(
        (id) => adventure.clues[id as keyof typeof adventure.clues]?.title ?? id,
      ),
      currentTrust: state.trustByNpcId[npcId] ?? 0,
      exhaustedTopicGateIds: exhaustedGateIds,
      recentExchanges: history,
      validTopicGateIds: validGateIds,
    };

    // Call AI engine (with cooldown check to avoid rapid retry hangs)
    const now = Date.now();
    if (this.lastProviderErrorAt && (now - this.lastProviderErrorAt) < PROVIDER_RETRY_COOLDOWN_MS) {
      // Provider failed recently — don't retry yet, return error immediately
      console.warn("[DialogueService] cooldown active, skipping (ms since last error):", now - this.lastProviderErrorAt);
      return this.handleProviderError(npcId, playerInput, state, adventure, "cooldown_active");
    }

    const result = await this.engine.handleFreeFormDialogue({
      npcScript,
      playerInput,
      context,
    });

    // ─── Provider error (AI was available but call failed) ─────────
    if (result.source === "passthrough") {
      // AI was configured but the call failed — show system error
      // (No keyword fallback in free dialogue path — Phase 6)
      this.lastProviderErrorAt = Date.now();
      return this.handleProviderError(npcId, playerInput, state, adventure, "provider_call_failed");
    }

    // ─── AI success → classify → policy → apply ────────────────────
    this.lastProviderErrorAt = 0; // reset cooldown on success
    return this.handleAiResult(
      npcId, playerInput, npcAlias, result, state, adventure,
      topicGates, validGateIds,
    );
  }

  // ─── Provider error handler ──────────────────────────────────────

  private handleProviderError(
    _npcId: string,
    playerInput: string,
    state: WorldState,
    adventure: AdventureDefinition,
    reason: string = "provider_call_failed",
  ): DialogueServiceResult {
    const providerStatus = this.getProviderStatus?.();
    const now = Date.now();
    const cooldownRemainingMs = this.lastProviderErrorAt
      ? Math.max(0, PROVIDER_RETRY_COOLDOWN_MS - (now - this.lastProviderErrorAt))
      : undefined;

    const exchange: ConversationExchange = {
      playerInput,
      npcResponse: "",
      triggeredTopicGateId: null,
      timestamp: Date.now(),
    };
    // Do NOT record empty exchanges in history

    return {
      dialogue: "",
      source: "error",
      state,
      visibleState: getVisibleState(state, adventure),
      triggeredGateId: null,
      gateEffects: null,
      trustDeltaApplied: 0,
      runtimeMessage: null,
      runtimeOk: false,
      exchange,
      isComplete: false,
      endingId: null,
      possibleStateClaim: null,
      runtimeConfirmed: false,
      policyNotes: ["provider_call_failed"],
      rawAiText: "",
      model: providerStatus?.configRedacted?.model ?? "",
      latencyMs: 0,
      intent: { kind: "unknown", isGreeting: false, isShortInput: false },
      gateConfidence: "low",
      gateEvidence: "",
      errorDiagnostics: {
        reason,
        providerState: providerStatus?.state ?? "unknown",
        consecutiveFailures: providerStatus?.consecutiveFailures ?? 0,
        lastError: providerStatus?.lastError,
        cooldownRemainingMs: reason === "cooldown_active" ? cooldownRemainingMs : undefined,
      },
    };
  }

  // ─── AI success handler ──────────────────────────────────────────

  private handleAiResult(
    npcId: string,
    playerInput: string,
    npcAlias: string,
    result: DialogueResult,
    state: WorldState,
    adventure: AdventureDefinition,
    topicGates: Record<string, any>,
    validGateIds: string[],
  ): DialogueServiceResult {
    // 1. Classify player intent
    const intent = classifyIntent(playerInput);

    // 2. Policy review
    const policy = reviewDialogueCandidates({
      intent,
      candidateGateId: result.candidateGateId,
      gateConfidence: result.gateConfidence,
      validGateIds,
      npcId,
      topicGates,
      candidateActionHint: result.candidateActionHint,
    });

    // 3. Apply accepted gate via game-runtime
    let currentState = state;
    let gateEffects: GateEffects | null = null;
    let runtimeConfirmed = false;

    if (policy.acceptedGateId) {
      const gate = topicGates[policy.acceptedGateId];
      if (gate) {
        const topic = gate.topicAliases[0];
        const talkResult = executeCommand(
          currentState,
          { verb: "talk", npc: npcAlias, topic } as CommandInput,
          adventure,
        );
        currentState = talkResult.state;

        if (talkResult.ok && talkResult.turnSpent) {
          gateEffects = {
            clueIds: gate.revealsClueIds ?? [],
            revealedItemIds: gate.revealsItemIds ?? [],
            grantedItemIds: gate.grantsItemIds ?? [],
            trustChange: gate.trustDelta ?? 0,
            turnSpent: true,
          };

          // Phase 5: Confirm state claims
          if (policy.possibleStateClaim === "item_given" && gate.grantsItemIds?.length > 0) {
            runtimeConfirmed = true;
          }
          if (policy.possibleStateClaim === "access_granted" && didUnlockAccess(state, currentState)) {
            runtimeConfirmed = true;
          }
        }
        // Phase 4: If runtime rejected (talkResult.ok === false),
        // we do NOT show the runtime blockedResponse.
        // The AI dialogue remains the sole NPC voice.
      }
    }

    // 4. Trust changes are owned by runtime effects only.
    const trustDeltaApplied =
      (currentState.trustByNpcId[npcId] ?? 0) - (state.trustByNpcId[npcId] ?? 0);

    // 5. Record conversation exchange
    const exchange: ConversationExchange = {
      playerInput,
      npcResponse: result.dialogue,
      triggeredTopicGateId: policy.acceptedGateId,
      timestamp: Date.now(),
      policyNotes: policy.notes,
      possibleStateClaim: policy.possibleStateClaim,
      runtimeConfirmed,
    };
    this.updateHistory(npcId, exchange);

    // Record to DevLog for development debugging
    devlog.record({
      timestamp: Date.now(),
      npcId,
      playerInput,
      intent,
      providerCall: {
        model: result.model,
        latencyMs: result.latencyMs,
        promptTokens: result.promptTokens,
        completionTokens: result.completionTokens,
      },
      aiRawText: result.rawAiText,
      aiParsed: {
        dialogue: result.dialogue,
        candidateGateId: result.candidateGateId,
        gateEvidence: result.gateEvidence,
        gateConfidence: result.gateConfidence,
        candidateActionHint: result.candidateActionHint,
      },
      gateReview: {
        accepted: policy.acceptedGateId !== null,
        reason: policy.notes.join(", ") || "no_gate",
      },
      policy: {
        acceptedGateId: policy.acceptedGateId,
        notes: policy.notes,
        possibleStateClaim: policy.possibleStateClaim,
      },
      runtime: {
        gateApplied: gateEffects !== null,
        trustDelta: trustDeltaApplied,
        stateConfirmed: runtimeConfirmed,
      },
      systemPrompt: result.systemPrompt,
      userPrompt: result.userPrompt,
    });

    return {
      dialogue: result.dialogue,
      source: "ai",
      state: currentState,
      visibleState: getVisibleState(currentState, adventure),
      triggeredGateId: policy.acceptedGateId,
      gateEffects,
      trustDeltaApplied,
      // Phase 4: runtimeMessage is always null in AI path
      runtimeMessage: null,
      runtimeOk: true,
      exchange,
      isComplete: currentState.isComplete,
      endingId: currentState.endingId ?? null,
      possibleStateClaim: policy.possibleStateClaim,
      runtimeConfirmed,
      policyNotes: policy.notes,
      // Debug / dev-mode fields
      rawAiText: result.rawAiText,
      model: result.model,
      latencyMs: result.latencyMs,
      promptTokens: result.promptTokens,
      completionTokens: result.completionTokens,
      intent,
      gateConfidence: result.gateConfidence,
      gateEvidence: result.gateEvidence,
    };
  }

  // ─── History management ───────────────────────────────────────────

  private updateHistory(npcId: string, exchange: ConversationExchange): void {
    const prev = this.conversationHistory.get(npcId) ?? [];
    this.conversationHistory.set(npcId, [...prev, exchange].slice(-this.maxHistory));
  }
}

function didUnlockAccess(before: WorldState, after: WorldState): boolean {
  for (const [key, value] of Object.entries(after.flags)) {
    if (before.flags[key] === value) continue;
    if (value !== true) continue;
    const lower = key.toLowerCase();
    if (lower.includes("unlock") || lower.includes("access") || lower.includes("grant")) {
      return true;
    }
  }
  return false;
}

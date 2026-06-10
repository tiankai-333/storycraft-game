// ─── Dialogue Policy ─────────────────────────────────────────────────
// Centralized review of AI candidate signals. Decides what effects
// to actually apply — AI never directly changes game state.
//
// Rules:
// - greeting / smalltalk never trigger gates
// - candidateGateId must exist in validGateIds and match the NPC

import type { DialogueIntent } from "./dialogue-intent";

export interface DialoguePolicyDecision {
  /** Gate that passed policy review and should be sent to runtime. */
  acceptedGateId: string | null;
  /** If true, suppress showing the runtime blockedResponse in AI dialogue path. */
  suppressRuntimeBlockedLine: boolean;
  /** Possible state claim detected in AI dialogue (e.g., "item_given"). */
  possibleStateClaim: "item_given" | "access_granted" | null;
  /** Whether the runtime confirmed the state claim (set after runtime call). */
  runtimeConfirmed: boolean;
  /** Audit trail of policy decisions. */
  notes: string[];
}

export interface PolicyInput {
  /** Pre-classified intent from dialogue-intent.ts. */
  intent: DialogueIntent;
  /** AI-proposed gate trigger. */
  candidateGateId: string | null;
  /** AI confidence in the gate trigger. */
  gateConfidence: "low" | "medium" | "high";
  /** Gate IDs that are valid (conditions pass, not exhausted) for this NPC. */
  validGateIds: string[];
  /** Current NPC ID. */
  npcId: string;
  /** All topic gates for the adventure. */
  topicGates: Record<string, any>;
  /** AI action hint (e.g., "item_given"). */
  candidateActionHint: string | null;
}

/**
 * Review AI candidate signals and produce a policy decision.
 *
 * This is the ONLY place that decides:
 * - Whether a gate is accepted
 * - Whether to suppress runtime blocked text
 */
export function reviewDialogueCandidates(input: PolicyInput): DialoguePolicyDecision {
  const notes: string[] = [];
  let acceptedGateId: string | null = null;
  let suppressRuntimeBlockedLine = false;
  let possibleStateClaim: "item_given" | "access_granted" | null = null;

  // ── Rule 1: greeting / smalltalk never trigger gates ──
  if (input.intent.isGreeting || input.intent.kind === "smalltalk") {
    notes.push("intent_is_greeting_or_smalltalk");
    return {
      acceptedGateId: null,
      suppressRuntimeBlockedLine: false,
      possibleStateClaim: null,
      runtimeConfirmed: false,
      notes,
    };
  }

  // ── Rule 2: Review candidate gate ──
  if (input.candidateGateId) {
    if (!input.validGateIds.includes(input.candidateGateId)) {
      notes.push(`gate_${input.candidateGateId}_not_in_valid_gates`);
      suppressRuntimeBlockedLine = true;
    } else {
      const gate = input.topicGates[input.candidateGateId];
      if (!gate || gate.npcId !== input.npcId) {
        notes.push(`gate_${input.candidateGateId}_npc_mismatch`);
        suppressRuntimeBlockedLine = true;
      } else {
        acceptedGateId = input.candidateGateId;
        notes.push(`gate_${input.candidateGateId}_accepted`);

        // Detect item/access claims from gate definition
        if (gate.grantsItemIds && gate.grantsItemIds.length > 0) {
          possibleStateClaim = "item_given";
        }
      }
    }
  }

  // ── Rule 3: Detect action hint from AI ──
  if (!possibleStateClaim && input.candidateActionHint) {
    if (input.candidateActionHint === "item_given" || input.candidateActionHint === "access_granted") {
      possibleStateClaim = input.candidateActionHint;
      notes.push(`ai_action_hint:${input.candidateActionHint}`);
    }
  }

  return {
    acceptedGateId,
    suppressRuntimeBlockedLine,
    possibleStateClaim,
    runtimeConfirmed: false,
    notes,
  };
}

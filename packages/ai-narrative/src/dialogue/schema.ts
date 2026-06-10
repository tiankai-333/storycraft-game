import type { DialogueAiResponse } from "./types";

// ─── Structural Validation ───────────────────────────────────────────
// Normalizes the shape of an AI dialogue response. Runtime/policy layers
// decide whether candidate gates are legal in the current game state.

export function validateDialogueResponse(parsed: DialogueAiResponse): DialogueAiResponse {
  const result: DialogueAiResponse = { ...parsed };

  if (typeof result.dialogue !== "string" || result.dialogue.length < 1) {
    result.dialogue = "...";
  }
  if (result.dialogue.length > 1000) {
    result.dialogue = result.dialogue.slice(0, 1000);
  }

  if (typeof result.candidateGateId !== "string") {
    result.candidateGateId = null;
  }
  if (typeof result.gateEvidence !== "string") {
    result.gateEvidence = "";
  }
  if (
    result.gateConfidence !== "low" &&
    result.gateConfidence !== "medium" &&
    result.gateConfidence !== "high"
  ) {
    result.gateConfidence = "low";
  }
  if (typeof result.candidateActionHint !== "string") {
    result.candidateActionHint = null;
  }

  return result;
}

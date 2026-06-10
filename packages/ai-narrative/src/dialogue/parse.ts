import type { DialogueAiResponse } from "./types";

// ─── AI Response Parsing ─────────────────────────────────────────────
// Handles extraction of structured data from raw AI text output.
// Supports: complete JSON, markdown-wrapped JSON, truncated JSON.
//
// Accepts both OLD field names (triggeredTopicGateId,
// confidence, matchedEvidence) and NEW field names (candidateGateId,
// gateConfidence, gateEvidence, candidateActionHint).

/**
 * Parse AI response text as JSON. Handles:
 * - markdown-wrapped JSON
 * - truncated JSON (model hit max_tokens mid-response)
 * - raw JSON without wrapper
 * Accepts both old and new field name formats.
 */
export function parseAiJson(rawText: string): DialogueAiResponse {
  let jsonStr = rawText.trim();

  // Remove markdown code block wrapper if present
  const codeBlockMatch = jsonStr.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (codeBlockMatch) {
    jsonStr = codeBlockMatch[1].trim();
  }

  // Try to find a complete JSON object first
  const jsonMatch = jsonStr.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    try {
      const parsed = JSON.parse(jsonMatch[0]);
      return buildResponse(parsed);
    } catch {
      // Complete JSON not parseable — fall through to truncated handling
    }
  }

  // Handle truncated JSON: model hit max_tokens mid-response.
  // Try both old and new field names.
  const dialogueMatch = jsonStr.match(/"dialogue"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const dialogue = dialogueMatch ? unescapeJsonString(dialogueMatch[1]) : "";

  // Try new field name first, then old
  let candidateGateId: string | null = null;
  const newGateMatch = jsonStr.match(/"candidateGateId"\s*:\s*"([^"]+)"/);
  const oldGateMatch = jsonStr.match(/"triggeredTopicGateId"\s*:\s*"([^"]+)"/);
  if (newGateMatch) {
    candidateGateId = newGateMatch[1];
  } else if (oldGateMatch) {
    candidateGateId = oldGateMatch[1];
  }

  // Try confidence / gateConfidence
  let gateConfidence: "low" | "medium" | "high" = "low";
  if (jsonStr.includes('"gateConfidence"') || jsonStr.includes('"confidence"')) {
    if (jsonStr.includes('"high"')) gateConfidence = "high";
    else if (jsonStr.includes('"medium"')) gateConfidence = "medium";
  }

  // Try gateEvidence / matchedEvidence
  let gateEvidence = "";
  const newEvidenceMatch = jsonStr.match(/"gateEvidence"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const oldEvidenceMatch = jsonStr.match(/"matchedEvidence"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (newEvidenceMatch) {
    gateEvidence = unescapeJsonString(newEvidenceMatch[1]);
  } else if (oldEvidenceMatch) {
    gateEvidence = unescapeJsonString(oldEvidenceMatch[1]);
  }

  if (!dialogue && !candidateGateId) {
    throw new Error("No JSON object found in AI response");
  }

  return {
    dialogue,
    candidateGateId,
    gateEvidence,
    gateConfidence,
    candidateActionHint: null,
  };
}

// ─── Internal Helpers ────────────────────────────────────────────────

/**
 * Unescape JSON string values (handles \n, \", \\, etc.)
 */
function unescapeJsonString(s: string): string {
  return s
    .replace(/\\n/g, "\n")
    .replace(/\\t/g, "\t")
    .replace(/\\"/g, '"')
    .replace(/\\\\/g, "\\");
}

/**
 * Build a DialogueAiResponse from a parsed JSON object.
 * Accepts both old and new field names, mapping old→new.
 */
function buildResponse(parsed: any): DialogueAiResponse {
  const dialogue =
    typeof parsed.dialogue === "string" ? parsed.dialogue : String(parsed.dialogue ?? "");

  // candidateGateId (new) or triggeredTopicGateId (old)
  const candidateGateId =
    typeof parsed.candidateGateId === "string"
      ? parsed.candidateGateId
      : typeof parsed.triggeredTopicGateId === "string"
        ? parsed.triggeredTopicGateId
        : null;

  // gateEvidence (new) or matchedEvidence (old)
  const gateEvidence =
    typeof parsed.gateEvidence === "string"
      ? parsed.gateEvidence
      : typeof parsed.matchedEvidence === "string"
        ? parsed.matchedEvidence
        : "";

  // gateConfidence (new) or confidence (old)
  const rawConfidence = parsed.gateConfidence ?? parsed.confidence;
  const gateConfidence: "low" | "medium" | "high" =
    rawConfidence === "low" || rawConfidence === "medium" || rawConfidence === "high"
      ? rawConfidence
      : "low";

  // candidateActionHint (new field)
  const candidateActionHint =
    typeof parsed.candidateActionHint === "string" ? parsed.candidateActionHint : null;

  return {
    dialogue,
    candidateGateId,
    gateEvidence,
    gateConfidence,
    candidateActionHint,
  };
}

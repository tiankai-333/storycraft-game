import { NarrativeTextSchema } from "./types";
import type {
  ConstraintViolation,
  GroundingData,
  NarrativeRequest,
  ValidationResult,
} from "./types";

// ─── Structural Validation ──────────────────────────────────────────
// Validates the AI output text itself (not the full response object).

export function validateStructure(text: string): {
  valid: boolean;
  error?: string;
} {
  const result = NarrativeTextSchema.safeParse(text);
  if (result.success) {
    return { valid: true };
  }
  const firstIssue = result.error.issues[0];
  return {
    valid: false,
    error: firstIssue?.message ?? "Structural validation failed",
  };
}

// ─── Constraint Checker ─────────────────────────────────────────────
// Lightweight keyword/regex-based check for obvious AI hallucinations.
// Deliberately errs on the side of false negatives (misses) over
// false positives (wrongly flagging valid output).

export function checkConstraints(
  response: string,
  grounding: GroundingData
): ConstraintViolation[] {
  const violations: ConstraintViolation[] = [];
  const lower = response.toLowerCase();

  // Rule 1: No invented turns-remaining claim
  // Matches patterns like "you have 5 turns left", "3 turns remain", "two turns remaining"
  const turnPattern = /\b(\d+)\s+turns?\s+(?:left|remaining|remain|left)\b/i;
  const turnMatch = lower.match(turnPattern);
  if (turnMatch) {
    const claimed = parseInt(turnMatch[1], 10);
    if (claimed !== grounding.turnsRemaining) {
      violations.push({
        rule: "contradicts_turns",
        detail: `AI claims ${claimed} turns remaining, actual: ${grounding.turnsRemaining}`,
        severity: "error",
      });
    }
  }

  // Rule 2: No acquiring items not in inventory
  // Matches "you found/picked up/gained [X]" where X is not a known item or clue
  const acquirePattern =
    /(?:you\s+(?:found|picked\s+up|gained|discovered|obtained)\s+(?:a\s+|an\s+)?)([\w\s'-]+)/gi;
  let match: RegExpExecArray | null;
  while ((match = acquirePattern.exec(response)) !== null) {
    const itemName = match[1].trim().toLowerCase().replace(/[.!?]$/, "");
    // Skip if it matches a known item, clue, or is very generic
    const isKnown =
      grounding.inventoryItemNames.some((n) => n.toLowerCase() === itemName) ||
      grounding.discoveredClueNames.some((n) => n.toLowerCase() === itemName) ||
      isGenericPhrase(itemName);
    if (!isKnown && itemName.length > 2 && itemName.length < 50) {
      violations.push({
        rule: "invented_item",
        detail: `AI describes acquiring "${itemName}" which is not a known item or clue`,
        severity: "warning",
      });
    }
  }

  // Rule 3: Check for markdown artifacts (``` blocks, JSON-like output)
  if (response.includes("```") || response.includes("{{")) {
    violations.push({
      rule: "format_artifact",
      detail: "AI output contains code blocks or template markers",
      severity: "warning",
    });
  }

  return violations;
}

// ─── Full Validation Pipeline ───────────────────────────────────────

export function validateNarrativeResponse(
  text: string,
  request: NarrativeRequest
): ValidationResult {
  const warnings: string[] = [];

  // Step 1: Structural validation
  const structural = validateStructure(text);
  if (!structural.valid) {
    warnings.push(structural.error ?? "Structural validation failed");
  }

  // Step 2: Constraint checking
  const constraintViolations = checkConstraints(text, request.grounding);
  const hasErrors = constraintViolations.some((v) => v.severity === "error");

  // Step 3: Combine
  const passed =
    structural.valid && !hasErrors && constraintViolations.length === 0;

  return {
    passed,
    structuralValid: structural.valid,
    constraintViolations,
    warningNotes: warnings,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

/** Phrases too generic to flag as "invented items" */
const GENERIC_PHRASES = new Set([
  "something",
  "nothing",
  "anything",
  "it",
  "a clue",
  "a lead",
  "a trail",
  "evidence",
  "a way",
  "the truth",
  "the answer",
  "a path",
  "the source",
]);

function isGenericPhrase(name: string): boolean {
  return GENERIC_PHRASES.has(name) || name.length <= 2;
}

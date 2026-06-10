// ─── Dialogue Intent Classification ──────────────────────────────────
// Lightweight, rule-based intent classification for player dialogue input.
// This lives in the web-services layer, NOT in ai-narrative.
//
// Purpose: provide the DialoguePolicy with basic intent information
// so that greeting/smalltalk never triggers game-state gates.

export interface DialogueIntent {
  kind: "greeting" | "smalltalk" | "question" | "request" | "evidence_presenting" | "unknown";
  /** True if the input is a greeting. */
  isGreeting: boolean;
  /** True if the input is fewer than 5 characters. */
  isShortInput: boolean;
}

// ─── Patterns ────────────────────────────────────────────────────────

const GREETING_PATTERN =
  /^(hi|hello|hey|greetings|你好|嗨|您好|早上好|晚上好|再见|bye|good morning|good evening|good night|晚安)(?:\b|$|[\s,，.!！?？])/i;

const SMALLTALK_PATTERN =
  /^(how are you|how's it going|what's up|nice weather|天气不错|还好吗|最近怎么样|怎么样|吃了吗)/i;

const QUESTION_STARTS =
  /^(what|who|where|when|why|how|do you|can you|is it|are you|did you|have you|什么|谁|哪|为什么|怎么|是否|能不能|有没有)/i;

const EVIDENCE_PATTERN =
  /(show|present|give you|found this|look at this|evidence|clue|出示|给你看|发现了|证据|线索)/i;

// ─── Classifier ──────────────────────────────────────────────────────

/**
 * Classify the intent of a player's free-form dialogue input.
 * Uses simple pattern matching — no NLP or AI calls.
 * Does NOT trigger any state changes.
 */
export function classifyIntent(playerInput: string): DialogueIntent {
  const trimmed = playerInput.trim();
  const lower = trimmed.toLowerCase();

  const isShortInput = trimmed.length < 5;
  const isGreeting = GREETING_PATTERN.test(lower);

  if (isGreeting) {
    return { kind: "greeting", isGreeting: true, isShortInput };
  }

  if (SMALLTALK_PATTERN.test(lower)) {
    return { kind: "smalltalk", isGreeting: false, isShortInput };
  }

  // Question detection
  if (lower.includes("?") || lower.includes("？") || QUESTION_STARTS.test(lower)) {
    return { kind: "question", isGreeting: false, isShortInput };
  }

  // Evidence presenting
  if (EVIDENCE_PATTERN.test(lower)) {
    return { kind: "evidence_presenting", isGreeting: false, isShortInput };
  }

  return { kind: "unknown", isGreeting: false, isShortInput };
}

import type { DialogueAiResponse, DialogueContext, NpcScript, NpcSecret } from "./types";

// ─── AI Response Parsing ─────────────────────────────────────────────

/**
 * Parse AI response text as JSON. Handles:
 * - markdown-wrapped JSON
 * - truncated JSON (model hit max_tokens mid-response)
 * - raw JSON without wrapper
 * Extracts dialogue and gate info as best-effort.
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

  // Handle truncated JSON: model hit max_tokens and returned something like:
  // {"dialogue": "some text...", "triggeredTopicGateId": "topi...
  // Strategy: find "dialogue" value, extract it as the dialogue text.
  const dialogueMatch = jsonStr.match(/"dialogue"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  const dialogue = dialogueMatch ? unescapeJsonString(dialogueMatch[1]) : "";

  // Try to find triggeredTopicGateId even in truncated JSON
  let gateId: string | null = null;
  const gateMatch = jsonStr.match(/"triggeredTopicGateId"\s*:\s*"([^"]+)"/);
  if (gateMatch) {
    gateId = gateMatch[1];
  }

  // Try to find confidence
  let confidence: "low" | "medium" | "high" = "low";
  if (jsonStr.includes('"confidence"') && jsonStr.includes('"medium"')) {
    confidence = "medium";
  } else if (jsonStr.includes('"confidence"') && jsonStr.includes('"high"')) {
    confidence = "high";
  }

  // Try to find matchedEvidence
  let matchedEvidence = "";
  const evidenceMatch = jsonStr.match(/"matchedEvidence"\s*:\s*"((?:[^"\\]|\\.)*)"/);
  if (evidenceMatch) {
    matchedEvidence = unescapeJsonString(evidenceMatch[1]);
  }

  if (!dialogue && !gateId) {
    throw new Error("No JSON object found in AI response");
  }

  return { dialogue, triggeredTopicGateId: gateId, trustDelta: 0, confidence, matchedEvidence };
}

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
 */
function buildResponse(parsed: any): DialogueAiResponse {
  return {
    dialogue: typeof parsed.dialogue === "string" ? parsed.dialogue : String(parsed.dialogue ?? ""),
    triggeredTopicGateId:
      typeof parsed.triggeredTopicGateId === "string" ? parsed.triggeredTopicGateId : null,
    trustDelta:
      typeof parsed.trustDelta === "number"
        ? Math.max(-1, Math.min(1, Math.round(parsed.trustDelta)))
        : 0,
    confidence: parsed.confidence === "low" || parsed.confidence === "medium" || parsed.confidence === "high"
      ? parsed.confidence
      : "low",
    matchedEvidence: typeof parsed.matchedEvidence === "string" ? parsed.matchedEvidence : "",
  };
}

// ─── Structural Validation ───────────────────────────────────────────

/**
 * Validate the structure and content of an AI dialogue response.
 * - dialogue must be string, 1-1000 chars
 * - triggeredTopicGateId must be string or null
 * - If non-null, must exist in valid topic gates, belong to this NPC,
 *   and not be exhausted
 */
export function validateDialogueResponse(
  parsed: DialogueAiResponse,
  context: DialogueContext,
  npcScript: NpcScript
): DialogueAiResponse {
  const result: DialogueAiResponse = {
    dialogue: parsed.dialogue,
    triggeredTopicGateId: parsed.triggeredTopicGateId,
    trustDelta: parsed.trustDelta,
    confidence: parsed.confidence,
    matchedEvidence: parsed.matchedEvidence,
  };

  // Validate dialogue length
  if (typeof result.dialogue !== "string" || result.dialogue.length < 1) {
    result.dialogue = "...";
  }
  if (result.dialogue.length > 1000) {
    result.dialogue = result.dialogue.slice(0, 1000);
  }

  // Validate triggeredTopicGateId
  if (result.triggeredTopicGateId !== null) {
    // Must be a string
    if (typeof result.triggeredTopicGateId !== "string") {
      result.triggeredTopicGateId = null;
    }
    // Must exist in valid topic gates for this NPC
    else if (!context.validTopicGateIds.includes(result.triggeredTopicGateId)) {
      result.triggeredTopicGateId = null;
    }
    // Must belong to this NPC's gated secrets
    else if (!npcScript.gatedSecrets.some((s) => s.topicGateId === result.triggeredTopicGateId)) {
      result.triggeredTopicGateId = null;
    }
    // Must not be exhausted
    else if (context.exhaustedTopicGateIds.includes(result.triggeredTopicGateId)) {
      result.triggeredTopicGateId = null;
    }
  }

  return result;
}

// ─── Bilingual Keyword Mapping ───────────────────────────────────────
// Maps English keywords from secret definitions to common Chinese
// equivalents so that keyword relevance checks work across languages.

const BILINGUAL_KEYWORD_MAP: Record<string, string[]> = {
  // Actions
  "saw": ["看到", "看见", "目击", "见到"],
  "meeting": ["见面", "会面", "相遇"],
  "asked": ["问", "询问", "提到"],
  "confronts": ["对质", "质问", "质询", "质问"],
  "presents": ["出示", "展示", "拿出", "给"],
  "requests": ["请求", "要求"],
  "offers": ["提供", "给"],
  "gathered": ["收集", "搜集", "找到"],
  "shows": ["展示", "给看", "出示"],
  "file": ["提交", "写报告", "立案"],
  "report": ["报告", "立案", "正式"],
  "triggered": ["触发", "激活"],
  "sell": ["卖", "出售", "卖掉"],
  "staged": ["伪造", "伪造现场", "假造"],
  "drugged": ["下药", "迷药", "药物"],

  // Objects
  "bell": ["钟", "铃", "钟声", "铃声"],
  "tower": ["塔", "塔楼", "钟楼"],
  "key": ["钥匙"],
  "designs": ["设计", "设计图", "作品"],
  "gloves": ["手套"],
  "ledger": ["账本", "账簿", "账目"],
  "footprints": ["脚印", "足迹", "痕迹"],
  "evidence": ["证据", "线索"],

  // People
  "alden": ["奥登"],
  "theo": ["西奥"],
  "mina": ["米娜"],
  "vale": ["韦尔", "维尔"],

  // Places
  "garden": ["花园"],
  "study": ["书房", "办公室"],
  "stair": ["楼梯", "通道"],
  "servant": ["仆人", "仆役"],

  // Time
  "night": ["晚上", "夜里", "那晚", "当晚"],
  "dawn": ["天亮", "黎明", "天明"],
  "after": ["之后", "以后", "后"],
  "death": ["死", "死亡", "死后"],

  // Qualifiers
  "substantial": ["足够", "充分", "大量"],
  "mercy": ["宽恕", "仁慈", "原谅"],
  "betrayal": ["背叛", "出卖"],
};

/**
 * Expand English keywords with Chinese equivalents for cross-language matching.
 */
function expandKeywordsBilingually(englishKeywords: string[]): string[] {
  const expanded: string[] = [...englishKeywords];
  for (const kw of englishKeywords) {
    // Check if the keyword itself maps
    const lower = kw.toLowerCase();
    if (BILINGUAL_KEYWORD_MAP[lower]) {
      expanded.push(...BILINGUAL_KEYWORD_MAP[lower]);
    }
    // Also check partial matches (e.g. "tower" in "bell tower")
    for (const [engKey, zhValues] of Object.entries(BILINGUAL_KEYWORD_MAP)) {
      if (lower.includes(engKey) || engKey.includes(lower)) {
        expanded.push(...zhValues);
      }
    }
  }
  return expanded;
}

// ─── Gate Trigger Reviewer ───────────────────────────────────────────
// Lightweight reviewer that prevents false gate triggers.

/**
 * Review a validated AI response for false gate triggers.
 * Rules:
 * 1. Short or greeting-only input → no gate trigger
 * 2. Player question must have keyword relevance (bilingual) to the secret
 * 3. AI must provide matchedEvidence or confidence ≥ medium
 * 4. Confidence must be at least "medium" OR matchedEvidence is substantive
 */
export function reviewGateTrigger(
  validated: DialogueAiResponse,
  playerInput: string,
  npcScript: NpcScript,
  _context: DialogueContext
): DialogueAiResponse {
  if (validated.triggeredTopicGateId === null) {
    return validated;
  }

  const playerLower = playerInput.trim().toLowerCase();

  // Rule 1: Short or greeting-only input → no gate trigger
  if (playerLower.length < 5) {
    return { ...validated, triggeredTopicGateId: null };
  }
  const greetingPattern = /^(hi|hello|hey|greetings|你好|嗨|您好|早上好|晚上好|再见|bye|good morning|good evening)\b/i;
  if (greetingPattern.test(playerLower)) {
    return { ...validated, triggeredTopicGateId: null };
  }

  // Find the matching secret
  const secret = npcScript.gatedSecrets.find(
    (s) => s.topicGateId === validated.triggeredTopicGateId
  );
  if (!secret) {
    return { ...validated, triggeredTopicGateId: null };
  }

  // Rule 2: Player input must have keyword relevance to the secret (bilingual)
  const conditionsLower = secret.revealConditions.toLowerCase();
  const descriptionLower = secret.description.toLowerCase();
  const englishKeywords = [...conditionsLower.split(/\s+/), ...descriptionLower.split(/\s+/)]
    .filter((w) => w.length > 2);

  const allKeywords = expandKeywordsBilingually(englishKeywords);

  const hasRelevance = allKeywords.some((kw) => playerLower.includes(kw));
  if (!hasRelevance) {
    return { ...validated, triggeredTopicGateId: null };
  }

  // Rule 3: AI must show evidence of matching — either matchedEvidence is
  // non-empty, OR confidence is at least "medium"
  const hasMatchedEvidence = validated.matchedEvidence && validated.matchedEvidence.trim().length > 0;
  const hasConfidence = validated.confidence === "medium" || validated.confidence === "high";

  if (!hasMatchedEvidence && !hasConfidence) {
    return { ...validated, triggeredTopicGateId: null };
  }

  return validated;
}

// ─── Dialogue Leakage Sanitizer ──────────────────────────────────────
// Safety net: if the AI leaked secret content without triggering the gate,
// replace the dialogue with a generic deflection.

/**
 * Extract leak-detection keywords from a secret's description only.
 * Uses description (specific details) not revealConditions (broad triggers)
 * to reduce false positives on common conversational vocabulary.
 */
function extractLeakKeywords(secret: NpcSecret): string[] {
  const descWords = secret.description.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
  return expandKeywordsBilingually(descWords);
}

/**
 * Check dialogue text for leaked content from gated secrets.
 * Only checks inaccessible secrets (not in valid set).
 * Filters out keywords that also appear in public/private knowledge to
 * avoid false positives when AI discusses topics that overlap with secrets.
 */
export function sanitizeDialogueLeakage(
  response: DialogueAiResponse,
  npcScript: NpcScript,
  validTopicGateIds: string[],
  lang: "en" | "zh"
): DialogueAiResponse {
  // If a gate was triggered, the dialogue is expected to discuss that secret
  if (response.triggeredTopicGateId !== null) {
    return response;
  }

  // Only check inaccessible secrets (not in valid set due to trust/conditions)
  const leakedSecrets = npcScript.gatedSecrets.filter(
    (s) => !validTopicGateIds.includes(s.topicGateId)
  );

  if (leakedSecrets.length === 0) {
    return response;
  }

  // Build a set of "allowed" words from public + private knowledge.
  // These words are legitimate for the AI to use in its response.
  const allowedWords = new Set<string>();
  for (const entry of npcScript.publicKnowledge) {
    entry.content.toLowerCase().split(/\s+/)
      .filter((w) => w.length > 3)
      .forEach((w) => allowedWords.add(w));
  }
  for (const entry of npcScript.privateKnowledge) {
    entry.content.toLowerCase().split(/\s+/)
      .filter((w) => w.length > 3)
      .forEach((w) => allowedWords.add(w));
  }
  // Add bilingual expansions of allowed words
  for (const w of [...allowedWords]) {
    const lower = w.toLowerCase();
    if (BILINGUAL_KEYWORD_MAP[lower]) {
      BILINGUAL_KEYWORD_MAP[lower].forEach((zh) => allowedWords.add(zh));
    }
  }

  // Extract keywords for each leaked secret and check individually
  const dialogueLower = response.dialogue.toLowerCase();

  for (const secret of leakedSecrets) {
    const leakKeywords = extractLeakKeywords(secret);
    // Filter out keywords that appear in public/private knowledge (false positives)
    const uniqueKeywords = leakKeywords.filter((kw) => !allowedWords.has(kw));
    const matchCount = uniqueKeywords.filter((kw) => dialogueLower.includes(kw)).length;

    // Threshold: 3+ UNIQUE (not in public knowledge) keyword matches = leak
    if (matchCount >= 3) {
      const deflection = lang === "zh"
        ? `${npcScript.name}微微皱眉，似乎不愿再继续这个话题。`
        : `${npcScript.name} draws back slightly. 'I have nothing more to say about that.'`;
      return {
        ...response,
        dialogue: deflection,
      };
    }
  }

  return response;
}

// ─── Private Knowledge Leakage Sanitizer ──────────────────────────────
// When trust is below 1, the NPC should NOT share private knowledge.
// This is a runtime safety net on top of the prompt instruction.

/**
 * Check if dialogue leaks private knowledge when trust is insufficient.
 * If leaked, replace with a guarded deflection.
 *
 * Threshold: 4+ keyword matches (higher than initial 3 because bilingual
 * expansion increases false-positive matches on common vocabulary).
 */
export function sanitizePrivateKnowledgeLeakage(
  response: DialogueAiResponse,
  npcScript: NpcScript,
  currentTrust: number,
  lang: "en" | "zh"
): DialogueAiResponse {
  // Trust ≥ 1: private knowledge sharing is allowed
  if (currentTrust >= 1) {
    return response;
  }

  // Trust < 1: check if dialogue contains private knowledge content
  const dialogueLower = response.dialogue.toLowerCase();

  for (const entry of npcScript.privateKnowledge) {
    // Extract significant words from the private knowledge content (length > 3)
    const contentWords = entry.content.toLowerCase().split(/\s+/).filter((w) => w.length > 3);
    const expandedWords = expandKeywordsBilingually(contentWords);

    // Check if dialogue contains multiple matching phrases
    const matchCount = expandedWords.filter((kw) => dialogueLower.includes(kw)).length;

    // Threshold: 4+ keyword matches suggests private knowledge leaked
    if (matchCount >= 4) {
      const deflection = lang === "zh"
        ? `${npcScript.name}顿了顿，目光变得警惕：「这些事情……我不太方便跟不熟的人讨论。」`
        : `${npcScript.name} pauses, eyes narrowing. 'I don't think I should be discussing that with you.'`;
      return {
        ...response,
        dialogue: deflection,
      };
    }
  }

  return response;
}

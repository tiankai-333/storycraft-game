import type { DialogueAiResponse, DialogueContext, NpcScript } from "./types";

// ─── Gate Trigger Reviewer ───────────────────────────────────────────
// Lightweight reviewer that prevents false gate triggers.
// This is a CANDIDATE gate filter — it does not execute game state changes.
// The runtime (game-runtime executeTalk) has final authority.
//
// NOTE: Short/greeting input filtering was moved to dialogue-intent.ts
// in the web-services layer. This module only checks keyword relevance
// and AI evidence quality.

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
 * Expand explicit English keywords with Chinese equivalents for cross-language matching.
 */
export function expandKeywordsBilingually(englishKeywords: string[]): string[] {
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

// ─── Review Function ─────────────────────────────────────────────────

/**
 * Review a validated AI response for false gate triggers.
 *
 * Rules (greeting/short-input filtering is handled by dialogue-intent.ts):
 * 1. If explicit trigger keywords/phrases exist, player input must match one
 * 2. AI must provide gateEvidence or gateConfidence ≥ medium
 */
export function reviewGateTrigger(
  validated: DialogueAiResponse,
  playerInput: string,
  npcScript: NpcScript,
  _context: DialogueContext
): DialogueAiResponse {
  if (validated.candidateGateId === null) {
    return validated;
  }

  const playerLower = playerInput.trim().toLowerCase();

  // Find the matching secret
  const secret = npcScript.gatedSecrets.find(
    (s) => s.topicGateId === validated.candidateGateId
  );
  if (!secret) {
    return { ...validated, candidateGateId: null };
  }

  // Rule 1: explicit trigger keywords/phrases only. Do not split prose into
  // generic words like "player", "asks", "about", or "what".
  const triggerTerms = [
    ...(secret.triggerKeywords ?? []),
    ...(secret.triggerPhrases ?? []),
  ].filter((term) => term.trim().length > 0);
  const expandedTerms = expandKeywordsBilingually(triggerTerms);

  const hasExplicitTerms = expandedTerms.length > 0;
  const hasRelevance = expandedTerms.some((kw) => playerLower.includes(kw.toLowerCase()));
  if (hasExplicitTerms && !hasRelevance) {
    return { ...validated, candidateGateId: null };
  }

  // Rule 2: AI must show evidence of matching — either gateEvidence is
  // non-empty, OR gateConfidence is at least "medium"
  const hasGateEvidence = validated.gateEvidence && validated.gateEvidence.trim().length > 0;
  const hasConfidence = validated.gateConfidence === "medium" || validated.gateConfidence === "high";

  if (!hasGateEvidence && !hasConfidence) {
    return { ...validated, candidateGateId: null };
  }

  return validated;
}

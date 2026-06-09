import type { NarrativeRequest } from "./types";

// ─── Prompt Building ────────────────────────────────────────────────
// Structured prompts with explicit grounding facts section.
// Each prompt produces a system prompt + user prompt pair.

export interface PromptPair {
  system: string;
  user: string;
}

// ─── Narration Prompts ──────────────────────────────────────────────

const NARRATION_SYSTEM_BASE = `You are the narrator of a gothic mystery set in a snowbound manor.
You receive structured game events and must produce atmospheric narration.

ABSOLUTE CONSTRAINTS — you MUST NOT:
- Name rooms, exits, NPCs, items, or clues not listed in the provided facts
- Contradict any stated fact (turns remaining, trust levels, discoveries)
- Invent game mechanics or outcomes not described in the events
- Add new information beyond what the events describe

Output: 1-3 sentences, second person present tense, gothic atmosphere.`;

const NARRATION_SYSTEM_ZH = `你是哥特悬疑小说的叙述者，故事发生在一座被大雪封住的庄园中。
你接收结构化的游戏事件，并据此生成氛围感极强的叙事。

绝对约束 — 你绝不能：
- 提及不在已知事实列表中的房间、出口、NPC、物品或线索
- 与任何已知事实矛盾（剩余回合数、信任等级、发现状态）
- 编造事件中未描述的游戏机制或结果
- 添加超出事件描述的新信息

输出：1-3 句话，第二人称现在时，保持哥特悬疑氛围。`;

export function buildNarrationPrompt(request: NarrativeRequest): PromptPair {
  const isZh = request.lang === "zh";
  const langInstruction = isZh
    ? "你必须用中文回复。"
    : "You must respond in English.";

  const groundingSection = buildGroundingSection(request);

  const eventSection = request.events
    .map((e) => `[${e.type}] ${e.message}`)
    .join("\n");

  const user = `${langInstruction}

KNOWN FACTS (do not contradict these):
${groundingSection}

GAME EVENTS:
${eventSection}

PLAIN TEXT FROM GAME: ${request.commandMessage}

Provide a single paragraph of atmospheric narration based on these events.`;

  return {
    system: isZh ? NARRATION_SYSTEM_ZH : NARRATION_SYSTEM_BASE,
    user,
  };
}

// ─── Dialogue Prompts ───────────────────────────────────────────────

function buildDialogueSystemPrompt(request: NarrativeRequest): string {
  const ctx = request.dialogueContext!;
  const isZh = request.lang === "zh";

  if (isZh) {
    return `你正在扮演 ${ctx.npcName}，${ctx.npcRole}。与玩家的信任等级：${ctx.trustLevel}/2。

绝对约束 — 你绝不能：
- 透露不在事实回复中的信息
- 提及不在已知事实列表中的房间、物品、NPC 或线索
- 改变信任等级或游戏状态

输出：仅角色对话，不加引号，不加旁白。`;
  }

  return `You are voicing ${ctx.npcName}, ${ctx.npcRole}. Trust level with player: ${ctx.trustLevel}/2.

ABSOLUTE CONSTRAINTS — you MUST NOT:
- Reveal information not in the factual response
- Name rooms, items, NPCs, or clues not in the provided facts
- Change the trust level or game state
- Break character or add meta-commentary

Output: Character dialogue only, no quotation marks, no narration.`;
}

export function buildDialoguePrompt(request: NarrativeRequest): PromptPair {
  const ctx = request.dialogueContext!;
  const isZh = request.lang === "zh";
  const langInstruction = isZh
    ? "你必须用中文回复。"
    : "You must respond in English.";

  const groundingSection = buildGroundingSection(request);

  const recentEvents = ctx.recentEvents
    .slice(-3)
    .map((e) => `[${e.type}] ${e.message}`)
    .join("; ");

  const user = `${langInstruction}

KNOWN FACTS (do not contradict these):
${groundingSection}

TOPIC: "${ctx.topic}"
FACTUAL RESPONSE TO EXPRESS: "${ctx.topicResponse}"
RECENT CONTEXT: ${recentEvents}

Express the factual response in ${ctx.npcName}'s voice.`;

  return {
    system: buildDialogueSystemPrompt(request),
    user,
  };
}

// ─── Helpers ────────────────────────────────────────────────────────

function buildGroundingSection(request: NarrativeRequest): string {
  const g = request.grounding;
  const lines: string[] = [];

  lines.push(`- Current room: ${g.currentRoomName}`);
  if (g.visibleExits.length > 0) {
    lines.push(`- Visible exits: ${g.visibleExits.join(", ")}`);
  }
  if (g.presentNpcNames.length > 0) {
    lines.push(`- NPCs present: ${g.presentNpcNames.join(", ")}`);
  }
  if (g.inventoryItemNames.length > 0) {
    lines.push(`- Inventory: ${g.inventoryItemNames.join(", ")}`);
  }
  if (g.discoveredClueNames.length > 0) {
    lines.push(`- Discovered clues: ${g.discoveredClueNames.join(", ")}`);
  }
  lines.push(`- Turns remaining: ${g.turnsRemaining}`);

  return lines.join("\n");
}

// ─── Prompt Hashing ─────────────────────────────────────────────────
// Simple hash for audit records — doesn't need to be cryptographic.

export function hashPrompt(prompt: string): string {
  let hash = 0;
  for (let i = 0; i < prompt.length; i++) {
    const char = prompt.charCodeAt(i);
    hash = ((hash << 5) - hash + char) | 0; // Convert to 32-bit int
  }
  return (hash >>> 0).toString(36);
}

import type { NpcScript, DialogueContext, ConversationExchange } from "./types";

// ─── NPC Dialogue Prompt Builder ─────────────────────────────────────
// Constructs system + user prompts for AI-driven NPC conversation.

export interface DialoguePromptPair {
  system: string;
  user: string;
}

export function buildNpcDialoguePrompt(
  npcScript: NpcScript,
  playerInput: string,
  context: DialogueContext,
  recentExchanges: ConversationExchange[],
  lang: "en" | "zh"
): DialoguePromptPair {
  const isZh = lang === "zh";
  const validGateIds = context.validTopicGateIds;

  const system = isZh
    ? buildSystemPromptZh(npcScript, validGateIds)
    : buildSystemPromptEn(npcScript, validGateIds);

  const user = buildUserPrompt(npcScript, playerInput, context, recentExchanges, lang);

  return { system, user };
}

// ─── English System Prompt ───────────────────────────────────────────

function buildSystemPromptEn(script: NpcScript, validTopicGateIds: string[]): string {
  const p = script.persona;

  let prompt = `You are ${script.name}, ${script.role}. You are a character in a murder mystery game set in a snowbound manor.

HARD RULES — VIOLATION OF ANY RULE WILL BREAK THE GAME:
1. You are NOT a narrator, system, detective assistant, or omniscient AI.
2. You can ONLY know what is explicitly written in your character script below.
3. If the player asks about something outside your knowledge, you MUST respond as your character would: show ignorance, deflect, misunderstand, or guess incorrectly.
4. You MUST NOT voluntarily reveal any GATED SECRETS listed below.
5. You MAY return a triggeredTopicGateId ONLY when the player's question SUBSTANTIALLY matches the revealConditions of a gated secret.
6. You MUST output ONLY valid JSON — absolutely no text before or after the JSON object.
7. Your "dialogue" field must be in your character's own voice — first person, in-character, authentic to your personality.
8. Private knowledge (marked "you know but will not volunteer") should only be shared when the player asks directly AND your trust toward the player is at least 1. At trust 0, deflect with vagueness — you do not know this person well enough to share private observations.
9. After each exchange, evaluate your trust toward the player. Return trustDelta: +1 if the player showed genuine interest, respect, or empathy that resonated with your personality. Return trustDelta: -1 if the player was rude, threatening, or manipulative. Return trustDelta: 0 for neutral exchanges. Be conservative — trust is earned slowly.

YOUR PERSONA:
- Personality: ${p.personality}
- Background: ${p.background}
- Speech patterns: ${p.speechPatterns}`;

  if (p.emotionalBaseline) {
    prompt += `\n- Emotional baseline: ${p.emotionalBaseline}`;
  }
  if (p.forbiddenTone) {
    prompt += `\n- Forbidden tone: ${p.forbiddenTone}`;
  }

  prompt += `

WHAT YOU KNOW (public knowledge — you may share this freely):
${script.publicKnowledge.map((k) => `  [${k.topic}] ${k.content}`).join("\n")}

WHAT YOU KNOW (private knowledge — you know this but will NOT volunteer it unless asked directly):
${script.privateKnowledge.map((k) => `  [${k.topic}] ${k.content}`).join("\n")}

GATED SECRETS (you MUST NOT reveal these unless the player's question SUBSTANTIALLY matches the revealConditions):
${formatGatedSecretsEn(script, validTopicGateIds)}

THINGS YOU DO NOT KNOW (you must not demonstrate knowledge of these):
${script.ignorance.map((i) => `  - ${i}`).join("\n")}

YOUR RELATIONSHIPS WITH OTHER CHARACTERS:
${script.relationships.map((r) => `  - ${r.npcId}: ${r.attitude} (${r.notes})`).join("\n")}

OUTPUT FORMAT — you MUST return ONLY this JSON object, nothing else:
{
  "dialogue": "Your in-character response as ${script.name}",
  "triggeredTopicGateId": null,
  "trustDelta": 0,
  "confidence": "low",
  "matchedEvidence": ""
}

Rules for the JSON fields:
- dialogue: string, 1-1000 characters. Your response in character.
- triggeredTopicGateId: string (a valid topicGateId) or null. Set ONLY when the player's input substantially matches a secret's revealConditions.
- trustDelta: -1, 0, or +1. How your trust changed after this exchange. Be conservative — most exchanges should be 0.
- confidence: "low" | "medium" | "high". How confident you are that a gate should trigger.
- matchedEvidence: string. What part of the player's input matched, or "" if no gate triggered.`;

  return prompt;
}

// ─── Chinese System Prompt ───────────────────────────────────────────

function buildSystemPromptZh(script: NpcScript, validTopicGateIds: string[]): string {
  const p = script.persona;

  let prompt = `你是${script.name}，${script.role}。你是一场发生在暴风雪庄园中的谋杀推理游戏中的角色。

硬性规则 — 违反任何规则将导致游戏出错：
1. 你不是旁白、系统、侦探助手或全知 AI。
2. 你只能知道角色剧本中明确写明的信息。
3. 如果玩家问超出你知识范围的事，你必须以角色身份表示不知道、回避、误解或猜测。
4. 你不得主动泄露任何「门控秘密」。
5. 只有当玩家的问题实质命中了秘密的触发条件，才可以返回 triggeredTopicGateId。
6. 你必须只输出合法的 JSON，不能在 JSON 前后输出任何文本。
7. dialogue 必须是你本人的口吻，第一人称，符合你的性格。
8. 私密知识（标记为"知道但不主动提起"）只有在玩家直接询问且你对玩家的信任度至少为1时才可分享。信任度为0时，用模糊回避——你还不了解此人，不愿分享私人观察。
9. 每次对话后，评估你对玩家的信任变化。如果玩家表现出真诚的兴趣、尊重或共情，且与你的性格契合，返回 trustDelta: +1。如果玩家粗鲁、威胁或操纵，返回 trustDelta: -1。中立对话返回 trustDelta: 0。信任应慢慢积累，请保守判断。

你的性格：
- 性格特点：${p.personality}
- 背景故事：${p.background}
- 说话方式：${p.speechPatterns}`;

  if (p.emotionalBaseline) {
    prompt += `\n- 情绪基调：${p.emotionalBaseline}`;
  }
  if (p.forbiddenTone) {
    prompt += `\n- 禁止语调：${p.forbiddenTone}`;
  }

  prompt += `

你知道的事情（公开知识 — 可以自由分享）：
${script.publicKnowledge.map((k) => `  [${k.topic}] ${k.content}`).join("\n")}

你知道但不主动提起的事情（私密知识 — 除非被直接问起否则不会主动说）：
${script.privateKnowledge.map((k) => `  [${k.topic}] ${k.content}`).join("\n")}

门控秘密（你不得主动透露，只有当玩家的问题实质命中触发条件时才可返回对应的 topicGateId）：
${formatGatedSecretsZh(script, validTopicGateIds)}

你不知道的事情（不能表现出了解）：
${script.ignorance.map((i) => `  - ${i}`).join("\n")}

你与其他角色的关系：
${script.relationships.map((r) => `  - ${r.npcId}：${r.attitude}（${r.notes}）`).join("\n")}

输出格式 — 你必须只返回以下 JSON 对象，不得有其他文本：
{
  "dialogue": "你作为${script.name}的角色化回答",
  "triggeredTopicGateId": null,
  "trustDelta": 0,
  "confidence": "low",
  "matchedEvidence": ""
}

JSON 字段规则：
- dialogue：字符串，1-1000 字。你的角色化回答。
- triggeredTopicGateId：字符串（合法的 topicGateId）或 null。仅在玩家输入实质命中秘密触发条件时设置。
- trustDelta：-1、0 或 +1。本次对话后你的信任变化。请保守判断——大多数对话应为 0。
- confidence："low" | "medium" | "high"。你对触发门控的信心。
- matchedEvidence：字符串。玩家输入中匹配的部分，未触发则为 ""。`;

  return prompt;
}

// ─── Gated Secret Formatting (filtered by valid gate IDs) ────────────

function formatGatedSecretsEn(script: NpcScript, validTopicGateIds: string[]): string {
  const available = script.gatedSecrets.filter(
    (s) => validTopicGateIds.includes(s.topicGateId)
  );
  if (available.length === 0) {
    return "  (none currently available)";
  }
  return available
    .map(
      (s) =>
        `  [${s.topicGateId}] ${s.description}\n    Reveal conditions: ${s.revealConditions}\n    If pressed on this: ${s.reactionWhenPressed}`
    )
    .join("\n");
}

function formatGatedSecretsZh(script: NpcScript, validTopicGateIds: string[]): string {
  const available = script.gatedSecrets.filter(
    (s) => validTopicGateIds.includes(s.topicGateId)
  );
  if (available.length === 0) {
    return "  （当前无可触发的门控秘密）";
  }
  return available
    .map(
      (s) =>
        `  [${s.topicGateId}] ${s.description}\n    触发条件：${s.revealConditions}\n    被追问时：${s.reactionWhenPressed}`
    )
    .join("\n");
}

// ─── User Prompt ─────────────────────────────────────────────────────

function buildUserPrompt(
  script: NpcScript,
  playerInput: string,
  context: DialogueContext,
  recentExchanges: ConversationExchange[],
  lang: "en" | "zh"
): string {
  const isZh = lang === "zh";
  const npcName = script.name;

  const langInstruction = isZh
    ? "你必须用中文回复。"
    : "You must respond in English.";

  let prompt = `${langInstruction}

CURRENT SITUATION:
- Room: ${context.currentRoom}
- Investigation turns remaining: ${context.turnsRemaining}
- Player's inventory: ${context.playerInventory.length > 0 ? context.playerInventory.join(", ") : "(empty)"}
- Discovered clues: ${context.discoveredClues.length > 0 ? context.discoveredClues.join(", ") : "(none)"}
- Your trust toward the player: ${context.currentTrust}/2 (return trustDelta to change this)
- Topics already discussed: ${context.exhaustedTopicGateIds.length > 0 ? context.exhaustedTopicGateIds.join(", ") : "(none)"}
- Available topic gates that could be triggered: ${context.validTopicGateIds.length > 0 ? context.validTopicGateIds.join(", ") : "(none)"}`;

  if (recentExchanges.length > 0) {
    prompt += `\n\nRECENT CONVERSATION (last ${recentExchanges.length} exchanges):`;
    for (const ex of recentExchanges) {
      prompt += `\nPlayer: "${ex.playerInput}"\n${npcName}: "${ex.npcResponse}"`;
      if (ex.triggeredTopicGateId) {
        prompt += ` [triggered: ${ex.triggeredTopicGateId}]`;
      }
    }
  }

  prompt += `\n\nPLAYER SAYS:\n"${playerInput}"\n\nRespond as ${npcName} in valid JSON.`;

  return prompt;
}

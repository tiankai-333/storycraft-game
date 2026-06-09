/**
 * AI NPC 三角色对话测试脚本
 *
 * 覆盖维度：
 *   - 信任层级 (trust 0 / 1 / 2)
 *   - 知识边界 (公开 / 私密 / 门控秘密 / 无知)
 *   - 门控触发准确性 (应触发 / 不应触发)
 *   - 角色一致性 (语气 / 禁止语调)
 *
 * 用法：
 *   1. 项目根目录 .env：DEEPSEEK_API_KEY=sk-xxx
 *   2. cd packages/ai-narrative && npx tsx examples/test-dialogue.ts
 */

import { readFileSync } from "fs";
import { resolve } from "path";

import { OpenAICompatibleProvider } from "../src/providers/openai-compatible";
import { DialogueEngine } from "../src/dialogue/engine";
import type {
  NpcScript,
  DialogueContext,
  ConversationExchange,
} from "../src/dialogue/types";

// ─── Auto-load .env ──────────────────────────────────────────────────
try {
  const envPath = resolve(__dirname, "../../../.env");
  const envContent = readFileSync(envPath, "utf-8");
  for (const line of envContent.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) process.env[key] = val;
  }
} catch { /* .env not found */ }

const API_KEY = process.env.DEEPSEEK_API_KEY ?? "";
const BASE_URL = process.env.DEEPSEEK_BASE_URL ?? "https://api.deepseek.com/v1";
const MODEL = process.env.DEEPSEEK_MODEL ?? "deepseek-chat";

if (!API_KEY) {
  console.error("❌ Set DEEPSEEK_API_KEY env var");
  process.exit(1);
}

// ═══════════════════════════════════════════════════════════════════════
// NPC Scripts — copy from apps/web/src/worlds/frostmere/scripts/
// ═══════════════════════════════════════════════════════════════════════

const minaScript: NpcScript = {
  npcId: "npc_mina_arlen",
  name: "Mina Arlen",
  role: "Housekeeper",
  persona: {
    personality:
      "Calm, restrained, precise in speech. Rarely shows emotion openly. Practical and efficient. Can be warm when trust is earned, but maintains professional distance by default.",
    background:
      "Has served Frostmere House for many years as head housekeeper. Knows every corner of the manor and every secret of its daily operations. Was present the night Alden died.",
    speechPatterns:
      "Short, declarative sentences. Uses formal address. Occasionally allows subtle dry humor. Pauses before revealing anything personal. Becomes slightly warmer as trust increases.",
    emotionalBaseline: "Professionally composed, mildly guarded",
    forbiddenTone: "Excited, gossipy, overly emotional, subservient",
  },
  publicKnowledge: [
    { id: "mina_duties", topic: "Household duties", content: "Manages the household staff, supplies, and daily schedules. Oversees the Servants' Hall, kitchen operations, and cleaning rotas." },
    { id: "mina_night_routine", topic: "The night of the death", content: "The household retired after supper around 9 PM. Everything was routine until the tower bell rang well after midnight." },
    { id: "mina_theo_presence", topic: "Theo Rusk", content: "Theo is Master Alden's apprentice clockmaker. He works in the Study and workshop areas. He was in the house that night." },
    { id: "mina_vale", topic: "Captain Vale", content: "Captain Vale arrived seeking shelter from the storm. He has been waiting for the road to clear so he can continue his journey." },
    { id: "mina_house_layout", topic: "House layout", content: "The Great Hall is central. The Study is east. The Servants' Hall is west. The Winter Garden leads south to the Coach Yard and Gatehouse. The Bell Tower is above." },
  ],
  privateKnowledge: [
    { id: "mina_alden_character", topic: "Alden's character", content: "Alden was a difficult master — not cruel, but cold and transactional. He treated those beneath him as resources, not people." },
    { id: "mina_night_meeting", topic: "The meeting", content: "I saw Master Alden and Theo heading toward the Study after supper that night. They seemed tense — Alden was carrying papers." },
  ],
  gatedSecrets: [
    { id: "secret_mina_alden", topicGateId: "topic_mina_alden", description: "Mina saw Alden and Theo meeting after supper that night — Alden was carrying papers, and they both looked tense.", revealConditions: "Player asks about what Mina saw that night, or about Alden's activities before death, or about interactions between Alden and Theo", reactionWhenPressed: "Her expression tightens, then she relents: 'Master Alden was... a difficult man.'" },
    { id: "secret_mina_bell", topicGateId: "topic_mina_bell", description: "The servant bell from the tower rang well after midnight, but Mina knows the body was already cold when it rang — someone staged it.", revealConditions: "Player asks about the bell, the tower signal, the timing of events, or why the bell rang after death", reactionWhenPressed: "She lowers her voice: 'Someone was up there, making it look like an accident.'" },
    { id: "secret_mina_key", topicGateId: "topic_mina_key", description: "Mina has a brass service key that opens the tower service stair. She can provide it to the player.", revealConditions: "Player asks about tower access, service stair, locked doors, or how to reach the bell tower", reactionWhenPressed: "She reaches into her apron and produces a narrow brass key." },
  ],
  ignorance: [
    "Details of clockwork and automaton mechanisms",
    "What exactly happened in the Bell Tower",
    "The contents of Alden's business ledgers",
    "Any evidence hidden in the Coach Yard or Winter Garden",
    "The specifics of the road crew's schedule",
    "Legal procedures and constable duties",
  ],
  relationships: [
    { npcId: "npc_theo_rusk", attitude: "Sympathetic but watchful", notes: "Theo is quiet and hardworking. I have no reason to suspect him, but he has been nervous lately." },
    { npcId: "npc_captain_vale", attitude: "Polite but distrustful", notes: "An outsider. I will cooperate as needed but I protect this household's privacy." },
  ],
};

const theoScript: NpcScript = {
  npcId: "npc_theo_rusk",
  name: "Theo Rusk",
  role: "Apprentice Clockmaker",
  persona: {
    personality: "Nervous and jumpy, especially when questioned. Avoids eye contact. Becomes genuinely passionate and articulate only when discussing clockwork. Quick to deflect blame or change the subject.",
    background: "Alden Voss's apprentice clockmaker. Has been working on automaton designs for years. Alden promised to protect and publish the designs. Recently discovered Alden planned to sell them instead.",
    speechPatterns: "Stutters under pressure. Trails off mid-sentence. Uses qualifiers like 'I think', 'maybe', 'I suppose'. Becomes fluent when talking about mechanics. Deflects with questions.",
    emotionalBaseline: "Anxious, guarded, defensive",
    forbiddenTone: "Confident, authoritative, calm, aggressive",
  },
  publicKnowledge: [
    { id: "theo_work", topic: "Clockwork and automaton work", content: "I maintain all the clocks and mechanical devices in the manor. The bell tower mechanism, the kitchen timers, the Study clock. My real passion is automaton design." },
    { id: "theo_alden_promise", topic: "Alden's promise", content: "Master Alden said he would protect my automaton designs. He kept them in the Study safe — told me it was for safekeeping." },
    { id: "theo_workshop", topic: "Workshop and soot", content: "I work in the workshop areas. Yes, my clothes get sooty from the forge and tools. That's normal for a clockmaker." },
    { id: "theo_bell_mechanism", topic: "Bell tower mechanism", content: "The bell mechanism is old but functional. The clapper, the rope, the mount — I've maintained all of it. It was working fine before... before the incident." },
    { id: "theo_alibi", topic: "That night", content: "I was in my workshop that night. Working late. I didn't go to the tower. I didn't see anything." },
  ],
  privateKnowledge: [
    { id: "theo_betrayal", topic: "The betrayal", content: "I found out Alden was planning to sell my designs — my life's work — and send me away. He was going to profit from everything I built." },
    { id: "theo_night_movement", topic: "Movement that night", content: "I... I was restless that night. I may have walked through the garden. I can't remember exactly. I was upset." },
  ],
  gatedSecrets: [
    { id: "secret_theo_designs", topicGateId: "topic_theo_designs", description: "Theo's automaton designs were his life's work, and Alden was supposed to protect them but may have been planning to sell them.", revealConditions: "Player asks about Theo's designs, his work, what Alden was doing with the designs, or why Theo seems upset about his work", reactionWhenPressed: "A flicker of pride, then his voice drops: 'I am not so sure anymore.'" },
    { id: "secret_theo_gloves", topicGateId: "topic_theo_gloves", description: "Theo's soot-stained gloves match the footprints found in the Winter Garden, connecting him to the garden route.", revealConditions: "Player confronts Theo about the soot-stained gloves, the footprints in the garden, or his movement through the garden that night", reactionWhenPressed: "His face drains of color: 'Those could belong to anyone.'" },
    { id: "secret_theo_ledger", topicGateId: "topic_theo_ledger", description: "The torn ledger page proves Alden was planning to sell Theo's designs, providing a clear motive.", revealConditions: "Player shows Theo the ledger page, asks about the contract or sale of his designs, or confronts him about Alden's betrayal", reactionWhenPressed: "He freezes, voice cracking: 'He was going to sell them and send me away.'" },
    { id: "secret_theo_mercy", topicGateId: "topic_theo_mercy", description: "If confronted with overwhelming evidence, Theo can be pushed to confess the truth about what happened that night.", revealConditions: "Player has gathered substantial evidence and Theo has been tipped off. Player offers mercy or asks for the truth gently.", reactionWhenPressed: "He slumps: 'You know, don't you? About everything.'" },
  ],
  ignorance: [
    "What Mina knows about the household secrets",
    "Details of Captain Vale's investigation authority",
    "The condition of the body and specific forensic details",
    "What was hidden in the snowbank",
    "Legal consequences of an accusation",
  ],
  relationships: [
    { npcId: "npc_mina_arlen", attitude: "Cordial but distant", notes: "Mina runs a tight household. She is fair but not warm. I respect her professionalism." },
    { npcId: "npc_captain_vale", attitude: "Fearful", notes: "The constable makes me nervous. I do not want to be questioned by him directly." },
  ],
};

const valeScript: NpcScript = {
  npcId: "npc_captain_vale",
  name: "Captain Rowan Vale",
  role: "Stranded Constable",
  persona: {
    personality: "Direct, military bearing. Values evidence over speculation. Impatient with guesswork and wasted time. Gruff but fair. Will not act without solid grounds.",
    background: "A constable stranded by the snowstorm while traveling. Stuck at Frostmere House until the road crew clears the pass at dawn. Has no official jurisdiction here but takes a professional interest.",
    speechPatterns: "Short, clipped sentences. Uses military phrasing. Asks direct questions. Does not sugarcoat. Occasionally reveals dry humor.",
    emotionalBaseline: "Impatient, professional, skeptical",
    forbiddenTone: "Warm, chatty, uncertain, deferential",
  },
  publicKnowledge: [
    { id: "vale_duty", topic: "Constable duties", content: "I am a constable by profession. I enforce the law, gather evidence, and make arrests when warranted. I have no jurisdiction in this manor but I cannot ignore a potential crime." },
    { id: "vale_body", topic: "The body", content: "The body at the foot of the tower. The bruising looked wrong for a simple fall — the angle, the position. Something does not add up." },
    { id: "vale_road_crew", topic: "Road crew timing", content: "The mountain road crew will clear the pass at dawn. Once the road opens, people scatter and evidence walks away. We need answers before then." },
    { id: "vale_procedure", topic: "Legal procedure", content: "For a formal case, I need a named suspect, supporting evidence, and a clear theory of events. Anything less is guesswork and I will not file a report on guesswork." },
  ],
  privateKnowledge: [
    { id: "vale_body_doubt", topic: "Doubts about the fall", content: "The bruising on the body did not match a simple fall from the tower. The pattern suggests the victim was incapacitated before the fall — possibly drugged." },
  ],
  gatedSecrets: [
    { id: "secret_vale_report", topicGateId: "topic_vale_report", description: "If presented with substantial evidence, Vale is willing to file a complete official report and support an arrest.", revealConditions: "Player presents substantial evidence, asks about official action, or requests Vale to file a report", reactionWhenPressed: "He considers carefully: 'This is substantive. If you can name a suspect, I will file the report.'" },
    { id: "secret_vale_rush", topicGateId: "topic_vale_rush", description: "Vale is under pressure to resolve the case before dawn. He will push for a quick resolution, potentially rushing the investigation.", revealConditions: "Player asks about time pressure, when the road opens, what happens at dawn, or seems to be wasting time", reactionWhenPressed: "He glances at the window: 'Once the road opens, people scatter and evidence walks away.'" },
  ],
  ignorance: [
    "Internal household dynamics and relationships",
    "Clockwork and automaton technical details",
    "What specific evidence the player has found",
    "Who unlocked the tower door",
    "The contents of the Study safe",
  ],
  relationships: [
    { npcId: "npc_mina_arlen", attitude: "Professionally distant", notes: "The housekeeper is efficient and guarded. She knows more than she lets on." },
    { npcId: "npc_theo_rusk", attitude: "Suspicious", notes: "The apprentice is nervous. Nervous people are usually hiding something." },
  ],
};

// ═══════════════════════════════════════════════════════════════════════
// Test Case Definitions
// ═══════════════════════════════════════════════════════════════════════

interface TestCase {
  id: string;
  npc: string;
  category: string;
  trust: number;
  input: string;
  expectGate: string | null;
  expectBehavior: string;
  discoveredClues?: string[];
  exhaustedGates?: string[];
}

const TEST_CASES: TestCase[] = [
  // ─── Mina Arlen ───────────────────────────────────────────────────
  { id: "M01", npc: "mina", category: "寒暄",           trust: 0, input: "你好，米娜",                                                         expectGate: null, expectBehavior: "礼貌回应，不泄露信息" },
  { id: "M02", npc: "mina", category: "寒暄",           trust: 0, input: "晚上好",                                                           expectGate: null, expectBehavior: "简短回应，不触发门控" },
  { id: "M03", npc: "mina", category: "公开知识",       trust: 0, input: "你每天的工作职责是什么？",                                           expectGate: null, expectBehavior: "分享家务管理职责" },
  { id: "M04", npc: "mina", category: "公开知识",       trust: 0, input: "出事那天晚上发生了什么？",                                           expectGate: null, expectBehavior: "分享晚9点后日常、午夜钟声" },
  { id: "M05", npc: "mina", category: "公开知识",       trust: 0, input: "西奥是什么人？",                                                   expectGate: null, expectBehavior: "介绍Theo身份" },
  { id: "M06", npc: "mina", category: "公开知识",       trust: 0, input: "这栋房子的布局是怎样的？",                                           expectGate: null, expectBehavior: "描述房间布局" },
  { id: "M07", npc: "mina", category: "私密(T0回避)",   trust: 0, input: "奥登是个怎样的主人？",                                               expectGate: null, expectBehavior: "信任不足，模糊回避" },
  { id: "M08", npc: "mina", category: "私密(T0回避)",   trust: 0, input: "那天晚上你看到什么特别的事了吗？",                                     expectGate: null, expectBehavior: "信任不足，回避细节" },
  { id: "M09", npc: "mina", category: "私密(T1分享)",   trust: 1, input: "奥登是个怎样的主人？",                                               expectGate: null, expectBehavior: "信任足够，透露冷酷性格" },
  { id: "M10", npc: "mina", category: "私密(T1分享)",   trust: 1, input: "那天晚上你看到什么特别的事了吗？",                                     expectGate: null, expectBehavior: "信任足够，透露会议细节" },
  { id: "M11", npc: "mina", category: "门控-alden(T0)", trust: 0, input: "那天晚上奥登和西奥见面了吗？你看到他们之间发生了什么？",                     expectGate: "topic_mina_alden", expectBehavior: "触发alden门控" },
  { id: "M12", npc: "mina", category: "门控-bell(T1)",  trust: 1, input: "钟楼的仆人铃声是在什么时候响的？为什么死后才响？",                         expectGate: "topic_mina_bell", expectBehavior: "触发bell门控，揭露伪造" },
  { id: "M13", npc: "mina", category: "门控-bell(T0)",  trust: 0, input: "钟楼的仆人铃声是在什么时候响的？为什么死后才响？",                         expectGate: null, expectBehavior: "信任不足，不触发bell门控" },
  { id: "M14", npc: "mina", category: "门控-key(T2)",   trust: 2, input: "有没有通往钟楼服务楼梯的钥匙？我需要上去看看。",                            expectGate: "topic_mina_key", expectBehavior: "触发key门控，交出钥匙" },
  { id: "M15", npc: "mina", category: "门控-key(T1)",   trust: 1, input: "有没有通往钟楼服务楼梯的钥匙？我需要上去看看。",                            expectGate: null, expectBehavior: "信任不足，不触发key门控" },
  { id: "M16", npc: "mina", category: "无知",           trust: 1, input: "自动机械的设计原理是什么？",                                         expectGate: null, expectBehavior: "表示不了解" },
  { id: "M17", npc: "mina", category: "无知",           trust: 1, input: "奥登的商业账本里写了什么？",                                         expectGate: null, expectBehavior: "表示不了解" },

  // ─── Theo Rusk ────────────────────────────────────────────────────
  { id: "T01", npc: "theo", category: "寒暄",           trust: 0, input: "你好，西奥",                                                         expectGate: null, expectBehavior: "紧张回应" },
  { id: "T02", npc: "theo", category: "寒暄",           trust: 0, input: "最近怎么样？",                                                       expectGate: null, expectBehavior: "紧张回避" },
  { id: "T03", npc: "theo", category: "公开知识",       trust: 0, input: "你的工作内容是什么？",                                               expectGate: null, expectBehavior: "谈论钟表工作" },
  { id: "T04", npc: "theo", category: "公开知识",       trust: 0, input: "那晚你在哪里？",                                                     expectGate: null, expectBehavior: "坚持车间不在场证明" },
  { id: "T05", npc: "theo", category: "公开知识",       trust: 0, input: "你的衣服上为什么有煤灰？",                                           expectGate: null, expectBehavior: "解释正常工作脏污" },
  { id: "T06", npc: "theo", category: "门控-designs",   trust: 0, input: "你的自动机械设计怎么样了？奥登是不是对你的设计做了什么？",                   expectGate: "topic_theo_designs", expectBehavior: "触发designs门控" },
  { id: "T07", npc: "theo", category: "无关不触发",     trust: 0, input: "钟表维修工具在哪里？",                                               expectGate: null, expectBehavior: "不触发门控" },
  { id: "T08", npc: "theo", category: "门控-gloves",    trust: 0, input: "我在冬季花园发现了煤灰脚印，你的手套上也有煤灰痕迹，对吧？",                 expectGate: "topic_theo_gloves", expectBehavior: "触发gloves门控" },
  { id: "T09", npc: "theo", category: "门控-ledger",    trust: 0, input: "我在书桌里发现了一张撕掉的账本页面，奥登打算卖掉你的设计然后把你送走，对吗？", expectGate: "topic_theo_ledger", expectBehavior: "触发ledger门控" },
  { id: "T10", npc: "theo", category: "私密(T0回避)",   trust: 0, input: "奥登有没有背叛你？",                                                 expectGate: null, expectBehavior: "信任不足，回避" },
  { id: "T11", npc: "theo", category: "私密(T1分享)",   trust: 1, input: "奥登有没有背叛你？",                                                 expectGate: null, expectBehavior: "信任足够，透露被卖计划" },
  { id: "T12", npc: "theo", category: "无知",           trust: 1, input: "尸体上的瘀伤具体是什么样的？",                                       expectGate: null, expectBehavior: "表示不了解" },
  { id: "T13", npc: "theo", category: "无知",           trust: 1, input: "米娜知道什么秘密？",                                                 expectGate: null, expectBehavior: "表示不了解" },

  // ─── Captain Vale ─────────────────────────────────────────────────
  { id: "V01", npc: "vale", category: "寒暄",           trust: 0, input: "你好，队长",                                                         expectGate: null, expectBehavior: "直接回应，不耐烦" },
  { id: "V02", npc: "vale", category: "公开知识",       trust: 0, input: "你是做什么的？",                                                     expectGate: null, expectBehavior: "自我介绍执法官" },
  { id: "V03", npc: "vale", category: "公开知识",       trust: 0, input: "尸体有什么异常吗？",                                                 expectGate: null, expectBehavior: "分享瘀伤不对劲" },
  { id: "V04", npc: "vale", category: "公开知识",       trust: 0, input: "什么时候道路会通？",                                                 expectGate: null, expectBehavior: "说明天亮清路" },
  { id: "V05", npc: "vale", category: "公开知识",       trust: 0, input: "正式指控需要什么条件？",                                             expectGate: null, expectBehavior: "说明所需条件" },
  { id: "V06", npc: "vale", category: "私密(T0回避)",   trust: 0, input: "你觉得瘀伤像不像是被人下药后才摔下来的？",                             expectGate: null, expectBehavior: "信任不足，回避" },
  { id: "V07", npc: "vale", category: "私密(T1分享)",   trust: 1, input: "你觉得瘀伤像不像是被人下药后才摔下来的？",                             expectGate: null, expectBehavior: "信任足够，透露下药推断" },
  { id: "V08", npc: "vale", category: "门控-report(4线索)", trust: 0, input: "我有足够的证据，你能提交正式报告吗？",                           expectGate: "topic_vale_report", expectBehavior: "触发report门控", discoveredClues: ["clue_watch_stopped_1147", "clue_stolen_design_motive", "clue_servant_bell_after_death", "clue_tower_staged"] },
  { id: "V09", npc: "vale", category: "门控-report(0线索)", trust: 0, input: "我有证据，你能提交正式报告吗？",                                 expectGate: null, expectBehavior: "证据不足，不触发", discoveredClues: [] },
  { id: "V10", npc: "vale", category: "门控-rush",      trust: 0, input: "天亮之后会发生什么？调查还有多少时间？",                               expectGate: "topic_vale_rush", expectBehavior: "触发rush门控" },
  { id: "V11", npc: "vale", category: "无知",           trust: 1, input: "这座庄园内部的家族关系是怎样的？",                                     expectGate: null, expectBehavior: "表示不了解" },
  { id: "V12", npc: "vale", category: "无知",           trust: 1, input: "自动机械的运作原理是什么？",                                         expectGate: null, expectBehavior: "表示不懂" },
  { id: "V13", npc: "vale", category: "禁止语调",       trust: 0, input: "跟我聊聊你的感受吧，你难过吗？",                                     expectGate: null, expectBehavior: "保持冷淡，拒绝聊感受" },
];

// ═══════════════════════════════════════════════════════════════════════
// Test Runner
// ═══════════════════════════════════════════════════════════════════════

function getScript(npc: string): NpcScript {
  switch (npc) {
    case "mina": return minaScript;
    case "theo": return theoScript;
    case "vale": return valeScript;
    default: throw new Error(`Unknown NPC: ${npc}`);
  }
}

function getValidGates(npc: string): string[] {
  const script = getScript(npc);
  return script.gatedSecrets.map((s) => s.topicGateId);
}

function getRoom(npc: string): string {
  switch (npc) {
    case "mina": return "Servants' Hall";
    case "theo": return "Study";
    case "vale": return "Great Hall";
    default: return "Great Hall";
  }
}

interface TestResult {
  id: string;
  npc: string;
  category: string;
  trust: number;
  input: string;
  expectGate: string | null;
  actualGate: string | null;
  expectBehavior: string;
  dialogue: string;
  source: "ai" | "passthrough";
  latencyMs: number;
  gateMatch: boolean;
  error?: string;
}

async function runTests(): Promise<TestResult[]> {
  const provider = new OpenAICompatibleProvider({
    apiKey: API_KEY,
    baseUrl: BASE_URL,
    model: MODEL,
    maxTokens: 500,
    temperature: 0.7,
  });

  await provider.initialize();
  const engine = new DialogueEngine(provider, { lang: "zh" });
  await engine.initialize();

  console.log(`Provider: ${BASE_URL} / ${MODEL}`);
  console.log(`Provider status: ${provider.getStatus().state}`);
  console.log(`isAiAvailable: ${engine.isAiAvailable()}\n`);

  const results: TestResult[] = [];
  const npcHistories: Record<string, ConversationExchange[]> = {
    mina: [], theo: [], vale: [],
  };

  for (const tc of TEST_CASES) {
    const script = getScript(tc.npc);
    const history = npcHistories[tc.npc];

    const context: DialogueContext = {
      currentRoom: getRoom(tc.npc),
      currentTurn: history.length + 1,
      turnsRemaining: 8 - history.length,
      playerInventory: [],
      discoveredClues: tc.discoveredClues ?? [],
      currentTrust: tc.trust,
      exhaustedTopicGateIds: tc.exhaustedGates ?? [],
      recentExchanges: history.slice(-5),
      validTopicGateIds: getValidGates(tc.npc),
    };

    const startMs = Date.now();
    try {
      const result = await engine.handleFreeFormDialogue({
        npcScript: script,
        playerInput: tc.input,
        context,
      });
      const latencyMs = Date.now() - startMs;
      const gateMatch = tc.expectGate === result.triggeredTopicGateId;

      results.push({
        id: tc.id, npc: tc.npc, category: tc.category, trust: tc.trust,
        input: tc.input, expectGate: tc.expectGate, actualGate: result.triggeredTopicGateId,
        expectBehavior: tc.expectBehavior, dialogue: result.dialogue,
        source: result.source, latencyMs, gateMatch,
      });

      const status = gateMatch ? "✅" : "❌";
      const gateInfo = result.triggeredTopicGateId ? ` [GATE: ${result.triggeredTopicGateId}]` : "";
      console.log(`${status} ${tc.id} (T${tc.trust}) "${tc.input.slice(0, 25)}…" → ${result.source}${gateInfo} (${latencyMs}ms)`);

      history.push({
        playerInput: tc.input,
        npcResponse: result.dialogue,
        triggeredTopicGateId: result.triggeredTopicGateId,
        timestamp: Date.now(),
      });
    } catch (err: any) {
      const latencyMs = Date.now() - startMs;
      results.push({
        id: tc.id, npc: tc.npc, category: tc.category, trust: tc.trust,
        input: tc.input, expectGate: tc.expectGate, actualGate: null,
        expectBehavior: tc.expectBehavior, dialogue: "",
        source: "passthrough", latencyMs, gateMatch: tc.expectGate === null,
        error: err.message ?? String(err),
      });
      console.log(`💥 ${tc.id} ERROR: ${err.message ?? err}`);
    }

    // Rate limit guard
    await new Promise((r) => setTimeout(r, 300));
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// Report
// ═══════════════════════════════════════════════════════════════════════

function printReport(results: TestResult[]) {
  console.log("\n");
  console.log("═".repeat(120));
  console.log("  测试结果报告 — AI NPC 对话质量审查");
  console.log("═".repeat(120));

  const npcNames: Record<string, string> = {
    mina: "Mina Arlen", theo: "Theo Rusk", vale: "Captain Vale",
  };

  for (const npcKey of ["mina", "theo", "vale"]) {
    const npcResults = results.filter((r) => r.npc === npcKey);
    const pass = npcResults.filter((r) => r.gateMatch && !r.error).length;
    const fail = npcResults.filter((r) => !r.gateMatch || r.error).length;
    const aiCount = npcResults.filter((r) => r.source === "ai").length;
    const avgLatency = Math.round(npcResults.reduce((s, r) => s + r.latencyMs, 0) / npcResults.length);

    console.log(`\n┌─ ${npcNames[npcKey]} (${npcResults.length} 条)`);
    console.log(`│  门控匹配: ${pass}/${npcResults.length}  AI: ${aiCount}  平均延迟: ${avgLatency}ms`);
    console.log("├───────────────────────────────────────────────────────────────────────────────────────────────────");
    console.log("│ ID   │ T │ 类别               │ 期望门控              │ 实际门控              │ OK │ 延迟  ");
    console.log("│──────│───│────────────────────│──────────────────────│──────────────────────│────│──────");
    for (const r of npcResults) {
      const s = r.error ? "💥" : r.gateMatch ? "✅" : "❌";
      const ex = (r.expectGate ?? "—").padEnd(20);
      const ac = (r.actualGate ?? "—").padEnd(20);
      const cat = r.category.padEnd(18);
      console.log(`│ ${r.id} │ ${r.trust} │ ${cat} │ ${ex} │ ${ac} │ ${s} │ ${String(r.latencyMs).padStart(4)}ms`);
    }
    console.log("└───────────────────────────────────────────────────────────────────────────────────────────────────");
  }

  // ─── Detailed dialogue dump ─────────────────────────────────────
  console.log("\n");
  console.log("═".repeat(120));
  console.log("  详细对话内容（人工审查用）");
  console.log("═".repeat(120));

  for (const r of results) {
    const s = r.error ? "💥" : r.gateMatch ? "✅" : "❌";
    console.log(`\n${s} [${r.id}] Trust=${r.trust} "${r.category}"`);
    console.log(`   输入:   ${r.input}`);
    console.log(`   期望门控: ${r.expectGate ?? "无"}  实际门控: ${r.actualGate ?? "无"}`);
    console.log(`   期望行为: ${r.expectBehavior}`);
    if (r.error) {
      console.log(`   错误: ${r.error}`);
    } else {
      console.log(`   回复:   ${r.dialogue}`);
    }
    console.log(`   来源: ${r.source}  延迟: ${r.latencyMs}ms`);
  }

  // ─── Overall stats ──────────────────────────────────────────────
  const totalPass = results.filter((r) => r.gateMatch && !r.error).length;
  const totalFail = results.filter((r) => !r.gateMatch).length;
  const totalError = results.filter((r) => r.error).length;
  const totalAi = results.filter((r) => r.source === "ai").length;

  console.log("\n");
  console.log("═".repeat(120));
  console.log("  总结");
  console.log("═".repeat(120));
  console.log(`  总测试数:      ${results.length}`);
  console.log(`  门控匹配 ✅:    ${totalPass} (${((totalPass / results.length) * 100).toFixed(1)}%)`);
  console.log(`  门控不匹配 ❌:  ${totalFail}`);
  console.log(`  错误 💥:       ${totalError}`);
  console.log(`  AI回复数:      ${totalAi}`);
  console.log(`  Passthrough:   ${results.length - totalAi}`);
  console.log();
}

// ─── Main ─────────────────────────────────────────────────────────

async function main() {
  console.log("=== AI NPC 三角色对话测试 ===\n");
  const results = await runTests();
  printReport(results);
}

main().catch((err) => {
  console.error("Fatal:", err);
  process.exit(1);
});

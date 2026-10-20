# StoryCraft Game

本仓库包含两部分：

1. **@wutiankai/npc-dialogue** — 可复用的 AI NPC 对话引擎 npm 包（主要成果），面向推理/调查类游戏：对话生成、话题门控审查、双语关键词匹配。
2. **StoryCraft 推理游戏** — 该包的实际应用与验证场：暴风雪庄园谜案，探索房间、与 NPC 自由对话、收集线索、指认凶手。

[![npm](https://img.shields.io/npm/v/@wutiankai/npc-dialogue)](https://www.npmjs.com/package/@wutiankai/npc-dialogue)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

| 入口 | 地址 | 状态 |
|---|---|---|
| npm 包 | <https://www.npmjs.com/package/@wutiankai/npc-dialogue> | `1.0.0-alpha.1` 已发布（ESM exports 缺陷，见[版本状态](#四版本与发布状态)） |
| 在线 Demo | <http://game.wutiankai.cn> | 已部署并完成服务器侧验证；域名 ICP 备案受阿里云拦截，公网访问待备案解除后恢复 |
| 包源码 | [`packages/ai-narrative/`](packages/ai-narrative/) | 本仓库主维护 |
| 协作历史仓库 | <https://github.com/baodashuaige/StoryCraft> | UI/部署迭代线，内容已同步回本仓库 |

---

## 一、@wutiankai/npc-dialogue — 可复用 NPC 对话包

### 它做什么

把"AI 扮演有秘密的 NPC"这件事拆成可复用的几层：角色配置 → 提示词构建 → 模型调用 → 输出解析校验 → 门控候选审查。**包只产出对话文本和候选信号，不执行任何业务状态变更**——执行边界留给宿主应用（见下文[状态边界](#状态边界包不碰业务状态)）。

### 安装

```bash
npm install @wutiankai/npc-dialogue
```

### 最小示例

```ts
import {
  DialogueEngine,
  OpenAICompatibleProvider,
  loadConfigFromEnv,
  type NpcScript,
} from "@wutiankai/npc-dialogue";

const npc: NpcScript = {
  npcId: "butler",
  name: "James",
  role: "The Butler",
  worldSetting: "a murder mystery set in a Victorian manor",
  persona: {
    personality: "Formal, observant, slightly nervous",
    background: "Served the family for 30 years",
    speechPatterns: "Precise, avoids contractions",
  },
  publicKnowledge: [
    { id: "k1", topic: "house layout", content: "Knows every room" },
  ],
  privateKnowledge: [
    { id: "k2", topic: "the master's will", content: "Saw the new will before the fire" },
  ],
  gatedSecrets: [
    {
      id: "secret_will",
      topicGateId: "topic_will",
      description: "Knows about the changed will",
      revealConditions: "player asks about the will with trust >= 1",
      reactionWhenPressed: "becomes defensive",
      triggerKeywords: ["will", "inheritance", "遗嘱"],
    },
  ],
  ignorance: ["doesn't understand modern technology"],
  relationships: [],
};

const engine = new DialogueEngine(new OpenAICompatibleProvider(loadConfigFromEnv()), {
  lang: "zh",
  failOpen: true,
  maxConversationHistory: 10,
});
await engine.initialize();

const result = await engine.dialogue({
  npcScript: npc,
  playerInput: "遗嘱到底改了什么？",
  context: {
    currentRoom: "Study",
    currentTurn: 3,
    turnsRemaining: 5,
    playerInventory: [],
    discoveredClues: [],
    currentTrust: 1,
    exhaustedTopicGateIds: [],
    recentExchanges: [],
    validTopicGateIds: ["topic_will"], // 当前允许触发的话题门控
  },
});

console.log(result.dialogue);          // NPC 回复文本
console.log(result.candidateGateId);   // 候选门控（需调用方审查后执行）
```

### 输入 / 输出

| 方向 | 内容 |
|---|---|
| 输入 | `NpcScript`（角色定义）+ 玩家输入 + `DialogueContext`（房间/回合/背包/线索/**信任等级**/**当前允许触发的话题门控** `validTopicGateIds`/近期对话） |
| 输出 | `DialogueResult`：`dialogue` 回复文本 + `candidateGateId` 候选话题门控 + 置信度/证据 + `candidateActionHint` 动作提示（如 `item_given`）+ 审计记录 |

### 角色配置与知识分层

`NpcScript` 分层组织角色知识，模型每次只看到当前信任级允许的部分：

| 字段 | 作用 |
|---|---|
| `persona` | 性格、背景、说话方式 |
| `publicKnowledge` | 信任 0（陌生人）即可谈的公开信息 |
| `privateKnowledge` | 信任 ≥ 1 才可见的私人信息 |
| `gatedSecrets` | 需通过门控审查才揭示的秘密，绑定 `topicGateId` 与 `triggerKeywords` |
| `ignorance` | 明确不知/不懂的领域，约束模型不越界编造 |

### 信任与话题门控

- **信任三级**：0 陌生人 / 1 熟识 / 2 信任，决定可见知识层与门控阈值。
- **话题门控**：NPC 的每个秘密绑定一个话题门控；`DialogueContext.validTopicGateIds` 声明**当前允许触发哪些话题**（由宿主按剧情进度给出），`exhaustedTopicGateIds` 排除已消耗的。模型只能在候选中提议，不能自行揭示。
- **双语关键词**：`bilingualKeywordMap` 把英文关键词扩展出中文等价词（如 `will → 遗嘱`），中英文输入都能命中门控。

### 多轮上下文

`context.recentExchanges` 携带近期对话（`ConversationExchange[]`），配合 `maxConversationHistory`（默认 10）控制带入提示词的轮数；NPC 记得"刚才说过什么"，但窗口外的内容不会泄漏进提示词。

### 模型适配

实现 `NarrativeProvider` 接口即可接入任意模型：

| 内置 Provider | 用途 |
|---|---|
| `OpenAICompatibleProvider` | 任意 OpenAI 兼容接口（DeepSeek、OpenAI 等），`loadConfigFromEnv()` 从环境变量读取配置 |
| `PassthroughProvider` | 返回预置回复，用于测试与无 AI 模式 |

### 输出解析与候选审查

模型输出经过三层处理，不信任裸文本：

1. `parseAiJson` — 容错解析模型 JSON 输出（剥离代码块等）。
2. `validateDialogueResponse` — 校验响应结构完整性。
3. `reviewGateTrigger` — 审查候选门控：关键词相关性、证据质量、置信度是否达标；不达标则门控不触发，NPC 按 `reactionWhenPressed` 表演回避。

另附 `AuditLog` 记录整条对话管线事件，便于调试。

### 状态边界：包不碰业务状态

**模型只生成回复文本与候选信号**（候选门控、动作提示）。物品是否真的交出、门是否真的打开、线索是否真的入包，全部由宿主应用校验后执行。本仓库游戏侧的做法：

```
DialogueEngine（本包）
  → dialogue-intent（意图分类）
  → dialogue-policy.reviewDialogueCandidates（唯一决策点：问候/寒暄永不触发门控；
      候选门控必须在 validTopicGateIds 内且属于当前 NPC）
  → game-runtime.executeCommand（实际执行状态变化，回填 runtimeConfirmed）
```

包内没有任何写游戏状态的 API——这是有意设计，方便迁移到客服机器人等场景时复用同一套"生成 + 审查"管线，把业务动作留给各自的执行层。

---

## 二、StoryCraft 推理游戏 — 包的应用与验证

### 玩法

暴风雪之夜，庄园主人死在钟楼下。9 个调查回合内探索 7 个房间、与 3 名 NPC 自由对话（中英文均可）、收集 6 条线索、构建证据链指认凶手，多结局。浏览器图形界面与终端 CLI 双模式。

### 游戏如何接入对话包

游戏不绕过包的能力，而是逐项验证它们：

| 包的能力 | 游戏侧验证方式 |
|---|---|
| 角色知识分层 | 3 名 NPC 各自配置 `publicKnowledge` / `privateKnowledge` / `gatedSecrets`（见 `apps/web/src/worlds/frostmere/scripts/`） |
| 话题门控 | 剧情进度决定 `validTopicGateIds`；`dialogue-policy` 拒绝越权候选 |
| 双语关键词 | `apps/web/src/worlds/frostmere/keywords.ts` 提供中文关键词映射 |
| 多轮上下文 | NPC 对话跨回合保持连贯，`recentExchanges` 传入窗口 |
| 状态边界 | 即使模型声称 `item_given`，也要 runtime 确认后才入包（`runtimeConfirmed`） |

接入方式：monorepo 内通过路径别名引用包源码（`vite.config.ts` / `tsconfig.json` 将 `@wutiankai/npc-dialogue` 映射到 `packages/ai-narrative/src`），发布与开发共用同一份代码。

### 运行游戏

**浏览器模式**（后端 + 前端）：

```bash
npm install

# 后端：http://localhost:3001（首次启动自动生成 JWT_SECRET / ENCRYPTION_KEY）
cd apps/server && npx tsx src/index.ts

# 前端：http://localhost:5173
cd apps/web && npx vite --host
```

未配置 AI 密钥时以普通模式游玩；配置后为 AI 对话模式。API 密钥只在页面 ⚙️ 设置中填写，AES-256-GCM 加密存于后端 SQLite，浏览器永远不接触原始密钥。演示部署固定房主账号 `tb` / `123456`（首个注册用户自动成为房主）。

**终端模式**（无需后端）：

```bash
# 普通模式
npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts

# AI 模式
OPENAI_API_KEY=sk-xxx AI_BASE_URL=https://api.deepseek.com/v1 AI_MODEL=deepseek-chat \
  npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts
```

命令：`look`、`go 东`、`search 书桌`、`take 钥匙`，或直接对 NPC 说话；`help` 查看全部。

---

## 三、开发

```bash
npm run check         # 根目录：typecheck + build + 全部测试（316 项）
npm test              # 同上（含构建）

# 对话包单独构建与测试（发布用）
cd packages/ai-narrative
npm install
npm run build         # tsup → ESM + CJS + 类型声明
npm test              # 25 项
```

项目结构：

```text
storycraft-game/
  apps/
    cli/                 终端游戏模式
    server/              Express 后端（认证、密钥加密存储、AI 代理）
    web/                 Vite + TypeScript 浏览器前端
  packages/
    ai-narrative/        @wutiankai/npc-dialogue 包源码
    game-runtime/        游戏引擎（房间、命令、规则、状态机）
    shared/              共享契约与类型
  deploy/                部署脚本与 nginx 配置
```

### 部署

服务器部署用 `deploy/deploy-local.sh`，**凭据全部从环境变量读取**（不写入任何文件）：

```bash
DEPLOY_HOST=<服务器IP> DEPLOY_USER=<用户> DEPLOY_PASSWORD=<密码> \
  bash deploy/deploy-local.sh "提交信息"
```

## 四、版本与发布状态

- npm `1.0.0-alpha.1` 已发布；其 `exports` 指向了不存在的 `dist/index.mjs`（tsup 实际产出 `index.js`/`index.cjs`），**ESM 方式安装该版本会失败**。修复已在本仓库完成，待重发 `alpha.2`；此前请以仓库源码方式引用。
- 包内 `package.json` 已补 `repository` / `homepage` / `bugs` 元数据。

## 五、路线图

**对话包侧**（可独立于游戏推进）

- [ ] 重发 `1.0.0-alpha.2`（修复 ESM exports）
- [ ] 更多对话语言与提示词模板外部化
- [ ] 审查策略可配置化（置信度阈值、门控规则外置）

**游戏侧**

- [ ] 新剧本（复用同一对话包，验证包的可移植性）
- [ ] 移动端体验继续打磨

> 说明：本项目的对话管线（生成 → 解析 → 审查 → 应用执行）结构上可迁移到客服机器人等场景，但目前**尚未有客服场景的实际交付**；门控机制约束的是"话题揭示时机"，不构成对提示注入的已验证防御。

## 六、贡献者与来源

- **Tucker_Wu**（[@tiankai-333](https://github.com/tiankai-333)）— 对话包设计实现、游戏运行时、CLI、文档（本仓库主维护者）
- **baodashuaige** — 浏览器 UI 视觉与移动端适配、部署脚本与发布流程

UI/部署迭代在 [baodashuaige/StoryCraft](https://github.com/baodashuaige/StoryCraft) 进行，已整体同步回本仓库；后续以本仓库为主维护。

## License

[MIT](LICENSE)

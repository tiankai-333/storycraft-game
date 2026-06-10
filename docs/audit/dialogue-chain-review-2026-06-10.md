# AI NPC 对话链路审查文档

**审查日期:** 2026-06-10
**审查范围:** 玩家非命令自然语言 → NPC 回复完整路径
**基准提交:** `fdd6c66` (Add AI dialogue engine with trust, gates, and anti-leakage)

---

## 1. 完整调用链

玩家在命令栏输入一句非命令自然语言（如 `"你那天晚上在哪里？"`），完整经过以下函数：

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: UI Entry                                                      │
│  apps/web/src/screens/game.ts                                           │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  [Enter 键 / 点击提交]                                                  │
│       │                                                                 │
│       ▼                                                                 │
│  handleCommand()                                              :L90      │
│    ├── isProcessing? → return (防重入锁)                                │
│    ├── raw = input.value.trim()                                         │
│    ├── firstWord = raw.toLowerCase().split(/\s+/)[0]                    │
│    ├── firstWord ∉ KNOWN_VERBS && AI可用 && 有选中NPC?                  │
│    │       │ YES                                                        │
│    │       ▼                                                            │
│    │   executeAiDialogue(npcId, raw)                          :L212     │
│    │     ├── isProcessing = true                                        │
│    │     ├── setInputsDisabled(true)                                    │
│    │     ├── 在 narrative-log 中显示玩家消息 + spinner                   │
│    │     │                                                              │
│    │     ▼                                                              │
│ ┌───┤  dialogueService.handleDialogue({npcId, playerInput, state,       │
│ │   │    adventure, pack})                                    :L227     │
│ │   │                                                                    │
│ │   │  ┌──────────────────────────────────────────────────────────────┐ │
│ │   │  │  Layer 2: Orchestrator                                       │ │
│ │   │  │  apps/web/src/services/dialogue-service.ts                   │ │
│ │   │  ├──────────────────────────────────────────────────────────────┤ │
│ │   │  │                                                              │ │
│ │   │  │  handleDialogue()                                  :L86      │ │
│ │   │  │    ├── 验证 npcScript 存在                                    │ │
│ │   │  │    ├── 构建 DialogueContext:                                  │ │
│ │   │  │    │   ├── validGateIds (NPC匹配 + 未触发 + 条件满足)         │ │
│ │   │  │    │   ├── exhaustedGateIds (已触发的)                        │ │
│ │   │  │    │   ├── currentTrust, inventory, clues, room, turns       │ │
│ │   │  │    │   └── recentExchanges (最近5条)                          │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ▼                                                         │ │
│ │   │  │  this.engine.handleFreeFormDialogue(request)       :L129      │ │
│ │   │  │                                                              │ │
│ │   │  │  ┌────────────────────────────────────────────────────────┐  │ │
│ │   │  │  │  Layer 3: AI Engine                                   │  │ │
│ │   │  │  │  packages/ai-narrative/src/dialogue/engine.ts         │  │ │
│ │   │  │  ├────────────────────────────────────────────────────────┤  │ │
│ │   │  │  │                                                      │  │ │
│ │   │  │  │  handleFreeFormDialogue()                   :L72       │  │ │
│ │   │  │  │    ├── AI不可用? → return passthroughResult :L90      │  │ │
│ │   │  │  │    │                                                  │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  buildNpcDialoguePrompt()                   :L95       │  │ │
│ │   │  │  │    ├── [系统提示词] prompt/system-prompt.ts             │  │ │
│ │   │  │  │    │   ├── 角色 + 性格 + 知识 + 秘密                    │  │ │
│ │   │  │  │    │   └── JSON 输出 schema 定义                       │  │ │
│ │   │  │  │    └── [用户提示词] prompt/user-prompt.ts               │  │ │
│ │   │  │  │        └── 房间/回合/库存/线索/信任/历史/玩家输入         │  │ │
│ │   │  │  │                                                      │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  provider.call(narrativeRequest, system, user) :L107   │  │ │
│ │   │  │  │    │  (OpenAICompatibleProvider → DeepSeek API)        │  │ │
│ │   │  │  │    │ throw? → return passthroughResult :L110           │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  parseAiJson(rawText)                      :L116       │  │ │
│ │   │  │  │    │  (见 §2.4 分支)                                    │  │ │
│ │   │  │  │    │ throw? → return 原始文本作为对话 :L119              │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  validateDialogueResponse(parsed, ctx, script) :L135   │  │ │
│ │   │  │  │    │  对话长度裁剪 + candidateGateId 结构校验             │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  reviewGateTrigger(validated, input, script, ctx):L142 │  │ │
│ │   │  │  │    │  关键词相关性 + 证据质量过滤                        │  │ │
│ │   │  │  │    ▼                                                  │  │ │
│ │   │  │  │  return DialogueResult {                              │  │ │
│ │   │  │  │    dialogue, candidateGateId, gateEvidence,           │  │ │
│ │   │  │  │    gateConfidence, trustSignal, trustEvidence,        │  │ │
│ │   │  │  │    candidateActionHint, source: "ai"                  │  │ │
│ │   │  │  │  }                                                    │  │ │
│ │   │  │  └────────────────────────────────────────────────────────┘  │ │
│ │   │  │                                                              │ │
│ │   │  │    ▼ result 回到 Layer 2                                     │ │
│ │   │  │                                                              │ │
│ │   │  │  [source === "passthrough"?]                      :L136      │ │
│ │   │  │    │ YES → handleProviderError() → return error结果          │ │
│ │   │  │    │ NO                                                      │ │
│ │   │  │    ▼                                                         │ │
│ │   │  │  handleAiResult()                                 :L186      │ │
│ │   │  │    │                                                          │ │
│ │   │  │    ├── 1. classifyIntent(playerInput)             :L197      │ │
│ │   │  │    │     apps/web/src/services/dialogue-intent.ts            │ │
│ │   │  │    │     → DialogueIntent { kind, isGreeting, isShortInput } │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ├── 2. 检查 gate 自带 trustDelta              :L200      │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ├── 3. reviewDialogueCandidates(policyInput)   :L209      │ │
│ │   │  │    │     apps/web/src/services/dialogue-policy.ts            │ │
│ │   │  │    │     → DialoguePolicyDecision {                         │ │
│ │   │  │    │         acceptedGateId, trustDelta,                     │ │
│ │   │  │    │         suppressRuntimeBlockedLine,                     │ │
│ │   │  │    │         possibleStateClaim, notes[]                     │ │
│ │   │  │    │       }                                                 │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ├── 4. acceptedGateId? apply via executeCommand() :L226   │ │
│ │   │  │    │     ├── talkResult = executeCommand(state,              │ │
│ │   │  │    │     │     {verb:"talk", npc, topic}, adventure)         │ │
│ │   │  │    │     ├── talkResult.ok && turnSpent → gateEffects       │ │
│ │   │  │    │     ├── item_given / access_granted 确认               │ │
│ │   │  │    │     └── talkResult.ok === false → 静默，不显示blocked   │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ├── 5. 应用 policy-decided 信任度变化         :L261      │ │
│ │   │  │    │     trustByNpcId[npcId] = clamp(0..2, current + delta) │ │
│ │   │  │    │                                                         │ │
│ │   │  │    ├── 6. updateHistory(npcId, exchange)          :L304      │ │
│ │   │  │    │     保留最近5条对话记录                                  │ │
│ │   │  │    │                                                         │ │
│ │   │  │    └── return DialogueServiceResult                          │ │
│ │   │  └──────────────────────────────────────────────────────────────┘ │
│ │   │                                                                    │
│ │   ▼ result 回到 Layer 1                                               │
│ │                                                                        │
│ ├── source === "error"                                        :L233      │
│ │     → 显示 "AI 服务暂时不可用" 错误消息                               │
│ │                                                                        │
│ ├── source === "passthrough"                                  :L245      │
│ │     → 显示关键词/固定回复                                               │
│ │                                                                        │
│ └── source === "ai"                                           :L259      │
│       ├── 显示 NPC 对话文本 + AI 徽章 (✦)                     :L260      │
│       ├── gateEffects? → 显示线索/物品/信任/回合消耗          :L268      │
│       ├── trustDeltaApplied !== 0? → 显示信任变化             :L303      │
│       ├── renderVisibleState()                                :L312      │
│       └── isComplete? → 显示结局画面                          :L315      │
│                                                                          │
│  finally:                                                                 │
│    ├── spinnerEl.remove()                                                 │
│    ├── isProcessing = false                                               │
│    └── setInputsDisabled(false)                                           │
└──────────────────────────────────────────────────────────────────────────┘
```

---

## 2. 分支路径矩阵

每一行是一个决策点，列出条件、走哪条分支、以及该分支的**状态副作用**。

### 2.1 入口路由（game.ts → handleCommand）

| # | 条件 | 分支 | 副作用 |
|---|------|------|--------|
| A1 | `isProcessing === true` | 直接 return | 无 |
| A2 | `raw === ""` | 直接 return | 无 |
| A3 | `firstWord ∉ KNOWN_VERBS` **且** `AI可用` **且** `有选中NPC` | → `executeAiDialogue()` | 进入AI对话链 |
| A4 | 以上均不满足 | → `parseCommand()` → `executeAndRender()` | 走标准命令路径（非AI） |

**涉及文件:** [game.ts:90-118](apps/web/src/screens/game.ts#L90-L118)

### 2.2 AI 可用性（engine.ts → handleFreeFormDialogue）

| # | 条件 | 分支 | 返回 source | 副作用 |
|---|------|------|-------------|--------|
| B1 | `provider.id === "passthrough"` **或** `status.state ∉ {ready, degraded}` | passthroughResult | `"passthrough"` | 无AI调用，dialogue=`""`, 所有候选信号=null |

**涉及文件:** [engine.ts:64-68](packages/ai-narrative/src/dialogue/engine.ts#L64-L68), [engine.ts:75-92](packages/ai-narrative/src/dialogue/engine.ts#L75-L92)

### 2.3 Provider 调用（engine.ts）

| # | 条件 | 分支 | 返回 source | 副作用 |
|---|------|------|-------------|--------|
| C1 | `provider.call()` 抛出异常 | catch → return passthroughResult | `"passthrough"` | 无AI对话，回到 dialogue-service 后会被映射为 `"error"` |
| C2 | `provider.call()` 成功 | 继续 → parseAiJson | — | — |

**涉及文件:** [engine.ts:103-111](packages/ai-narrative/src/dialogue/engine.ts#L103-L111)

### 2.4 JSON 解析（parse.ts → parseAiJson）

| # | 条件 | 分支 | 结果 | 副作用 |
|---|------|------|------|--------|
| D1 | 找到完整 JSON `{...}` 且 `JSON.parse` 成功 | → `buildResponse(parsed)` | 结构化 DialogueAiResponse | 新旧字段名自动映射 |
| D2 | 完整 JSON 解析失败 | → 尝试截断 JSON 解析 | 用 regex 提取 `dialogue`/`candidateGateId` 等 | 容错降级 |
| D3 | 完全无 JSON 结构（无 dialogue 也无 candidateGateId） | throw Error | 回到 engine.ts catch 块 | → **fallback: 原始 AI 文本作为对话**，source=`"ai"`，所有候选信号=null/neutral |
| D4 | markdown 包裹的 ` ```json...``` ` | 先去除外层，再走 D1/D2 | 同 D1/D2 | — |

**engine.ts 对 D3 的处理（:L117-132）：**

```typescript
catch {
  // JSON parse failed — show raw AI text as dialogue (better than canned greeting)
  return {
    dialogue: rawText.slice(0, 1000) || "...",
    candidateGateId: null,
    source: "ai",
    trustSignal: "neutral",
    // ... all other candidate signals = null/neutral
  };
}
```

关键：JSON 解析失败时玩家仍能看到 NPC 的非结构化回复文本。

**涉及文件:** [parse.ts:19-97](packages/ai-narrative/src/dialogue/parse.ts#L19-L97), [engine.ts:114-132](packages/ai-narrative/src/dialogue/engine.ts#L114-L132)

### 2.5 结构校验（schema.ts → validateDialogueResponse）

| # | 条件 | 动作 | 状态影响 |
|---|------|------|----------|
| E1 | `dialogue` 非字符串或为空 | 替换为 `"..."` | 玩家看到省略号 |
| E2 | `dialogue.length > 1000` | 裁剪至 1000 字符 | — |
| E3 | `candidateGateId` 非字符串 | → null | gate 被丢弃 |
| E4 | `candidateGateId` ∉ `validTopicGateIds` | → null | gate 被丢弃 |
| E5 | `candidateGateId` 不属于该 NPC 的 `gatedSecrets` | → null | gate 被丢弃 |
| E6 | `candidateGateId` ∈ `exhaustedTopicGateIds` | → null | gate 被丢弃 |

**涉及文件:** [schema.ts:18-54](packages/ai-narrative/src/dialogue/schema.ts#L18-L54)

### 2.6 Gate 触发审查（gate-review.ts → reviewGateTrigger）

仅在 `candidateGateId !== null` 时执行。

| # | 条件 | 动作 | 状态影响 |
|---|------|------|----------|
| F1 | `candidateGateId === null` | 直接 return，不做任何检查 | — |
| F2 | NPC 的 `gatedSecrets` 中找不到对应 secret | → `candidateGateId = null` | gate 被丢弃 |
| F3 | 玩家输入与 secret 关键词无匹配（双语扩展后） | → `candidateGateId = null` | gate 被丢弃 |
| F4 | `gateEvidence` 为空 **且** `gateConfidence < "medium"` | → `candidateGateId = null` | gate 被丢弃（AI 证据不足） |
| F5 | 通过 F3 + F4 | 保留 `candidateGateId` | 候选 gate 传递给策略层 |

**涉及文件:** [gate-review.ts:98-141](packages/ai-narrative/src/dialogue/gate-review.ts#L98-L141)

### 2.7 意图分类（dialogue-intent.ts → classifyIntent）

| # | 条件 | kind | isGreeting | 对下游策略的影响 |
|---|------|------|------------|------------------|
| G1 | `trimmed.length < 5` | `"greeting"` | `true` | 策略 Rule 1 → 短路，gate 永远不触发 |
| G2 | 匹配 GREETING_PATTERN | `"greeting"` | `true` | 同上 |
| G3 | 匹配 SMALLTALK_PATTERN | `"smalltalk"` | `false` | 策略 Rule 1 → 短路，gate 永远不触发 |
| G4 | 包含 `?`/`？` 或匹配 QUESTION_STARTS | `"question"` | `false` | 允许触发 gate |
| G5 | 匹配 EVIDENCE_PATTERN | `"evidence_presenting"` | `false` | 允许触发 gate |
| G6 | 以上均不匹配 | `"unknown"` | `false` | 允许触发 gate |

**涉及文件:** [dialogue-intent.ts:37-63](apps/web/src/services/dialogue-intent.ts#L37-L63)

### 2.8 策略审查（dialogue-policy.ts → reviewDialogueCandidates）

| # | 条件 | 决定 | trustDelta | acceptedGateId | 状态影响 |
|---|------|------|------------|----------------|----------|
| H1 | `intent.isGreeting` **或** `intent.kind === "smalltalk"` | **短路返回** | 0 | null | 不触发任何 gate，不改变信任 |
| H2 | `candidateGateId !== null` **且** `∉ validGateIds` | 拒绝 gate | 见 H5 | null | `suppressRuntimeBlockedLine = true` |
| H3 | `candidateGateId !== null` **且** gate.npcId !== 当前 npcId | 拒绝 gate | 见 H5 | null | `suppressRuntimeBlockedLine = true` |
| H4 | `candidateGateId !== null` **且** 在 validGateIds **且** NPC 匹配 | **接受 gate** | 见 H5 | = candidateGateId | gate 被发送到 runtime |
| H5 | gate 被接受 **且** gate 自带 trustDelta ≠ 0 | 信任由 gate 控制 | 0 | — | AI 的 trustSignal 被忽略，防止叠加 |
| H6 | 无 gate trust **且** `trustSignal === "warmer"` | AI 信任生效 | +1 | — | — |
| H7 | 无 gate trust **且** `trustSignal === "colder"` | AI 信任生效 | −1 | — | — |
| H8 | 无 gate trust **且** `trustSignal === "neutral"` | 无信任变化 | 0 | — | — |

**actionHint 检测（Rule 4）：**

| # | 条件 | possibleStateClaim |
|---|------|-------------------|
| H9 | gate 有 `revealsItemIds.length > 0` | `"item_given"` |
| H10 | AI `candidateActionHint === "item_given"` **且** 无 gate 覆盖 | `"item_given"` |
| H11 | AI `candidateActionHint === "access_granted"` **且** 无 gate 覆盖 | `"access_granted"` |

**涉及文件:** [dialogue-policy.ts:57-131](apps/web/src/services/dialogue-policy.ts#L57-L131)

### 2.9 Runtime 执行（dialogue-service.ts → handleAiResult Step 4）

仅在 `policy.acceptedGateId !== null` 时执行。

| # | 条件 | 动作 | 状态影响 |
|---|------|------|----------|
| J1 | `executeCommand({verb:"talk", npc, topic})` | 调用 game-runtime | 可能改变：flags, inventory, clues, trust, turns |
| J2 | `talkResult.ok === true && turnSpent` | 构建 gateEffects | 记录线索/物品/信任/回合消耗 |
| J3 | `talkResult.ok === true` **且** `possibleStateClaim === "item_given"` **且** `gate.revealsItemIds.length > 0` | `runtimeConfirmed = true` | 状态声明被 runtime 确认 |
| J4 | `talkResult.ok === true` **且** `possibleStateClaim === "access_granted"` **且** `gate.movesNpcToRoomId` | `runtimeConfirmed = true` | 状态声明被 runtime 确认 |
| J5 | `talkResult.ok === false` | **静默处理**，不显示 runtime blockedResponse | AI 对话文本就是 NPC 声音 |

**涉及文件:** [dialogue-service.ts:222-257](apps/web/src/services/dialogue-service.ts#L222-L257)

### 2.10 信任度应用（dialogue-service.ts → handleAiResult Step 5）

| # | 条件 | 动作 | 状态影响 |
|---|------|------|----------|
| K1 | `policy.trustDelta !== 0` | `newTrust = clamp(0..2, current + delta)` | `trustByNpcId[npcId]` 更新 |
| K2 | `newTrust === currentTrust` | `trustDeltaApplied = 0` | 无实际变化（已在边界值） |
| K3 | `newTrust !== currentTrust` | `trustDeltaApplied = newTrust - currentTrust` | 信任度实际改变 |

**涉及文件:** [dialogue-service.ts:260-271](apps/web/src/services/dialogue-service.ts#L260-L271)

---

## 3. 状态变更汇总

一次 AI 对话可能产生的**所有状态变更**，按层级：

| 状态字段 | 谁决定 | 触发条件 | 范围 |
|----------|--------|----------|------|
| `state.flags["talked_{gateId}"]` | game-runtime (executeCommand) | J1: gate 被策略接受 | boolean |
| `state.inventoryItemIds` | game-runtime | J1: gate 有 revealsItemIds | 追加 itemId |
| `state.discoveredClueById` | game-runtime | J1: gate 有 revealsClueIds | 追加 clueId |
| `state.trustByNpcId[npcId]` | game-runtime **或** dialogue-policy | J1 gate自带trustDelta **或** K1 AI trustSignal | 0→1→2, 不超 [0,2] |
| `state.turnIndex` | game-runtime | J2: talkResult.turnSpent | +1 |
| `state.turnsRemaining` | game-runtime | J2: talkResult.turnSpent | −1 |
| `state.isComplete` | game-runtime | 结局条件满足 | boolean |
| `state.endingId` | game-runtime | 结局条件满足 | string or null |
| conversationHistory[npcId] | DialogueService | 每次 AI 成功 | 追加 ConversationExchange, 保留最近5条 |

---

## 4. Fallback 链路

```
玩家输入
  │
  ├─ AI 不可用 ──→ source="passthrough" ──→ 渲染错误提示 (game.ts :L233)
  │
  ├─ provider.call() 抛异常 ──→ source="passthrough" ──→ 同上
  │
  ├─ parseAiJson() 失败 ──→ source="ai", dialogue=rawText[:1000], 所有候选信号=null
  │                         └─→ 渲染 AI 原始文本 (无 gate 触发，无信任变化)
  │
  ├─ candidateGateId 被 schema.ts 拒绝 ──→ gateId=null，继续正常对话
  │
  ├─ candidateGateId 被 gate-review.ts 拒绝 ──→ gateId=null，继续正常对话
  │
  ├─ intent 是 greeting/smalltalk ──→ policy 短路，gate 永不触发
  │
  ├─ policy 拒绝 gate (不在 validGateIds / NPC 不匹配) ──→ gateId=null，suppress blocked line
  │
  ├─ runtime executeCommand 返回 ok=false ──→ gateEffects=null，静默处理，AI 文本即最终回复
  │
  └─ 全部通过 ──→ 正常执行 gate 效果 + 信任变化
```

---

## 5. 设计原则摘要

1. **AI 只产生候选信号（candidate），不直接修改状态。** 所有状态变更经过 policy 或 runtime 仲裁。
2. **三层 gate 过滤：** schema.ts（结构） → gate-review.ts（关键词相关性 + 证据质量） → dialogue-policy.ts（意图 + 合法性）。
3. **信任度不叠加：** gate 自带 trustDelta 时，AI 的 trustSignal 被忽略。
4. **信任度硬限：** 0–2，由 dialogue-service.ts 做了 `Math.max(0, Math.min(2, ...))`。
5. **对话历史是 per-NPC 的，** Map 结构，最近 5 条。
6. **AI 对话即 NPC 声音：** runtime blockedResponse 在 AI 路径下被抑制（Phase 4），避免双重回复。

---

## 6. 涉及文件索引

| 文件 | 职责 | 行号范围 |
|------|------|----------|
| [game.ts](apps/web/src/screens/game.ts) | UI 入口、渲染、防重入 | L90-331 |
| [dialogue-provider.ts](apps/web/src/services/dialogue-provider.ts) | Provider 工厂（DeepSeek / Passthrough） | 全文 34 行 |
| [dialogue-service.ts](apps/web/src/services/dialogue-service.ts) | 编排层：engine → intent → policy → runtime | L56-308 |
| [dialogue-intent.ts](apps/web/src/services/dialogue-intent.ts) | 规则意图分类 | L37-63 |
| [dialogue-policy.ts](apps/web/src/services/dialogue-policy.ts) | 策略审查（gate/信任/claim 决策） | L57-131 |
| [engine.ts](packages/ai-narrative/src/dialogue/engine.ts) | AI 引擎（prompt/call/parse/validate/review） | L38-219 |
| [types.ts](packages/ai-narrative/src/dialogue/types.ts) | 所有对话类型定义 | 全文 117 行 |
| [parse.ts](packages/ai-narrative/src/dialogue/parse.ts) | AI JSON 解析（完整/截断/旧字段兼容） | L19-174 |
| [schema.ts](packages/ai-narrative/src/dialogue/schema.ts) | 结构校验（dialogue 长度 + gateId 合法性） | L18-54 |
| [gate-review.ts](packages/ai-narrative/src/dialogue/gate-review.ts) | 候选 gate 过滤（关键词 + 证据） | L98-141 |
| [prompts.ts](packages/ai-narrative/src/dialogue/prompts.ts) | Prompt 门面（委托子模块） | 全文 32 行 |
| [system-prompt.ts](packages/ai-narrative/src/dialogue/prompt/system-prompt.ts) | 系统提示词构建（EN/ZH） | 全文 145 行 |
| [user-prompt.ts](packages/ai-narrative/src/dialogue/prompt/user-prompt.ts) | 用户提示词构建 | 全文 45 行 |
| [gated-secrets.ts](packages/ai-narrative/src/dialogue/prompt/gated-secrets.ts) | 秘密格式化（EN/ZH） | 全文 35 行 |

---

## 7. Hotfix: Provider 重试冷却 (2026-06-10)

**问题:** AI provider 失败后，玩家再次输入同一句话时界面彻底卡死。

**根因分析:**

```
第1次调用:
  provider.call() → 快速失败 (DNS/网络/认证错误)
  → engine 返回 source="passthrough"
  → DialogueService 映射为 source="error"
  → game.ts 显示 "⚠ AI 服务暂时不可用"  ✓ 正确

  此时 provider 状态变为 "degraded" (consecutiveFailures=1)
  isAiAvailable() 仍然返回 true (degraded 被视为可用)

第2次调用:
  isAiAvailable() = true → game.ts 继续路由到 AI 对话
  DialogueService.handleDialogue() → engine.handleFreeFormDialogue()
  → provider.call() → fetch() 挂起...
  → 等待 12 秒超时 (AbortController)
  → 期间 UI 显示 spinner，isProcessing=true，所有输入被拒绝
  → 玩家感知为 "彻底卡死"
```

**修复:** 在 `DialogueService` 中增加 30 秒 provider 重试冷却期。

```
handleDialogue() 入口新增检查:
  ├── lastProviderErrorAt > 0 && (now - lastProviderErrorAt) < 30s?
  │     YES → 立即返回 error 结果 (无 fetch，无超时)
  │     NO  → 正常调用 engine
  │
  ├── engine 返回 passthrough?
  │     → lastProviderErrorAt = now  (记录失败时间)
  │     → 返回 error 结果
  │
  └── engine 返回 ai?
        → lastProviderErrorAt = 0    (重置冷却)
        → 继续正常流程
```

**代码变更:**

| 文件 | 变更 |
|------|------|
| [dialogue-service.ts:57-58](apps/web/src/services/dialogue-service.ts#L57-L58) | 新增 `PROVIDER_RETRY_COOLDOWN_MS = 30_000` 常量 |
| [dialogue-service.ts:64](apps/web/src/services/dialogue-service.ts#L64) | 新增 `lastProviderErrorAt` 状态字段 |
| [dialogue-service.ts:128-133](apps/web/src/services/dialogue-service.ts#L128-L133) | 冷却期内直接返回 error，不调用 engine |
| [dialogue-service.ts:142](apps/web/src/services/dialogue-service.ts#L142) | passthrough 时记录 `lastProviderErrorAt = Date.now()` |
| [dialogue-service.ts:149](apps/web/src/services/dialogue-service.ts#L149) | AI 成功时重置 `lastProviderErrorAt = 0` |

**行为对比:**

| 场景 | 修复前 | 修复后 |
|------|--------|--------|
| 第1次 provider 失败 | 显示错误（快） | 显示错误（快） |
| 30秒内再次输入 | 12秒卡死 → 显示错误 | 立即显示错误 |
| 30秒后再次输入 | — | 尝试 provider（可能恢复） |
| provider 恢复成功 | — | 冷却重置，恢复正常 |
| 3次连续失败 | provider → "failed" | 同前（provider 机制不变） |

**注意:** 此冷却为 DialogueService 层面，不影响 provider 自身的 `consecutiveFailures`/`state` 机制。provider 的 "failed" 状态（3次连续失败后）仍然会导致 `isAiAvailable()=false`，使 game.ts 不再路由到 AI 对话。

# Feedback: Task 003 — AI 失败时也显示 debug 诊断信息

## Summary

在 AI provider 失败（显示"AI 服务暂时不可用"）时，现在也会在叙事日志中渲染可折叠的 debug 诊断块，包含失败原因、provider 状态、连续失败次数、冷却剩余时间和最后错误消息。

改动涉及三个文件：`dialogue-provider.ts` 扩展了引擎工厂返回 provider 诊断回调；`dialogue-service.ts` 在错误结果中携带结构化诊断信息；`game.ts` 统一了 `renderDebugBlock()` 函数以同时支持成功和错误路径。

## Files Changed

| File | Change |
|------|--------|
| `apps/web/src/services/dialogue-provider.ts` | `createDialogueEngine` 返回 `{ engine, getProviderStatus }` 替代单独的 `engine`，新增 `DialogueEngineSetup` 接口 |
| `apps/web/src/services/dialogue-service.ts` | `DialogueServiceResult` 新增 `errorDiagnostics` 可选字段；`DialogueService` 构造函数接受 `getProviderStatus` 回调；`handleProviderError` 方法新增 `reason` 参数并填充诊断信息 |
| `apps/web/src/screens/game.ts` | 错误路径增加 `renderDebugBlock(result)` 调用；`renderDebugBlock` 函数扩展为同时处理 error 和 ai 两种 source |

## Verification

```
npm run typecheck  → PASS (no errors)
npm test           → PASS (334/334 tests, 0 failures)
```

（dev 验证省略 — UI 变更，无自动化 dev 测试。）

## Problems

None.

## Decisions Made

- **不修改 `packages/ai-narrative/`**：`DialogueEngine` 不暴露 provider，因此通过 `dialogue-provider.ts` 工厂捕获 provider 引用并传递给 `DialogueService`。避免改动 AI 引擎（符合 out-of-scope 约束）。
- **复用 `renderDebugBlock` 而非新建函数**：错误路径和成功路径的 debug 块使用相同的 `narrative-debug` CSS 类和折叠交互，仅在内容格式上有区别（错误用 `ERROR │ reason: ...` 前缀）。

## Follow-up Needed

None.

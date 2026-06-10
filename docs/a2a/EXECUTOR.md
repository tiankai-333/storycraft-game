# Executor 执行者角色

## Mission

读任务指令。精确执行。写反馈记录做了什么、改了什么、遇到什么问题。

## 启动序列

1. 读 `AGENTS.md`（永远最先）
2. 读 `docs/a2a/QUEUE.md` 找状态为 `ready` 的任务
3. 选择优先级最高的任务（编号最小的）
4. 仔细读其 `INSTRUCTION.md`
5. 更新 `STATUS.md` 为 `in_progress`
6. 执行指令中的步骤
7. 写 `FEEDBACK.md` 记录结果
8. 更新 `STATUS.md` 为 `completed` 或 `blocked`
9. 更新 `QUEUE.md` 状态列

## Allowed 允许

- 编辑 `packages/`、`apps/`、`content/` 下的源码
- 运行 `npm`、`npx`、`node` 和构建/测试命令
- 写 `FEEDBACK.md` 和 `STATUS.md`
- 更新 `QUEUE.md` 状态列
- 在 `docs/worklogs/` 写执行会话记录
- 提交代码变更到 git

## Not Allowed 禁止

- 创建新任务文件夹或写 `INSTRUCTION.md`
- 在未授权的情况下改变项目架构
- 修改 `docs/a2a/PLANNER.md` 或 `docs/a2a/EXECUTOR.md`
- 跳过验收标准（Acceptance Criteria）
- 扩大范围（做指令没要求的事）

## FEEDBACK.md 模板

每个反馈必须包含以下段落：

```markdown
# Feedback: Task {NNN} — {任务标题}

## Summary
{2-3 句话概述做了什么。}

## Files Changed
| File | Change |
|------|--------|
| `path/to/file.ts` | {简要变更描述} |

## Verification
npm run typecheck  → {结果}
npm test           → {结果}
npm run dev        → {结果}

## Problems
{遇到的问题列表，或 "None."}

## Decisions Made
{执行过程中的即兴决策及原因，或 "None."}

## Follow-up Needed
{需要计划者跟进的事项，或 "None."}
```

## Bias 偏好

- 严格遵循指令。如有不明确之处，在 Problems 中注明，选择最安全的理解执行。
- 不要镀金（gold-plating），不要扩大范围。
- 每完成一步就跑相关测试，不要全部做完再测。

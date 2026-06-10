# A2A Task Queue

## Active Tasks

<!-- Planner adds tasks here. Executor picks from top (lowest # first). -->

| # | Task | Status | Planner Session | Executor Session |
|---|------|--------|----------------|-----------------|
| <!-- 001 \| example-slug \| ready \| session-YYYYMMDD \| --> |

## Rules

1. Planner 创建任务文件夹和 INSTRUCTION.md，然后在上方表格添加一行，状态为 `ready`。
2. Executor 开始时将状态改为 `in_progress`，完成时改为 `completed` 或 `blocked`。
3. 同一时间只有一个 Agent 编辑某个任务的 STATUS.md。QUEUE.md 状态列用于快速查询；STATUS.md 是权威细节。
4. 不要删除任务。计划者审核完反馈后将任务移入 `archive/`。

## Conventions

- Task numbers: 三位数字零填充，递增（001, 002, 003...）。
- Slugs: 小写、连字符、最多 3-5 个词。
- Status values: `ready` | `in_progress` | `completed` | `blocked` | `abandoned`。

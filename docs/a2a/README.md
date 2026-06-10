# A2A — Agent-to-Agent 文件交接协议

## 概述

通过文件系统实现两个 Claude Code 会话之间的任务交接（handoff）：

- **计划者（Planner）**：读文档 + 读反馈 → 写任务指令
- **执行者（Executor）**：读指令 → 执行 → 写反馈

所有通信通过 `docs/a2a/` 下的 Markdown 文件完成，无需 API 或消息队列。

## 目录结构

```
docs/a2a/
├── README.md           ← 你在这里
├── PLANNER.md          ← 计划者角色定义
├── EXECUTOR.md         ← 执行者角色定义
├── QUEUE.md            ← 共享任务队列
├── tasks/              ← 活跃任务（每个任务一个文件夹）
│   └── {NNN}-{slug}/
│       ├── INSTRUCTION.md   计划者写 → 执行者读
│       ├── STATUS.md        任务状态（执行者维护）
│       └── FEEDBACK.md      执行者写 → 计划者读
└── archive/            ← 已完成任务归档
```

## 交接流程

```
1. 人在新会话中指定角色：
   - "你是计划者。读 docs/a2a/PLANNER.md 并遵循。"
   - "你是执行者。读 docs/a2a/EXECUTOR.md 并遵循。"

2. 计划者：
   读 AGENTS.md → 读 QUEUE.md → 审查文档/反馈 → 创建任务 → 写 INSTRUCTION.md

3. 执行者（另一个会话）：
   读 AGENTS.md → 读 QUEUE.md → 找 ready 任务 → 读 INSTRUCTION.md → 执行 → 写 FEEDBACK.md

4. 计划者回到会话：
   读 QUEUE.md → 发现 completed → 读 FEEDBACK.md → 规划下一步 → 归档
```

## 状态值

| 状态 | 含义 |
|------|------|
| `ready` | 计划者已写好指令，等待执行者认领 |
| `in_progress` | 执行者正在执行 |
| `completed` | 执行者已完成，等待计划者审核 |
| `blocked` | 执行者遇到阻塞，需要计划者解决 |
| `abandoned` | 计划者放弃此任务 |

## 编号规则

三位数字，零填充，递增：`001`、`002`、`003`... 查看 `QUEUE.md` 和 `archive/` 确定下一个编号。

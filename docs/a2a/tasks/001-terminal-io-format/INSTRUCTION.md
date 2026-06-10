# Task 001: [implement] 网页端命令 I/O 终端风格原格式渲染

## Goal

让网页端的命令输入/输出呈现出终端（terminal）风格的原格式：AI 对话保留换行、命令输出按结构分行显示、叙事日志使用等宽字体。

## Context

当前叙事日志（narrative log）使用衬线字体 Georgia，所有输出压成单行。AI 模型返回的多段落 NPC 对话被浏览器静默合并成一行，因为 `esc()` 不转义 `\n`，且没有 `white-space: pre-wrap`。`look` 命令把描述/出口/NPC 用空格拼成一行。

已有的终端元素：命令回显 `> command`、ASCII 房间地图（等宽）、调试块（等宽可折叠）。

## Scope

### In Scope

- 叙事日志的渲染样式 — AI 对话保留换行，命令输出分行，等宽字体
- 命令输出格式 — `look` 等命令的 message 拼接方式
- 输入框的终端风格提示

### Out of Scope

- 不改 AI prompt 或对话引擎逻辑
- 不改右侧面板（地图/NPC/物品栏）
- 不改 debug 块（已经很好）
- 不改 index.html 的 DOM 结构

## Acceptance Criteria

- [ ] AI 对话多段落回复在浏览器中正确显示换行（不压成一行）
- [ ] `look` 命令输出分行显示：房间描述一行、出口一行、NPC 一行
- [ ] 叙事日志使用等宽字体
- [ ] 不破坏现有的命令回显、效果消息（🔍📦💚⏳）、结局显示
- [ ] `npm run typecheck` 通过
- [ ] `npm test` 全部通过

## Constraints

- 不改 AI 引擎、prompt、对话策略
- 不改 HTML 模板结构（index.html）
- 不引入新的 npm 依赖

## References

- `apps/web/src/screens/game.ts` — 渲染逻辑（标准命令输出 + AI 对话输出）
- `apps/web/src/style.css` — 叙事日志样式
- `packages/game-runtime/src/commands/look.ts` — look 命令输出格式
- `packages/game-runtime/src/commands/` — 其他命令的输出格式

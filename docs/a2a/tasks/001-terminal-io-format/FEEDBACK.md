# Feedback: Task 001 — 网页端命令 I/O 终端风格原格式渲染

## Summary
将叙事日志改为等宽字体并启用 `white-space: pre-wrap`，修复了 AI 对话换行丢失的问题。将 `look` 命令输出从单行空格拼接改为换行分隔。给命令输入框添加了 `>` 前缀视觉提示。所有改动限定在 3 个文件内。

## Files Changed
| File | Change |
|------|--------|
| `apps/web/src/style.css` | `.narrative-entry` 加等宽字体 + `pre-wrap`；新增 `.ai-dialogue` class；`#command-bar::before` 添加 `>` 前缀；输入框左内边距调整为 `1.75rem` |
| `apps/web/src/screens/game.ts` | AI 对话元素加 `ai-dialogue` class（渲染 + 重放两条路径） |
| `packages/game-runtime/src/commands/look.ts` | `messageParts.join(" ")` → `join("\n")` |

## Verification
npm run typecheck  → pass
npm test           → 334/334 pass
npm run dev (vite) → boots on localhost:5174

## Problems
None.

## Decisions Made
- 采用指令推荐的方案 A（CSS `white-space: pre-wrap`），而非方案 B（`\n` → `<br>` 替换）。理由：最小改动，不引入 XSS 风险。
- `#command-input` 的 `font-family` 从 `inherit` 改为等宽字体，与叙事日志风格统一。
- `.ai-dialogue` 的 `white-space: pre-wrap` 与 `.narrative-entry` 上的同名属性现在是冗余的但无害——如果未来需要单独控制 AI 对话的换行行为，该 class 已就位。

## Follow-up Needed
None.

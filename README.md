# 🏰 StoryCraft Game

AI 驱动的互动文字冒险 / AI-driven interactive fiction.

探索房间、与 NPC 对话、收集线索、破解谜案。支持 **浏览器** 和 **终端** 两种游玩方式。

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 启动后端

```bash
cd apps/server

# 首次运行：复制环境变量模板并填写密钥
cp .env.example .env
# 编辑 .env，设置 ENCRYPTION_KEY 和 JWT_SECRET

npx tsx src/index.ts   # 启动在 http://localhost:3001
```

### 3. 启动前端

```bash
cd apps/web
npx vite --host        # 启动在 http://localhost:5173
```

浏览器打开 <http://localhost:5173> 即可。

### 4. 终端模式（CLI）

无需后端，直接在终端里玩：

```bash
# 普通模式（无 AI）
npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts

# AI 模式
OPENAI_API_KEY=sk-xxx AI_BASE_URL=https://api.deepseek.com/v1 AI_MODEL=deepseek-chat \
  npx tsx --tsconfig apps/cli/tsconfig.json apps/cli/src/run.ts
```

## 游戏模式

### 🖥️ 浏览器模式

- **游客模式**：直接进入游戏，自动使用房主配置的 AI 密钥
  - 点设置 → "用自己的" → 左下角提示「房主摆了摆手，表示不用客气 ヽ(´ー`)ﾉ」
- **登录用户**：点右上角 👤 登录/注册，可配置自己的 API 密钥
  - 第一个注册的用户自动成为 **房主（host）**，密钥供所有游客使用

### 📟 终端模式

- 支持中英文命令：`look`、`go 东`、`search 书桌`、`take 钥匙`
- 自由文本直接对 NPC 说话（AI 自动回复）
- 彩色 ANSI 输出：房间、出口、NPC、线索一目了然
- 输入 `help` 查看完整命令列表

## 配置 AI 密钥

StoryCraft 使用 AI 服务生成 NPC 对话。API 密钥**不会传递到浏览器**——以加密形式存储在 SQLite 中，所有 AI 请求由后端代理转发。

### 设置方式

1. 启动应用，注册账号（第一个用户自动成为 **host**）
2. **Settings（设置）** → 填写 API 密钥（DeepSeek / OpenAI 兼容）、Base URL、模型名
3. 后端用 AES-256 加密存储

未配置密钥的游客自动使用 host 密钥。

### 安全模型

| 层级 | 安全措施 |
| --- | --- |
| **浏览器** | 始终不接触原始密钥。前端调用 `POST /api/ai/chat`，后端代理转发 |
| **后端** | AES-256 加密存储，加密主密钥在 `.env`（已 gitignore） |
| **Git** | 仅提交 `.env.example`，不含密钥 |

生成密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

## 项目结构

```text
storycraft-game/
  apps/
    cli/                终端游戏模式（ANSI 彩色输出）
    server/             Express 后端（认证、密钥存储、AI 代理）
    web/                Vite + TypeScript 浏览器前端
  packages/
    game-runtime/       房间、命令、规则、任务、状态
    ai-narrative/       AI 对话引擎、提示词构建、门控审核
    shared/             共享契约与类型
  docs/                 设计文档与开发日志
```

## 常用命令

```bash
npm run typecheck     # 全局类型检查
npm test              # 运行所有测试
npm run build         # 生产构建
```

## 当前线索：霜钟楼的最后一声钟响

> 暴风雪之夜，庄园主人奥登·沃斯被发现死在钟楼之下。家中众人声称钟楼门从内部锁死。黎明时分，山路将被打通，嫌疑人将四散而去。你只有 **8 个调查回合** 来揭开真相。

3 个 NPC、7 个房间、6 条线索、8 个结局。你能在黎明前找到凶手吗？

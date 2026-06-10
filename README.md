# StoryCraft Game

AI-driven interactive fiction. Explore rooms, talk to NPCs, collect clues, and solve the mystery.

## Quick Start

### 1. Install dependencies

```bash
npm install
```

### 2. Start the backend

```bash
cd apps/server

# Copy and fill in secrets (first time only)
cp .env.example .env
# Edit .env — set ENCRYPTION_KEY and JWT_SECRET

npm run dev          # starts on http://localhost:3001
```

### 3. Start the frontend

```bash
cd apps/web
npm run dev          # starts on http://localhost:5173
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Configuring the AI API Key

StoryCraft uses an AI provider for NPC dialogue. The API key **never reaches the browser** — it is stored encrypted in a SQLite database and the backend proxies all AI requests server-side.

### How to set the key

1. Start the app, register an account (the first user becomes **host**).
2. Go to **Settings** → enter your API key (e.g. a DeepSeek or OpenAI-compatible key), base URL, and model name.
3. The backend encrypts the key with AES-256 and stores it in `apps/server/data/keys.db`.

Guests and other users automatically fall back to the host key unless they configure their own.

### Key security model

| Layer | What happens |
| --- | --- |
| **Browser** | Never sees the raw key. Frontend calls `POST /api/ai/chat`; backend proxies to the AI provider. |
| **Backend** | Key stored encrypted in SQLite (`api_keys` table). Encryption key (`ENCRYPTION_KEY`) lives in `apps/server/.env`, which is gitignored. |
| **Git** | `.env` files are in `.gitignore`. Only `.env.example` (without secrets) is committed. |

To generate the secrets for `.env`:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Run once for `ENCRYPTION_KEY`, once for `JWT_SECRET`.

## Project Structure

```text
storycraft-game/
  apps/
    server/             Express backend (auth, key storage, AI proxy)
    web/                Vite + TypeScript frontend
  packages/
    game-runtime/       rooms, commands, rules, quests, state
    ai-narrative/       AI dialogue engine, prompt builder, gate review
    shared/             shared contracts and schemas
  docs/                 design docs and worklogs
```

## Available Commands

```bash
npm run typecheck     # type-check all packages
npm test              # run all tests
npm run build         # production build
```

---

## 中文说明

AI 驱动的互动文字冒险。探索房间、与 NPC 对话、收集线索、破解谜案。

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

npm run dev          # 启动在 http://localhost:3001
```

### 3. 启动前端

```bash
cd apps/web
npm run dev          # 启动在 http://localhost:5173
```

浏览器打开 [http://localhost:5173](http://localhost:5173) 即可。

## 配置 AI API 密钥

StoryCraft 使用 AI 服务生成 NPC 对话。API 密钥**不会传递到浏览器**——它以加密形式存储在 SQLite 数据库中，所有 AI 请求由后端代理转发。

### 如何设置密钥

1. 启动应用后注册账号（第一个注册用户自动成为 **host**）。
2. 进入 **Settings（设置）** → 填写 API 密钥（如 DeepSeek 或 OpenAI 兼容密钥）、Base URL 和模型名称。
3. 后端使用 AES-256 加密密钥并存储在 `apps/server/data/keys.db` 中。

未配置密钥的访客和其他用户会自动使用 host 密钥。

### 密钥安全模型

| 层级 | 安全措施 |
| --- | --- |
| **浏览器** | 始终不接触原始密钥。前端调用 `POST /api/ai/chat`，由后端代理转发至 AI 服务。 |
| **后端** | 密钥以 AES-256 加密存储在 SQLite（`api_keys` 表）中。加密主密钥（`ENCRYPTION_KEY`）存放在 `apps/server/.env`，已被 gitignore。 |
| **Git** | `.env` 文件已加入 `.gitignore`，仅提交不含密钥的 `.env.example`。 |

生成 `.env` 所需密钥：

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

分别运行一次，填入 `ENCRYPTION_KEY` 和 `JWT_SECRET`。

## 项目结构

```text
storycraft-game/
  apps/
    server/             Express 后端（认证、密钥存储、AI 代理）
    web/                Vite + TypeScript 前端
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

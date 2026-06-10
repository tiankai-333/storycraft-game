// Bootstrap: polyfill browser APIs and load .env before any module graph loads
(globalThis as any).localStorage ??= { getItem: () => null, setItem: () => {}, removeItem: () => {} };

// Load .env file — search from CWD upward, also check project root
import { readFileSync, existsSync } from "fs";
import { resolve, dirname } from "path";

function loadEnv(): void {
  const candidates = [
    resolve(process.cwd(), ".env"),
    resolve(dirname(process.argv[1] || ""), "../../.env"), // apps/cli/../../.env = project root
  ];
  let envPath = candidates.find((p) => existsSync(p));
  if (!envPath) return;

  const content = readFileSync(envPath, "utf-8");
  for (const line of content.split("\n")) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx < 0) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const val = trimmed.slice(eqIdx + 1).trim();
    if (!process.env[key]) {
      process.env[key] = val;
    }
  }

  // Map DeepSeek/Vite vars to the names loadConfigFromEnv() expects
  if (!process.env.OPENAI_API_KEY && !process.env.AI_API_KEY) {
    process.env.OPENAI_API_KEY =
      process.env.DEEPSEEK_API_KEY || process.env.VITE_AI_API_KEY || "";
  }
  if (!process.env.AI_BASE_URL) {
    process.env.AI_BASE_URL =
      process.env.DEEPSEEK_BASE_URL || process.env.VITE_AI_BASE_URL || "";
  }
  if (!process.env.AI_MODEL) {
    process.env.AI_MODEL =
      process.env.DEEPSEEK_MODEL || process.env.VITE_AI_MODEL || "";
  }
}

loadEnv();

// Dynamic import so the polyfill + env loads first
import("./index.ts");

import { PassthroughProvider, OpenAICompatibleProvider, DialogueEngine } from "@ai-narrative";
import type { Lang } from "../i18n";

// ─── Environment config (from .env via Vite) ────────────────────────
const envKey: string | undefined = import.meta.env.VITE_AI_API_KEY;
const envBase: string | undefined = import.meta.env.VITE_AI_BASE_URL;
const envModel: string | undefined = import.meta.env.VITE_AI_MODEL;

// ─── Narration mode ─────────────────────────────────────────────────
export type NarrationMode = "normal" | "smart";

const MODE_KEY = "storycraft_mode";

export function getNarrationMode(): NarrationMode {
  return (localStorage.getItem(MODE_KEY) as NarrationMode) || "smart";
}

export function setNarrationMode(mode: NarrationMode): void {
  if (mode === "normal") localStorage.setItem(MODE_KEY, "normal");
  else localStorage.setItem(MODE_KEY, "smart");
}

/** Whether a server-side API key is available via environment. */
export function hasEnvKey(): boolean {
  return !!envKey;
}

/** Describe the current key source for UI feedback. */
export function getKeySource(): "custom" | "env" | "none" {
  const userKey = localStorage.getItem("storycraft_api_key");
  if (userKey) return "custom";
  if (envKey) return "env";
  return "none";
}

/**
 * Create and initialize a DialogueEngine based on browser configuration.
 * - normal mode: always PassthroughProvider (no AI)
 * - smart mode: URL param > localStorage > .env
 */
export async function createDialogueEngine(lang: Lang): Promise<DialogueEngine> {
  const mode = getNarrationMode();

  // Normal mode: no AI, topic buttons only
  if (mode === "normal") {
    const provider = new PassthroughProvider();
    await provider.initialize();
    const engine = new DialogueEngine(provider, { lang });
    await engine.initialize();
    return engine;
  }

  // Smart mode: resolve key
  const key =
    new URLSearchParams(window.location.search).get("apiKey") ||
    localStorage.getItem("storycraft_api_key") ||
    envKey ||
    undefined;

  let provider;
  if (key) {
    provider = new OpenAICompatibleProvider({
      apiKey: key,
      baseUrl: localStorage.getItem("storycraft_api_base") || envBase || "https://api.deepseek.com",
      model: localStorage.getItem("storycraft_model") || envModel || "deepseek-v4-pro",
      maxTokens: 300,
      temperature: 0.7,
    });
  } else {
    provider = new PassthroughProvider();
  }

  await provider.initialize();

  const engine = new DialogueEngine(provider, { lang });
  await engine.initialize();

  return engine;
}

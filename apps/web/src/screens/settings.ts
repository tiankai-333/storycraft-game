import { t } from "../i18n";
import { getNarrationMode, type NarrationMode } from "../services/dialogue-provider";
import { getKeyConfig, testKeyConfig, saveKeyConfig, isLoggedIn } from "../services/api-client";
import { reinitDialogueService } from "./game";

// ─── Pending state (applied only on Save) ───────────────────────────
let pendingMode: NarrationMode;
let pendingSource: "host" | "custom";

// ─── Shared button styles ───────────────────────────────────────────
const activeStyle = "flex:1;padding:0.4rem 0;font-size:0.85rem;background:var(--btn-bg);color:var(--text-highlight);border:2px solid var(--text-highlight);font-family:inherit;font-weight:bold;cursor:pointer;border-radius:3px";
const inactiveStyle = "flex:1;padding:0.4rem 0;font-size:0.85rem;background:var(--btn-bg);color:var(--text-primary);border:1px solid var(--border);font-family:inherit;cursor:pointer;border-radius:3px";

// ─── Init ───────────────────────────────────────────────────────────
export function initSettings(): void {
  document.getElementById("settings-btn-lobby")?.addEventListener("click", openSettings);
  document.getElementById("settings-btn-game")?.addEventListener("click", openSettings);
  document.getElementById("settings-close")!.addEventListener("click", closeSettings);
  document.getElementById("settings-save")!.addEventListener("click", saveSettings);
  document.getElementById("settings-mode-normal")?.addEventListener("click", () => switchMode("normal"));
  document.getElementById("settings-mode-smart")?.addEventListener("click", () => switchMode("smart"));
  document.getElementById("settings-src-custom")?.addEventListener("click", () => switchSource("custom"));
  document.getElementById("settings-src-env")?.addEventListener("click", () => switchSource("host"));
  document.getElementById("settings-test-btn")?.addEventListener("click", handleTest);

  // Re-render source when auth state changes (login/logout from auth modal)
  window.addEventListener("auth-changed", () => {
    pendingSource = "host";
    void renderSource();
  });
}

// ─── Open / Close ───────────────────────────────────────────────────
export async function openSettings(): Promise<void> {
  (document.getElementById("settings-modal") as HTMLElement).classList.remove("hidden");
  (document.getElementById("settings-title") as HTMLElement).textContent = t("叙事设置", "Narrator Settings");
  (document.getElementById("settings-save") as HTMLElement).textContent = t("保存", "Save");

  pendingMode = getNarrationMode();
  pendingSource = "host";

  renderMode(pendingMode);
  await renderSource();

  (document.getElementById("settings-status") as HTMLElement).textContent = "";
}

function closeSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.add("hidden");
}

// ─── Mode switching ─────────────────────────────────────────────────

function renderMode(mode: NarrationMode): void {
  const normalBtn = document.getElementById("settings-mode-normal") as HTMLElement;
  const smartBtn = document.getElementById("settings-mode-smart") as HTMLElement;
  const descEl = document.getElementById("settings-mode-desc") as HTMLElement;
  const configEl = document.getElementById("settings-smart-config") as HTMLElement;

  if (mode === "normal") {
    normalBtn.style.cssText = activeStyle;
    smartBtn.style.cssText = inactiveStyle;
    descEl.textContent = t("普通模式：NPC 通过固定话题按钮对话，不使用 AI。", "Normal mode: NPCs use fixed topic buttons, no AI.");
    configEl.style.display = "none";
  } else {
    normalBtn.style.cssText = inactiveStyle;
    smartBtn.style.cssText = activeStyle;
    descEl.textContent = t("智能模式：NPC 由 AI 驱动自由对话。", "Smart mode: NPCs are driven by AI for free-form dialogue.");
    configEl.style.display = "";
    void renderSource();
  }
}

function switchMode(mode: NarrationMode): void {
  pendingMode = mode;
  renderMode(mode);
}

// ─── Config source display ─────────────────────────────────────────

async function renderSource(): Promise<void> {
  const envInfo = document.getElementById("settings-env-info") as HTMLElement;
  const envModel = document.getElementById("settings-env-model") as HTMLElement;
  const customFields = document.getElementById("settings-custom-fields") as HTMLElement;
  const srcEnvBtn = document.getElementById("settings-src-env") as HTMLElement;
  const srcCustomBtn = document.getElementById("settings-src-custom") as HTMLElement;

  customFields.style.display = "none";
  envInfo.style.display = "none";

  if (pendingSource === "host") {
    // Show host key info
    srcEnvBtn.style.cssText = activeStyle;
    srcCustomBtn.style.cssText = inactiveStyle;
    envInfo.style.display = "";

    try {
      const config = await getKeyConfig();
      if (config) {
        envModel.textContent = `${config.model} (${config.baseUrl.replace(/https?:\/\//, "").split("/")[0]})`;
      } else {
        envModel.textContent = t("房主还没配置密钥", "Host hasn't configured a key yet");
      }
    } catch {
      envModel.textContent = t("无法连接服务器", "Cannot connect to server");
    }
  } else {
    // "用自己的" selected
    if (!isLoggedIn()) {
      // Guest → show message in status area + revert to host
      const statusEl = document.getElementById("settings-status") as HTMLElement;
      statusEl.textContent = t("房主摆了摆手，表示不用客气 ヽ(´ー`)ﾉ", "The host waves dismissively — no need to be polite ヽ(´ー`)ﾉ");
      pendingSource = "host";
      srcEnvBtn.style.cssText = activeStyle;
      srcCustomBtn.style.cssText = inactiveStyle;
      envInfo.style.display = "";
      try {
        const config = await getKeyConfig();
        if (config) {
          envModel.textContent = `${config.model} (${config.baseUrl.replace(/https?:\/\//, "").split("/")[0]})`;
        }
      } catch { /* ignore */ }
    } else {
      // Logged in → show input fields
      srcEnvBtn.style.cssText = inactiveStyle;
      srcCustomBtn.style.cssText = activeStyle;
      customFields.style.display = "";
    }
  }
}

function switchSource(src: "host" | "custom"): void {
  pendingSource = src;
  void renderSource();
}

// ─── Test connectivity ──────────────────────────────────────────────

async function handleTest(): Promise<void> {
  const statusEl = document.getElementById("settings-status") as HTMLElement;
  const testBtn = document.getElementById("settings-test-btn") as HTMLElement;

  testBtn.textContent = t("测试中…", "Testing…");
  testBtn.setAttribute("disabled", "true");

  try {
    const result = await testKeyConfig();
    if (result.ok) {
      statusEl.textContent = t("✓ 连接成功，AI 正常运行", "✓ Connected, AI is running");
    } else {
      statusEl.textContent = t(`✗ 连接失败: ${result.error}`, `✗ Connection failed: ${result.error}`);
    }
  } catch (err: any) {
    statusEl.textContent = t(`✗ 测试出错: ${err.message}`, `✗ Test error: ${err.message}`);
  } finally {
    testBtn.textContent = t("测试连接", "Test Connection");
    testBtn.removeAttribute("disabled");
  }
}

// ─── Save ───────────────────────────────────────────────────────────

async function saveSettings(): Promise<void> {
  const statusEl = document.getElementById("settings-status") as HTMLElement;

  // 1. Write mode
  if (pendingMode === "normal") {
    localStorage.setItem("storycraft_mode", "normal");
  } else {
    localStorage.setItem("storycraft_mode", "smart");
  }

  // 2. Handle config source
  if (!isLoggedIn() || pendingSource === "host") {
    statusEl.textContent = t("✓ 已保存", "✓ Saved");
  } else {
    const key = (document.getElementById("settings-api-key") as HTMLInputElement).value.trim();
    const base = (document.getElementById("settings-base-url") as HTMLInputElement).value.trim();
    const model = (document.getElementById("settings-model") as HTMLInputElement).value.trim();

    if (!key) {
      statusEl.textContent = t("请输入 API Key", "Please enter an API Key");
      return;
    }

    statusEl.textContent = t("正在为 NPC 注入灵魂…", "Injecting souls into NPCs…");
    try {
      await saveKeyConfig({ apiKey: key, baseUrl: base || "https://api.deepseek.com/v1", model: model || "deepseek-v4-pro" });
      statusEl.textContent = t("✓ NPC 灵魂注入完成", "✓ NPC soul injection complete");
    } catch {
      statusEl.textContent = t("✗ 灵魂注入失败，请检查配置", "✗ Soul injection failed, check config");
    }
  }

  // 3. Rebuild engine
  try {
    await reinitDialogueService();
  } catch {
    // Engine rebuild may fail silently before game starts
  }
}

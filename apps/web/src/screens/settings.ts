import { t } from "../i18n";
import { getKeySource, getNarrationMode, type NarrationMode } from "../services/dialogue-provider";
import { reinitDialogueService } from "./game";

// ─── Pending state (applied only on Save) ───────────────────────────
let pendingMode: NarrationMode;
let pendingSource: "env" | "custom";

// ─── Shared button styles ───────────────────────────────────────────
const activeStyle = "flex:1;padding:0.4rem 0;font-size:0.85rem;background:var(--btn-bg);color:var(--text-highlight);border:2px solid var(--text-highlight);font-family:inherit;font-weight:bold;cursor:pointer;border-radius:3px";
const inactiveStyle = "flex:1;padding:0.4rem 0;font-size:0.85rem;background:var(--btn-bg);color:var(--text-primary);border:1px solid var(--border);font-family:inherit;cursor:pointer;border-radius:3px";
const srcActiveStyle = "flex:1;padding:0.35rem 0;font-size:0.8rem;background:var(--btn-bg);color:var(--text-highlight);border:2px solid var(--text-highlight);font-family:inherit;font-weight:bold;cursor:pointer;border-radius:3px";
const srcInactiveStyle = "flex:1;padding:0.35rem 0;font-size:0.8rem;background:var(--btn-bg);color:var(--text-primary);border:1px solid var(--border);font-family:inherit;cursor:pointer;border-radius:3px";

// ─── Init ───────────────────────────────────────────────────────────
export function initSettings(): void {
  document.getElementById("settings-btn-lobby")?.addEventListener("click", openSettings);
  document.getElementById("settings-btn-game")?.addEventListener("click", openSettings);
  document.getElementById("settings-close")!.addEventListener("click", closeSettings);
  document.getElementById("settings-save")!.addEventListener("click", saveSettings);
  document.getElementById("settings-mode-normal")?.addEventListener("click", () => switchMode("normal"));
  document.getElementById("settings-mode-smart")?.addEventListener("click", () => switchMode("smart"));
  document.getElementById("settings-src-env")?.addEventListener("click", () => switchSource("env"));
  document.getElementById("settings-src-custom")?.addEventListener("click", () => switchSource("custom"));
}

// ─── Open / Close ───────────────────────────────────────────────────
export function openSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.remove("hidden");
  (document.getElementById("settings-title") as HTMLElement).textContent = t("叙事设置", "Narrator Settings");
  (document.getElementById("settings-save") as HTMLElement).textContent = t("保存", "Save");

  // Read current real state into pending
  pendingMode = getNarrationMode();
  pendingSource = getKeySource() === "custom" ? "custom" : "env";

  renderMode(pendingMode);
  renderSource();

  // Clear status
  (document.getElementById("settings-status") as HTMLElement).textContent = "";
}

function closeSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.add("hidden");
}

// ─── Mode switching (visual only, saved on Save) ────────────────────

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
    renderSource();
  }
}

function switchMode(mode: NarrationMode): void {
  pendingMode = mode;
  renderMode(mode);
}

// ─── Config source switching (visual only, saved on Save) ───────────

function renderSource(): void {
  const envBtn = document.getElementById("settings-src-env") as HTMLElement;
  const customBtn = document.getElementById("settings-src-custom") as HTMLElement;
  const fieldsEl = document.getElementById("settings-custom-fields") as HTMLElement;

  if (pendingSource === "env") {
    envBtn.style.cssText = srcActiveStyle;
    customBtn.style.cssText = srcInactiveStyle;
    fieldsEl.style.display = "none";
  } else {
    envBtn.style.cssText = srcInactiveStyle;
    customBtn.style.cssText = srcActiveStyle;
    fieldsEl.style.display = "";

    // Populate from localStorage
    (document.getElementById("settings-api-key") as HTMLInputElement).value =
      localStorage.getItem("storycraft_api_key") || "";
    (document.getElementById("settings-base-url") as HTMLInputElement).value =
      localStorage.getItem("storycraft_api_base") || "";
    (document.getElementById("settings-model") as HTMLInputElement).value =
      localStorage.getItem("storycraft_model") || "";
  }
}

function switchSource(src: "env" | "custom"): void {
  pendingSource = src;
  renderSource();
}

// ─── Save (the ONLY place that writes state) ────────────────────────

async function saveSettings(): Promise<void> {
  const statusEl = document.getElementById("settings-status") as HTMLElement;

  // 1. Write mode
  if (pendingMode === "normal") {
    localStorage.setItem("storycraft_mode", "normal");
  } else {
    localStorage.setItem("storycraft_mode", "smart");
  }

  // 2. Write config source
  if (pendingSource === "env") {
    localStorage.removeItem("storycraft_api_key");
    localStorage.removeItem("storycraft_api_base");
    localStorage.removeItem("storycraft_model");
  } else {
    const key = (document.getElementById("settings-api-key") as HTMLInputElement).value.trim();
    const base = (document.getElementById("settings-base-url") as HTMLInputElement).value.trim();
    const model = (document.getElementById("settings-model") as HTMLInputElement).value.trim();
    if (key) localStorage.setItem("storycraft_api_key", key);
    else localStorage.removeItem("storycraft_api_key");
    if (base) localStorage.setItem("storycraft_api_base", base);
    else localStorage.removeItem("storycraft_api_base");
    if (model) localStorage.setItem("storycraft_model", model);
    else localStorage.removeItem("storycraft_model");
  }

  // 3. Apply
  statusEl.textContent = t("✓ 已保存", "✓ Saved");
  try {
    await reinitDialogueService();
  } catch {
    statusEl.textContent = t("保存失败，请刷新页面", "Save failed, please reload");
  }

  // 4. Re-read actual state and refresh UI
  pendingMode = getNarrationMode();
  pendingSource = getKeySource() === "custom" ? "custom" : "env";
  renderMode(pendingMode);
  renderSource();
}

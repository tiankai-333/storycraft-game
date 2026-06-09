import { t, getLang } from "../i18n";

export function initSettings(): void {
  document.getElementById("settings-btn-lobby")?.addEventListener("click", openSettings);
  document.getElementById("settings-btn-game")?.addEventListener("click", openSettings);
  document.getElementById("settings-close")!.addEventListener("click", closeSettings);
  document.getElementById("settings-save")!.addEventListener("click", saveSettings);
}

export function openSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.remove("hidden");
  (document.getElementById("settings-api-key") as HTMLInputElement).value =
    localStorage.getItem("storycraft_api_key") || "";
  (document.getElementById("settings-base-url") as HTMLInputElement).value =
    localStorage.getItem("storycraft_api_base") || "";
  (document.getElementById("settings-model") as HTMLInputElement).value =
    localStorage.getItem("storycraft_model") || "";
  (document.getElementById("settings-title") as HTMLElement).textContent = t("AI 叙事设置", "AI Narrator Settings");
  (document.getElementById("settings-save") as HTMLElement).textContent = t("保存", "Save");
  (document.getElementById("settings-status") as HTMLElement).textContent =
    localStorage.getItem("storycraft_api_key") ? t("已配置", "Configured") : t("未配置 — 将使用默认文本", "Not configured — using fallback text");
}

function closeSettings(): void {
  (document.getElementById("settings-modal") as HTMLElement).classList.add("hidden");
}

function saveSettings(): void {
  const key = (document.getElementById("settings-api-key") as HTMLInputElement).value.trim();
  const base = (document.getElementById("settings-base-url") as HTMLInputElement).value.trim();
  const model = (document.getElementById("settings-model") as HTMLInputElement).value.trim();
  if (key) localStorage.setItem("storycraft_api_key", key);
  else localStorage.removeItem("storycraft_api_key");
  if (base) localStorage.setItem("storycraft_api_base", base);
  else localStorage.removeItem("storycraft_api_base");
  if (model) localStorage.setItem("storycraft_model", model);
  else localStorage.removeItem("storycraft_model");
  (document.getElementById("settings-status") as HTMLElement).textContent = key
    ? t("✓ 已保存，AI 叙事已启用", "✓ Saved, AI narration enabled")
    : t("已清除，使用默认文本", "Cleared, using fallback text");
}

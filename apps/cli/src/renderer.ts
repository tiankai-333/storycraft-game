/**
 * ANSI-colored terminal renderer for StoryCraft CLI.
 */
import type { VisibleState, WorldState, AdventureDefinition } from "@shared";
import type { Translator } from "../../web/src/i18n";
import type { GateEffects } from "./dialogue-adapter";

// ─── ANSI helpers ───────────────────────────────────────────────────

const F = {
  reset: "\x1b[0m",
  bold: "\x1b[1m",
  dim: "\x1b[2m",
  cyan: "\x1b[36m",
  green: "\x1b[32m",
  yellow: "\x1b[33m",
  red: "\x1b[31m",
  magenta: "\x1b[35m",
  white: "\x1b[37m",
  bgBlue: "\x1b[44m",
  gray: "\x1b[90m",
};

function c(...codes: string[]): string {
  return codes.join("");
}

// ─── Public API ─────────────────────────────────────────────────────

export function clearScreen(): void {
  process.stdout.write("\x1b[2J\x1b[H");
}

export function printBanner(title: string, subtitle: string): void {
  console.log();
  console.log(c(F.bold, F.cyan, `  🏰 ${title}`, F.reset));
  console.log(c(F.dim, F.white, `  ${subtitle}`, F.reset));
  console.log(c(F.dim, F.gray, `  ${"─".repeat(40)}`, F.reset));
  console.log();
}

export function printIntro(text: string): void {
  console.log(c(F.white, `  ${text}`, F.reset));
  console.log();
}

export function renderStatusHeader(
  v: VisibleState,
  state: WorldState,
  adventure: AdventureDefinition,
  tr: Translator,
): void {
  const sep = c(F.dim, F.gray, `  ${"─".repeat(40)}`, F.reset);
  console.log(sep);

  // Room name
  console.log(c(F.bold, F.cyan, `  📍 ${tr.room(v.currentRoom.id)}`, F.reset));

  // Exits — show direction + target room name
  if (v.visibleExits.length > 0) {
    const dirMap: Record<string, string> = {
      north: "北", south: "南", east: "东", west: "西",
      up: "上", down: "下", northeast: "东北", northwest: "西北",
      southeast: "东南", southwest: "西南",
    };
    const exits = v.visibleExits.map(e => {
      const def = (adventure.exits as any)[e.id];
      const dir = dirMap[def?.direction ?? ""] ?? def?.direction ?? "";
      const target = tr.room(def?.toRoomId ?? "");
      return `${dir}→${target}`;
    }).join("  ");
    console.log(c(F.green, `  🚪 ${exits}`, F.reset));
  }

  // NPCs present
  if (v.presentNpcs.length > 0) {
    const npcs = v.presentNpcs.map(n => tr.npc(n.id)).join(", ");
    console.log(c(F.yellow, `  👤 ${npcs}`, F.reset));
  }

  // Turns remaining
  const turns = state.turnsRemaining;
  const turnsColor = turns <= 2 ? F.red : turns <= 4 ? F.yellow : F.white;
  console.log(c(turnsColor, `  ⏳ ${turns} ${tr.lang === "zh" ? "回合剩余" : "turns left"}`, F.reset));

  console.log();
}

export function renderNarrative(text: string, source: "ai" | "system" | "error"): void {
  if (!text) return;
  const color = source === "ai" ? F.cyan : source === "error" ? F.red : F.white;
  // Indent and wrap lines
  const lines = text.split("\n").map(l => c(color, `  ${l}`, F.reset));
  console.log(lines.join("\n"));
  console.log();
}

export function renderGateEffects(effects: GateEffects | null, tr: Translator): void {
  if (!effects) return;

  if (effects.clueIds.length > 0) {
    for (const id of effects.clueIds) {
      console.log(c(F.magenta, `  📋 发现线索: ${tr.clue(id)}`, F.reset));
    }
  }
  if (effects.revealedItemIds.length > 0) {
    for (const id of effects.revealedItemIds) {
      console.log(c(F.green, `  🔍 发现物品: ${tr.item(id)}`, F.reset));
    }
  }
  if (effects.grantedItemIds.length > 0) {
    for (const id of effects.grantedItemIds) {
      console.log(c(F.green, `  🎒 获得物品: ${tr.item(id)}`, F.reset));
    }
  }
  if (effects.trustChange !== 0) {
    const arrow = effects.trustChange > 0 ? "↑" : "↓";
    console.log(c(F.yellow, `  💬 信任度 ${arrow}${Math.abs(effects.trustChange)}`, F.reset));
  }
  if (effects.turnSpent) {
    console.log(c(F.dim, F.yellow, `  (消耗了 1 回合)`, F.reset));
  }
  if (effects.clueIds.length > 0 || effects.grantedItemIds.length > 0) {
    console.log();
  }
}

export function renderInventory(v: VisibleState, tr: Translator): void {
  console.log(c(F.bold, F.white, `  🎒 物品栏`, F.reset));
  if (v.inventory.length === 0) {
    console.log(c(F.dim, `    (${tr.lang === "zh" ? "空" : "empty"})`, F.reset));
  } else {
    for (const item of v.inventory) {
      console.log(c(F.white, `    - ${tr.item(item.id)}`, F.reset));
    }
  }
  console.log();
}

export function renderClues(v: VisibleState, tr: Translator): void {
  console.log(c(F.bold, F.white, `  📋 线索`, F.reset));
  const clueIds = Object.keys(v.clues);
  if (clueIds.length === 0) {
    console.log(c(F.dim, `    (${tr.lang === "zh" ? "无" : "none"})`, F.reset));
  } else {
    for (const id of clueIds) {
      const strength = v.clues[id];
      const bar = strength === "strong" ? "██" : strength === "standard" ? "█░" : "░░";
      console.log(c(F.magenta, `    ${bar} ${tr.clue(id)}`, F.reset));
    }
  }
  console.log();
}

export function renderTrust(v: VisibleState, adventure: AdventureDefinition, tr: Translator): void {
  console.log(c(F.bold, F.white, `  💬 信任度`, F.reset));
  const npcIds = Object.keys(v.trust);
  for (const id of npcIds) {
    const level = v.trust[id];
    const hearts = "❤".repeat(level) + "♡".repeat(3 - level);
    console.log(c(F.yellow, `    ${tr.npc(id)} ${hearts}`, F.reset));
  }
  console.log();
}

export function renderFullStatus(
  v: VisibleState,
  state: WorldState,
  adventure: AdventureDefinition,
  tr: Translator,
): void {
  renderInventory(v, tr);
  renderClues(v, tr);
  renderTrust(v, adventure, tr);

  // Consequences
  if (v.consequences.length > 0) {
    console.log(c(F.bold, F.white, `  ⚠️ 后果`, F.reset));
    for (const id of v.consequences) {
      console.log(c(F.red, `    - ${tr.consequence(id)}`, F.reset));
    }
    console.log();
  }
}

export function renderEnding(state: WorldState, adventure: AdventureDefinition, tr: Translator): void {
  const endingId = state.endingId;
  if (!endingId) return;

  console.log();
  console.log(c(F.dim, F.gray, `  ${"═".repeat(40)}`, F.reset));
  console.log(c(F.bold, F.magenta, `  ${tr.ending(endingId)}`, F.reset));
  const summary = tr.endingSummary(endingId);
  if (summary) {
    console.log(c(F.white, `  ${summary}`, F.reset));
  }
  console.log(c(F.dim, F.gray, `  ${"═".repeat(40)}`, F.reset));
  console.log();
}

export function renderHelp(): void {
  console.log();
  console.log(c(F.bold, F.white, `  命令帮助 / Help`, F.reset));
  const cmds = [
    ["look / 看", "观察当前房间"],
    ["go <方向> / 去", "移动到其他房间"],
    ["search <目标> / 搜索", "搜查场景中的物体"],
    ["take <物品> / 拿", "拾取物品"],
    ["talk <NPC> / 对话", "与 NPC 对话"],
    ["use <物品> on <目标>", "使用物品"],
    ["inventory / i / 背包", "查看物品栏"],
    ["accuse <NPC> [模式]", "指控嫌疑人"],
    ["status / 状态", "查看完整状态"],
    ["help / 帮助", "显示帮助"],
    ["quit / 退出", "退出游戏"],
    ["", ""],
    ["自由文本", "对在场的 NPC 说任何话 (AI 模式)"],
  ];
  for (const [cmd, desc] of cmds) {
    if (!cmd) { console.log(); continue; }
    console.log(c(F.cyan, `    ${cmd.padEnd(24)}`, F.dim, F.white, desc, F.reset));
  }
  console.log();
}

export function prompt(): void {
  process.stdout.write(c(F.bold, F.green, `  > `, F.reset));
}

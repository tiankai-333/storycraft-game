/**
 * Command parser for StoryCraft CLI.
 * Parses raw text input into CommandInput or AI dialogue routing.
 */
import type { CommandInput } from "@shared";
import type { VisibleState, AdventureDefinition } from "@shared";
import type { WorldMeta, WorldTranslations } from "../../web/src/world-registry";

const KNOWN_VERBS = new Set([
  "look", "看", "观察",
  "go", "去", "走",
  "search", "搜索", "搜查",
  "take", "拿", "取",
  "inventory", "i", "背包", "物品",
  "talk", "说", "对话",
  "use", "用", "使用",
  "accuse", "指控",
  "help", "帮助",
  "status", "状态",
  "quit", "退出", "exit",
]);

export type ParsedCommand =
  | { kind: "command"; input: CommandInput }
  | { kind: "ai_dialogue"; npcId: string; text: string }
  | { kind: "help" }
  | { kind: "status" }
  | { kind: "quit" }
  | { kind: "unknown" };

/**
 * Parse raw CLI input into a structured command.
 *
 * - Known verbs → CommandInput
 * - Free text + NPC present → AI dialogue
 * - Special: help, status, quit
 */
export function parseCliCommand(
  raw: string,
  visibleState: VisibleState,
  adventure: AdventureDefinition,
  meta: WorldMeta,
  selectedNpcId: string | null,
  translations?: WorldTranslations,
): ParsedCommand {
  const trimmed = raw.trim();
  if (!trimmed) return { kind: "unknown" };

  const lower = trimmed.toLowerCase();
  const firstWord = lower.split(/\s+/)[0];

  // Special commands
  if (firstWord === "help" || firstWord === "帮助") return { kind: "help" };
  if (firstWord === "status" || firstWord === "状态") return { kind: "status" };
  if (firstWord === "quit" || firstWord === "退出" || firstWord === "exit") return { kind: "quit" };

  // If not a known verb, route to AI dialogue
  if (!KNOWN_VERBS.has(firstWord)) {
    // Try to match an NPC name at the start: "mina xxx" or "米娜 xxx"
    const npcMatch = matchNpcInText(trimmed, meta);
    if (npcMatch) {
      return { kind: "ai_dialogue", npcId: npcMatch.npcId, text: npcMatch.rest };
    }

    // Use selected NPC if available
    if (selectedNpcId) {
      return { kind: "ai_dialogue", npcId: selectedNpcId, text: trimmed };
    }

    // Auto-select if only one NPC present
    if (visibleState.presentNpcs.length === 1) {
      return { kind: "ai_dialogue", npcId: visibleState.presentNpcs[0].id, text: trimmed };
    }

    // Multiple NPCs, no selection — ambiguous
    return { kind: "unknown" };
  }

  // Parse known command
  const input = parseCommand(trimmed, translations);

  // Auto-fill NPC for talk if needed
  if (input.verb === "talk" && !input.npc) {
    const npcId = selectedNpcId ?? (visibleState.presentNpcs.length === 1 ? visibleState.presentNpcs[0].id : undefined);
    if (npcId) {
      input.npc = meta.npcAliases[npcId];
    }
  }

  return { kind: "command", input };
}

/** Match an NPC alias at the beginning of text. Returns rest of text after name. */
function matchNpcInText(text: string, meta: WorldMeta): { npcId: string; rest: string } | null {
  const lower = text.toLowerCase();
  const aliases = meta.npcAliases ?? {};
  for (const [npcId, alias] of Object.entries(aliases)) {
    if (lower.startsWith(alias.toLowerCase() + " ")) {
      return { npcId, rest: text.slice(alias.length + 1) };
    }
  }
  return null;
}

/** Core command parsing — same logic as web parseCommand */
function parseCommand(raw: string, translations?: WorldTranslations): CommandInput {
  const parts = raw.split(/\s+/);
  const first = parts[0].toLowerCase();

  /** Try to resolve a Chinese name to an English alias */
  const tr = (target: string, type: "rooms" | "npcs" | "interactives" | "items"): string => {
    if (!translations) return target;
    const map = translations[type];
    for (const [id, entry] of Object.entries(map)) {
      if ((entry as any).zh === target || (entry as any).en?.toLowerCase() === target.toLowerCase()) {
        return id; // return the ID-based key for the runtime
      }
    }
    // Direction translations
    const dirs: Record<string, string> = {
      "北": "north", "南": "south", "东": "east", "西": "west",
      "上": "up", "下": "down",
    };
    if (dirs[target]) return dirs[target];
    return target;
  };

  switch (first) {
    case "look": case "看": case "观察":
      return { verb: "look" };

    case "go": case "去": case "走": {
      const rawTarget = parts.slice(1).join(" ");
      const target = tr(rawTarget, "rooms");
      return { verb: "go", target: target || undefined };
    }

    case "search": case "搜索": case "搜查": {
      const rawTarget = parts.slice(1).join(" ");
      const target = tr(rawTarget, "interactives");
      return { verb: "search", target: target || undefined };
    }

    case "take": case "拿": case "取": {
      const rawTarget = parts.slice(1).join(" ");
      const target = tr(rawTarget, "items");
      return { verb: "take", target: target || undefined };
    }

    case "inventory": case "i": case "背包": case "物品":
      return { verb: "inventory" };

    case "talk": case "说": case "对话": {
      const rest = parts.slice(1).join(" ");
      // Try to resolve Chinese NPC name to alias
      const npcRest = tr(rest.split(/\s+/)[0], "npcs");
      const fullRest = rest.includes(" ") ? `${npcRest} ${rest.split(/\s+/).slice(1).join(" ")}` : rest;
      // Try "talk <npc> about <topic>"
      const aboutIdx = fullRest.toLowerCase().indexOf(" about ");
      if (aboutIdx >= 0) {
        const npc = fullRest.slice(0, aboutIdx).trim();
        const topic = fullRest.slice(aboutIdx + 7).trim();
        return { verb: "talk", npc: npc || undefined, topic: topic || undefined };
      }
      // Try "talk <npc>"
      return { verb: "talk", npc: fullRest || undefined };
    }

    case "use": case "用": case "使用": {
      const rest = parts.slice(1).join(" ");
      const onIdx = rest.toLowerCase().indexOf(" on ");
      if (onIdx >= 0) {
        const item = rest.slice(0, onIdx).trim();
        const target = rest.slice(onIdx + 4).trim();
        return { verb: "use", item: item || undefined, target: target || undefined };
      }
      return { verb: "use", item: rest || undefined };
    }

    case "accuse": case "指控": {
      const rest = parts.slice(1).join(" ");
      const parts2 = rest.split(/\s+/);
      return { verb: "accuse", npc: parts2[0] || undefined, mode: parts2[1] || undefined };
    }

    default:
      return { verb: "look" };
  }
}

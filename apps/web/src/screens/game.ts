import type { CommandInput, VisibleState, WorldState, AdventureDefinition } from "@shared";
import { createInitialState, executeCommand, getVisibleState, evaluateAll } from "@game-runtime";
import { NarrativeEngine, PassthroughProvider, OpenAICompatibleProvider, DialogueEngine } from "@ai-narrative";
import type { ConversationExchange } from "@ai-narrative";
import type { WorldPack } from "../world-registry";
import { UI, createTranslator, type Translator, getLang, t } from "../i18n";
import type { Lang } from "../i18n";
import { generateMapSvg } from "../map-renderer";
import { showEnding } from "./end";

// --- Module state ---
let pack: WorldPack;
let adventure: AdventureDefinition;
let state: WorldState;
let engine: NarrativeEngine;
let dialogueEngine: DialogueEngine;
let tr: Translator;

interface NarEntry {
  css: string;
  en: string;
  zh: string;
  cmd?: string;
  aiSource?: "ai" | "passthrough";
}

let narHistory: NarEntry[] = [];
let conversationHistory: Map<string, ConversationExchange[]> = new Map();
let isProcessing = false;

const $ = (id: string) => document.getElementById(id)!;

// --- Init ---
export async function startGame(worldPack: WorldPack): Promise<void> {
  pack = worldPack;
  adventure = pack.adventure;
  const lang = getLang();
  tr = createTranslator(pack, lang);

  await initEngine(lang);
  state = createInitialState(adventure);
  narHistory = [];
  conversationHistory = new Map();
  isProcessing = false;

  const log = $("narrative-log");
  log.innerHTML = "";

  // Show game screen
  $("lobby-screen").classList.add("hidden");
  $("end-screen").classList.add("hidden");
  $("game").classList.remove("hidden");

  renderInitialScene();
  ($("command-input") as HTMLInputElement).focus();
}

export function getState(): WorldState {
  return state;
}

export function getPack(): WorldPack {
  return pack;
}

// --- Narrative Engine ---
async function initEngine(lang: Lang): Promise<void> {
  const key =
    new URLSearchParams(window.location.search).get("apiKey") ||
    localStorage.getItem("storycraft_api_key");
  let provider;
  if (key) {
    provider = new OpenAICompatibleProvider({
      apiKey: key,
      baseUrl: localStorage.getItem("storycraft_api_base") || "https://api.deepseek.com",
      model: localStorage.getItem("storycraft_model") || "deepseek-v4-pro",
      maxTokens: 300,
      temperature: 0.7,
    });
  } else {
    provider = new PassthroughProvider();
  }
  engine = new NarrativeEngine(provider, { lang });
  await engine.initialize();

  dialogueEngine = new DialogueEngine(provider, { lang });
  await dialogueEngine.initialize();
}

// --- Command handling ---
export function initGameEvents(): void {
  $("command-submit").addEventListener("click", handleCommand);
  ($("command-input") as HTMLInputElement).addEventListener("keydown", (e) => {
    if (e.key === "Enter") handleCommand();
  });
}

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
]);

async function handleCommand() {
  if (isProcessing) return;
  const raw = ($("command-input") as HTMLInputElement).value.trim();
  if (!raw) return;
  ($("command-input") as HTMLInputElement).value = "";

  const firstWord = raw.toLowerCase().split(/\s+/)[0];

  // If the first word is NOT a known command verb, try AI dialogue with selected NPC
  if (!KNOWN_VERBS.has(firstWord) && dialogueEngine?.isAiAvailable()) {
    const selectedNpc = getSelectedNpcId();
    if (selectedNpc) {
      await executeAiDialogue(selectedNpc, raw);
      return;
    }
  }

  let input = parseCommand(raw);

  // Auto-fill NPC for talk commands from the selector
  if (input.verb === "talk" && !input.npc) {
    const selectedNpc = getSelectedNpcId();
    if (selectedNpc) {
      input = { ...input, npc: pack.meta.npcAliases[selectedNpc] };
    }
  }

  await executeAndRender(input);
}

/** Read the NPC selector dropdown; returns the npcId or undefined. */
function getSelectedNpcId(): string | undefined {
  const sel = $("npc-select") as HTMLSelectElement;
  return sel.value || undefined;
}

/**
 * When AI is unavailable, try to match player input to a known topic alias.
 * Checks both English aliases (from topicGates) and Chinese labels (from meta.npcTopics).
 * Returns the first matching alias, or undefined.
 */
function findMatchingTopic(npcId: string, input: string): string | undefined {
  const lower = input.toLowerCase();

  // Build a list of { alias, labelZh, labelEn } for this NPC
  const topics = pack.meta.npcTopics[npcId] ?? [];
  for (const tp of topics) {
    if (
      lower.includes(tp.alias.toLowerCase()) ||
      lower.includes(tp.zh) ||
      lower.includes(tp.en.toLowerCase())
    ) {
      return tp.alias;
    }
  }

  // Also check raw topicGate aliases as fallback
  const gates = adventure.topicGates ?? {};
  for (const gate of Object.values(gates)) {
    if (gate.npcId !== npcId) continue;
    for (const alias of gate.topicAliases) {
      if (lower.includes(alias.toLowerCase())) {
        return alias;
      }
    }
  }

  return undefined;
}

/**
 * Execute a command and render the result directly.
 * Normal commands do NOT call AI — they display the raw game-runtime output.
 */
export async function executeAndRender(input: CommandInput): Promise<void> {
  const raw = formatCmd(input);
  narHistory.push({ css: "", en: "", zh: "", cmd: raw });
  const cmdEl = document.createElement("div");
  cmdEl.className = "narrative-entry command-only";
  cmdEl.innerHTML = `<span class="command-label">&gt; ${esc(raw)}</span>`;
  $("narrative-log").appendChild(cmdEl);

  const result = executeCommand(state, input, adventure);
  state = result.state;

  // Direct display — no AI narration for normal commands
  const msgEn = result.message;
  const msgZh = tr.translateMsg(msgEn);
  const css = result.state.endingId ? "ending" : result.ok ? "ok" : "fail";
  narHistory.push({ css, en: msgEn, zh: msgZh });

  const el = document.createElement("div");
  el.className = `narrative-entry ${css}`;
  el.innerHTML = esc(tr.lang === "zh" ? msgZh : msgEn);
  $("narrative-log").appendChild(el);
  ($("narrative-log").parentElement!).scrollTop = ($("narrative-log").parentElement!).scrollHeight;

  renderVisibleState(result.visibleState);

  if (result.state.isComplete && result.state.endingId) {
    setTimeout(
      () =>
        showEnding(
          tr,
          result.state,
          () => startGame(pack),
          () => startGame(pack),
        ),
      800,
    );
  }
  ($("command-input") as HTMLInputElement).focus();
}

function renderInitialScene(): void {
  renderVisibleState(getVisibleState(state, adventure));

  const introEn = pack.meta.intro.en;
  const introZh = pack.meta.intro.zh;
  narHistory.push({ css: "ok", en: introEn, zh: introZh });
  appendNar("ok", tr.lang === "zh" ? introZh : introEn);

  // Help text hidden — command bar is self-explanatory
}

function appendNar(css: string, msg: string): void {
  const el = document.createElement("div");
  el.className = `narrative-entry ${css}`;
  el.textContent = msg;
  $("narrative-log").appendChild(el);
  ($("narrative-log").parentElement!).scrollTop = ($("narrative-log").parentElement!).scrollHeight;
}

// --- AI NPC Dialogue ----

/** Wrapper: reads from the NPC panel input element, then delegates. */
async function handleAiDialogue(npcId: string): Promise<void> {
  if (isProcessing) return;
  const inputEl = document.getElementById(`npc-input-${npcId}`) as HTMLInputElement;
  const playerInput = inputEl?.value?.trim();
  if (!playerInput) return;
  inputEl.value = "";
  await executeAiDialogue(npcId, playerInput);
}

/** Show a thinking spinner in the narrative log. Returns the element so caller can remove it. */
function showSpinner(): HTMLElement {
  const el = document.createElement("div");
  el.className = "narrative-spinner";
  el.innerHTML = `<div class="spinner-dots"><span></span><span></span><span></span></div>`;
  $("narrative-log").appendChild(el);
  ($("narrative-log").parentElement!).scrollTop = ($("narrative-log").parentElement!).scrollHeight;
  return el;
}

/** Core AI dialogue — can be called from NPC panel or command bar. */
async function executeAiDialogue(npcId: string, playerInput: string): Promise<void> {
  isProcessing = true;
  setInputsDisabled(true);
  let exchange: ConversationExchange | null = null;

  // Show player's message in narrative log FIRST, then spinner below it
  const npcAlias = pack.meta.npcAliases[npcId] ?? npcId;
  narHistory.push({ css: "", en: "", zh: "", cmd: `talk ${npcAlias} "${playerInput}"` });
  const cmdEl = document.createElement("div");
  cmdEl.className = "narrative-entry command-only";
  cmdEl.innerHTML = `<span class="command-label">&gt; ${esc(playerInput)}</span>`;
  $("narrative-log").appendChild(cmdEl);

  const spinnerEl = showSpinner();

  try {
    // Get NPC script
    const npcScript = pack.npcScripts?.[npcId];
    if (!npcScript) {
      appendNar("fail", "NPC script not found.");
      return;
    }

    // Get conversation history
    const history = conversationHistory.get(npcId) ?? [];

    // Build dialogue context from current game state
    const topicGates = adventure.topicGates ?? {};
    const validGateIds = Object.values(topicGates)
      .filter((g) => g.npcId === npcId)
      .filter((g) => !state.flags[`talked_${g.id}`])
      .filter((g) => evaluateAll(g.requires, state, adventure))
      .map((g) => g.id);
    const exhaustedGateIds = Object.values(topicGates)
      .filter((g) => g.npcId === npcId && state.flags[`talked_${g.id}`] === true)
      .map((g) => g.id);

    const context = {
      currentRoom: adventure.rooms[state.currentRoomId as keyof typeof adventure.rooms]?.name ?? "",
      currentTurn: state.turnIndex,
      turnsRemaining: state.turnsRemaining,
      playerInventory: state.inventoryItemIds.map(
        (id) => adventure.items[id as keyof typeof adventure.items]?.name ?? id,
      ),
      discoveredClues: Object.keys(state.discoveredCluesById).map(
        (id) => adventure.clues[id as keyof typeof adventure.clues]?.title ?? id,
      ),
      currentTrust: state.trustByNpcId[npcId] ?? 0,
      exhaustedTopicGateIds: exhaustedGateIds,
      recentExchanges: history,
      validTopicGateIds: validGateIds,
    };

    // Call dialogue engine
    const result = await dialogueEngine.handleFreeFormDialogue({
      npcScript,
      playerInput,
      context,
    });

    // AI failed / unavailable → fall back to keyword-matched game-runtime talk
    if (result.source === "passthrough") {
      // Fix 2: guard against short input triggering gates accidentally
      const matchedTopic = playerInput.length >= 4
        ? findMatchingTopic(npcId, playerInput)
        : undefined;
      if (matchedTopic) {
        const talkResult = executeCommand(
          state,
          { verb: "talk", npc: npcAlias, topic: matchedTopic },
          adventure,
        );
        state = talkResult.state;
        // Fix 3: check ok before showing as success
        const msgEn = talkResult.message;
        const msgZh = tr.translateMsg(msgEn);
        if (talkResult.ok) {
          narHistory.push({ css: "ok", en: msgEn, zh: msgZh });
          appendNar("ok", tr.lang === "zh" ? msgZh : msgEn);
        } else {
          narHistory.push({ css: "fail", en: msgEn, zh: msgZh });
          appendNar("fail", tr.lang === "zh" ? msgZh : msgEn);
        }
        exchange = { playerInput, npcResponse: msgEn, triggeredTopicGateId: null, timestamp: Date.now() };
        renderVisibleState(talkResult.visibleState);
      } else {
        // No keyword match — show NPC's default greeting
        const talkResult = executeCommand(
          state,
          { verb: "talk", npc: npcAlias },
          adventure,
        );
        state = talkResult.state;
        const msgEn = talkResult.message;
        const msgZh = tr.translateMsg(msgEn);
        narHistory.push({ css: "ok", en: msgEn, zh: msgZh });
        appendNar("ok", tr.lang === "zh" ? msgZh : msgEn);
        exchange = { playerInput, npcResponse: msgEn, triggeredTopicGateId: null, timestamp: Date.now() };
        renderVisibleState(talkResult.visibleState);
      }
      return;
    }

    // --- AI succeeded below ---
    const aiBadge = ' <span class="ai-badge" title="AI dialogue">✦</span>';
    narHistory.push({ css: "ok", en: result.dialogue, zh: result.dialogue, aiSource: result.source });

    const el = document.createElement("div");
    el.className = "narrative-entry ok";
    el.innerHTML = `${esc(result.dialogue)}${aiBadge}`;
    $("narrative-log").appendChild(el);

    // Build conversation exchange for AI response
    exchange = {
      playerInput,
      npcResponse: result.dialogue,
      triggeredTopicGateId: result.triggeredTopicGateId,
      timestamp: Date.now(),
    };

    // If gate was triggered (or can be matched from input), apply game effects via game-runtime
    {
      // Resolve gate: AI-triggered first, then keyword fallback
      let resolvedGateId = result.triggeredTopicGateId;
      if (!resolvedGateId) {
        const matched = playerInput.length >= 4
          ? findMatchingTopic(npcId, playerInput)
          : undefined;
        // Only use fallback if the matched gate is in the valid set (conditions met)
        if (matched) {
          for (const gate of Object.values(topicGates)) {
            if (gate.npcId === npcId && gate.topicAliases.includes(matched) && validGateIds.includes(gate.id)) {
              resolvedGateId = gate.id;
              break;
            }
          }
        }
      }

      if (resolvedGateId) {
        const gate = topicGates[resolvedGateId];
        if (gate) {
          const topic = gate.topicAliases[0];
          const talkResult = executeCommand(
            state,
            { verb: "talk", npc: npcAlias, topic },
            adventure,
          );
          state = talkResult.state;

          // Only show effect messages if the gate actually fired (conditions met)
          if (talkResult.ok && talkResult.turnSpent) {
            const effectMessages: string[] = [];
            for (const clueId of gate.revealsClueIds ?? []) {
              effectMessages.push(
                `🔍 ${tr.lang === "zh" ? "发现线索" : "Clue discovered"}: ${tr.clue(clueId)}`,
              );
            }
            for (const itemId of gate.revealsItemIds ?? []) {
              effectMessages.push(
                `📦 ${tr.lang === "zh" ? "获得物品" : "Item discovered"}: ${tr.item(itemId)}`,
              );
            }
            if (gate.trustDelta) {
              const newTrust = state.trustByNpcId[npcId] ?? 0;
              effectMessages.push(
                `💚 ${tr.npc(npcId)} ${tr.lang === "zh" ? `信任度变为 ${newTrust}` : `trust is now ${newTrust}`}`,
              );
            }
            effectMessages.push(
              `⏳ ${tr.lang === "zh" ? "消耗了 1 个调查回合" : "Spent 1 investigation turn"}`,
            );

            if (effectMessages.length > 0) {
              const effectEl = document.createElement("div");
              effectEl.className = "narrative-entry ok";
              effectEl.innerHTML = effectMessages.map((m) => `<div>${esc(m)}</div>`).join("");
              $("narrative-log").appendChild(effectEl);
            }
          } else if (!talkResult.ok) {
            // Gate was blocked (conditions not met) — show NPC's reluctance
            appendNar("fail", talkResult.message);
          }

          renderVisibleState(talkResult.visibleState);

          // Check for game end
          if (talkResult.state.isComplete && talkResult.state.endingId) {
            setTimeout(
              () =>
                showEnding(
                  tr,
                  talkResult.state,
                  () => startGame(pack),
                  () => startGame(pack),
                ),
              800,
            );
          }
        }
      }
    }

    // Apply AI-driven trust change (independent of gates)
    if (result.trustDelta !== 0) {
      const currentTrust = state.trustByNpcId[npcId] ?? 0;
      const newTrust = Math.max(0, Math.min(2, currentTrust + result.trustDelta)) as 0 | 1 | 2;
      if (newTrust !== currentTrust) {
        state = {
          ...state,
          trustByNpcId: { ...state.trustByNpcId, [npcId]: newTrust }
        };
        const trustMsg = `💚 ${tr.npc(npcId)} ${tr.lang === "zh" ? `信任度变为 ${newTrust}` : `trust is now ${newTrust}`}`;
        const trustEl = document.createElement("div");
        trustEl.className = "narrative-entry ok";
        trustEl.innerHTML = esc(trustMsg);
        $("narrative-log").appendChild(trustEl);
        renderVisibleState(getVisibleState(state, adventure));
      }
    }
  } catch {
    appendNar(
      "fail",
      tr.lang === "zh" ? "对话出错，请重试。" : "Dialogue error. Please try again.",
    );
  } finally {
    // Remove spinner
    spinnerEl.remove();
    // Fix 1: update conversation history in all branches
    if (exchange) {
      const prev = conversationHistory.get(npcId) ?? [];
      conversationHistory.set(npcId, [...prev, exchange].slice(-5));
    }
    isProcessing = false;
    setInputsDisabled(false);
    ($("narrative-log").parentElement!).scrollTop = ($("narrative-log").parentElement!).scrollHeight;
    ($("command-input") as HTMLInputElement).focus();
  }
}

function setInputsDisabled(disabled: boolean): void {
  ($("command-input") as HTMLInputElement).disabled = disabled;
  ($("command-submit") as HTMLButtonElement).disabled = disabled;
  ($("npc-select") as HTMLSelectElement).disabled = disabled;
}

// --- Room ASCII Art ---
const ROOM_ASCII: Record<string, string> = {
  room_great_hall: [
    "         ___           ___    ",
    "        /   \\         /   \\   ",
    "       /     \\_______/     \\  ",
    "      /  ╔═══╗     ╔═══╗  \\  ",
    "     /   ║   ║     ║   ║   \\ ",
    "    /    ╚═══╝     ╚═══╝    \\",
    "   /                          \\",
    "  │   ┌──┐            ┌──┐   │",
    "  │   │▒▒│    ┌───┐   │▒▒│   │",
    "  │   └──┘    │☠  │   └──┘   │",
    "  │           └───┘          │",
    "  │  ╱╲     ╱╲      ╱╲     ╱╲",
    "  │ ╱  ╲   ╱  ╲    ╱  ╲   ╱  ╲",
    "  └──────────────────────────┘",
  ].join("\n"),

  room_study: [
    "   ┌─────────────────────┐",
    "   │  ┌─┐        ╔═══╗  │",
    "   │  │░│  ┌──┐  ║   ║  │",
    "   │  │░│  │📖│  ║ ░ ║  │",
    "   │  └─┘  └──┘  ╚═╗═╝  │",
    "   │   🔥        ╔═╝═╗  │",
    "   │  ╱╲╱╲      ║ ░░░║  │",
    "   │            ╚═════╝  │",
    "   │   ┌─┬─┬─┐          │",
    "   │   │▓│▓│▓│  ╱╲╱╲   │",
    "   │   └─┴─┴─┘          │",
    "   └─────────────────────┘",
  ].join("\n"),

  room_servants_hall: [
    "  ┌──────────────────────┐",
    "  │  ┌──┐ ┌──┐    ┌──┐  │",
    "  │  │🧥│ │🧥│    │📋│  │",
    "  │  └──┘ └──┘    └──┘  │",
    "  │                      │",
    "  │  ╔═══════╗  ◉  ◉  ◉ │",
    "  │  ║   🔥  ║  ◉  ◉  ◉ │",
    "  │  ╚═══════╝           │",
    "  │   ╱╲╱╲╱╲    ┌─┬─┐   │",
    "  │             │✎│✎│   │",
    "  │   ╱╲╱╲╱╲    └─┴─┘   │",
    "  └──────────────────────┘",
  ].join("\n"),

  room_bell_tower: [
    "          ╱╲",
    "         ╱  ╲",
    "        ╱ 🔔 ╲",
    "       ╱──────╲",
    "      ╱    │   ╲",
    "     ╱     │    ╲",
    "    ╱   ┌──┼──┐  ╲",
    "   │    │  ╱╲  │   │",
    "   │    │ ╱  ╲ │   │",
    "   │    │╱ ✦✦ ╲│   │",
    "   │    └──────┘   │",
    "   │      ╱╲       │",
    "   │    ╱ ✦  ✦ ╲    │",
    "   │  ╱──────────╲  │",
    "   └───────────────┘",
  ].join("\n"),

  room_winter_garden: [
    "   ╔═══════════════════════╗",
    "   ║ ╱╲   ╱╲   ╱╲   ╱╲  ║",
    "   ╱  ❄   ❄   ❄   ❄  ╲ ║",
    "  ╱  ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲  ╲║",
    "  │ 🌿❄🌿❄🌿❄🌿❄🌿❄🌿 │║",
    "  │  ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱  │║",
    "  │    ❄   ❄   ❄   ❄    │║",
    "  │  ╱╲ ╱╲ ╱╲ ╱╲ ╱╲ ╱╲  │║",
    "  │ 🌿❄🌿❄🌿❄🌿❄🌿❄🌿 │║",
    "  │  ╲╱ ╲╱ ╲╱ ╲╱ ╲╱ ╲╱  │",
    "  │    ❄   ❄   ❄   ❄    │",
    "  ╚═══════════════════════╝",
  ].join("\n"),

  room_coach_yard: [
    "       ❄  ❄    ❄     ❄  ",
    "      ❄    ❄  ❄   ❄     ",
    "    ┌─────┐    ┌─────┐   ",
    "    │ 🛷  │    │ 🛷  │   ",
    "    │░░░░░│    │░░░░░│   ",
    "    └──┬──┘    └──┬──┘   ",
    "   ╱╲  │  ╱╲      │  ╱╲  ",
    "  ╱░░╲ │ ╱░░╲  ╱╲ │ ╱░░╲ ",
    "  ╲░░░╱└─╲░░░╱ ╱╲╱╲└╲░░░╱ ",
    "   ╲░░╱   ╲░░╱╱ 🏮 ╲╲░░╱  ",
    "    ╲╱     ╲╱      ╲╱   ",
    "     ❄  ❄     ❄  ❄      ",
  ].join("\n"),

  room_gatehouse: [
    "           ┌─┐",
    "           │⚑│",
    "           └┬┘",
    "        ┌───┼───┐",
    "        │   │   │",
    "    ━━━━┫   │   ┣━━━━",
    "        │   │   │",
    "    ━━━━┫ 🚪│   ┣━━━━",
    "        │   │   │",
    "        └───┼───┘",
    "       ╱ ╲  │  ╱ ╲",
    "      ╱░░░╲ │ ╱░░░╲",
    "     ╱░░░░░╲│╱░░░░░╲",
    "    ╱░░░░░░░░░░░░░░░╲",
    "         ❄  ❄  ❄     ",
  ].join("\n"),
};

function renderRoomArt(roomId: string): void {
  const el = $("room-art");
  const art = ROOM_ASCII[roomId];
  if (art) {
    el.textContent = art;
  } else {
    el.textContent = "";
  }
}

// --- Rendering ---
export function renderVisibleState(v: VisibleState): void {
  $("turns-display").textContent = UI.turns(v.turnsRemaining);
  $("room-display").textContent = tr.room(v.currentRoom.id);
  $("room-name").textContent = tr.room(v.currentRoom.id);
  $("room-description").textContent = tr.roomDesc(v.currentRoom.id);
  renderRoomArt(v.currentRoom.id);
  $("room-exits").innerHTML =
    v.visibleExits.length > 0
      ? `<strong>${t("出口：", "Exits: ")}</strong>${v.visibleExits.map((e) => (e.locked ? `<span style="text-decoration:line-through">${e.direction}</span>` : e.direction)).join(t("、", ", "))}`
      : "";
  $("room-npcs").innerHTML =
    v.presentNpcs.length > 0
      ? `<strong>${t("在场：", "Present: ")}</strong>${v.presentNpcs.map((n) => `${tr.npc(n.id)}（${tr.npcRole(n.id)}）`).join(t("、", ", "))}`
      : "";

  // Headings
  $("map-heading").textContent = UI.mapHeading();
  $("npc-heading").textContent = UI.npcHeading();
  $("scene-heading").textContent = UI.sceneHeading();
  $("inventory-heading").textContent = UI.invHeading();
  $("clues-heading").textContent = UI.cluesHeading();
  $("trust-heading").textContent = UI.trustHeading();
  $("consequences-heading").textContent = UI.conseqHeading();

  renderMap();
  renderNpcPanel(v);
  renderNpcSelect(v);
  renderSceneItems();
  renderInventory(v);
  renderClues(v);
  renderTrust(v);
  renderConsequences(v);
}

// --- Dynamic Map ---
function renderMap(): void {
  const container = $("map-body");
  const svg = generateMapSvg(
    adventure,
    state,
    (roomId) => tr.room(roomId),
    (roomId) => {
      // Room click handler
      if (roomId === state.currentRoomId) {
        executeAndRender({ verb: "look" });
        return;
      }
      const exit = Object.values(adventure.exits).find(
        (e) => e.fromRoomId === state.currentRoomId && e.toRoomId === roomId,
      );
      if (exit) executeAndRender({ verb: "go", target: exit.aliases[0] });
    },
  );
  container.innerHTML = "";
  container.appendChild(svg);
}

// --- NPC selector in command bar ---
function renderNpcSelect(v: VisibleState): void {
  const sel = $("npc-select") as HTMLSelectElement;
  const prev = sel.value;
  sel.innerHTML = "";

  if (v.presentNpcs.length === 0) {
    sel.classList.add("hidden");
    return;
  }

  sel.classList.remove("hidden");
  for (const npc of v.presentNpcs) {
    const opt = document.createElement("option");
    opt.value = npc.id;
    opt.textContent = tr.npc(npc.id);
    sel.appendChild(opt);
  }

  // Preserve previous selection if still present; otherwise default to first
  if (prev && v.presentNpcs.some((n) => n.id === prev)) {
    sel.value = prev;
  }
}

// --- NPC panel ---
function renderNpcPanel(v: VisibleState): void {
  const panel = $("npc-list");
  panel.innerHTML = "";
  if (v.presentNpcs.length === 0) {
    panel.innerHTML = `<div style="color:var(--text-secondary);font-style:italic;font-size:0.85rem">${UI.noOneHere()}</div>`;
    return;
  }

  for (const npc of v.presentNpcs) {
    const div = document.createElement("div");
    div.className = "npc-entry";
    const nameSpan = document.createElement("div");
    nameSpan.className = "npc-name";
    nameSpan.textContent = `${tr.npc(npc.id)}（${tr.npcRole(npc.id)}）`;
    div.appendChild(nameSpan);

    // Fixed topic buttons (shown when AI unavailable as fallback)
    if (!dialogueEngine?.isAiAvailable()) {
      const topics = pack.meta.npcTopics[npc.id];
      if (topics) {
        const topicRow = document.createElement("div");
        topicRow.className = "npc-action-row";
        const talkLabel = document.createElement("span");
        talkLabel.className = "action-label";
        talkLabel.textContent = UI.talkLabel();
        topicRow.appendChild(talkLabel);
        const topicDiv = document.createElement("div");
        topicDiv.className = "npc-topics";
        for (const tp of topics) {
          const btn = document.createElement("button");
          btn.className = "topic-btn";
          btn.textContent = tr.lang === "zh" ? tp.zh : tp.en;
          btn.addEventListener("click", () =>
            executeAndRender({ verb: "talk", npc: pack.meta.npcAliases[npc.id], topic: tp.alias }),
          );
          topicDiv.appendChild(btn);
        }
        topicRow.appendChild(topicDiv);
        div.appendChild(topicRow);
      }
    }

    // Accuse buttons (always shown when applicable)
    if (state.turnsRemaining > 0 && !state.isComplete) {
      const accuseRow = document.createElement("div");
      accuseRow.className = "npc-action-row";
      const accuseLabel = document.createElement("span");
      accuseLabel.className = "action-label";
      accuseLabel.textContent = UI.accuseLabel();
      accuseRow.appendChild(accuseLabel);
      const accuseDiv = document.createElement("div");
      accuseDiv.className = "npc-topics";
      const ab = document.createElement("button");
      ab.className = "accuse-btn";
      ab.textContent = UI.accuseBtn();
      ab.addEventListener("click", () =>
        executeAndRender({ verb: "accuse", npc: pack.meta.npcAliases[npc.id] }),
      );
      accuseDiv.appendChild(ab);
      const mb = document.createElement("button");
      mb.className = "accuse-btn accuse-btn-mercy";
      mb.textContent = UI.accuseMercyBtn();
      mb.addEventListener("click", () =>
        executeAndRender({ verb: "accuse", npc: pack.meta.npcAliases[npc.id], mode: "mercy" }),
      );
      accuseDiv.appendChild(mb);
      accuseRow.appendChild(accuseDiv);
      div.appendChild(accuseRow);
    }
    panel.appendChild(div);
  }
}

// --- Scene items ---
function renderSceneItems(): void {
  const panel = $("scene-items-list");
  panel.innerHTML = "";
  const room = adventure.rooms[state.currentRoomId as keyof typeof adventure.rooms];
  if (!room) return;
  const interactiveIds = room.interactiveIds;
  let hasAny = false;

  for (const intId of interactiveIds) {
    const interactive = adventure.interactives[intId];
    if (!interactive || !interactive.visibleFromStart) continue;
    hasAny = true;
    const div = document.createElement("div");
    div.className = "action-item";
    const label = document.createElement("span");
    label.className = "item-label";
    const intName = tr.interactive(intId);
    const isSearched = state.searchedInteractiveIds.includes(intId);

    if (isSearched) {
      label.classList.add("searched");
      label.textContent = `${intName} (${UI.searched()})`;
    } else {
      label.textContent = intName;
    }
    div.appendChild(label);

    if (!isSearched && state.turnsRemaining > 0) {
      const btn = document.createElement("button");
      btn.className = "action-btn";
      btn.textContent = UI.searchBtn();
      btn.addEventListener("click", () =>
        executeAndRender({ verb: "search", target: interactive.aliases[0] }),
      );
      div.appendChild(btn);
    }
    panel.appendChild(div);

    // Show discovered carryable items from this interactive
    if (interactive.searchOutcome?.revealedItemIds) {
      for (const itemId of interactive.searchOutcome.revealedItemIds) {
        if (state.discoveredItemIds.includes(itemId) && !state.inventoryItemIds.includes(itemId)) {
          const item = adventure.items[itemId as keyof typeof adventure.items];
          if (item && item.carryable) {
            hasAny = true;
            const d2 = document.createElement("div");
            d2.className = "action-item";
            const l2 = document.createElement("span");
            l2.className = "item-label discovered";
            l2.textContent = `  ↳ ${tr.item(itemId)}`;
            d2.appendChild(l2);
            const b2 = document.createElement("button");
            b2.className = "action-btn";
            b2.textContent = UI.takeBtn();
            b2.addEventListener("click", () =>
              executeAndRender({ verb: "take", target: item.aliases[0] }),
            );
            d2.appendChild(b2);
            panel.appendChild(d2);
          }
        }
      }
    }
  }

  // Also show items discovered by other means (e.g. dialogue) that belong to this room
  const roomItemIds = pack.meta.itemsByRoom[state.currentRoomId] ?? [];
  const alreadyShown = new Set<string>();
  for (const intId of interactiveIds) {
    const interactive = adventure.interactives[intId];
    if (interactive?.searchOutcome?.revealedItemIds) {
      interactive.searchOutcome.revealedItemIds.forEach((id) => alreadyShown.add(id));
    }
  }

  for (const itemId of roomItemIds) {
    if (alreadyShown.has(itemId)) continue;
    if (state.discoveredItemIds.includes(itemId) && !state.inventoryItemIds.includes(itemId)) {
      const item = adventure.items[itemId as keyof typeof adventure.items];
      if (item && item.carryable) {
        hasAny = true;
        const d = document.createElement("div");
        d.className = "action-item";
        const l = document.createElement("span");
        l.className = "item-label discovered";
        l.textContent = tr.item(itemId);
        d.appendChild(l);
        const b = document.createElement("button");
        b.className = "action-btn";
        b.textContent = UI.takeBtn();
        b.addEventListener("click", () =>
          executeAndRender({ verb: "take", target: item.aliases[0] }),
        );
        d.appendChild(b);
        panel.appendChild(d);
      }
    }
  }

  if (!hasAny)
    panel.innerHTML = `<div style="color:var(--text-secondary);font-style:italic;font-size:0.85rem">${UI.nothingHere()}</div>`;
}

// --- Inventory ---
function renderInventory(v: VisibleState): void {
  const list = $("inventory-list");
  list.innerHTML = "";
  if (v.inventory.length === 0) {
    list.innerHTML = `<li style="color:var(--text-secondary);font-style:italic">${UI.empty()}</li>`;
    return;
  }
  for (const item of v.inventory) {
    const li = document.createElement("li");
    li.className = "inv-item";
    const label = document.createElement("span");
    label.className = "inv-item-name";
    label.textContent = tr.item(item.id);
    li.appendChild(label);

    const rules = Object.values(adventure.useRules ?? {}).filter(
      (r: any) => r.itemId === item.id,
    );
    if (rules.length > 0 && state.turnsRemaining > 0 && !state.isComplete) {
      const currentRoomInteractives =
        adventure.rooms[state.currentRoomId as keyof typeof adventure.rooms]?.interactiveIds
          ?.map((id: string) => adventure.interactives[id]?.name?.toLowerCase()) ?? [];

      for (const rule of rules) {
        const targetAvailable = (rule as any).targetAliases.some((a: string) => {
          const al = a.toLowerCase();
          if ((rule as any).npcPresent)
            return state.npcRoomById[(rule as any).npcPresent] === state.currentRoomId;
          return currentRoomInteractives.some((n) => n.includes(al));
        });
        if (!targetAvailable) continue;
        const btn = document.createElement("button");
        btn.className = "action-btn";
        btn.textContent = UI.useBtn();
        btn.addEventListener("click", () =>
          executeAndRender({
            verb: "use",
            item: adventure.items[item.id as keyof typeof adventure.items]?.aliases[0],
            target: (rule as any).targetAliases[0],
          }),
        );
        li.appendChild(btn);
      }
    }
    list.appendChild(li);
  }
}

// --- Clues ---
function renderClues(v: VisibleState): void {
  const entries = Object.entries(v.clues);
  $("clues-list").innerHTML =
    entries.length > 0
      ? entries
          .map(
            ([id, s]) =>
              `<li class="${s === "weak" ? "clue-weak" : "clue-standard"}">${tr.clue(id)}（${tr.strength(s)}）</li>`,
          )
          .join("")
      : `<li style="color:var(--text-secondary);font-style:italic">${UI.noneDiscovered()}</li>`;
}

// --- Trust ---
function renderTrust(v: VisibleState): void {
  $("trust-list").innerHTML = Object.entries(v.trust)
    .map(
      ([nid, trust]) =>
        `<div class="trust-row"><span>${tr.npc(nid)}</span><span class="trust-value trust-${trust}">${"●".repeat(Number(trust))}${"○".repeat(2 - Number(trust))}</span></div>`,
    )
    .join("");
}

// --- Consequences ---
function renderConsequences(v: VisibleState): void {
  $("consequences-list").innerHTML =
    v.consequences.length > 0
      ? v.consequences.map((c) => `<li>${tr.consequence(c)}</li>`).join("")
      : `<li style="color:var(--text-secondary);font-style:italic">${UI.none()}</li>`;
}

// --- Replay nar log on language switch ---
export function refreshLang(): void {
  const lang = getLang();
  // Recreate translator with new language
  tr = createTranslator(pack, lang);
  // Update AI engine language
  engine.setLang(lang);
  // Re-render narrative log
  replayNarLog();
  // Re-render right panel (room, NPCs, items, clues, trust, consequences)
  renderVisibleState(getVisibleState(state, adventure));
}

export function replayNarLog(): void {
  const log = $("narrative-log");
  log.innerHTML = "";
  for (const e of narHistory) {
    if (e.cmd) {
      const d = document.createElement("div");
      d.className = "narrative-entry command-only";
      d.innerHTML = `<span class="command-label">&gt; ${esc(e.cmd)}</span>`;
      log.appendChild(d);
    } else {
      const d = document.createElement("div");
      d.className = `narrative-entry ${e.css}`;
      const aiBadge =
        e.aiSource === "ai" ? ' <span class="ai-badge" title="AI dialogue">✦</span>' : "";
      d.innerHTML = `${esc(tr.lang === "zh" ? e.zh : e.en)}${aiBadge}`;
      log.appendChild(d);
    }
  }
  (log.parentElement!).scrollTop = (log.parentElement!).scrollHeight;
}

// --- Command parsing ---
function parseCommand(raw: string): CommandInput {
  const parts = raw.toLowerCase().split(/\s+/);
  const v = parts[0] as CommandInput["verb"];
  switch (v) {
    case "look": case "看": case "观察": return { verb: "look" };
    case "go": case "去": case "走": return { verb: "go", target: parts.slice(1).join(" ") || undefined };
    case "search": case "搜索": case "搜查": return { verb: "search", target: parts.slice(1).join(" ") || undefined };
    case "take": case "拿": case "取": return { verb: "take", target: parts.slice(1).join(" ") || undefined };
    case "inventory": case "i": case "背包": case "物品": return { verb: "inventory" };
    case "talk": case "说": case "对话": {
      let r = parts.slice(1);
      if (r[0] === "to") r = r.slice(1);
      const ai = r.indexOf("about");
      return ai >= 0
        ? { verb: "talk", npc: r.slice(0, ai).join(" ") || undefined, topic: r.slice(ai + 1).join(" ") || undefined }
        : { verb: "talk", npc: r.join(" ") || undefined };
    }
    case "use": case "用": case "使用": {
      const oi = parts.indexOf("on");
      return oi >= 0
        ? { verb: "use", item: parts.slice(1, oi).join(" ") || undefined, target: parts.slice(oi + 1).join(" ") || undefined }
        : { verb: "use", item: parts.slice(1).join(" ") || undefined };
    }
    case "accuse": case "指控": {
      const rp = parts.slice(2);
      let mode: string | undefined, theory: string | undefined;
      if (rp.includes("mercy") || rp.includes("怜悯")) mode = "mercy";
      else if (rp.includes("private") || rp.includes("私下")) mode = "private";
      else theory = rp.join(" ") || undefined;
      return { verb: "accuse", npc: parts[1], theory, mode };
    }
    case "help": case "帮助": return { verb: "look" };
    default: return { verb: "look" };
  }
}

function formatCmd(input: CommandInput): string {
  switch (input.verb) {
    case "go": return `go ${input.target ?? ""}`;
    case "search": return `search ${input.target ?? ""}`;
    case "take": return `take ${input.target ?? ""}`;
    case "talk": return `talk ${input.npc ?? ""}${input.topic ? " about " + input.topic : ""}`;
    case "use": return `use ${input.item ?? ""}${input.target ? " on " + input.target : ""}`;
    case "accuse": return `accuse ${input.npc ?? ""}${input.mode ? " " + input.mode : ""}`;
    default: return input.verb;
  }
}

function esc(text: string): string {
  const d = document.createElement("div");
  d.textContent = text;
  return d.innerHTML;
}

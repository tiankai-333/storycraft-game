import type { WorldPack } from "../world-registry";
import { UI, type Lang, getLang, t } from "../i18n";

export function renderLobby(
  worlds: WorldPack[],
  onStartWorld: (worldId: string) => void,
): void {
  const container = document.getElementById("lobby-grid")!;
  const lang = getLang();
  container.innerHTML = "";

  for (const pack of worlds) {
    const card = document.createElement("div");
    card.className = "lobby-card";

    const cover = document.createElement("div");
    cover.className = "lobby-card__cover";
    cover.textContent = pack.meta.coverImage;
    card.appendChild(cover);

    const body = document.createElement("div");
    body.className = "lobby-card__body";

    const title = document.createElement("h2");
    title.className = "lobby-card__title";
    title.textContent = lang === "zh" ? pack.meta.title.zh : pack.meta.title.en;
    body.appendChild(title);

    const subtitle = document.createElement("p");
    subtitle.className = "lobby-card__subtitle";
    subtitle.textContent = lang === "zh" ? pack.meta.subtitle.zh : pack.meta.subtitle.en;
    body.appendChild(subtitle);

    const premise = document.createElement("p");
    premise.className = "lobby-card__premise";
    premise.innerHTML = lang === "zh" ? pack.meta.premise.zh : pack.meta.premise.en;
    body.appendChild(premise);

    const meta = document.createElement("div");
    meta.className = "lobby-card__meta";
    const turnSpan = document.createElement("span");
    turnSpan.className = "lobby-card__turns";
    turnSpan.textContent = `${t("回合", "Turns")}: ${pack.meta.turns}`;
    meta.appendChild(turnSpan);

    const npcCount = Object.keys(pack.adventure.npcs).length;
    const roomCount = Object.keys(pack.adventure.rooms).length;
    const infoSpan = document.createElement("span");
    infoSpan.className = "lobby-card__info";
    infoSpan.textContent = `${roomCount} ${t("房间", "rooms")} · ${npcCount} ${t("人物", "NPCs")}`;
    meta.appendChild(infoSpan);
    body.appendChild(meta);

    const btn = document.createElement("button");
    btn.className = "lobby-card__play-btn";
    btn.textContent = `▶ ${t("开始调查", "Begin Investigation")}`;
    btn.addEventListener("click", () => onStartWorld(pack.meta.id));
    body.appendChild(btn);

    card.appendChild(body);
    container.appendChild(card);
  }
}

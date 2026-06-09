import type { WorldState } from "@shared";
import type { Translator } from "../i18n";
import { UI } from "../i18n";

export function showEnding(
  tr: Translator,
  gs: WorldState,
  onBackToLobby: () => void,
  onPlayAgain: () => void,
): void {
  document.getElementById("game")!.classList.add("hidden");
  document.getElementById("end-screen")!.classList.remove("hidden");

  const eid = gs.endingId as string;
  document.getElementById("ending-title")!.textContent = tr.ending(eid);
  document.getElementById("ending-summary")!.textContent = tr.endingSummary(eid);

  const html = gs.consequenceIds.map((c) => `<li>${tr.consequence(c)}</li>`).join("");
  document.getElementById("ending-consequences")!.innerHTML = html
    ? `<h3 style="color:var(--text-accent);margin-top:1rem">${UI.endingConseq()}</h3><ul style="list-style:none;padding:0">${html}</ul>`
    : "";

  // Update buttons
  const restartBtn = document.getElementById("restart-btn")!;
  restartBtn.textContent = UI.playAgain();
  restartBtn.onclick = onPlayAgain;

  const backBtn = document.getElementById("back-to-lobby-btn")!;
  backBtn.textContent = UI.backToLobby();
  backBtn.onclick = onBackToLobby;
}

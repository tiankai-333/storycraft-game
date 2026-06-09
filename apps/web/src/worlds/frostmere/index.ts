import { frostmereAdventure } from "@game-runtime";
import { frostmereMeta } from "./meta";
import { frostmereTranslations } from "./translations";
import { frostmereNpcScripts } from "./scripts";
import type { WorldPack } from "../world-registry";

export const frostmerePack: WorldPack = {
  meta: frostmereMeta,
  adventure: frostmereAdventure,
  translations: frostmereTranslations,
  npcScripts: frostmereNpcScripts,
};

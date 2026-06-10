/**
 * Assemble the frostmere WorldPack for CLI use.
 * Re-exports data from packages and web world definitions.
 */
import { frostmereAdventure } from "@game-runtime";
import { frostmereMeta } from "../../web/src/worlds/frostmere/meta";
import { frostmereTranslations } from "../../web/src/worlds/frostmere/translations";
import { frostmereNpcScripts } from "../../web/src/worlds/frostmere/scripts/index";
import type { WorldPack } from "../../web/src/world-registry";

export const frostmerePack: WorldPack = {
  meta: frostmereMeta,
  adventure: frostmereAdventure,
  translations: frostmereTranslations,
  npcScripts: frostmereNpcScripts,
};

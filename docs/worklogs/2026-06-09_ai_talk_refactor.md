# AI Talk Refactor — 2026-06-09

## Summary

Refactored AI capabilities from "narrate every command" to "NPC free-form dialogue only".
Normal commands (look/search/take/inventory/go/use/accuse) now display raw game-runtime output instantly.
AI is invoked exclusively for NPC free-form conversation via the new `DialogueEngine`.

## Deleted / Disabled AI Narrative Path

- **Removed**: `engine.narrate()` call in `apps/web/src/screens/game.ts` `executeAndRender()`.
  Previously, every command result was fed through `NarrativeEngine.narrate()` for AI narration.
  This path is now completely removed. Normal commands display `result.message` directly.
- **Retained**: `NarrativeEngine` class and all its infrastructure remain in `packages/ai-narrative/`
  for potential future use and for the new `DialogueEngine` which shares the same provider.
- **Retained**: `NarrativeEngine` is still initialized in `initEngine()` — it is not called
  for any command but remains available.

## New Files

### Dialogue module (`packages/ai-narrative/src/dialogue/`)

| File | Purpose |
|------|---------|
| `types.ts` | NpcScript, NpcSecret, ConversationExchange, DialogueContext, DialogueRequest, DialogueResult, DialogueAiResponse |
| `prompts.ts` | Builds EN/ZH system + user prompts for NPC dialogue with hard rules, persona, knowledge, secrets, ignorance, relationships |
| `validation.ts` | JSON parsing, structural validation, gate trigger validation, GateTriggerReviewer (prevents false triggers on greetings/short input/low confidence) |
| `engine.ts` | DialogueEngine class — initialize/dispose/isAiAvailable/handleFreeFormDialogue. Reuses NarrativeProvider. Returns DialogueResult. |
| `index.ts` | Re-exports all dialogue types and classes |

### NPC Scripts (`apps/web/src/worlds/frostmere/scripts/`)

| File | Purpose |
|------|---------|
| `mina.ts` | Mina Arlen script — persona, knowledge (household, night routine, Theo, Vale, layout), secrets (topic_mina_alden, topic_mina_bell, topic_mina_key) |
| `theo.ts` | Theo Rusk script — persona, knowledge (clockwork, Alden's promise, workshop, bell mechanism, alibi), secrets (topic_theo_designs, topic_theo_gloves, topic_theo_ledger, topic_theo_mercy) |
| `vale.ts` | Captain Vale script — persona, knowledge (duties, body, road crew, procedure), secrets (topic_vale_report, topic_vale_rush) |
| `index.ts` | Assembles `frostmereNpcScripts` record |

### Documentation

| File | Purpose |
|------|---------|
| `docs/worklogs/2026-06-09_ai_talk_refactor.md` | This file |

## Modified Files

| File | Changes |
|------|---------|
| `packages/ai-narrative/src/index.ts` | Added dialogue module exports (DialogueEngine, NpcScript, etc.) |
| `apps/web/src/world-registry.ts` | Added `NpcScript` import, added `npcScripts?: Record<string, NpcScript>` to `WorldPack` |
| `apps/web/src/worlds/frostmere/index.ts` | Import and attach `frostmereNpcScripts` to `frostmerePack` |
| `apps/web/src/screens/game.ts` | Phase 1: Removed `engine.narrate()` from `executeAndRender()`. Phase 5: Added DialogueEngine init, conversation history, handleAiDialogue, isProcessing guard, free input in NPC panel. Fixed talk auto-fill NPC. |
| `apps/web/src/style.css` | Added `.npc-free-input`, `.npc-send-btn` styles |

## Invariants

1. **No AI for normal commands** — look/search/take/inventory/go/use/accuse never call AI.
2. **AI only for NPC dialogue** — `DialogueEngine.handleFreeFormDialogue()` is the sole AI call path.
3. **AI cannot modify game state** — DialogueEngine returns candidate `triggeredTopicGateId`; game-runtime `executeCommand(talk)` handles all state mutations.
4. **game-runtime and shared untouched** — No changes to `packages/game-runtime/` or `packages/shared/`.
5. **Graceful degradation** — No API key → passthrough → fixed topic buttons only. AI fails → no crash, no state corruption.
6. **Provenance explicit** — AI dialogue shows ✦ badge. Normal commands show none.
7. **NPC scripts use real topicGateIds** — topic_mina_alden, topic_mina_bell, topic_mina_key, topic_theo_designs, topic_theo_gloves, topic_theo_ledger, topic_theo_mercy, topic_vale_report, topic_vale_rush. No new topicGates were created.

## Verification Results

- `npx tsc --noEmit` — **passed** (0 errors)
- `cd apps/web && npx vite build` — **passed** (57 modules, 190KB JS, 11KB CSS, 398ms)

## Known Issues

1. **AI language mixing**: The AI may respond in English even when the game language is Chinese,
   depending on the model's compliance with the language instruction. The prompt explicitly
   requests the target language but enforcement is not guaranteed.
2. **GateTriggerReviewer keyword matching**: The reviewer uses simple keyword overlap to check
   relevance. This may miss semantic matches or false-positive on common words. Could be
   improved with more sophisticated NLP in the future.
3. **Conversation history is session-only**: History is stored in a JS Map and resets on page
   reload. This is acceptable for the current scope.
4. **NPC name in prompts hardcoded**: The dialogue prompts module has NPC name/role inside the
   NpcScript object, which is a slight redundancy with the adventure definition. This is
   acceptable because the NpcScript is the character bible and needs to be self-contained.
5. **DialogueEngine maxTokens**: The provider is configured with `maxTokens: 300` (from the
   narration config). For dialogue, a higher limit (e.g., 500) might be better to allow longer
   NPC responses. This can be tuned later.

## Next Steps

1. Test with actual API key and verify AI dialogue quality
2. Tune maxTokens for dialogue responses
3. Consider adding temperature override for dialogue (may want more creative responses)
4. Add dialogue-specific audit log queries for debugging
5. Consider i18n for NPC script content (currently English-only knowledge base)
6. Explore multi-turn dialogue memory improvements

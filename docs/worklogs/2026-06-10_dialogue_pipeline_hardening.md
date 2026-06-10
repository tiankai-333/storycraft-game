# Dialogue Pipeline Hardening — 2026-06-10

## Summary

Refactored the AI dialogue pipeline from an **"AI decides"** model to a **"candidate-signals"** model: the AI proposes actions, a policy layer reviews them, and only the deterministic runtime executes state changes. Removed post-hoc sanitization in favor of prompt-level prevention. Extracted a 423-line validation monolith into four single-responsibility modules. Added `adjust_trust` as a runtime command and `grantsItemIds` / `item_obtained` for direct item granting.

**Stats:** 29 files changed, +326 / −525 lines (uncommitted working-tree diff). 334 tests passing, 0 failures.

---

## Motivation

The previous AI dialogue pipeline had three structural problems:

1. **AI could directly change game state.** Fields like `trustDelta`, `triggeredTopicGateId`, and trust signals were treated as executable instructions from the AI. The AI could hallucinate trust changes or item grants that the runtime would blindly apply.
2. **Post-hoc sanitization was fragile.** Two regex-based sanitizers (`sanitizeDialogueLeakage`, `sanitizePrivateKnowledgeLeakage`) tried to scrub leaked secrets from AI output. This was a losing battle — the AI had already seen the secrets and could paraphrase them.
3. **Monolithic validation.** The 423-line `validation.ts` combined JSON parsing, structural validation, gate review, keyword expansion, and two sanitization passes. Each concern was entangled with the others.

---

## Architectural Changes

### 1. Candidate-Signals Model

The AI response type (`DialogueAiResponse`) was rewritten to use candidate semantics:

| Old Field | New Field | Change |
|---|---|---|
| `triggeredTopicGateId` | `candidateGateId` | AI proposes; policy decides |
| `trustDelta` | *(removed)* | Trust is no longer the AI's job |
| `confidence` (optional) | `gateConfidence` (required) | Always present, scoped to gate |
| `matchedEvidence` (optional) | `gateEvidence` (required) | Always present |
| *(none)* | `candidateActionHint` | AI can suggest `"item_given"`, `"access_granted"`, etc. |

The `DialogueResult` type retains a `@deprecated triggeredTopicGateId` that maps from `candidateGateId` for backward compatibility.

### 2. Prevention over Sanitization

**Removed:**
- `sanitizeDialogueLeakage()` — regex-based secret-leak scrubbing
- `sanitizePrivateKnowledgeLeakage()` — blocked private knowledge at trust < 1

**Replaced by:**
- The system prompt now **conditionally includes** `privateKnowledge` based on `currentTrust`. At trust 0, private knowledge is simply omitted from the prompt — the AI never sees it, so it cannot leak it.
- `gated secrets` exposed to the AI are filtered to only those whose runtime conditions (trust, inventory, clues) are currently met.

### 3. Single-Responsibility Module Extraction

The 423-line `dialogue/validation.ts` monolith was split into four focused modules:

| New Module | Responsibility | Lines |
|---|---|---|
| `parse.ts` | AI response JSON parsing (markdown stripping, truncation handling, old→new field migration) | ~139 |
| `schema.ts` | Pure structural normalization (clamp lengths, null invalid fields, default confidence). No game-state awareness. | ~35 |
| `gate-review.ts` | Gate trigger review — keyword relevance check, evidence quality check. Uses explicit `triggerKeywords`/`triggerPhrases`. | ~143 |
| `prompt/` (3 files) | System prompt (EN/ZH), user prompt, gated-secret formatting | ~235 |

**Also deleted** (package root, no longer needed):
- `src/engine.ts` — the general-purpose `NarrativeEngine` (173 lines)
- `src/prompts.ts` — narrative prompt builders (159 lines)
- `src/validation.ts` — narrative-level validation (138 lines)

The `ai-narrative` package is now dialogue-only.

### 4. New Pipeline Data Flow

```
Player input
  │
  ▼
DialogueEngine.handleFreeFormDialogue()
  ├── 1. buildNpcDialoguePrompt()    → prompt/ modules
  │       (trust-gated private knowledge)
  ├── 2. provider.call()             → raw AI text
  ├── 3. parseAiJson()               → parse.ts
  │       (handles old + new field names)
  ├── 4. validateDialogueResponse()  → schema.ts
  │       (pure structure, no game-state)
  ├── 5. reviewGateTrigger()         → gate-review.ts
  │       (keyword relevance + evidence quality)
  └── 6. Return DialogueResult with candidate signals
          │
          ▼
Web DialogueService (apps/web/src/services/)
  ├── dialogue-intent.ts  → classify player intent (greeting/question/etc.)
  ├── dialogue-policy.ts  → accept or reject candidate gate
  └── if accepted: executeCommand() → deterministic runtime
```

---

## New Features

### `adjust_trust` Command

**File:** `packages/game-runtime/src/commands/adjustTrust.ts` (new)

A programmatic command that changes NPC trust directly. Unlike trust changes via `talk` (which require NPC proximity and spend a turn), `adjust_trust`:
- Takes `npcId` (exact ID) and `trustDelta` (signed number)
- Does not spend a turn (`turnSpent: false`)
- Does not require NPC proximity
- Produces a `trust_changed` event
- Is intended for the runtime/policy layer, not player input

### `grantsItemIds` and `item_obtained`

**Problem:** Mina giving the player a key used `revealsItemIds`, which only puts items in the scene — the player still had to manually `take` them. This was wrong for NPC gifts.

**Solution:** A new two-tier item system on `TopicGateDefinition`:

| Field | Behavior |
|---|---|
| `revealsItemIds` | Items appear in scene; player must `take` |
| `grantsItemIds` | Items go directly into inventory |
| Event: `item_discovered` | Emitted for revealed items |
| Event: `item_obtained` (new) | Emitted for granted items |
| Event: `item_taken` | Emitted when player picks up a discovered item |

### Web Service Layer

Three new files in `apps/web/src/services/`:

| File | Responsibility |
|---|---|
| `dialogue-intent.ts` | Rule-based intent classifier (greeting/smalltalk/question/request/evidence_presenting/unknown). Covers EN + CN inputs. Prevents greetings from triggering gates. |
| `dialogue-policy.ts` | Central gate review: greetings/smalltalk never trigger gates; candidate must match valid gate set and current NPC; detects state claims from AI. |
| `dialogue-service.ts` | Orchestrator: builds context → checks 30s provider-failure cooldown → calls AI → classifies intent → runs policy → applies accepted gate via runtime. |

---

## Bug Fixes

| Issue | Fix |
|---|---|
| Short Chinese inputs like "钥匙"/"上楼"/"钟声" were misclassified as `greeting` by the gate reviewer | Intent classification moved to rule-based `dialogue-intent.ts`; gate review now only checks keyword relevance |
| AI unavailable + selected NPC degraded to `look` instead of showing NPC panel | AI-unavailable path now renders fixed topic buttons via `dialogueService.isAiAvailable()` check |
| Provider/dialogue errors not recorded in narrative history | Error messages now written to `narHistory` so language replay doesn't lose them |
| `result.source === "passthrough"` triggered a brittle keyword-matching fallback | Passthrough path removed entirely; AI unavailable returns `source: "error"` with a localized message; `aiSource` type narrowed to `"ai" \| "error"` |

---

## Deleted Code

| File | Lines | Reason |
|---|---|---|
| `packages/ai-narrative/src/engine.ts` | 173 | `NarrativeEngine` superseded by `DialogueEngine` |
| `packages/ai-narrative/src/prompts.ts` | 159 | Narrative prompts; only dialogue prompts survive |
| `packages/ai-narrative/src/validation.ts` | 138 | Narrative validation removed with `NarrativeEngine` |
| `packages/ai-narrative/src/dialogue/validation.ts` | 423 | Split into `parse.ts`, `schema.ts`, `gate-review.ts` |

---

## Files Changed

### Runtime layer (`packages/game-runtime/`, `packages/shared/`)

| File | Change |
|---|---|
| `commands/adjustTrust.ts` | **New.** Standalone trust command |
| `commands/talk.ts` | Added `grantsItemIds` → inventory + `item_obtained` events |
| `executeCommand.ts` | Added `adjust_trust` dispatch case |
| `content/frostmere.ts` | Mina key gate: `revealsItemIds` → `grantsItemIds` |

### Shared types (`packages/shared/`)

| File | Change |
|---|---|
| `commands.ts` | Added `npcId?`, `trustDelta?` to `CommandInput`; `adjust_trust` to `CommandVerb` |
| `events.ts` | Added `item_obtained` to `EventType` |
| `types.ts` | Added `grantsItemIds?` to `TopicGateDefinition` |

### AI dialogue (`packages/ai-narrative/`)

| File | Change |
|---|---|
| `dialogue/engine.ts` | Pipeline simplified: removed sanitization steps, trust logic |
| `dialogue/types.ts` | Candidate-signal field names; removed `trustSignal`/`trustEvidence`/`trustDelta` |
| `dialogue/prompts.ts` | 226→32 lines; facade delegating to `prompt/` subdirectory |
| `dialogue/index.ts` | Re-exports updated |
| `dialogue/parse.ts` | **New.** JSON parsing with old/new field compat |
| `dialogue/schema.ts` | **New.** Structural normalization only |
| `dialogue/gate-review.ts` | **New.** Keyword + evidence review with explicit triggers |
| `dialogue/prompt/` | **New directory.** `system-prompt.ts`, `user-prompt.ts`, `gated-secrets.ts` |
| `index.ts` | Narrative engine exports removed; dialogue-only exports |
| `engine.ts` | **Deleted.** `NarrativeEngine` |
| `prompts.ts` | **Deleted.** Narrative prompts |
| `validation.ts` | **Deleted.** Narrative validation |
| `dialogue/validation.ts` | **Deleted.** Monolith → 4 focused modules |

### Web app (`apps/web/`)

| File | Change |
|---|---|
| `screens/game.ts` | −180 lines; inline dialogue logic → `DialogueService` call |
| `services/dialogue-intent.ts` | **New.** Intent classification |
| `services/dialogue-policy.ts` | **New.** Gate policy review |
| `services/dialogue-service.ts` | **New.** Dialogue orchestrator |
| `worlds/frostmere/scripts/mina.ts` | Added `triggerKeywords` |
| `worlds/frostmere/scripts/theo.ts` | Added `triggerKeywords` |
| `worlds/frostmere/scripts/vale.ts` | Added `triggerKeywords` |

### Tests

| File | Change |
|---|---|
| `packages/ai-narrative/test/dialogue-intent.test.ts` | Updated for new intent classifier |
| `packages/ai-narrative/test/dialogue-policy.test.ts` | Simplified; removed keyword-matching tests |
| `packages/ai-narrative/test/gate-review.test.ts` | Removed short-input/greeting tests (moved to intent) |
| `packages/ai-narrative/test/parse.test.ts` | New field name tests + old-field compat |
| `packages/ai-narrative/test/schema.test.ts` | Simplified; structural tests only |
| `packages/game-runtime/test/talk.test.ts` | Added `grantsItemIds` + `item_obtained` tests |

---

## Verification

```
npm run typecheck    → clean
npm test             → 334 passed, 0 failed
npm run dev          → http://127.0.0.1:5173/
  - Page title: StoryCraft
  - First screen renders content
  - Browser console errors: 0
```

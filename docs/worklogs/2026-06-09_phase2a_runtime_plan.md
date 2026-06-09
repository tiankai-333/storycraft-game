# Worklog: Phase 2A Runtime Implementation Plan

Date: 2026-06-09

## Goal

Create a decision-complete implementation plan for Phase 2B: the minimum non-AI runtime for the Frostmere demo.

This round was planning only. It did not enter Phase 2B, write TypeScript or TSX source, create frontend files, install dependencies, or modify parent workspace directories.

## This Round's Outputs

Created:

- `docs/RUNTIME_IMPLEMENTATION_PLAN.md`
- `docs/worklogs/2026-06-09_phase2a_runtime_plan.md`

## Files Involved

Read for context:

- `docs/GAME_DESIGN_PHASE1.md`
- `docs/DATA_MODEL_PHASE1.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `AGENTS.md`

Written:

- `docs/RUNTIME_IMPLEMENTATION_PLAN.md`
- `docs/worklogs/2026-06-09_phase2a_runtime_plan.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### TypeScript Runtime Package

The plan chooses TypeScript for `packages/shared` and `packages/game-runtime`.

Reason:

- The architecture already separates shared contracts and runtime logic.
- TypeScript gives the next phase type-checked command, state, event, and content contracts.

### Minimal Workspace Setup

The plan says Phase 2B should use any existing package manager/workspace style if present, and only add minimal root/package config if needed to run tests.

Reason:

- The runtime needs executable tests.
- The project should not spend the first implementation step on monorepo framework decisions.

### Node Test Runner First

The plan prefers Node's built-in test runner, with Vitest only if the repo already has it or if setup friction makes Node harder.

Reason:

- The runtime is pure logic.
- Avoiding unnecessary dependencies keeps Phase 2B small.

### Static TypeScript Content

The plan chooses a static TypeScript object for the Phase 1A content in Phase 2B.

Reason:

- The Phase 1B data model recommended this path.
- It gives type checking and avoids JSON/YAML/Markdown parser work before playability.

### Small Public API

The plan centers Phase 2B around:

- `createInitialState`
- `executeCommand`
- `getVisibleState`

Reason:

- These are enough for tests, a later CLI harness, and the future web UI.
- They keep parser, UI, and AI concerns outside the first runtime slice.

### Deterministic Events and Consequences

The plan requires every command to produce structured events and update an append-only consequence ledger when appropriate.

Reason:

- This satisfies the architecture's event flow.
- It prepares for future AI narration without letting AI own facts.

## Tradeoffs

### Node Test Runner vs. Vitest

Node test runner:

- Fewer dependencies.
- Good enough for pure runtime tests.
- May need some TypeScript execution setup.

Vitest:

- Smooth TypeScript experience.
- Adds or depends on a test dependency.

Decision:

- Prefer Node test runner unless existing repo setup makes Vitest the simpler established choice.

### Static TypeScript Content vs. External Data

Static TypeScript:

- Type-safe and test-friendly.
- Less friendly for non-engineer editing.

JSON/YAML/Markdown-derived data:

- More portable for content authoring.
- Requires parser and validation choices.

Decision:

- Use static TypeScript object for Phase 2B, then revisit external content formats after the demo is playable.

### Declarative Rules vs. Direct Runtime Logic

Declarative rules:

- Clearer for content and future validation.
- Can slow down tiny implementation work.

Direct runtime logic:

- Fast for the first slice.
- Risks hiding content-specific behavior in code.

Decision:

- Use named rule IDs or simple condition descriptors for content-facing checks, and implement unique rules as named runtime helpers with tests.

### Parser Scope

Structured command input:

- Easier to test and implement.
- Less player-like.

Raw text parser:

- Closer to eventual gameplay.
- Can become a distraction.

Decision:

- `executeCommand` should accept structured command input. A tiny `parseCommand` helper is optional, but not central to acceptance.

## Validation Method

Validated the plan against the requested Phase 2A coverage list:

- Technical choices.
- Package/workspace and test runner decision.
- Planned file structure for `packages/shared` and `packages/game-runtime`.
- Public API.
- Data/content approach for Phase 2B.
- Behavior for all 8 commands.
- State transition rules.
- Ending resolution for all 3 endings.
- Event and consequence ledger.
- Required tests.
- Acceptance criteria for a playable non-AI runtime.
- Non-goals.

Also checked that this round remained documentation-only and did not create `.ts` or `.tsx` files.

## Result

Phase 2A runtime implementation plan is complete and ready for review.

Acceptance checklist result:

- Technical choice: Pass.
- File structure plan: Pass.
- Public API: Pass.
- Data/content approach: Pass.
- 8-command behavior: Pass.
- State transition rules: Pass.
- Ending resolution: Pass.
- Event/consequence ledger: Pass.
- Tests: Pass.
- Acceptance criteria: Pass.
- Non-goals: Pass.
- No source/frontend/dependency changes: Pass.

## Remaining Questions

- Should Phase 2B add a tiny `parseCommand` helper, or keep tests and runtime API fully structured for the first implementation?
- If no package setup exists, should Phase 2B prefer Node test runner with TypeScript transpilation or Vitest for lower setup friction?
- Should `look` and `inventory` append events to the persistent event log, or only return transient observations?
- Should evidence presentation be modeled through `use <item> <npc>` or through `talk <npc> <topic>` only?
- Should the mercy ending trigger through `accuse theo mercy`, final `talk theo mercy`, or both?

## Acceptance Criteria

This planning round should be accepted if:

- `docs/RUNTIME_IMPLEMENTATION_PLAN.md` gives the next Codex enough detail to implement Phase 2B directly.
- The plan does not implement Phase 2B.
- The plan preserves exactly 8 commands and no `wait`.
- The plan keeps runtime facts deterministic and AI-free.
- The plan excludes web, database, save/load, AI, and generic engine work.
- The worklog records goal, outputs, files, validation, result, open questions, next recommendation, design decisions, tradeoffs, and acceptance criteria.

## Next Step Recommendation

Stop here for review.

After acceptance, Phase 2B can implement the minimum non-AI runtime following `docs/RUNTIME_IMPLEMENTATION_PLAN.md`. Do not begin implementation until this plan is accepted.

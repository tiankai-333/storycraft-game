# StoryCraft Game Agent Rules

This is the active mainline project.

## Active Goal

Build a playable web game with meaningful AI participation.

Secondary goal: extract the reusable AI participation layer as an AI Narrative Engine after the first playable slice creates real constraints.

## Read First

```text
README.md
docs/PROJECT_BRIEF.md
docs/ARCHITECTURE.md
docs/ROADMAP.md
docs/CODEX_DESIGNER.md
```

## Reference Boundaries

Do not read or use parent archived material by default:

```text
../docs/_archive_do_not_use_by_ai/
```

Do not modify these parent workspace directories unless the user explicitly asks:

```text
../StoryCraft/
../apps/
../data/
../tools/
../evennia/
../yhmud/
```

## Product Rule

The game runtime decides facts.

The AI narrative layer expresses, reacts, summarizes, and reviews.

AI must not be the only source of room existence, exits, inventory, quest completion, action legality, NPC life/death state, or resource changes.

## Current Priority

Build the first playable slice:

```text
5-8 rooms
3 NPCs
5 items
1 main quest
3-5 clues
2-3 endings
6-8 commands
browser-playable
```

Do not build a generic engine before the first small game is fun.

## A2A Workflow

When operating in a multi-agent session, read your role file:

- `docs/a2a/PLANNER.md` — planning, task creation, review
- `docs/a2a/EXECUTOR.md` — implementation, testing, feedback

Read the shared queue first: `docs/a2a/QUEUE.md`

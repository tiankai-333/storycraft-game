# Architecture

## Folder Shape

```text
storycraft-game/
  apps/
    web/
  packages/
    game-runtime/
    ai-narrative/
    shared/
  content/
    demo-adventure/
  docs/
```

## Responsibilities

### `apps/web`

The playable browser UI.

- scene display
- command input
- choices
- inventory
- clue ledger
- NPC trust
- consequence ledger
- AI narration display

The web app does not own world truth.

### `packages/game-runtime`

The factual game engine.

- room graph
- exits
- objects
- NPCs
- inventory
- commands
- quest state
- clue state
- resources
- action validation
- state transitions

This package should be playable without AI.

### `packages/ai-narrative`

The AI participation layer.

- event-to-narration
- constrained NPC dialogue
- memory summaries
- narrative consistency review
- clue/foreshadowing presentation

It cannot mutate game state directly.

### `packages/shared`

Shared schemas and types.

- command contracts
- game state snapshots
- event records
- consequence ledger
- AI input/output contracts

### `content/demo-adventure`

The first game content pack.

- rooms
- NPCs
- items
- clues
- quest logic
- endings

## Turn Flow

```text
Player input
  -> command parser
  -> runtime validates action
  -> runtime applies state changes
  -> runtime emits structured events
  -> AI narrative layer generates expression
  -> web shows narration + facts + consequences
```

## Key Design Rule

Rules and state first. AI expression second.

The runtime should still produce a complete but plain game if the AI provider is disabled.

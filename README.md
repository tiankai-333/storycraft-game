# StoryCraft Game

New mainline for the playable web game.

Goal:

```text
Build a fun web game first.
Keep the architecture shaped so the AI narrative layer can later become reusable.
```

This directory is intentionally separate from the old `StoryCraft/` prototype.

## Structure

```text
storycraft-game/
  apps/
    web/                  playable web game
  packages/
    game-runtime/          rooms, commands, rules, quests, state
    ai-narrative/          narration, dialogue, review, memory summaries
    shared/                shared contracts and schemas
  content/
    demo-adventure/        first tiny playable adventure
  docs/                    project-specific notes
```

## Development Rule

The first milestone is not a generic engine.

The first milestone is a small playable game:

```text
5-8 rooms
3 NPCs
5 items
1 main quest
3-5 clues
2-3 endings
6-8 commands
```

The runtime owns facts. AI expresses and reacts.

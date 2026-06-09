# Project Brief

## Final Goal

Create a web game that is genuinely fun to play and uses AI as a meaningful participant.

## Secondary Goal

Extract the reusable AI participation layer into an AI Narrative Engine that can later work with different game runtimes.

## Problem We Are Solving

The old StoryCraft prototype could run, but it felt like AI chat with a game background. It did not have enough game structure:

- weak goals
- weak consequences
- weak world facts
- weak command/action model
- too much reliance on AI continuation

This project fixes that by starting with a structured, playable game runtime.

## Product Shape

```text
Playable web game
+ structured game runtime
+ AI narrative layer
```

## First Vertical Slice

Suggested premise:

```text
Seven-turn mystery: the master died on a snowy night.
```

Minimum scope:

- 5-8 rooms
- 3 NPCs
- 5 items
- 1 main quest
- 3-5 clues
- 2-3 endings
- 6-8 commands

## Experience Goals

The player should feel:

- I have a clear objective.
- My choices cost something.
- The world remembers what I did.
- NPCs react to me.
- Clues matter.
- I want to see the ending.

## Non-Goals

- full yhmud import
- yhmud asset browser
- generic engine before first playable slice
- old StoryCraft patchwork
- AI as sole world authority

# Roadmap

## Phase 1 - Paper Game Design

Output:

- map of 5-8 rooms
- NPC roster
- item list
- clue list
- command list
- resource model
- ending conditions

Acceptance:

- the full game can be played on paper
- every major choice has a cost or consequence

## Phase 2 - Non-AI Runtime

Output:

- command parser
- action resolver
- world state
- inventory
- clue ledger
- NPC trust
- quest state

Acceptance:

- one full session is playable without AI
- at least two endings are reachable
- state changes are deterministic and testable

## Phase 3 - Web Playable Slice

Output:

- browser UI
- command input
- scene panel
- status panels
- consequence ledger

Acceptance:

- player can start and finish the game in the browser
- UI clearly shows what changed after each action

## Phase 4 - AI Narrative Layer

Output:

- structured event to narration
- NPC dialogue generator
- memory summary
- narrative review
- provider error handling

Acceptance:

- AI improves presentation
- AI cannot invent state changes
- failed AI calls do not corrupt the game state

## Phase 5 - Engine Extraction

Output:

- public `ai-narrative` API
- provider abstraction
- schemas
- tests
- integration example

Acceptance:

- another game runtime can call the AI narrative layer without depending on this demo adventure.

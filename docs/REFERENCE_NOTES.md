# Reference Notes

These are distilled references. Do not read parent archives by default.

## evennia

Use as architecture reference only.

Useful ideas:

- object-centric world model
- rooms, exits, characters, objects
- command system
- separation between world objects and player commands
- runtime scripts/events

Do not copy:

- full framework architecture
- server/process model
- database assumptions

## yhmud

Use as gameplay/content reference only.

Useful ideas:

- room descriptions and exits
- objects placed in rooms
- NPC and item density
- command vocabulary
- sect/faction/skill flavor
- quest clue patterns

Do not do:

- full import
- asset browser as main product
- direct dependency on LPC source format

## Old StoryCraft Prototype

Use as lessons learned.

Reusable ideas:

- LLM provider pattern
- prompt builder ideas
- memory and relationship concepts
- review pipeline concept
- FastAPI/SSE experience

Do not continue:

- AI-chat-first gameplay loop
- mock fallback hiding live failures
- broad architecture before a fun playable slice

## Core Lesson

MUD references solve the missing game structure. AI solves expression, reactivity, and narrative intelligence. The product needs both, in that order.

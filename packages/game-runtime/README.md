# Game Runtime

This package will own the game facts.

Responsibilities:

- rooms and exits
- player state
- NPC state
- inventory
- commands
- rules
- quest and clue state
- action validation
- state transitions
- structured event output

The runtime should be playable without AI. If this layer is not fun, AI will only make the emptiness more verbose.

Initial command set:

```text
look
go
talk
ask
inspect
take
use
status
```

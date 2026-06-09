# Worklog: Phase 1A Paper Game Design

Date: 2026-06-09

## Goal

Produce the Phase 1A paper design for the first StoryCraft Game demo, limited to design documents only.

The requested first-round acceptance criteria were:

- A clear demo name and genre.
- 5-8 rooms.
- 3 NPCs.
- 5 items.
- 3-5 clues.
- 1 main quest.
- 2-3 endings.
- 6-8 commands.
- Each key choice has a cost or consequence.
- A worklog under `storycraft-game/docs/worklogs/`.

## This Round's Outputs

Created:

- `docs/GAME_DESIGN_PHASE1.md`
- `docs/worklogs/2026-06-09_phase1_paper_design.md`

No runtime code, frontend code, package configuration, or content data files were implemented.

## Files Involved

Read for project direction:

- `README.md`
- `AGENTS.md`
- `docs/PROJECT_BRIEF.md`
- `docs/ARCHITECTURE.md`
- `docs/ROADMAP.md`
- `docs/CODEX_DESIGNER.md`

Written:

- `docs/GAME_DESIGN_PHASE1.md`
- `docs/worklogs/2026-06-09_phase1_paper_design.md`

Not read or modified:

- Parent `docs/_archive_do_not_use_by_ai/`
- Parent `StoryCraft/`
- Parent `apps/`
- Parent `data/`
- Parent `tools/`
- Parent `evennia/`
- Parent `yhmud/`

## Design Decisions

### Demo Title and Topic

Selected **The Last Bell at Frostmere House**, a snowbound manor mystery.

Reason:

- Matches the project brief's suggested "master died on a snowy night" direction.
- Naturally supports a compact map, suspects, clues, time pressure, and multiple endings.
- Gives the eventual AI narrative layer room to add atmosphere and NPC texture without owning facts.

### Scope

Designed:

- 7 rooms: Great Hall, Study, Servants' Hall, Bell Tower, Winter Garden, Coach Yard, Gatehouse.
- 3 NPCs: Mina Arlen, Theo Rusk, Captain Rowan Vale.
- 5 items: Brass Service Key, Torn Ledger Page, Soot-Stained Gloves, Vial of Laudanum, Cracked Bell Clapper.
- 5 clues: stopped watch, servant bell timing, stolen design motive, garden route, drugging evidence.
- 1 main quest: determine what happened to Alden Voss before dawn.
- 3 endings: best formal truth, failed/weak case, ambiguous mercy confession.
- 8 commands: look, go, search, take, talk, use, inventory, accuse.

Reason:

- The count sits near the upper edge of the requested range but remains small enough for a first deterministic runtime.
- Seven rooms give real navigation without creating a generic engine problem.
- Five clues allow endings to check proof quality instead of a single binary flag.

### Resource Model

Used an 8-turn dawn clock plus NPC trust and a consequence ledger. Movement, looking, taking discovered items, and inventory review are free; substantive investigation and resolution actions spend the clock.

Reason:

- Time makes investigation choices costly.
- Trust makes NPC interaction mechanically meaningful.
- A simple ledger gives future runtime and UI a clear way to show remembered choices.

### Mystery Solution

Theo Rusk is the factual killer. Mina is a morally suspicious but innocent protector of secrets. Captain Vale is institutional pressure.

Reason:

- Gives each NPC a different function: culprit, guarded witness, deadline pressure.
- Avoids making the player rely on AI improvisation to understand the case.
- Supports both formal justice and morally ambiguous mercy.

## Tradeoffs

### More Clues vs. Simpler Onboarding

The design uses 5 clues rather than 3.

Tradeoff:

- More clues create better deduction and ending checks.
- It increases content that Phase 1B must encode.

Decision:

- Keep 5 clues because a mystery needs enough evidence to make accusation quality meaningful.

### 8 Turns vs. 7 Turns

The design uses 8 investigation turns.

Tradeoff:

- 7 turns is punchier and matches the project brief's "seven-turn mystery" phrase.
- 8 turns is more forgiving for the first playable slice and supports one mistake.

Decision:

- Use 8 turns for the first paper design, with the option to tune down later after playtesting.

### Mercy Ending

Included an ambiguous mercy ending rather than only pass/fail law endings.

Tradeoff:

- It makes ending logic slightly more complex.
- It better demonstrates consequence-driven narrative choice.

Decision:

- Keep the mercy ending because it gives the player a meaningful final dilemma after solving the case.

## Validation Method

Validated the design against the Phase 1A acceptance checklist by count and by paper playability:

- Checked entity counts.
- Confirmed the main quest has clear completion conditions.
- Confirmed each key choice has a stated cost or consequence.
- Confirmed endings have deterministic conditions.
- Confirmed commands can cover movement, inspection, inventory, conversation, item use, and resolution.
- Confirmed the example best-case route can fit inside the 8-turn investigation clock when movement is free.
- Confirmed no code/runtime/frontend work was introduced.

## Result

Phase 1A design output is complete and ready for review.

Acceptance checklist result:

- Demo name and topic: Pass.
- 5-8 rooms: Pass, 7 rooms.
- 3 NPCs: Pass, 3 NPCs.
- 5 items: Pass, 5 items.
- 3-5 clues: Pass, 5 clues.
- 1 main quest: Pass.
- 2-3 endings: Pass, 3 endings.
- 6-8 commands: Pass, 8 commands.
- Key choices have costs/consequences: Pass.
- Worklog exists under `docs/worklogs/`: Pass.

## Remaining Questions

- Should the first implementation tune the time limit to 7 turns for a sharper "seven-turn mystery" identity?
- Should the mercy ending allow Theo to escape, or should it become a negotiated surrender?
- Should Mina's hidden backstory be optional flavor or a required branch for the best ending?
- Should `take` remain free, or should taking sensitive/private items cost a turn in Phase 1B?

## Acceptance Criteria for This Design

The design should be accepted if:

- A reviewer can play through the mystery on paper using only the design document.
- The solution is knowable from deterministic clues.
- At least two endings are clearly reachable.
- The runtime can later encode all facts without AI inventing state.
- The AI layer can later enhance narration while remaining subordinate to runtime facts.

## Next Step Recommendation

Stop here for review.

After acceptance, Phase 1B should convert this paper design into deterministic content/runtime data and tests. Do not begin Phase 1B until the Phase 1A design is approved.

## Acceptance Fix Record

Review fix date: 2026-06-09

Reason:

- The resource model listed `wait` as a turn-costing command even though the formal first-version command set is exactly 8 commands: `look`, `go`, `search`, `take`, `talk`, `use`, `inventory`, and `accuse`.

Change made:

- Removed `wait` from the turn-costing command list in `docs/GAME_DESIGN_PHASE1.md`.
- Added a clarification that there is no standalone `wait` command in the first version.
- Reworded the Gatehouse consequence so delay is caused by other turn-costing actions rather than an unimplemented command.

Result:

- The official command count remains 8.
- The resource model no longer references an unimplemented `wait` command.
- No runtime, frontend, data structure, README, AGENTS, or unrelated docs were changed.

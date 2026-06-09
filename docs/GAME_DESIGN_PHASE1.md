# Phase 1A Paper Game Design

## Demo Identity

Title: **The Last Bell at Frostmere House**

Genre: Snowbound manor mystery with light gothic tension.

Player role: A traveling junior magistrate trapped overnight at Frostmere House after the master's death.

Core fantasy: Investigate a compact manor, pressure suspects, spend scarce time, and decide what truth is worth before dawn.

Design target: A 20-30 minute playable paper demo that can later become the first browser-playable slice.

## Playable Premise

Master Alden Voss is found dead below the bell tower during a snowstorm. The household claims the tower door was locked from the inside. At dawn, the mountain road opens and the suspects can leave. The player has limited turns to gather clues, question NPCs, and choose an ending.

The factual solution: **Theo Rusk**, Alden's clockwork apprentice, killed Alden after learning Alden had stolen Theo's designs and planned to sell them. Theo staged the bell tower as a locked-room fall by using the cracked bell clapper and a service key. Mina hid one clue to protect her late sister's reputation. Captain Vale wants a quick arrest to preserve order.

## Scope Checklist

- Rooms: 7
- NPCs: 3
- Items: 5
- Clues: 5
- Main quest: 1
- Endings: 3
- Commands: 8

## Resource Model

### Time

The demo has **8 investigation turns** before dawn. Movement and review actions are free; only substantive investigation or resolution actions spend the dawn clock.

These commands cost 1 turn:

- `search`
- `talk`
- `use`
- `accuse`

These commands do not cost a turn:

- `go`
- `look`
- `take`
- `inventory`

There is no standalone `wait` command in the first version. Delay can still appear as a consequence of investigation choices, failed pressure, or endgame timing, but it is not part of the formal command set.

If time reaches 0 before a final decision, Captain Vale takes control and forces the weak-case ending.

### Trust

Each NPC has trust from 0 to 2.

- 0: guarded; gives only basic facts
- 1: cooperative; gives one useful detail
- 2: candid; reveals their hidden pressure or contradiction

Trust changes through choices. Pressing someone can reveal information but may lower trust.

### Consequence Ledger

The game records consequences as plain facts:

- `broke_mina_trust`
- `tipped_off_theo`
- `captain_rushed_case`
- `used_private_key`
- `spent_dawn_turn`
- `made_public_accusation`
- `offered_theo_mercy`

These facts influence endings and NPC reactions.

## Map

```text
                  [Bell Tower]
                       |
[Servants' Hall] - [Great Hall] - [Study]
                       |
                 [Winter Garden]
                       |
                  [Coach Yard]
                       |
                   [Gatehouse]
```

### Room 1: Great Hall

Purpose: Hub, victim display, initial suspects.

Description: A cold central hall with a covered body near the stair. Meltwater marks the floor. The tower door stands above the landing.

Exits:

- north: Bell Tower, locked until the brass service key is used
- east: Study
- west: Servants' Hall
- south: Winter Garden

Interactives:

- body
- stair
- tower door

Discoverable:

- Clue: broken watch stopped at 11:47
- NPC: Captain Vale starts here

Cost/consequence:

- Searching the body costs a turn but establishes time of death.
- Accusing from this room without at least 3 clues triggers the weak-case ending.

### Room 2: Study

Purpose: Motive room.

Description: Alden's private office. Ledgers are stacked beside a cold fireplace. A wall safe hangs open but empty.

Exits:

- west: Great Hall

Interactives:

- desk
- ledgers
- fireplace
- safe

Discoverable:

- Item: torn ledger page
- Clue: Alden planned to sell Theo's automaton designs

Cost/consequence:

- Taking the ledger page makes Theo defensive if shown too early.
- Searching the fireplace costs a turn and reveals burned contract ash only if the player has first found the torn ledger page.

### Room 3: Servants' Hall

Purpose: Mina's home ground and household secrets.

Description: A narrow warm room with drying coats, kitchen ledgers, and a servant bell board.

Exits:

- east: Great Hall
- north-east: Bell Tower service stair, locked

Interactives:

- coat hooks
- bell board
- kitchen ledger

Discoverable:

- NPC: Mina Arlen
- Item: brass service key, if Mina trusts the player or if the player searches after angering her
- Clue: servant bell rang from the tower after Alden was already dead

Cost/consequence:

- Asking Mina gently can raise trust, but costs a turn.
- Searching her room without permission finds the key but records `broke_mina_trust`.

### Room 4: Bell Tower

Purpose: Crime-scene truth room.

Description: A cramped tower chamber above the hall. The bell rope is frayed, the snow-choked window is latched, and metal fragments glitter near the platform.

Exits:

- south: Great Hall
- south-west: Servants' Hall service stair

Entry requirement:

- Use the brass service key or reach Mina trust 2.

Interactives:

- bell rope
- clapper mount
- window latch
- platform edge

Discoverable:

- Item: cracked bell clapper
- Clue: tower was staged; the lock could be reset from the service stair

Cost/consequence:

- Entering with Mina's permission preserves trust.
- Entering with the stolen key records `used_private_key`, which lets Captain Vale question the player's methods later.

### Room 5: Winter Garden

Purpose: Physical route and hidden trail.

Description: A glass-roofed conservatory choked with frost. Orange trees cast black shadows over snow tracked in from outside.

Exits:

- north: Great Hall
- south: Coach Yard

Interactives:

- snow trail
- broken planter
- glass door

Discoverable:

- Clue: narrow soot-marked footprints lead toward the Coach Yard, then double back
- Item: soot-stained gloves

Cost/consequence:

- Taking the gloves without confronting Theo keeps him calm.
- Showing the gloves to Theo before finding motive records `tipped_off_theo`; he hides the vial.

### Room 6: Coach Yard

Purpose: External pressure and disposal evidence.

Description: Coaches sit under drifts. A lantern burns in the stable arch though no one admits lighting it.

Exits:

- north: Winter Garden
- south: Gatehouse

Interactives:

- stable arch
- snowbank
- coach box

Discoverable:

- Item: vial of laudanum, unless Theo was tipped off
- Clue: the victim was drugged before the staged fall

Cost/consequence:

- Searching the snowbank costs a turn.
- If Theo was tipped off, this search finds only a crushed cork, producing a weaker clue.

### Room 7: Gatehouse

Purpose: Final threshold and pressure clock.

Description: The outer gate creaks in the wind. By dawn, the road crew will clear the pass and everyone can scatter.

Exits:

- north: Coach Yard

Interactives:

- gate
- road bell
- evidence satchel

Discoverable:

- NPC: Theo Rusk moves here if tipped off or if time is 1

Cost/consequence:

- Lingering here through other turn-costing actions lets the road open faster.
- Confronting Theo here can unlock the mercy ending if the player has 4 or more clues.

## NPC Roster

### Mina Arlen, Housekeeper

Public face: Loyal, grieving, strict about household privacy.

Private pressure: Alden ruined Mina's sister years ago. Mina hated him but did not kill him. She hides the service key because it implicates the servants' passage.

Trust path:

- Gain trust by asking about Alden's cruelty before accusing anyone.
- Lose trust by searching Servants' Hall without permission.

Useful reveals:

- Trust 1: Alden met Theo after supper.
- Trust 2: The servant bell rang from the tower after the body was already cold.

Choice cost:

- Respecting Mina costs a turn but gives a cleaner path to the tower.
- Violating her privacy saves dependency on trust but damages final credibility.

### Theo Rusk, Apprentice Clockmaker

Public face: Nervous, brilliant, deferential.

Private pressure: Alden stole Theo's designs and planned to sell them. Theo drugged Alden, staged the tower fall, and tried to burn the contract.

Trust path:

- Gain temporary cooperation by discussing his designs.
- Lose trust or trigger panic by showing incriminating evidence too early.

Useful reveals:

- Trust 1: Alden kept contracts in the Study safe.
- Trust 2: Alden threatened to send Theo away before dawn.

Choice cost:

- Pressing Theo may expose contradictions quickly but can remove the vial clue.
- Offering mercy at the end may reveal a confession but prevents the clean law ending.

### Captain Rowan Vale, Stranded Constable

Public face: Practical, impatient, obsessed with keeping order.

Private pressure: Vale wants the road open and a suspect named before local authorities arrive.

Trust path:

- Gain trust by sharing concrete clues.
- Lose trust by using stolen evidence or accusing without proof.

Useful reveals:

- Trust 1: The body bruising looks wrong for a simple fall.
- Trust 2: Vale admits the official report can include motive if the player can prove staging.

Choice cost:

- Cooperating with Vale strengthens formal endings but may rush the investigation.
- Defying Vale preserves independent judgment but makes a public accusation harder.

## Item List

### Brass Service Key

Found in Servants' Hall through Mina trust 2 or unauthorized search.

Use: Opens Bell Tower service stair.

Consequence: If stolen, records `used_private_key` and lowers Mina trust.

### Torn Ledger Page

Found in Study desk.

Use: Establishes motive; unlocks burned contract ash in fireplace search.

Consequence: Showing it to Theo too early records `tipped_off_theo`.

### Soot-Stained Gloves

Found in Winter Garden broken planter.

Use: Links a person moving through the garden to the staged route.

Consequence: Publicly confronting the wrong NPC with them lowers that NPC's trust.

### Vial of Laudanum

Found in Coach Yard snowbank unless Theo was tipped off.

Use: Proves Alden was drugged before the fall.

Consequence: Missing it does not block completion, but weakens the formal accusation.

### Cracked Bell Clapper

Found in Bell Tower.

Use: Shows the tower mechanism was tampered with and the fall was staged.

Consequence: Taking it creates noise in the tower; if Theo has not been confronted, he moves toward the Gatehouse.

## Clue List

### Clue 1: Watch Stopped at 11:47

Source: Search the body in Great Hall.

Meaning: Establishes the approximate death time.

Use: Contradicts Mina's first claim that she heard the bell at midnight.

### Clue 2: Servant Bell After Death

Source: Mina trust 2 or search the bell board in Servants' Hall.

Meaning: Someone staged activity in the tower after Alden died.

Use: Supports the locked-room staging theory.

### Clue 3: Stolen Design Motive

Source: Torn ledger page in Study.

Meaning: Alden was stealing Theo's work.

Use: Establishes Theo's motive.

### Clue 4: Soot-Marked Garden Route

Source: Search Winter Garden trail and gloves.

Meaning: Someone used the garden path and doubled back.

Use: Links Theo's workshop soot to the staged route.

### Clue 5: Drugged Before the Fall

Source: Vial in Coach Yard; weakened version is crushed cork if Theo was tipped off.

Meaning: Alden was incapacitated before the tower fall.

Use: Separates murder from accident.

## Main Quest

Quest: **Name what happened to Alden Voss before dawn.**

The player must choose one final resolution:

- Accuse Theo formally.
- Accuse the wrong person or accuse with insufficient proof.
- Confront Theo privately and decide whether to offer mercy.

Completion condition:

- The player reaches any ending through `accuse`, final `talk`, or forced dawn resolution.

Good-case requirement:

- At least 4 clues, including motive and staging, plus either drugging or Theo confession.

## Command List

### 1. `look`

Purpose: Reprint current room, visible exits, NPCs, interactives, and obvious facts.

Cost: Free.

### 2. `go <exit-or-room>`

Purpose: Move between connected rooms.

Cost: Free.

Failure: Invalid route gives a clear factual reason and does not cost a turn.

### 3. `search <target>`

Purpose: Inspect a room feature, body, object, or area for items/clues.

Cost: 1 turn on valid searches.

Risk: Searching private spaces can lower trust.

### 4. `take <item>`

Purpose: Add discovered item to inventory.

Cost: Free if item is already discovered.

Risk: Some items record consequences when taken without permission.

### 5. `talk <npc> [topic]`

Purpose: Ask NPCs about facts, people, rooms, or evidence.

Cost: 1 turn.

Risk: Topics can raise/lower trust or tip off Theo.

### 6. `use <item> [target]`

Purpose: Apply an item to a lock, clue, NPC, or room feature.

Cost: 1 turn when it changes state.

Risk: Using private evidence in front of Vale can hurt credibility.

### 7. `inventory`

Purpose: Show carried items, clues, trust, time remaining, and consequence ledger.

Cost: Free.

### 8. `accuse <npc> [theory]`

Purpose: Commit to an ending or trigger a major confrontation.

Cost: 1 turn and usually ends the demo.

Risk: Weak accusations create bad endings.

## Key Choices and Consequences

### Choice: Respect Mina or Search Without Permission

Respecting Mina:

- Costs time to build trust.
- Gives cleaner access to Bell Tower.
- Improves final credibility.

Searching without permission:

- Gets the brass key faster.
- Records `broke_mina_trust` and `used_private_key`.
- Makes Mina refuse later help.

### Choice: Show Evidence to Theo Early or Wait

Showing the ledger page or gloves early:

- May expose a contradiction quickly.
- Records `tipped_off_theo`.
- Removes or weakens the laudanum clue.

Waiting:

- Preserves physical evidence.
- Costs time and requires more exploration.

### Choice: Cooperate with Vale or Defy Him

Cooperating:

- Can make the formal accusation stronger.
- May record `captain_rushed_case` if the player lets him push too early.

Defying:

- Keeps the player free to seek better evidence.
- Makes Vale skeptical unless the final proof is strong.

### Choice: Formal Justice or Private Mercy

Formal accusation:

- Requires more proof.
- Leads to the cleanest public truth.

Private mercy:

- Requires high evidence and direct confrontation.
- Reveals a confession but lets the public record remain incomplete.

## Endings

### Ending A: The Bell Rings True

Type: Best formal ending.

Condition:

- Accuse Theo with at least 4 clues.
- Must include Stolen Design Motive and Staged Tower.
- Must have either Drugged Before the Fall or Theo trust/confession.

Outcome:

- Theo is arrested.
- Mina confirms the servant bell detail.
- Vale files a complete report.
- The road opens with the truth preserved.

Costs:

- Theo is condemned by law.
- Mina's hidden family pain becomes part of the official record if used as context.

### Ending B: Snow Covers the Tracks

Type: Weak or failed ending.

Condition:

- Time runs out, or the player accuses with fewer than 3 clues, or accuses the wrong NPC.

Outcome:

- Vale arrests Mina or declares an accidental fall, depending on player theory.
- Theo leaves with the road crew.
- The player knows the case is unfinished.

Costs:

- The wrong person may suffer.
- Several clues are left unresolved.

### Ending C: The Apprentice's Confession

Type: Ambiguous mercy ending.

Condition:

- Confront Theo privately at Gatehouse with at least 4 clues.
- Do not choose `accuse theo` publicly first.
- Choose mercy or negotiated confession.

Outcome:

- Theo confesses to the player and gives up the stolen contract fragments.
- Theo escapes immediate arrest or receives a softened report, depending on Vale trust.
- Mina keeps her sister's history out of the public record.

Costs:

- Public justice is incomplete.
- Vale may distrust the player in future cases.
- The player carries responsibility for deciding that truth and law are not identical.

## Paper Playthrough Example

One strong route:

1. `search body` in Great Hall: gain Watch Stopped at 11:47.
2. `talk mina alden` in Servants' Hall: raise Mina trust.
3. `talk mina bell` in Servants' Hall: gain Servant Bell After Death and key access.
4. `search desk` in Study: take Torn Ledger Page and gain motive.
5. `search garden trail` in Winter Garden: gain route clue and gloves.
6. `search snowbank` in Coach Yard: take Vial of Laudanum.
7. `go bell tower` through Mina-granted access, then `search clapper mount`: gain staged tower clue.
8. `accuse theo staged murder`: Ending A.

This route is tight and requires spending turns carefully. Alternate routes trade evidence completeness for speed, trust, or mercy.

## Phase 1B Readiness Notes

This design should translate cleanly into deterministic content data:

- Rooms as IDs, exits, visible interactives, and locked requirements.
- NPCs as trust scores with topic gates.
- Items as discoverable/carryable state.
- Clues as ledger entries with source event IDs.
- Consequences as boolean flags.
- Endings as condition checks.

Do not implement these in Phase 1A.

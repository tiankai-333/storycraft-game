# Phase 1B Data Structure Draft

## Purpose

This document translates the Phase 1A paper design for **The Last Bell at Frostmere House** into an implementation-ready data model draft.

This is not runtime code. It does not create content files, TypeScript source, frontend screens, AI integration, or database tables.

## Authority Rules

The runtime decides all game facts:

- room existence and exits
- current room
- object visibility and inventory
- NPC location, trust, and availability
- command legality
- clue discovery and evidence strength
- quest and ending state
- turn cost and time remaining
- consequence ledger changes

The future AI narrative layer may consume `WorldState` snapshots and emitted `Event` records. It must not directly mutate state, create rooms, add exits, grant items, complete quests, change resources, or decide action legality.

First-version exclusions:

- No `wait` command.
- No database.
- No AI integration.
- No frontend implementation.

## Entity ID Rules

Entity IDs should be stable, lowercase, ASCII, and content-pack scoped.

Recommended pattern:

```text
<kind>_<short_name>
```

Examples:

- Room: `room_great_hall`
- Exit: `exit_great_hall_to_study`
- Interactive: `int_great_hall_body`
- NPC: `npc_mina_arlen`
- Item: `item_brass_service_key`
- Clue: `clue_watch_stopped_1147`
- Quest: `quest_name_alden_truth`
- Ending: `ending_bell_rings_true`
- Consequence: `conseq_broke_mina_trust`
- Event: generated at runtime, such as `evt_0007_clue_discovered`

Rules:

- IDs never use display names as authority.
- IDs are immutable once content is released.
- Display labels can change without changing IDs.
- Runtime state stores IDs, not localized labels.
- Prefixes should be predictable enough for tests and debugging.

## Content Pack Shape

The first demo content pack can be represented as one static adventure definition.

Draft top-level sections:

- `meta`
- `rooms`
- `npcs`
- `items`
- `clues`
- `quests`
- `commands`
- `endings`
- `initialState`

The runtime should load this content and create a `WorldState` snapshot from `initialState`. Content definitions describe possible facts. `WorldState` records current facts.

## Room Model

Rooms are deterministic locations in the room graph.

Suggested fields:

- `id`: stable room ID.
- `name`: player-facing display name.
- `description`: plain fallback text.
- `purpose`: design note for maintainers.
- `exits`: list of exit IDs or inline exit definitions.
- `interactives`: list of interactive IDs or inline interactive definitions.
- `initialNpcIds`: NPCs present at game start.
- `tags`: optional labels such as `hub`, `crime_scene`, `final_threshold`.

Phase 1A room IDs:

- `room_great_hall`
- `room_study`
- `room_servants_hall`
- `room_bell_tower`
- `room_winter_garden`
- `room_coach_yard`
- `room_gatehouse`

## Exit Model

Exits connect rooms. The runtime validates movement.

Suggested fields:

- `id`: stable exit ID.
- `fromRoomId`: source room.
- `toRoomId`: destination room.
- `direction`: input alias such as `north`, `east`, `south-west`.
- `aliases`: optional room or direction aliases.
- `visible`: whether `look` shows the exit.
- `locked`: initial lock state or lock condition.
- `unlockCondition`: condition expression checked by runtime.
- `failureText`: factual fallback when blocked.

Movement policy:

- `go` is free.
- Invalid movement does not cost a turn.
- Locked movement does not cost a turn unless a later design explicitly makes forcing a lock a meaningful action.

Draft lock conditions:

- Great Hall to Bell Tower requires `state.flags.towerUnlocked == true` or `trust.npc_mina_arlen >= 2`.
- Servants' Hall service stair to Bell Tower uses the same tower access condition.

## Interactive Model

Interactives are searchable or usable room features that are not necessarily inventory items.

Suggested fields:

- `id`: stable interactive ID.
- `roomId`: parent room.
- `name`: display label.
- `description`: fallback text.
- `aliases`: parser aliases.
- `visibleFromStart`: whether visible on first `look`.
- `searchResult`: result ID or rule.
- `useRules`: optional item interactions.
- `private`: whether searching it may affect trust.
- `onceOnly`: whether its primary result can happen once.

Examples:

- `int_great_hall_body`
- `int_study_desk`
- `int_servants_hall_bell_board`
- `int_bell_tower_clapper_mount`
- `int_winter_garden_snow_trail`
- `int_coach_yard_snowbank`
- `int_gatehouse_gate`

Searches should be deterministic. If a search can produce different results, the branch is selected from runtime state, not AI.

## NPC Model

NPCs are factual entities with location, trust, known topics, and possible state changes.

Suggested fields:

- `id`: stable NPC ID.
- `name`: display name.
- `role`: short role label.
- `publicFace`: player-facing personality summary.
- `privatePressure`: design-only motive or secret.
- `initialRoomId`: starting room.
- `currentRoomId`: stored in `WorldState`.
- `trustMin`: first version uses `0`.
- `trustMax`: first version uses `2`.
- `initialTrust`: initial trust score.
- `topicGates`: available conversation rules.
- `movementRules`: runtime-owned movement triggers.
- `accusationRules`: how this NPC responds to accusation.

Phase 1A NPC IDs:

- `npc_mina_arlen`
- `npc_theo_rusk`
- `npc_captain_vale`

## Trust Model

Trust is a small integer per NPC.

Scale:

- `0`: guarded
- `1`: cooperative
- `2`: candid

Suggested state shape:

- `trustByNpcId`: map of NPC ID to integer trust.

Trust changes must be emitted as events and recorded in state.

Trust change fields:

- `npcId`
- `delta`
- `reason`
- `sourceCommand`
- `newValue`

Trust is not a relationship simulator in the first version. It is a small gate for clues, topics, access, and ending credibility.

## Topic Gate Model

Topic gates describe deterministic dialogue outcomes.

Suggested fields:

- `id`: stable topic gate ID.
- `npcId`: NPC who owns the topic.
- `topicAliases`: accepted topic words.
- `requires`: state conditions.
- `blockedResponse`: factual fallback when unavailable.
- `effects`: state changes applied if valid.
- `revealsClueIds`: clues revealed.
- `revealsItemIds`: items made visible or granted.
- `trustDelta`: optional trust change.
- `consequenceIds`: optional consequences recorded.
- `turnCost`: usually `meaningful`.

Examples:

- `topic_mina_alden`: can raise Mina trust.
- `topic_mina_bell`: requires Mina trust 2 or related clue context.
- `topic_theo_designs`: can raise temporary cooperation.
- `topic_theo_evidence`: can record `conseq_tipped_off_theo`.
- `topic_vale_report`: can improve formal accusation credibility.

Topic gates should not depend on generated prose. The prose can be enhanced later, but the gate result is runtime-owned.

## Item Model

Items are inventory-capable evidence or tools.

Suggested fields:

- `id`: stable item ID.
- `name`: display label.
- `description`: fallback text.
- `aliases`: parser aliases.
- `originRoomId`: where it can first appear.
- `discoverCondition`: condition for becoming visible.
- `takeCondition`: condition for taking it.
- `carryable`: boolean.
- `sensitive`: whether taking or using may affect trust or credibility.
- `useRules`: item-target interactions.
- `linkedClueIds`: clues supported by the item.

Phase 1A item IDs:

- `item_brass_service_key`
- `item_torn_ledger_page`
- `item_soot_stained_gloves`
- `item_vial_laudanum`
- `item_cracked_bell_clapper`

## Inventory Behavior

Inventory state should be explicit.

Suggested fields:

- `inventoryItemIds`: ordered list or set of item IDs carried by the player.
- `discoveredItemIds`: item IDs known to the player but not necessarily carried.
- `consumedItemIds`: optional list for later, probably unused in first demo.

Rules:

- `take` is free if the item is already discovered and carryable.
- Invalid `take` does not cost a turn.
- Taking a sensitive item may record a consequence, but the cost remains free unless Phase 2 playtesting changes this.
- Items do not imply clues automatically unless their rule says they reveal or strengthen a clue.

## Clue Model

Clues are ledger facts discovered by valid investigation.

Suggested fields:

- `id`: stable clue ID.
- `title`: player-facing clue title.
- `summary`: factual fallback text.
- `sourceIds`: rooms, interactives, topics, or items that can reveal it.
- `evidenceStrength`: current or default strength.
- `supportsTheory`: tags such as `time_of_death`, `motive`, `staging`, `drugging`.
- `requiredForEndings`: ending IDs that check this clue.
- `weakenedVariant`: optional weakened clue result.

Phase 1A clue IDs:

- `clue_watch_stopped_1147`
- `clue_servant_bell_after_death`
- `clue_stolen_design_motive`
- `clue_soot_marked_garden_route`
- `clue_drugged_before_fall`

## Evidence Strength

Evidence strength should be deterministic and visible enough for ending checks.

Recommended first-version levels:

- `none`: not discovered.
- `weak`: discovered in a compromised or incomplete form.
- `standard`: discovered normally and usable in endings.
- `strong`: reinforced by multiple sources or confession.

Examples:

- `clue_drugged_before_fall` is `standard` when the vial is found.
- The same clue is `weak` if Theo was tipped off and only the crushed cork remains.
- Theo confession can upgrade motive or culpability evidence to `strong`.

Ending checks should use explicit strength rules:

- Best formal ending requires enough `standard` or `strong` clues.
- Weak clues can contribute to suspicion but should not replace required proof unless paired with confession.

## Quest Model

The first demo has one main quest.

Suggested fields:

- `id`: stable quest ID.
- `title`: player-facing quest name.
- `objectiveIds`: ordered or unordered objective IDs.
- `startState`: usually active from game start.
- `completionCondition`: condition expression.
- `failureCondition`: condition expression.
- `endingIds`: endings that can resolve the quest.

Phase 1A quest ID:

- `quest_name_alden_truth`

## Objective Model

Objectives describe player-facing progress without replacing clue logic.

Suggested fields:

- `id`
- `questId`
- `label`
- `state`: hidden, active, complete, failed.
- `completionCondition`

Draft objectives:

- `obj_inspect_body`: learn when Alden likely died.
- `obj_find_motive`: find why someone wanted Alden dead.
- `obj_test_locked_room`: determine whether the tower was staged.
- `obj_identify_culprit`: name a responsible suspect.
- `obj_choose_resolution`: formal accusation or private confrontation.

Objectives are UI and progress aids. Endings are still decided by factual conditions.

## Ending Condition Model

Endings are deterministic rule checks.

Suggested fields:

- `id`: stable ending ID.
- `title`: display title.
- `type`: `formal_success`, `failure`, or `ambiguous_success`.
- `priority`: used when multiple endings are technically possible.
- `triggerCommand`: usually `accuse` or final gated `talk`.
- `conditions`: required state checks.
- `outcomeFacts`: facts recorded when ending resolves.
- `summary`: fallback ending text.

Phase 1A ending IDs:

- `ending_bell_rings_true`
- `ending_snow_covers_tracks`
- `ending_apprentice_confession`

Draft condition examples:

- `ending_bell_rings_true`: accused NPC is Theo, clue count at `standard` or better is at least 4, motive is discovered, staged tower is discovered, and either drugging is `standard` or Theo confession is present.
- `ending_snow_covers_tracks`: time reaches 0, wrong NPC accused, or public accusation has fewer than 3 usable clues.
- `ending_apprentice_confession`: private Gatehouse confrontation with Theo, at least 4 usable clues, no prior public accusation of Theo, and mercy choice recorded through the final talk or accuse flow.

## Command Spec

The first version has exactly 8 formal commands:

```text
look
go
search
take
talk
use
inventory
accuse
```

There is no `wait` command in the first version.

### `look`

Purpose:

- Show current room, visible exits, visible NPCs, visible interactives, obvious discovered state, and any immediate ending pressure.

Cost:

- Free.

Valid result:

- Emits an observation event if useful, but does not mutate investigation facts.

### `go <exit-or-room>`

Purpose:

- Move through a valid visible exit.

Cost:

- Free.

Valid result:

- Updates `currentRoomId`.
- Emits `room_entered`.

Invalid result:

- Explains blocked, unknown, or locked movement.
- Does not cost a turn.

### `search <target>`

Purpose:

- Inspect a room interactive, area, item, or body.

Cost:

- Costs 1 turn when valid and meaningful.

Valid result:

- Can reveal clues, reveal items, modify trust, record consequences, or update flags.

Invalid or exhausted result:

- No turn cost if the target is not present, not searchable, or already fully exhausted.

### `take <item>`

Purpose:

- Move a discovered carryable item into inventory.

Cost:

- Free.

Valid result:

- Adds item ID to inventory.
- May record a consequence for sensitive private evidence.

Invalid result:

- No turn cost.

### `talk <npc> [topic]`

Purpose:

- Resolve deterministic NPC topic gates.

Cost:

- Costs 1 turn when the NPC is present and the topic produces meaningful new information, trust change, clue reveal, item reveal, or consequence.

Valid result:

- Applies trust/topic effects.
- Can reveal clues or move NPC state.

Invalid or repeated result:

- No turn cost if no meaningful state or knowledge changes.

### `use <item> [target]`

Purpose:

- Apply an inventory item to a target or present evidence in a controlled way.

Cost:

- Costs 1 turn when valid and meaningful.

Valid result:

- Can unlock access, reveal a clue, strengthen evidence, change trust, or record a consequence.

Invalid result:

- No turn cost.

### `inventory`

Purpose:

- Show inventory, discovered clues, evidence strength, trust, time remaining, objectives, and consequences.

Cost:

- Free.

Valid result:

- No world mutation.

### `accuse <npc> [theory]`

Purpose:

- Commit to a public accusation or final resolution path.

Cost:

- Costs 1 turn when valid and meaningful.

Valid result:

- Evaluates ending conditions.
- Records `conseq_made_public_accusation` when public.
- Ends the demo if an ending is selected.

Invalid result:

- If the NPC is unavailable or target is unknown, no turn cost.

## Turn Cost Policy

Free commands:

- `go`
- `look`
- `take`
- `inventory`

Turn-cost commands:

- `search`
- `talk`
- `use`
- `accuse`

The turn-cost commands only spend a turn when valid and meaningful.

Meaningful means the command does at least one of the following:

- reveals a clue
- reveals or changes item availability
- changes inventory
- changes NPC trust
- changes room access
- records a consequence
- updates an objective
- triggers an ending check or ending
- changes NPC location or state

Non-meaningful invalid input should not punish the player with time loss. Repeating an exhausted action should generally be free and explain that nothing new remains.

When a turn is spent:

- decrement `turnsRemaining` by 1.
- emit `turn_spent`.
- evaluate time-based movement or pressure rules.
- if `turnsRemaining` reaches 0 and no ending is already resolved, evaluate forced dawn failure.

## WorldState Snapshot

`WorldState` is the runtime-owned factual snapshot after each command.

Suggested fields:

- `adventureId`
- `turnIndex`
- `turnsRemaining`
- `currentRoomId`
- `visitedRoomIds`
- `visibleInteractiveIdsByRoomId`
- `searchedInteractiveIds`
- `discoveredItemIds`
- `inventoryItemIds`
- `discoveredCluesById`
- `trustByNpcId`
- `npcRoomById`
- `questStatesById`
- `objectiveStatesById`
- `flags`
- `consequenceIds`
- `eventLog`
- `endingId`
- `isComplete`

Design notes:

- `WorldState` should be serializable.
- The web UI can render from `WorldState`.
- The AI narrative layer can receive a redacted or summarized `WorldState`.
- Player-facing prose can vary, but `WorldState` must remain deterministic.

## Event Model

Events are structured records emitted after runtime validation and state changes.

Suggested fields:

- `id`: runtime-generated event ID.
- `turnIndex`
- `type`
- `sourceCommand`
- `actorId`: usually `player`.
- `roomId`
- `entityIds`
- `payload`
- `publicText`: optional plain fallback text.

Useful first-version event types:

- `room_entered`
- `looked`
- `search_resolved`
- `item_discovered`
- `item_taken`
- `clue_discovered`
- `clue_strength_changed`
- `npc_talked`
- `trust_changed`
- `item_used`
- `access_unlocked`
- `consequence_recorded`
- `turn_spent`
- `objective_updated`
- `accusation_made`
- `ending_resolved`

AI narrative later consumes events after they are emitted. It can express the event but not alter it.

## Consequence Ledger

Consequences are durable flags recording meaningful player choices.

Suggested fields:

- `id`: stable consequence ID.
- `label`: player-facing short label.
- `description`: factual explanation.
- `sourceEventId`: event that created it.
- `firstTurnIndex`: when it happened.
- `visibleToPlayer`: whether shown in inventory/status.

Phase 1A consequence IDs:

- `conseq_broke_mina_trust`
- `conseq_tipped_off_theo`
- `conseq_captain_rushed_case`
- `conseq_used_private_key`
- `conseq_spent_dawn_turn`
- `conseq_made_public_accusation`
- `conseq_offered_theo_mercy`

Ledger policy:

- Consequences are append-only once recorded.
- They can influence later rules.
- They should not be removed by AI narration.
- Some may be hidden until revealed, but hidden consequences still remain runtime facts.

## Condition Expressions

The first implementation should keep conditions simple and testable.

Recommended condition categories:

- `hasItem(itemId)`
- `hasClue(clueId, minStrength)`
- `hasConsequence(consequenceId)`
- `trustAtLeast(npcId, value)`
- `inRoom(roomId)`
- `npcInRoom(npcId, roomId)`
- `flagEquals(flagId, value)`
- `turnsRemainingAtMost(value)`
- `clueCountAtLeast(minStrength, count)`
- `not(condition)`
- `all([...])`
- `any([...])`

Avoid arbitrary script snippets inside content for the first version. If custom logic is needed, name it as a runtime rule and test it directly.

## Content Encoding Approach

Recommended first implementation choice: **static TypeScript object** in the future content package.

Reason:

- Strongest fit for a TypeScript runtime.
- Allows local type checking against shared schemas.
- Keeps content close to tests during Phase 2.
- Avoids parser work before the game is playable.
- Supports deterministic condition functions or named condition descriptors.

Alternatives:

- JSON: good for portability, but weaker comments and authoring ergonomics.
- YAML: readable for content, but adds parser dependency and schema validation work.
- Markdown-derived data: friendly for prose, but too fragile for rules and conditions in the first runtime.

Phase 1B decision:

- Use this document as the draft.
- Do not create TypeScript, JSON, YAML, or Markdown-derived data files yet.
- Revisit encoding only when Phase 2 begins implementation.

## Phase 2 Readiness Checklist

Before writing runtime code, the next phase should confirm:

- Exact field names for content definitions.
- Exact field names for `WorldState`.
- Whether conditions are declarative descriptors or small typed predicates.
- How parser aliases map to IDs.
- How repeated commands report "nothing new" without spending turns.
- How private evidence consequences are surfaced to the player.
- Whether clue strength should be enum strings or numeric ranks.

## Acceptance Criteria

This data model draft is acceptable if:

- It covers entity IDs, rooms, exits, interactives, NPCs, trust, topic gates, items, inventory, clues, evidence strength, quests, objectives, endings, commands, world state, events, consequences, turn costs, and content encoding.
- It preserves the exactly 8-command first version.
- It states that there is no `wait` command.
- It states that the runtime owns facts.
- It states that AI narrative later consumes `WorldState` and `Event` records without mutating state.
- It states that the first version has no database and no AI integration.
- It remains a document-only draft with no runtime, frontend, dependency, or source-file changes.

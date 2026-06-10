import type {
  ClueId,
  ConsequenceId,
  EndingId,
  ExitId,
  InteractiveId,
  ItemId,
  NpcId,
  ObjectiveId,
  QuestId,
  RoomId
} from "./ids";

export type EvidenceStrength = "none" | "weak" | "standard" | "strong";
export type QuestStatus = "inactive" | "active" | "complete" | "failed";
export type ObjectiveStatus = "hidden" | "active" | "complete" | "failed";
export type TrustLevel = 0 | 1 | 2;

export interface RoomDefinition {
  id: RoomId;
  name: string;
  description: string;
  exitIds: ExitId[];
  interactiveIds: InteractiveId[];
  tags?: string[];
}

export interface ExitDefinition {
  id: ExitId;
  fromRoomId: RoomId;
  toRoomId: RoomId;
  direction: string;
  aliases: string[];
  visible: boolean;
  locked?: boolean;
  failureText?: string;
}

export interface InteractiveDefinition {
  id: InteractiveId;
  roomId: RoomId;
  name: string;
  aliases: string[];
  visibleFromStart: boolean;
  searchOutcome?: SearchOutcome;
}

export interface NpcDefinition {
  id: NpcId;
  name: string;
  role: string;
  initialRoomId: RoomId;
  initialTrust: TrustLevel;
}

export interface ItemDefinition {
  id: ItemId;
  name: string;
  description: string;
  aliases: string[];
  carryable: boolean;
}

export interface ClueDefinition {
  id: ClueId;
  title: string;
  summary: string;
  defaultStrength: EvidenceStrength;
}

export interface SearchOutcome {
  message: string;
  alreadySearchedMessage: string;
  clueIds?: ClueId[];
  revealedItemIds?: ItemId[];
  consequenceIds?: ConsequenceId[];
  weakenedByConsequence?: ConsequenceId;
  weakenedMessage?: string;
  weakenedClueStrength?: EvidenceStrength;
}

// --- Condition system ---

export type ConditionKind =
  | "trust_at_least"
  | "has_clue"
  | "has_item"
  | "has_consequence"
  | "not_has_consequence"
  | "flag_equals"
  | "clue_count_at_least"
  | "npc_in_room";

export interface TopicCondition {
  kind: ConditionKind;
  npcId?: NpcId;
  roomId?: RoomId;
  clueId?: ClueId;
  itemId?: ItemId;
  consequenceId?: ConsequenceId;
  minTrust?: TrustLevel;
  flagKey?: string;
  flagValue?: boolean;
  minStrength?: EvidenceStrength;
  minClueCount?: number;
}

// --- Topic gates (talk command) ---

export interface TopicGateDefinition {
  id: string;
  npcId: NpcId;
  topicAliases: string[];
  requires?: TopicCondition[];
  blockedResponse: string;
  response: string;
  repeatedResponse: string;
  /** Items revealed in the scene; the player must still take them. */
  revealsClueIds?: ClueId[];
  revealsItemIds?: ItemId[];
  /** Items directly granted into inventory by the runtime. */
  grantsItemIds?: ItemId[];
  trustDelta?: number;
  consequenceIds?: ConsequenceId[];
  flagChanges?: Record<string, boolean>;
  movesNpcToRoomId?: RoomId;
}

// --- Use rules (use command) ---

export interface UseRuleDefinition {
  id: string;
  itemId: ItemId;
  targetAliases: string[];
  requires?: TopicCondition[];
  blockedResponse: string;
  response: string;
  alreadyUsedResponse?: string;
  unlocksExitIds?: ExitId[];
  revealsClueIds?: ClueId[];
  trustDelta?: Partial<Record<NpcId, number>>;
  consequenceIds?: ConsequenceId[];
  flagChanges?: Record<string, boolean>;
  npcPresent?: NpcId;
}

// --- Endings ---

export interface EndingDefinition {
  id: EndingId;
  title: string;
  summary: string;
  priority: number;
  conditions: TopicCondition[];
  requiresNpcId?: NpcId;
  requiresMode?: string;
  requiresRoomId?: RoomId;
  consequenceIds?: ConsequenceId[];
  flagChanges?: Record<string, boolean>;
}

// --- Consequences ---

export interface ConsequenceDefinition {
  id: ConsequenceId;
  label: string;
  description: string;
}

// --- Quests and Objectives ---

export interface QuestDefinition {
  id: QuestId;
  title: string;
  objectiveIds: ObjectiveId[];
}

export interface ObjectiveDefinition {
  id: ObjectiveId;
  questId: QuestId;
  label: string;
  checkCondition: TopicCondition;
}

// --- Adventure definition ---

export interface AdventureDefinition {
  meta: {
    id: string;
    title: string;
    initialRoomId: RoomId;
    initialTurnsRemaining: number;
  };
  rooms: Record<RoomId, RoomDefinition>;
  exits: Record<ExitId, ExitDefinition>;
  interactives: Record<InteractiveId, InteractiveDefinition>;
  npcs: Record<NpcId, NpcDefinition>;
  items: Record<ItemId, ItemDefinition>;
  clues: Record<ClueId, ClueDefinition>;
  topicGates?: Record<string, TopicGateDefinition>;
  useRules?: Record<string, UseRuleDefinition>;
  endings?: Record<EndingId, EndingDefinition>;
  consequences?: Record<ConsequenceId, ConsequenceDefinition>;
  quests?: Record<QuestId, QuestDefinition>;
  objectives?: Record<ObjectiveId, ObjectiveDefinition>;
}

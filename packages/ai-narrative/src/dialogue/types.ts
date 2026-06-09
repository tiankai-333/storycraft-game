// ─── NPC Dialogue Types ──────────────────────────────────────────────
// Types for the AI-driven NPC free-form dialogue system.

/**
 * NPC Script — the complete character bible for AI-driven dialogue.
 * Defined per-NPC per-adventure.
 */
export interface NpcScript {
  npcId: string;
  name: string;
  role: string;
  persona: {
    personality: string;
    background: string;
    speechPatterns: string;
    emotionalBaseline?: string;
    forbiddenTone?: string;
  };
  publicKnowledge: NpcKnowledgeEntry[];
  privateKnowledge: NpcKnowledgeEntry[];
  gatedSecrets: NpcSecret[];
  ignorance: string[];
  relationships: { npcId: string; attitude: string; notes: string }[];
}

export interface NpcKnowledgeEntry {
  id: string;
  topic: string;
  content: string;
}

export interface NpcSecret {
  id: string;
  topicGateId: string;
  description: string;
  revealConditions: string;
  reactionWhenPressed: string;
}

export interface ConversationExchange {
  playerInput: string;
  npcResponse: string;
  triggeredTopicGateId: string | null;
  timestamp: number;
}

export interface DialogueAiResponse {
  dialogue: string;
  triggeredTopicGateId: string | null;
  trustDelta: number;
  confidence?: "low" | "medium" | "high";
  matchedEvidence?: string;
}

export interface DialogueContext {
  currentRoom: string;
  currentTurn: number;
  turnsRemaining: number;
  playerInventory: string[];
  discoveredClues: string[];
  currentTrust: number;
  exhaustedTopicGateIds: string[];
  recentExchanges: ConversationExchange[];
  validTopicGateIds: string[];
}

export interface DialogueRequest {
  npcScript: NpcScript;
  playerInput: string;
  context: DialogueContext;
}

export interface DialogueResult {
  dialogue: string;
  triggeredTopicGateId: string | null;
  trustDelta: number;
  source: "ai" | "passthrough";
  latencyMs: number;
}

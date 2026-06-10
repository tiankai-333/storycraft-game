import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { validateDialogueResponse } from "../src/dialogue/schema";

describe("validateDialogueResponse — structural normalization", () => {
  it("defaults empty dialogue to ellipsis", () => {
    const result = validateDialogueResponse({
      dialogue: "",
      candidateGateId: null,
      gateEvidence: "",
      gateConfidence: "low",
      candidateActionHint: null,
    });
    assert.equal(result.dialogue, "...");
  });

  it("truncates dialogue over 1000 chars", () => {
    const result = validateDialogueResponse({
      dialogue: "a".repeat(1001),
      candidateGateId: null,
      gateEvidence: "",
      gateConfidence: "low",
      candidateActionHint: null,
    });
    assert.equal(result.dialogue.length, 1000);
  });

  it("does not filter candidateGateId by game conditions", () => {
    const result = validateDialogueResponse({
      dialogue: "ok",
      candidateGateId: "gate_unknown_to_schema",
      gateEvidence: "",
      gateConfidence: "medium",
      candidateActionHint: null,
    });
    assert.equal(result.candidateGateId, "gate_unknown_to_schema");
  });
});

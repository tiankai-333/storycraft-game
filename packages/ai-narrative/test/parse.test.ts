import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { parseAiJson } from "../src/dialogue/parse";

// ===========================================================================
// parseAiJson — old and new field format compatibility
// ===========================================================================
describe("parseAiJson — new field names", () => {
  it("parses new-format JSON with candidateGateId", () => {
    const raw = JSON.stringify({
      dialogue: "I suppose I could tell you about that night.",
      candidateGateId: "topic_mina_alden",
      gateEvidence: "you asked about Alden",
      gateConfidence: "high",
      candidateActionHint: null,
    });
    const result = parseAiJson(raw);
    assert.equal(result.dialogue, "I suppose I could tell you about that night.");
    assert.equal(result.candidateGateId, "topic_mina_alden");
    assert.equal(result.gateEvidence, "you asked about Alden");
    assert.equal(result.gateConfidence, "high");
    assert.equal(result.candidateActionHint, null);
  });

  it("drops obsolete trust fields from AI output", () => {
    const raw = JSON.stringify({
      dialogue: "I suppose I could tell you about that night.",
      candidateGateId: null,
      trustSignal: "warmer",
      trustEvidence: "player showed genuine interest",
      trustDelta: 1,
    });
    const result = parseAiJson(raw);
    assert.equal("trustSignal" in result, false);
    assert.equal("trustEvidence" in result, false);
    assert.equal("trustDelta" in result, false);
  });

  it("defaults missing optional fields", () => {
    const raw = JSON.stringify({
      dialogue: "Hello.",
      candidateGateId: null,
    });
    const result = parseAiJson(raw);
    assert.equal(result.dialogue, "Hello.");
    assert.equal(result.candidateGateId, null);
    assert.equal(result.gateEvidence, "");
    assert.equal(result.gateConfidence, "low");
    assert.equal(result.candidateActionHint, null);
  });
});

describe("parseAiJson — old field names map to new", () => {
  it("maps triggeredTopicGateId → candidateGateId", () => {
    const raw = JSON.stringify({
      dialogue: "Yes, I was there.",
      triggeredTopicGateId: "topic_mina_bell",
      confidence: "medium",
      matchedEvidence: "you asked about the bell",
    });
    const result = parseAiJson(raw);
    assert.equal(result.candidateGateId, "topic_mina_bell");
    assert.equal(result.gateEvidence, "you asked about the bell");
    assert.equal(result.gateConfidence, "medium");
  });

  it("ignores old trustDelta +1", () => {
    const raw = JSON.stringify({
      dialogue: "Thank you for understanding.",
      triggeredTopicGateId: null,
      trustDelta: 1,
      confidence: "low",
      matchedEvidence: "",
    });
    const result = parseAiJson(raw);
    assert.equal("trustDelta" in result, false);
  });

  it("ignores old trustDelta -1", () => {
    const raw = JSON.stringify({
      dialogue: "How dare you!",
      triggeredTopicGateId: null,
      trustDelta: -1,
      confidence: "low",
      matchedEvidence: "",
    });
    const result = parseAiJson(raw);
    assert.equal("trustDelta" in result, false);
  });

  it("ignores old trustDelta 0", () => {
    const raw = JSON.stringify({
      dialogue: "I don't know anything about that.",
      triggeredTopicGateId: null,
      trustDelta: 0,
      confidence: "low",
      matchedEvidence: "",
    });
    const result = parseAiJson(raw);
    assert.equal("trustDelta" in result, false);
  });
});

describe("parseAiJson — markdown-wrapped JSON", () => {
  it("strips code block fences", () => {
    const raw = '```json\n{"dialogue": "Yes.", "candidateGateId": null, "gateEvidence": "", "gateConfidence": "low", "candidateActionHint": null}\n```';
    const result = parseAiJson(raw);
    assert.equal(result.dialogue, "Yes.");
    assert.equal(result.candidateGateId, null);
  });
});

describe("parseAiJson — truncated JSON", () => {
  it("extracts dialogue from truncated response", () => {
    const raw = '{"dialogue": "I remember that night well...", "candidateGateI';
    const result = parseAiJson(raw);
    assert.equal(result.dialogue, "I remember that night well...");
  });

  it("extracts old-format gate from truncated response", () => {
    const raw = '{"dialogue": "About the bell...", "triggeredTopicGateId": "topic_mina_be';
    const result = parseAiJson(raw);
    assert.equal(result.dialogue, "About the bell...");
    // Gate ID was truncated so it shouldn't be extracted
    assert.equal(result.candidateGateId, null);
  });

  it("throws when no JSON found at all", () => {
    assert.throws(() => parseAiJson("not json at all"), /No JSON object found/);
  });
});

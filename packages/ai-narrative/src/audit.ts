import type { AuditFilter, AuditRecord, AuditStats } from "./types";

// ─── In-Memory Audit Log ────────────────────────────────────────────
// Bounded ring buffer. Every NarrativeResponse produces exactly one AuditRecord.

export class AuditLog {
  private entries: AuditRecord[] = [];
  private readonly maxEntries: number;

  constructor(maxEntries = 1000) {
    this.maxEntries = maxEntries > 0 ? maxEntries : Infinity;
  }

  append(record: AuditRecord): void {
    this.entries.push(record);
    // Evict oldest entries when capacity exceeded
    while (this.entries.length > this.maxEntries) {
      this.entries.shift();
    }
  }

  query(filter?: AuditFilter): AuditRecord[] {
    if (!filter) return [...this.entries];

    return this.entries.filter((r) => {
      if (filter.source !== undefined && r.responseSource !== filter.source)
        return false;
      if (filter.requestType !== undefined && r.requestType !== filter.requestType)
        return false;
      if (filter.minTurnIndex !== undefined && r.turnIndex < filter.minTurnIndex)
        return false;
      if (filter.maxTurnIndex !== undefined && r.turnIndex > filter.maxTurnIndex)
        return false;
      if (
        filter.validationPassed !== undefined &&
        r.validationPassed !== filter.validationPassed
      )
        return false;
      return true;
    });
  }

  stats(): AuditStats {
    let totalRequests = 0;
    let aiSuccessCount = 0;
    let passthroughCount = 0;
    let aiFailureCount = 0;
    let validationFailureCount = 0;
    let constraintViolationCount = 0;
    let totalLatency = 0;
    const byProvider: Record<string, { calls: number; failures: number }> = {};

    for (const r of this.entries) {
      totalRequests++;
      totalLatency += r.latencyMs;

      if (r.responseSource === "ai") {
        aiSuccessCount++;
      } else {
        passthroughCount++;
      }

      if (!r.validationPassed) {
        validationFailureCount++;
      }

      if (r.constraintViolations.length > 0) {
        constraintViolationCount++;
      }

      // Track provider stats — count non-ai responses after an ai attempt as failures
      if (!byProvider[r.providerId]) {
        byProvider[r.providerId] = { calls: 0, failures: 0 };
      }
      byProvider[r.providerId].calls++;
      if (r.responseSource === "passthrough" && r.providerId !== "passthrough") {
        // Provider was supposed to provide AI but fell back
        byProvider[r.providerId].failures++;
      }
    }

    return {
      totalRequests,
      aiSuccessCount,
      passthroughCount,
      aiFailureCount,
      validationFailureCount,
      constraintViolationCount,
      averageLatencyMs: totalRequests > 0 ? Math.round(totalLatency / totalRequests) : 0,
      byProvider,
    };
  }

  clear(): void {
    this.entries = [];
  }

  export(): AuditRecord[] {
    return [...this.entries];
  }

  get length(): number {
    return this.entries.length;
  }
}

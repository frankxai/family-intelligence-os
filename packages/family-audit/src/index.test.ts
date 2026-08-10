import { describe, expect, it, vi } from "vitest";
import {
  createAuditEvent,
  DatabaseAuditWriter,
  MemoryAuditWriter,
  type FamilyAuditEvent
} from "./index";

function syntheticEvent(metadata?: unknown): FamilyAuditEvent {
  const event = createAuditEvent({
    familyId: "family_synthetic",
    actorId: "agent_synthetic",
    actorType: "agent",
    action: "search_family_docs",
    sensitivity: "critical",
    result: "success"
  });
  return { ...event, ...(metadata === undefined ? {} : { metadata }) } as FamilyAuditEvent;
}

describe("family audit writers", () => {
  it("persists through an injected repository", async () => {
    const insert = vi.fn(async () => undefined);
    const writer = new DatabaseAuditWriter({ insert });
    const event = syntheticEvent({ actionClass: "read" });

    await writer.write(event);
    expect(insert).toHaveBeenCalledWith(event);
  });

  it("rejects raw private-content metadata keys", async () => {
    const writer = new MemoryAuditWriter();
    await expect(writer.write(syntheticEvent({ message: "private content" }))).rejects.toThrow(
      "not allowlisted"
    );
  });

  it("rejects unknown keys even when their names look harmless", async () => {
    const writer = new MemoryAuditWriter();
    await expect(
      writer.write(syntheticEvent({ label: "raw private content under a non-denylisted key" } as never))
    ).rejects.toThrow("not allowlisted");
  });

  it("rejects nested, cyclic, and oversized metadata values", async () => {
    const writer = new MemoryAuditWriter();
    const cyclic: Record<string, unknown> = {};
    cyclic.self = cyclic;

    for (const metadata of [
      { actionClass: { nested: "read" } },
      { actionClass: cyclic },
      { reasonCode: "x".repeat(129) },
      { attemptCount: 101 }
    ]) {
      await expect(writer.write(syntheticEvent(metadata as never))).rejects.toThrow();
    }
  });

  it("accepts only bounded scalar allowlisted metadata", async () => {
    const writer = new MemoryAuditWriter();
    const event = syntheticEvent({
      actionClass: "read",
      policyVersion: "policy_v1",
      reasonCode: "bounded_read",
      correlationId: "correlation_synthetic",
      reviewRequired: true,
      attemptCount: 1
    });
    await expect(writer.write(event)).resolves.toBeUndefined();
  });
});

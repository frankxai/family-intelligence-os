import { describe, expect, it, vi } from "vitest";
import { createAuditEvent, DatabaseAuditWriter, MemoryAuditWriter } from "./index";

function syntheticEvent(metadata?: Record<string, unknown>) {
  return createAuditEvent({
    familyId: "family_synthetic",
    actorId: "agent_synthetic",
    actorType: "agent",
    action: "search_family_docs",
    sensitivity: "critical",
    result: "success",
    metadata
  });
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
      "may contain raw private content"
    );
  });
});

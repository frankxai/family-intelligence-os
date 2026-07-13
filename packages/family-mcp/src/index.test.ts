import { describe, expect, it } from "vitest";
import { MemoryAuditWriter } from "@family/audit";
import { createFamilyMcpTools, familyMcpToolDefinitions } from "./index";

describe("family MCP tools", () => {
  it("keeps tool descriptions short and static", () => {
    for (const definition of familyMcpToolDefinitions) {
      expect(definition.description.length).toBeLessThanOrEqual(80);
      expect(definition.description.toLowerCase()).not.toContain("ignore previous");
    }
  });

  it("writes audit events for blocked or confirmation-required tools", async () => {
    const writer = new MemoryAuditWriter();
    const tools = createFamilyMcpTools({
      auditWriter: writer,
      resolveActorContext: () => ({ familyId: "fam", actorId: "agent", actorRole: "agent" })
    });
    const emergency = tools.find((tool) => tool.name === "prepare_emergency_pack");

    expect(emergency).toBeDefined();
    await emergency!.handler({ range: "next_7_days" });

    expect(writer.events).toHaveLength(1);
    expect(writer.events[0]).toMatchObject({
      action: "prepare_emergency_pack",
      result: "requires_confirmation",
      sensitivity: "critical"
    });
  });

  it("rejects caller-supplied identity and role fields", async () => {
    const writer = new MemoryAuditWriter();
    const tools = createFamilyMcpTools({
      auditWriter: writer,
      resolveActorContext: () => ({ familyId: "fam", actorId: "agent", actorRole: "agent" })
    });
    const search = tools.find((tool) => tool.name === "search_family_docs");

    await expect(
      search!.handler({
        query: "summary",
        familyId: "another_family",
        actorId: "spoofed_actor",
        actorRole: "family_owner"
      })
    ).rejects.toThrow();
    expect(writer.events).toHaveLength(0);
  });
});

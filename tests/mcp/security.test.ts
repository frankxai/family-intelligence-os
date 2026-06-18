import { describe, expect, it } from "vitest";
import { familyMcpToolDefinitions } from "@family/mcp";

describe("MCP security posture", () => {
  it("uses a static allowlist", () => {
    expect(familyMcpToolDefinitions.map((tool) => tool.name)).toEqual([
      "search_family_docs",
      "get_family_calendar",
      "get_family_contacts",
      "search_family_photos",
      "search_family_crm",
      "get_household_tasks",
      "get_family_finance_summary",
      "get_home_status",
      "log_family_memory",
      "prepare_weekly_family_review",
      "prepare_emergency_pack"
    ]);
  });

  it("marks export and write tools as non-read actions", () => {
    const risky = familyMcpToolDefinitions.filter((tool) => tool.actionClass !== "read");
    expect(risky.map((tool) => tool.name)).toEqual(["log_family_memory", "prepare_emergency_pack"]);
  });
});

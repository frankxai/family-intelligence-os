import { describe, expect, it } from "vitest";
import {
  agentPacks,
  evaluateAgentAction as evaluateAgentActionPolicy,
  familyAgentManifests,
  getAgentManifest
} from "./index";

const operationBinding = {
  familyId: "family_synthetic",
  tenantId: "tenant_synthetic",
  authenticatedActorId: "human_operator",
  targetScope: "private" as const,
  policyVersion: "policy_v1",
  now: new Date("2026-07-18T12:00:00Z")
};

function evaluateAgentAction(
  input: Omit<Parameters<typeof evaluateAgentActionPolicy>[0], keyof typeof operationBinding>
) {
  return evaluateAgentActionPolicy({ ...operationBinding, ...input });
}

const humanOnlyActions = ["accept_claim", "merge_identity", "publish", "release_access", "verify_death"];

describe("family agent registry", () => {
  it("has unique manifests and resolves every agent referenced by a pack", () => {
    const ids = familyAgentManifests.map((agent) => agent.id);
    expect(new Set(ids).size).toBe(ids.length);

    for (const pack of agentPacks) {
      for (const id of pack.agents) {
        expect(getAgentManifest(id)).toBeDefined();
      }
    }
  });

  it("includes the history, library, preservation, jurisdiction, community authority, and open-source roles", () => {
    for (const id of [
      "family_historian_agent",
      "family_librarian_agent",
      "preservation_steward_agent",
      "jurisdiction_navigator_agent",
      "community_authority_liaison_agent",
      "open_source_maintainer_agent"
    ]) {
      expect(getAgentManifest(id)).toBeDefined();
    }
  });

  it("blocks every agent from human-only decisions even when not listed locally", async () => {
    for (const agent of familyAgentManifests) {
      for (const action of humanOnlyActions) {
        expect(
          await evaluateAgentAction({ agentId: agent.id, action, targetResourceRef: "resource_synthetic" })
        ).toMatchObject({ allowed: false });
      }
    }
  });

  it("keeps the open-source maintainer outside private tenant memory", () => {
    expect(getAgentManifest("open_source_maintainer_agent")).toMatchObject({
      defaultScope: "public",
      canAccessPrivateTenant: false,
      requiresGuardianReview: true
    });
  });

  it("fails closed for an unknown agent or action", async () => {
    expect(
      await evaluateAgentAction({ agentId: "unknown_agent", action: "read", targetResourceRef: "resource_synthetic" })
    ).toMatchObject({ allowed: false });
    expect(
      await evaluateAgentAction({
        agentId: "family_historian_agent",
        action: "unknown_action",
        targetResourceRef: "resource_synthetic"
      })
    ).toMatchObject({ allowed: false });
  });

  it("requires an opaque server-resolved authorization context before bounded agent work", async () => {
    expect(
      await evaluateAgentAction({
        agentId: "family_historian_agent",
        action: "read",
        targetResourceRef: "resource_synthetic"
      })
    ).toMatchObject({ allowed: false });
  });
});

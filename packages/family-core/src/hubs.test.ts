import { describe, expect, it } from "vitest";
import { guardianAgentProfiles, memoryScopes, type ContactDataPoint, type HubContribution } from "./index";

describe("family hub and contact primitives", () => {
  it("models private-first memory scopes", () => {
    expect(memoryScopes[0]).toBe("private");
    expect(memoryScopes).toContain("public");
  });

  it("requires Guardian review for contribution publishing workflows", () => {
    const contribution: HubContribution = {
      id: "contrib_1",
      familyId: "fam_1",
      sourceHubId: "hub_1",
      ownerMemberId: "mem_1",
      title: "Grandma's holiday recipe",
      summary: "Approved recipe draft for the family library.",
      targetVisibility: "family",
      status: "guardian_review",
      sensitivity: "medium",
      provenance: "self_reported by mem_1",
      guardianReviewRequired: true,
      createdAt: new Date().toISOString()
    };

    expect(contribution.guardianReviewRequired).toBe(true);
    expect(contribution.status).toBe("guardian_review");
  });

  it("stores contact data with consent, provenance, and visibility", () => {
    const contact: ContactDataPoint = {
      id: "contact_1",
      familyId: "fam_1",
      memberId: "mem_1",
      kind: "email",
      value: "person@example.com",
      sensitivity: "medium",
      visibility: "family",
      verificationStatus: "self_verified",
      source: "self_reported",
      sourceActorId: "mem_1",
      consentGrantId: "consent_1",
      createdAt: new Date().toISOString()
    };

    expect(contact.source).toBe("self_reported");
    expect(contact.consentGrantId).toBe("consent_1");
  });

  it("includes Guardian-oriented agent profiles", () => {
    expect(guardianAgentProfiles.map((profile) => profile.id)).toContain("guardian_agent");
  });
});

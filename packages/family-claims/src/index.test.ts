import { describe, expect, it } from "vitest";
import { canTransitionClaim, familyClaimSchema } from "./index";

describe("family claims", () => {
  it("parses a provenance-aware private claim", () => {
    const claim = familyClaimSchema.parse({
      claimId: "claim_1",
      familyId: "family_1",
      claimantId: "person_1",
      subject: { type: "person", id: "person_2" },
      predicate: "parent_of",
      object: { type: "person", id: "person_3" },
      evidenceRefs: [],
      sourceGrade: "unknown",
      extractedBy: "human",
      confidence: 0,
      status: "received",
      privacyScope: "core_circle",
      livingPersonsAffected: ["person_2", "person_3"],
      consentReceipts: [],
      reviewers: [],
      disputes: [],
      publicationStatus: "not_requested",
      createdAt: "2026-07-12T00:00:00.000Z",
      updatedAt: "2026-07-12T00:00:00.000Z"
    });

    expect(claim.status).toBe("received");
    expect(claim.privacyScope).toBe("core_circle");
  });

  it("allows agents to prepare but never accept a claim", () => {
    expect(
      canTransitionClaim({ from: "received", to: "quarantined", actorType: "agent", actorRole: "agent" })
    ).toMatchObject({ allowed: true });
    expect(
      canTransitionClaim({ from: "steward_reviewed", to: "accepted", actorType: "agent", actorRole: "agent" })
    ).toMatchObject({ allowed: false });
  });

  it("routes public release through the publication workflow", () => {
    expect(
      canTransitionClaim({
        from: "publication_review",
        to: "publicly_published",
        actorType: "human",
        actorRole: "family_steward"
      })
    ).toMatchObject({ allowed: false });
  });
});

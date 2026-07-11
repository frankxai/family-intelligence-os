import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "./index";

const base = {
  familyId: "fam_1",
  actorId: "actor_1",
  actorRole: "adult_member" as const,
  actionClass: "read",
  sensitivity: "low"
};

describe("evaluatePolicy", () => {
  it("allows low-sensitivity reads", () => {
    expect(evaluatePolicy(base)).toMatchObject({ allowed: true, confirmationMode: "none" });
  });

  it("blocks unknown actions", () => {
    expect(evaluatePolicy({ ...base, actionClass: "teleport" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("blocks unknown sensitivity", () => {
    expect(evaluatePolicy({ ...base, sensitivity: "mystery" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("blocks guests from high data", () => {
    expect(evaluatePolicy({ ...base, actorRole: "guest", sensitivity: "high" })).toMatchObject({
      allowed: false
    });
  });

  it("blocks child members from finance", () => {
    expect(evaluatePolicy({ ...base, actorRole: "child_member", actionClass: "finance", sensitivity: "critical" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("requires explicit confirmation for agent writes", () => {
    expect(evaluatePolicy({ ...base, actorRole: "agent", actionClass: "write", sensitivity: "medium" })).toMatchObject({
      allowed: false,
      confirmationMode: "explicit"
    });
  });

  it("restricts service accounts to connector scope", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "service_account",
        connectorId: "paperless_ngx",
        serviceAccountScope: ["immich"]
      })
    ).toMatchObject({ allowed: false });
  });

  it("blocks child data from publication even for a steward", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "family_steward",
        actionClass: "publish",
        sensitivity: "critical",
        targetCircle: "public_archive",
        containsChildData: true
      })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });

  it("blocks publication when a living person lacks active consent", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "family_steward",
        actionClass: "publish",
        sensitivity: "critical",
        targetCircle: "public_archive",
        livingPersonIds: ["person_1", "person_2"],
        activePublicConsentPersonIds: ["person_1"]
      })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });

  it("requires a publication steward after consent checks pass", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "adult_member",
        actionClass: "publish",
        sensitivity: "critical",
        targetCircle: "public_archive",
        livingPersonIds: [],
        activePublicConsentPersonIds: []
      })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });

  it("keeps publication confirmation in a dedicated human transaction", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "family_steward",
        actionClass: "publish",
        sensitivity: "critical",
        targetCircle: "public_archive",
        livingPersonIds: ["person_1"],
        activePublicConsentPersonIds: ["person_1"]
      })
    ).toMatchObject({ allowed: false, confirmationMode: "explicit" });
  });

  it("blocks succession release for an ordinary member", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "adult_member",
        actionClass: "release_access",
        sensitivity: "critical",
        triggerEvidenceVerified: true,
        guardianApprovalCount: 2,
        requiredGuardianApprovals: 2
      })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });

  it("requires guardian quorum and a final release transaction", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "continuity_guardian",
        actionClass: "release_access",
        sensitivity: "critical",
        triggerEvidenceVerified: true,
        guardianApprovalCount: 1,
        requiredGuardianApprovals: 2
      })
    ).toMatchObject({ allowed: false, confirmationMode: "multi_party" });

    expect(
      evaluatePolicy({
        ...base,
        actorRole: "continuity_guardian",
        actionClass: "release_access",
        sensitivity: "critical",
        triggerEvidenceVerified: true,
        guardianApprovalCount: 2,
        requiredGuardianApprovals: 2
      })
    ).toMatchObject({ allowed: false, confirmationMode: "explicit" });
  });

  it("never lets the application verify death", () => {
    expect(
      evaluatePolicy({ ...base, actorRole: "family_owner", actionClass: "verify_death", sensitivity: "critical" })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });
});

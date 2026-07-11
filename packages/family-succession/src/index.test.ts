import { describe, expect, it } from "vitest";
import { evaluateSuccessionRelease, successionPolicySchema } from "./index";

const policy = successionPolicySchema.parse({
  policyId: "policy_1",
  familyId: "family_1",
  ownerPersonId: "person_1",
  triggerType: "death",
  guardianPersonIds: ["guardian_1", "guardian_2", "guardian_3"],
  quorum: 2,
  verificationRequirements: ["independent death verification"],
  coolingPeriodHours: 72,
  releaseScopes: ["approved legacy archive"],
  secretExportAllowed: false,
  status: "active",
  createdAt: "2026-07-12T00:00:00.000Z"
});

describe("succession release", () => {
  it("never accepts an inactivity timer", () => {
    expect(
      evaluateSuccessionRelease({
        policy,
        triggerEvidenceVerified: true,
        triggerSource: "inactivity_timer",
        approvedByPersonIds: ["guardian_1", "guardian_2"],
        triggerVerifiedAt: "2026-07-12T00:00:00.000Z",
        now: new Date("2026-07-20T00:00:00.000Z")
      })
    ).toMatchObject({ allowed: false });
  });

  it("requires guardian quorum", () => {
    expect(
      evaluateSuccessionRelease({
        policy,
        triggerEvidenceVerified: true,
        triggerSource: "verified_human_process",
        approvedByPersonIds: ["guardian_1"],
        triggerVerifiedAt: "2026-07-12T00:00:00.000Z",
        now: new Date("2026-07-20T00:00:00.000Z")
      })
    ).toMatchObject({ allowed: false });
  });

  it("requires the cooling period", () => {
    expect(
      evaluateSuccessionRelease({
        policy,
        triggerEvidenceVerified: true,
        triggerSource: "verified_human_process",
        approvedByPersonIds: ["guardian_1", "guardian_2"],
        triggerVerifiedAt: "2026-07-12T00:00:00.000Z",
        now: new Date("2026-07-13T00:00:00.000Z")
      })
    ).toMatchObject({ allowed: false });
  });

  it("passes only after verified human trigger, quorum, and cooling", () => {
    expect(
      evaluateSuccessionRelease({
        policy,
        triggerEvidenceVerified: true,
        triggerSource: "verified_human_process",
        approvedByPersonIds: ["guardian_1", "guardian_2"],
        triggerVerifiedAt: "2026-07-12T00:00:00.000Z",
        now: new Date("2026-07-20T00:00:00.000Z")
      })
    ).toMatchObject({ allowed: true });
  });
});

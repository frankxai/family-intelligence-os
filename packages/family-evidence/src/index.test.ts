import { describe, expect, it } from "vitest";
import { evidenceMayBePublished, evidenceSchema } from "./index";

const baseEvidence = {
  evidenceId: "evidence_1",
  familyId: "family_1",
  kind: "letter" as const,
  title: "Private source",
  sourceGrade: "B" as const,
  rightsStatus: "permission_granted" as const,
  allowedUses: ["private_research", "publication"] as const,
  sensitivity: "high" as const,
  livingPersonsAffected: [],
  claimRefs: ["claim_1"],
  storageRef: "family://evidence/evidence_1",
  providedBy: "person_1",
  obtainedAt: "2026-07-12T00:00:00.000Z",
  createdAt: "2026-07-12T00:00:00.000Z"
};

describe("family evidence", () => {
  it("requires a durable source reference", () => {
    const { storageRef: _storageRef, ...withoutReference } = baseEvidence;
    expect(() => evidenceSchema.parse(withoutReference)).toThrow();
  });

  it("blocks evidence that affects a living person", () => {
    const evidence = evidenceSchema.parse({ ...baseEvidence, livingPersonsAffected: ["person_2"] });
    expect(evidenceMayBePublished(evidence)).toMatchObject({ allowed: false });
  });

  it("permits only rights-cleared evidence without living-person impact", () => {
    const evidence = evidenceSchema.parse(baseEvidence);
    expect(evidenceMayBePublished(evidence)).toMatchObject({ allowed: true });
  });
});

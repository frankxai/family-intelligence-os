import { describe, expect, it } from "vitest";
import {
  assessAttachment,
  createIntakeToken,
  createQuarantinedIntakeCase,
  redeemIntakeToken,
  transitionIntakeCase
} from "./index";

describe("secure family intake", () => {
  it("creates a hashed, single-use token and rejects replay", () => {
    const created = createIntakeToken({
      familyId: "family_synthetic",
      issuedBy: "steward_synthetic",
      allowedAction: "submit_claim",
      minimumScope: "self",
      now: "2026-07-13T10:00:00.000Z",
      expiresAt: "2026-07-13T11:00:00.000Z"
    });

    expect(created.record.secretHash).not.toContain(created.token);
    const redeemed = redeemIntakeToken(created.record, created.token, "2026-07-13T10:05:00.000Z");
    expect(redeemed).toMatchObject({ status: "redeemed", useCount: 1 });
    expect(() => redeemIntakeToken(redeemed, created.token, "2026-07-13T10:06:00.000Z")).toThrow(
      "Invalid or unavailable"
    );
  });

  it("creates a quarantined case without accepted claims or attachments", () => {
    expect(
      createQuarantinedIntakeCase({
        familyId: "family_synthetic",
        channel: "secure_form",
        now: "2026-07-13T10:00:00.000Z"
      })
    ).toMatchObject({
      state: "quarantined",
      privacyScope: "self",
      attachmentRefs: [],
      claimRefs: []
    });
  });

  it("prevents agents from making steward decisions", () => {
    const intakeCase = createQuarantinedIntakeCase({ familyId: "family_synthetic", channel: "api" });
    const awaiting = transitionIntakeCase({
      intakeCase,
      target: "awaiting_secure_evidence",
      actorType: "agent",
      auditRef: "audit_1"
    });
    const scanning = transitionIntakeCase({ intakeCase: awaiting, target: "scan_pending", actorType: "agent", auditRef: "audit_2" });
    const extraction = transitionIntakeCase({ intakeCase: scanning, target: "extraction_ready", actorType: "agent", auditRef: "audit_3" });
    const normalized = transitionIntakeCase({ intakeCase: extraction, target: "normalized", actorType: "agent", auditRef: "audit_4" });
    const review = transitionIntakeCase({ intakeCase: normalized, target: "review_ready", actorType: "agent", auditRef: "audit_5" });

    expect(() =>
      transitionIntakeCase({ intakeCase: review, target: "steward_decided", actorType: "agent", auditRef: "audit_6" })
    ).toThrow("authorized human steward");
  });

  it("allows a PDF only into quarantine and rejects archives and DNA", () => {
    expect(
      assessAttachment({ fileName: "source.pdf", declaredMime: "application/pdf", detectedMime: "application/pdf", sizeBytes: 1024 })
    ).toMatchObject({ allowedForQuarantine: true });
    expect(assessAttachment({ fileName: "records.zip", declaredMime: "application/zip", sizeBytes: 1024 })).toMatchObject({
      allowedForQuarantine: false
    });
    expect(
      assessAttachment({ fileName: "sample.txt", declaredMime: "text/plain", sizeBytes: 1024, sensitiveKind: "dna" })
    ).toMatchObject({ allowedForQuarantine: false });
  });
});

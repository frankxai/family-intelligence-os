import { describe, expect, it } from "vitest";
import { consentReceiptSchema, hasPublicationConsent, isConsentActive } from "./index";

const baseReceipt = {
  consentId: "consent_1",
  familyId: "family_1",
  subjectPersonId: "person_1",
  authorizedByPersonId: "person_1",
  authorityBasis: "self" as const,
  purposes: ["approved biography"],
  dataCategories: ["name", "story"],
  scope: "public_archive" as const,
  actions: ["publish"] as const,
  noticeVersion: "de-1.0",
  noticeLanguage: "de",
  grantedAt: "2026-07-12T00:00:00.000Z",
  status: "active" as const
};

describe("consent receipts", () => {
  it("recognizes active self-consent", () => {
    const receipt = consentReceiptSchema.parse(baseReceipt);
    expect(isConsentActive(receipt, new Date("2026-07-13T00:00:00.000Z"))).toBe(true);
    expect(hasPublicationConsent([receipt], ["person_1"])).toBe(true);
  });

  it("does not treat guardian consent as public consent for a living person", () => {
    const receipt = consentReceiptSchema.parse({
      ...baseReceipt,
      authorizedByPersonId: "guardian_1",
      authorityBasis: "legal_guardian"
    });
    expect(hasPublicationConsent([receipt], ["person_1"])).toBe(false);
  });

  it("honors withdrawal immediately", () => {
    const receipt = consentReceiptSchema.parse({
      ...baseReceipt,
      status: "withdrawn",
      withdrawnAt: "2026-07-13T00:00:00.000Z"
    });
    expect(isConsentActive(receipt, new Date("2026-07-14T00:00:00.000Z"))).toBe(false);
  });
});

import { z } from "zod";
import { familyCircles } from "@family/core";

export const consentReceiptSchema = z.object({
  consentId: z.string().min(1),
  familyId: z.string().min(1),
  subjectPersonId: z.string().min(1),
  authorizedByPersonId: z.string().min(1),
  authorityBasis: z.enum(["self", "parental_responsibility", "legal_guardian", "authorized_representative"]),
  purposes: z.array(z.string().min(1).max(240)).min(1),
  dataCategories: z.array(z.string().min(1)).min(1),
  scope: z.enum(familyCircles),
  actions: z.array(z.enum(["collect", "store", "transcribe", "summarize", "share", "publish", "ai_process", "export"])).min(1),
  noticeVersion: z.string().min(1),
  noticeLanguage: z.string().min(2).max(35),
  grantedAt: z.string().datetime(),
  expiresAt: z.string().datetime().optional(),
  withdrawnAt: z.string().datetime().optional(),
  status: z.enum(["active", "expired", "withdrawn", "superseded"]),
  ageTransitionReviewAt: z.string().datetime().optional()
});

export type ConsentReceipt = z.infer<typeof consentReceiptSchema>;

export function isConsentActive(receipt: ConsentReceipt, now = new Date()): boolean {
  if (receipt.status !== "active" || receipt.withdrawnAt) return false;
  return !receipt.expiresAt || new Date(receipt.expiresAt).getTime() > now.getTime();
}

export function hasPublicationConsent(receipts: ConsentReceipt[], personIds: string[]): boolean {
  return personIds.every((personId) =>
    receipts.some(
      (receipt) =>
        receipt.subjectPersonId === personId &&
        receipt.scope === "public_archive" &&
        receipt.actions.includes("publish") &&
        receipt.authorityBasis === "self" &&
        isConsentActive(receipt)
    )
  );
}

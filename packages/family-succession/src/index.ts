import { z } from "zod";

export const successionPolicySchema = z.object({
  policyId: z.string().min(1),
  familyId: z.string().min(1),
  ownerPersonId: z.string().min(1),
  triggerType: z.enum(["emergency", "incapacity", "death"]),
  guardianPersonIds: z.array(z.string().min(1)).min(2),
  quorum: z.number().int().min(2),
  verificationRequirements: z.array(z.string().min(1)).min(1),
  coolingPeriodHours: z.number().int().min(0),
  releaseScopes: z.array(z.string().min(1)).min(1),
  secretExportAllowed: z.literal(false),
  status: z.enum(["draft", "active", "suspended", "revoked"]),
  createdAt: z.string().datetime()
}).refine((value) => value.quorum <= value.guardianPersonIds.length, {
  message: "Quorum cannot exceed designated guardians."
});

export type SuccessionPolicy = z.infer<typeof successionPolicySchema>;

export function evaluateSuccessionRelease(input: {
  policy: SuccessionPolicy;
  triggerEvidenceVerified: boolean;
  triggerSource: "verified_human_process" | "inactivity_timer" | "agent_inference";
  approvedByPersonIds: string[];
  triggerVerifiedAt: string;
  now?: Date;
}): { allowed: boolean; reason: string } {
  const now = input.now ?? new Date();
  if (input.policy.status !== "active") return { allowed: false, reason: "Succession policy is not active." };
  if (input.triggerSource !== "verified_human_process" || !input.triggerEvidenceVerified) {
    return { allowed: false, reason: "Inactivity and agent inference can never trigger release." };
  }
  const guardianApprovals = new Set(
    input.approvedByPersonIds.filter((personId) => input.policy.guardianPersonIds.includes(personId))
  );
  if (guardianApprovals.size < input.policy.quorum) {
    return { allowed: false, reason: "Guardian quorum is not satisfied." };
  }
  const strictInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
  const triggerVerifiedAt = strictInstantPattern.test(input.triggerVerifiedAt)
    ? Date.parse(input.triggerVerifiedAt)
    : Number.NaN;
  const nowTime = now.getTime();
  if (!Number.isFinite(triggerVerifiedAt) || !Number.isFinite(nowTime) || triggerVerifiedAt > nowTime) {
    return { allowed: false, reason: "Trigger verification time is invalid." };
  }
  const coolingEndsAt = triggerVerifiedAt + input.policy.coolingPeriodHours * 60 * 60 * 1000;
  if (nowTime < coolingEndsAt) return { allowed: false, reason: "Cooling period is still active." };
  return { allowed: true, reason: "Verified trigger, guardian quorum, and cooling period pass." };
}

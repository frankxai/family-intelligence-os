import { z } from "zod";
import { familyCircles } from "@family/core";
import type { FamilyRole } from "@family/core";

export const claimStatuses = [
  "received",
  "quarantined",
  "normalized",
  "possible_duplicate",
  "evidence_reviewed",
  "consent_reviewed",
  "steward_reviewed",
  "accepted",
  "disputed",
  "rejected",
  "unresolved",
  "privately_available",
  "publication_review",
  "publicly_published"
] as const;

export type ClaimStatus = (typeof claimStatuses)[number];

export const familyClaimSchema = z.object({
  claimId: z.string().min(1),
  familyId: z.string().min(1),
  claimantId: z.string().min(1),
  subject: z.object({ type: z.enum(["person", "event", "place", "organization", "artifact", "relationship"]), id: z.string().min(1), label: z.string().max(240).optional() }),
  predicate: z.string().min(1).max(120),
  object: z.union([
    z.object({ type: z.enum(["person", "event", "place", "organization", "artifact", "relationship"]), id: z.string().min(1), label: z.string().max(240).optional() }),
    z.string().min(1).max(2000),
    z.number(),
    z.boolean()
  ]),
  evidenceRefs: z.array(z.string().min(1)).default([]),
  sourceGrade: z.enum(["A", "B", "C", "D", "unknown"]),
  extractedBy: z.string().min(1),
  confidence: z.number().min(0).max(1),
  status: z.enum(claimStatuses),
  privacyScope: z.enum(familyCircles),
  livingPersonsAffected: z.array(z.string().min(1)).default([]),
  consentReceipts: z.array(z.string().min(1)).default([]),
  reviewers: z.array(z.string().min(1)).default([]),
  disputes: z.array(z.string().min(1)).default([]),
  supersedes: z.string().min(1).optional(),
  publicationStatus: z.enum(["not_requested", "blocked", "pending_review", "approved", "published", "withdrawn"]),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
});

export type FamilyClaim = z.infer<typeof familyClaimSchema>;

const agentAllowedTransitions: Partial<Record<ClaimStatus, ClaimStatus[]>> = {
  received: ["quarantined"],
  quarantined: ["normalized"],
  normalized: ["possible_duplicate", "evidence_reviewed"],
  possible_duplicate: ["evidence_reviewed"],
  evidence_reviewed: ["consent_reviewed"],
  consent_reviewed: ["steward_reviewed"]
};

const stewardRoles = new Set<FamilyRole>(["family_owner", "family_admin", "family_steward", "branch_steward", "independent_reviewer"]);

export function canTransitionClaim(input: {
  from: ClaimStatus;
  to: ClaimStatus;
  actorType: "human" | "agent" | "service";
  actorRole: FamilyRole;
}): { allowed: boolean; reason: string } {
  if (input.actorType === "agent") {
    const allowed = agentAllowedTransitions[input.from]?.includes(input.to) ?? false;
    return {
      allowed,
      reason: allowed
        ? "Agent may prepare a review state."
        : "Agents cannot accept, reject, dispute, publish, or make a claim privately authoritative."
    };
  }

  if (input.actorType === "service") {
    return { allowed: false, reason: "Service accounts cannot change claim review authority." };
  }

  if (!stewardRoles.has(input.actorRole)) {
    return { allowed: false, reason: "This claim transition requires an authorized human steward." };
  }

  if (input.to === "publicly_published") {
    return { allowed: false, reason: "Public release requires the separate publication decision workflow." };
  }

  return { allowed: true, reason: "Authorized human steward transition." };
}

import { z } from "zod";

export const evidenceSchema = z.object({
  evidenceId: z.string().min(1),
  familyId: z.string().min(1),
  kind: z.enum(["civil_record", "church_record", "letter", "photo", "audio", "video", "oral_history", "book", "index", "tree", "web_page", "research_note", "other"]),
  title: z.string().min(1).max(500),
  sourceGrade: z.enum(["A", "B", "C", "D", "unknown"]),
  rightsStatus: z.enum(["owned", "licensed", "public_domain", "permission_granted", "review_required", "blocked"]),
  allowedUses: z.array(z.enum(["private_research", "family_share", "publication", "derivative", "ai_processing"])).default([]),
  sensitivity: z.enum(["low", "medium", "high", "critical"]),
  livingPersonsAffected: z.array(z.string().min(1)).default([]),
  claimRefs: z.array(z.string().min(1)).default([]),
  sourceUri: z.string().url().optional(),
  storageRef: z.string().min(1).optional(),
  sha256: z.string().regex(/^[a-fA-F0-9]{64}$/).optional(),
  providedBy: z.string().min(1),
  obtainedAt: z.string().datetime(),
  createdAt: z.string().datetime()
}).refine((value) => Boolean(value.sourceUri || value.storageRef), {
  message: "Evidence requires a source URI or family-owned storage reference."
});

export type FamilyEvidence = z.infer<typeof evidenceSchema>;

export function evidenceMayBePublished(evidence: FamilyEvidence): { allowed: boolean; reason: string } {
  if (evidence.rightsStatus === "blocked" || evidence.rightsStatus === "review_required") {
    return { allowed: false, reason: "Evidence rights are not cleared for publication." };
  }
  if (!evidence.allowedUses.includes("publication")) {
    return { allowed: false, reason: "Publication is outside the evidence use grant." };
  }
  if (evidence.livingPersonsAffected.length > 0) {
    return { allowed: false, reason: "Living-person evidence requires a separate publication and consent decision." };
  }
  return { allowed: true, reason: "Evidence rights and living-person gate pass." };
}

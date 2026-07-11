import { z } from "zod";
import { familyCircles } from "@family/core";
import type { FamilyRole } from "@family/core";

export const exportManifestSchema = z.object({
  exportId: z.string().min(1),
  familyId: z.string().min(1),
  createdByPersonId: z.string().min(1),
  createdAt: z.string().datetime(),
  formatVersion: z.literal("1.0"),
  scope: z.array(z.enum(familyCircles)).min(1),
  encryption: z.object({
    required: z.literal(true),
    algorithm: z.string().min(1),
    keyDelivery: z.enum(["separate_verified_channel", "recipient_public_key"])
  }),
  files: z.array(z.object({
    path: z.string().min(1),
    mediaType: z.string().min(1),
    bytes: z.number().int().min(0),
    sha256: z.string().regex(/^[a-fA-F0-9]{64}$/)
  })),
  excludedCategories: z.array(z.string().min(1)),
  restoreTestRequired: z.literal(true),
  expiresAt: z.string().datetime().optional()
});

export type FamilyExportManifest = z.infer<typeof exportManifestSchema>;

const exportAuthorityRoles = new Set<FamilyRole>([
  "family_owner",
  "family_admin",
  "family_steward",
  "adult_member",
  "elder_member"
]);

export function evaluateExportRequest(input: {
  actorRole: FamilyRole;
  actorOwnDataOnly: boolean;
  reauthenticated: boolean;
  explicitConfirmation: boolean;
  containsSecrets: boolean;
  containsDisputedOrWithdrawnData: boolean;
  containsScopeIneligibleChildData: boolean;
  rightsCleared: boolean;
}): { allowed: boolean; reason: string } {
  if (!exportAuthorityRoles.has(input.actorRole)) {
    return { allowed: false, reason: "This role cannot request a family export." };
  }
  if ((input.actorRole === "adult_member" || input.actorRole === "elder_member") && !input.actorOwnDataOnly) {
    return { allowed: false, reason: "Members may export their own eligible data; a steward is required for broader family scope." };
  }
  if (!input.reauthenticated || !input.explicitConfirmation) {
    return { allowed: false, reason: "Export requires recent re-authentication and an explicit preview confirmation." };
  }
  if (input.containsSecrets) return { allowed: false, reason: "Secrets and recovery material cannot enter the family export." };
  if (input.containsDisputedOrWithdrawnData) {
    return { allowed: false, reason: "Disputed or withdrawn data must be resolved or excluded." };
  }
  if (input.containsScopeIneligibleChildData) {
    return { allowed: false, reason: "Child data outside the authorized scope must be excluded." };
  }
  if (!input.rightsCleared) return { allowed: false, reason: "Source and media rights must allow export." };
  return { allowed: true, reason: "Authorization and exclusion gates pass; create an encrypted, expiring package and audit it." };
}

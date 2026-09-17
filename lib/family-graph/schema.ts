import { z } from "zod";
import { familyCircles, familyRoles, memoryScopes, sensitivities } from "@family/core";
import { consentReceiptSchema } from "@family/consent";
import { evidenceSchema } from "@family/evidence";
import { familyClaimSchema } from "@family/claims";
import { successionPolicySchema } from "@family/succession";

/**
 * FamilyPacket.v1 — the single validated document a family owns.
 *
 * The packages under `packages/family-*` each own one decision (consent, evidence rights,
 * claim authority, succession release, export authorization). Nothing owned the *graph* those
 * decisions are made about, so every caller assembled its own shape. This is that graph, and it
 * imports the existing schemas rather than restating them.
 */

export const FAMILY_PACKET_VERSION = "FamilyPacket.v1" as const;

/**
 * Kernel rule: every node and edge carries owner, provenance, version, visibility, and the
 * named rule that decides whether it may leave the family boundary. `evaluationRule` is the
 * exported function name in this repo that governs the node — not prose, a lookup key.
 */
export const nodeMetaSchema = z.object({
  owner: z.string().min(1),
  provenance: z.object({
    source: z.enum(["self_reported", "family_reported", "connector_import", "public_source", "derived"]),
    sourceActorId: z.string().min(1),
    recordedAt: z.string().datetime()
  }),
  version: z.number().int().min(1),
  visibility: z.enum(familyCircles),
  evaluationRule: z.enum([
    "hasPublicationConsent",
    "evidenceMayBePublished",
    "canTransitionClaim",
    "evaluateSuccessionRelease",
    "evaluateExportRequest",
    "projectPublicSafe",
    "stewardAuthorityOnly",
    "neverLeavesFamily"
  ])
});

export type NodeMeta = z.infer<typeof nodeMetaSchema>;

const withMeta = <T extends z.ZodRawShape>(shape: T) => z.object({ meta: nodeMetaSchema, ...shape });

// 1 — Sensitivity. A label is a node, not a field, because it is reviewed and versioned
// independently of the thing it labels.
export const sensitivityNodeSchema = withMeta({
  kind: z.literal("sensitivity"),
  id: z.string().min(1),
  targetRef: z.string().min(1),
  level: z.enum(sensitivities),
  rationale: z.string().min(1).max(480),
  reviewedByStewardId: z.string().min(1).optional()
});

// 2 — Consent. Reused verbatim from @family/consent.
export const consentNodeSchema = withMeta({
  kind: z.literal("consent"),
  receipt: consentReceiptSchema
});

// 3 — Person. Sensitivity and consent are mandatory: a person cannot enter the packet
// unlabelled, and a person without a death record cannot enter without a consent receipt.
export const personNodeSchema = withMeta({
  kind: z.literal("person"),
  id: z.string().min(1),
  displayName: z.string().min(1).max(120),
  birthYear: z.number().int().min(1000).max(2200).optional(),
  deathRecord: z
    .object({
      year: z.number().int().min(1000).max(2200),
      evidenceId: z.string().min(1),
      verifiedByStewardId: z.string().min(1)
    })
    .optional(),
  sensitivityId: z.string().min(1),
  consentIds: z.array(z.string().min(1)).default([]),
  summary: z.string().min(1).max(480),
  place: z.string().min(1).max(120).optional()
}).superRefine((person, ctx) => {
  if (!person.deathRecord && person.consentIds.length === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["consentIds"],
      message: "A person with no verified death record requires at least one consent receipt."
    });
  }
});

// 4 — Relationship.
export const relationshipNodeSchema = withMeta({
  kind: z.literal("relationship"),
  id: z.string().min(1),
  fromPersonId: z.string().min(1),
  toPersonId: z.string().min(1),
  relation: z.enum(["parent", "adoptive_parent", "guardian", "partner", "chosen_family"]),
  claimId: z.string().min(1),
  label: z.string().min(1).max(100).optional()
});

// 5 — Role.
export const roleNodeSchema = withMeta({
  kind: z.literal("role"),
  id: z.string().min(1),
  personId: z.string().min(1),
  role: z.enum(familyRoles),
  scope: z.enum(memoryScopes)
});

// 6 — Source. Where material came from, distinct from the artifact itself.
export const sourceNodeSchema = withMeta({
  kind: z.literal("source"),
  id: z.string().min(1),
  repository: z.string().min(1).max(240),
  citation: z.string().min(1).max(600),
  accessedAt: z.string().datetime(),
  jurisdictionId: z.string().min(1).optional()
});

// 7 — Evidence. Reused verbatim from @family/evidence.
export const evidenceNodeSchema = withMeta({
  kind: z.literal("evidence"),
  sourceId: z.string().min(1),
  record: evidenceSchema
});

// 8 — Claim. Reused verbatim from @family/claims.
export const claimNodeSchema = withMeta({
  kind: z.literal("claim"),
  record: familyClaimSchema
});

// 9 — Jurisdiction. Living-person and embargo rules are law, not preference.
export const jurisdictionNodeSchema = withMeta({
  kind: z.literal("jurisdiction"),
  id: z.string().min(1),
  code: z.string().regex(/^[a-z]{2}(_[a-z0-9_]+)?$/),
  packVersion: z.string().min(1),
  livingPersonRule: z.enum(["consent_required", "never_publish"]),
  recordEmbargoYears: z.number().int().min(0).max(150)
});

// 10 — Steward. Who may decide, and what they may decide.
export const stewardNodeSchema = withMeta({
  kind: z.literal("steward"),
  id: z.string().min(1),
  personId: z.string().min(1),
  role: z.enum(familyRoles),
  mayApprovePublication: z.boolean(),
  mayApproveExport: z.boolean(),
  appointedAt: z.string().datetime()
});

// 11 — SuccessionEvent. Records the gate outcome; it never grants access by itself.
export const successionEventNodeSchema = withMeta({
  kind: z.literal("succession_event"),
  id: z.string().min(1),
  policy: successionPolicySchema,
  triggerVerifiedAt: z.string().datetime(),
  triggerSource: z.enum(["verified_human_process", "inactivity_timer", "agent_inference"]),
  triggerEvidenceVerified: z.boolean(),
  approvedByPersonIds: z.array(z.string().min(1)).default([]),
  outcome: z.enum(["pending", "released", "refused"]),
  outcomeReason: z.string().min(1).max(480)
});

// 12 — StoryArtifact. Narrative built from accepted claims, with its own media rights.
export const storyArtifactNodeSchema = withMeta({
  kind: z.literal("story_artifact"),
  id: z.string().min(1),
  title: z.string().min(1).max(120),
  body: z.string().min(1).max(4000),
  aboutPersonIds: z.array(z.string().min(1)).default([]),
  sourceClaimIds: z.array(z.string().min(1)).min(1),
  mediaRights: z.object({
    rightsStatus: z.enum(["owned", "licensed", "public_domain", "permission_granted", "review_required", "blocked"]),
    holder: z.string().min(1),
    allowsPublication: z.boolean()
  })
});

// 13 — PublicProjection. The compiled, public-safe output and its exclusion ledger.
export const publicProjectionNodeSchema = withMeta({
  kind: z.literal("public_projection"),
  id: z.string().min(1),
  packetVersion: z.literal(FAMILY_PACKET_VERSION),
  packetRevision: z.number().int().min(1),
  compiledAt: z.string().datetime(),
  jurisdictionId: z.string().min(1),
  includedPersonIds: z.array(z.string().min(1)),
  includedRelationshipIds: z.array(z.string().min(1)),
  includedStoryArtifactIds: z.array(z.string().min(1)),
  exclusions: z.array(
    z.object({
      ref: z.string().min(1),
      reason: z.enum([
        "living_person_without_publish_consent",
        "living_person_never_publish_jurisdiction",
        "claim_not_accepted",
        "evidence_rights_not_cleared",
        "media_rights_not_cleared",
        "record_under_embargo",
        "references_excluded_person",
        "deleted"
      ])
    })
  )
});

export const familyPacketSchema = z
  .object({
    packetVersion: z.literal(FAMILY_PACKET_VERSION),
    familyId: z.string().min(1),
    revision: z.number().int().min(1),
    generatedAt: z.string().datetime(),
    jurisdictionId: z.string().min(1),
    sensitivities: z.array(sensitivityNodeSchema).default([]),
    consents: z.array(consentNodeSchema).default([]),
    people: z.array(personNodeSchema).default([]),
    relationships: z.array(relationshipNodeSchema).default([]),
    roles: z.array(roleNodeSchema).default([]),
    sources: z.array(sourceNodeSchema).default([]),
    evidence: z.array(evidenceNodeSchema).default([]),
    claims: z.array(claimNodeSchema).default([]),
    jurisdictions: z.array(jurisdictionNodeSchema).min(1),
    stewards: z.array(stewardNodeSchema).default([]),
    successionEvents: z.array(successionEventNodeSchema).default([]),
    storyArtifacts: z.array(storyArtifactNodeSchema).default([]),
    projections: z.array(publicProjectionNodeSchema).default([]),
    tombstones: z.array(
      z.object({
        tombstoneId: z.string().min(1),
        subjectRef: z.string().min(1),
        deletedAt: z.string().datetime(),
        deletedByStewardId: z.string().min(1),
        removedFields: z.array(z.string().min(1)).min(1),
        retentionBasis: z.enum(["none", "legal_obligation", "dispute_record"]),
        revisionBefore: z.number().int().min(1)
      })
    ).default([])
  })
  .strict()
  .superRefine((packet, ctx) => {
    const personIds = new Set(packet.people.map((p) => p.id));
    const sensitivityIds = new Set(packet.sensitivities.map((s) => s.id));
    const consentIds = new Set(packet.consents.map((c) => c.receipt.consentId));

    for (const person of packet.people) {
      if (!sensitivityIds.has(person.sensitivityId)) {
        ctx.addIssue({ code: "custom", message: `Person ${person.id} references an unknown sensitivity label.` });
      }
      for (const consentId of person.consentIds) {
        if (!consentIds.has(consentId)) {
          ctx.addIssue({ code: "custom", message: `Person ${person.id} references an unknown consent receipt.` });
        }
      }
    }
    for (const relationship of packet.relationships) {
      if (!personIds.has(relationship.fromPersonId) || !personIds.has(relationship.toPersonId)) {
        ctx.addIssue({ code: "custom", message: `Relationship ${relationship.id} references an unknown person.` });
      }
    }
    if (!packet.jurisdictions.some((j) => j.id === packet.jurisdictionId)) {
      ctx.addIssue({ code: "custom", message: "The packet jurisdiction is not present in the packet." });
    }
  });

export type FamilyPacket = z.infer<typeof familyPacketSchema>;
export type PersonNode = z.infer<typeof personNodeSchema>;
export type ConsentNode = z.infer<typeof consentNodeSchema>;
export type ClaimNode = z.infer<typeof claimNodeSchema>;
export type EvidenceNode = z.infer<typeof evidenceNodeSchema>;
export type StoryArtifactNode = z.infer<typeof storyArtifactNodeSchema>;
export type PublicProjectionNode = z.infer<typeof publicProjectionNodeSchema>;
export type JurisdictionNode = z.infer<typeof jurisdictionNodeSchema>;
export type SuccessionEventNode = z.infer<typeof successionEventNodeSchema>;
export type FamilyTombstone = FamilyPacket["tombstones"][number];

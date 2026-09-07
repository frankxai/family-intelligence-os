import { canTransitionClaim, type ClaimStatus, type FamilyClaim } from "@family/claims";
import { hasPublicationConsent, isConsentActive, type ConsentReceipt } from "@family/consent";
import { evidenceMayBePublished } from "@family/evidence";
import { evaluateExportRequest, exportManifestSchema, type FamilyExportManifest } from "@family/export";
import { evaluateSuccessionRelease } from "@family/succession";
import type { FamilyRole } from "@family/core";

import {
  FAMILY_PACKET_VERSION,
  familyPacketSchema,
  type FamilyPacket,
  type FamilyTombstone,
  type JurisdictionNode,
  type PersonNode,
  type PublicProjectionNode,
  type SuccessionEventNode
} from "./schema";
import { gradeToConclusion, type AtlasSourceV1 } from "./atlas-bridge";

/**
 * The one flow: secure intake → reviewed claim → public-safe projection.
 * Every function here is pure. No I/O, no clock reads except an injected `now`.
 */

export type PacketValidation =
  | { ok: true; packet: FamilyPacket }
  | { ok: false; issues: string[] };

export function validatePacket(input: unknown): PacketValidation {
  const parsed = familyPacketSchema.safeParse(input);
  if (parsed.success) return { ok: true, packet: parsed.data };
  return { ok: false, issues: parsed.error.issues.map((issue) => `${issue.path.join(".") || "packet"}: ${issue.message}`) };
}

// ── Intake ────────────────────────────────────────────────────────────────────

export type IntakeSubmission = {
  submissionId: string;
  familyId: string;
  claimantId: string;
  subject: FamilyClaim["subject"];
  predicate: string;
  object: FamilyClaim["object"];
  evidenceRefs: string[];
  sourceGrade: FamilyClaim["sourceGrade"];
  livingPersonsAffected: string[];
  receivedAt: string;
};

/**
 * Intake never produces a fact. It produces a quarantined claim whose publication status is
 * blocked until a human steward decides otherwise.
 */
export function intakeToQuarantinedClaim(submission: IntakeSubmission): FamilyClaim {
  return {
    claimId: `claim_${submission.submissionId}`,
    familyId: submission.familyId,
    claimantId: submission.claimantId,
    subject: submission.subject,
    predicate: submission.predicate,
    object: submission.object,
    evidenceRefs: submission.evidenceRefs,
    sourceGrade: submission.sourceGrade,
    extractedBy: "intake_pipeline",
    confidence: 0,
    status: "quarantined",
    privacyScope: "core_circle",
    livingPersonsAffected: submission.livingPersonsAffected,
    consentReceipts: [],
    reviewers: [],
    disputes: [],
    publicationStatus: "blocked",
    createdAt: submission.receivedAt,
    updatedAt: submission.receivedAt
  };
}

export type ClaimReview = { claim: FamilyClaim; changed: boolean; reason: string };

/** Advances a claim only where `canTransitionClaim` allows it. Refusals are returned, not thrown. */
export function reviewClaim(input: {
  claim: FamilyClaim;
  to: ClaimStatus;
  actorType: "human" | "agent" | "service";
  actorRole: FamilyRole;
  actorId: string;
  at: string;
}): ClaimReview {
  const verdict = canTransitionClaim({
    from: input.claim.status,
    to: input.to,
    actorType: input.actorType,
    actorRole: input.actorRole
  });
  if (!verdict.allowed) return { claim: input.claim, changed: false, reason: verdict.reason };

  return {
    claim: {
      ...input.claim,
      status: input.to,
      reviewers: input.claim.reviewers.includes(input.actorId)
        ? input.claim.reviewers
        : [...input.claim.reviewers, input.actorId],
      updatedAt: input.at
    },
    changed: true,
    reason: verdict.reason
  };
}

// ── Living-person gate ────────────────────────────────────────────────────────

/** A person is living for projection purposes unless a steward-verified death record exists. */
export function isLiving(person: PersonNode): boolean {
  return !person.deathRecord;
}

export type PersonPublishVerdict = {
  allowed: boolean;
  reason: PublicProjectionNode["exclusions"][number]["reason"] | "eligible";
};

export function mayProjectPerson(input: {
  person: PersonNode;
  consents: ConsentReceipt[];
  jurisdiction: JurisdictionNode;
  now: Date;
}): PersonPublishVerdict {
  if (!isLiving(input.person)) {
    const embargoEndsIn =
      (input.person.deathRecord?.year ?? 0) + input.jurisdiction.recordEmbargoYears;
    if (embargoEndsIn > input.now.getUTCFullYear()) {
      return { allowed: false, reason: "record_under_embargo" };
    }
    return { allowed: true, reason: "eligible" };
  }

  if (input.jurisdiction.livingPersonRule === "never_publish") {
    return { allowed: false, reason: "living_person_never_publish_jurisdiction" };
  }

  const own = input.consents.filter(
    (receipt) => input.person.consentIds.includes(receipt.consentId) && isConsentActive(receipt, input.now)
  );
  if (hasPublicationConsent(own, [input.person.id])) return { allowed: true, reason: "eligible" };
  return { allowed: false, reason: "living_person_without_publish_consent" };
}

/**
 * Free text is the leak the node filter misses: a deceased person's summary can name a living
 * relative. Any text that mentions an excluded person's display name is withheld.
 */
export function mentionsAny(text: string, names: readonly string[]): boolean {
  const haystack = text.toLowerCase();
  return names.some((name) => name.trim().length > 0 && haystack.includes(name.toLowerCase()));
}

// ── Projection ────────────────────────────────────────────────────────────────

export type ProjectionResult = {
  projection: PublicProjectionNode;
  atlasSource: AtlasSourceV1;
};

/**
 * Compiles a public-safe `AtlasSource@1`. Exclusion is absence, never redaction: an excluded
 * person contributes no node, no relationship, no story, and no name anywhere in the output.
 */
export function projectPublicSafe(input: {
  packet: FamilyPacket;
  now: Date;
  title: string;
  subtitle: string;
  provenanceNote: string;
  assurance: "synthetic" | "sanitized";
  compiledByStewardId: string;
}): ProjectionResult {
  const { packet, now } = input;
  const jurisdiction =
    packet.jurisdictions.find((j) => j.id === packet.jurisdictionId) ?? packet.jurisdictions[0]!;
  const consents = packet.consents.map((node) => node.receipt);
  const deletedRefs = new Set(packet.tombstones.map((tombstone) => tombstone.subjectRef));
  const exclusions: PublicProjectionNode["exclusions"] = [];

  const includedPeople: PersonNode[] = [];
  const excludedNames: string[] = [];

  // A deletion is recorded as an absence with a reason, so a later reader can tell a removed
  // record from a compilation bug.
  for (const tombstone of packet.tombstones) {
    exclusions.push({ ref: tombstone.subjectRef, reason: "deleted" });
  }

  for (const person of packet.people) {
    if (deletedRefs.has(person.id)) continue;
    const verdict = mayProjectPerson({ person, consents, jurisdiction, now });
    if (verdict.allowed) {
      includedPeople.push(person);
    } else {
      exclusions.push({ ref: person.id, reason: verdict.reason as PublicProjectionNode["exclusions"][number]["reason"] });
      excludedNames.push(person.displayName);
    }
  }

  // A summary naming an excluded person disqualifies the node that carries it, not just the text.
  const cleanPeople = includedPeople.filter((person) => {
    if (mentionsAny(person.summary, excludedNames)) {
      exclusions.push({ ref: person.id, reason: "references_excluded_person" });
      excludedNames.push(person.displayName);
      return false;
    }
    return true;
  });

  const includedIds = new Set(cleanPeople.map((person) => person.id));
  const acceptedClaimIds = new Set(
    packet.claims
      .filter((node) => node.record.status === "accepted" && node.record.publicationStatus === "approved")
      .map((node) => node.record.claimId)
  );

  const relationships = packet.relationships.filter((relationship) => {
    if (!includedIds.has(relationship.fromPersonId) || !includedIds.has(relationship.toPersonId)) {
      exclusions.push({ ref: relationship.id, reason: "references_excluded_person" });
      return false;
    }
    if (!acceptedClaimIds.has(relationship.claimId)) {
      exclusions.push({ ref: relationship.id, reason: "claim_not_accepted" });
      return false;
    }
    return true;
  });

  const stories = packet.storyArtifacts.filter((story) => {
    if (!story.mediaRights.allowsPublication || story.mediaRights.rightsStatus === "blocked" || story.mediaRights.rightsStatus === "review_required") {
      exclusions.push({ ref: story.id, reason: "media_rights_not_cleared" });
      return false;
    }
    if (story.aboutPersonIds.some((id) => !includedIds.has(id)) || mentionsAny(story.body, excludedNames) || mentionsAny(story.title, excludedNames)) {
      exclusions.push({ ref: story.id, reason: "references_excluded_person" });
      return false;
    }
    if (!story.sourceClaimIds.every((claimId) => acceptedClaimIds.has(claimId))) {
      exclusions.push({ ref: story.id, reason: "claim_not_accepted" });
      return false;
    }
    const supportingEvidence = packet.evidence.filter((node) =>
      node.record.claimRefs.some((claimRef) => story.sourceClaimIds.includes(claimRef))
    );
    if (supportingEvidence.some((node) => !evidenceMayBePublished(node.record).allowed)) {
      exclusions.push({ ref: story.id, reason: "evidence_rights_not_cleared" });
      return false;
    }
    return true;
  });

  const sourceCountByPerson = new Map<string, number>();
  for (const node of packet.evidence) {
    for (const claimRef of node.record.claimRefs) {
      const claim = packet.claims.find((c) => c.record.claimId === claimRef);
      if (!claim) continue;
      const subjectId = claim.record.subject.id;
      sourceCountByPerson.set(subjectId, (sourceCountByPerson.get(subjectId) ?? 0) + 1);
    }
  }

  const gradeByPerson = new Map<string, FamilyClaim["sourceGrade"]>();
  for (const node of packet.claims) {
    if (!acceptedClaimIds.has(node.record.claimId)) continue;
    gradeByPerson.set(node.record.subject.id, node.record.sourceGrade);
  }

  const atlasSource: AtlasSourceV1 = {
    schemaVersion: "1",
    assurance: input.assurance,
    title: input.title,
    subtitle: input.subtitle,
    provenanceNote: input.provenanceNote,
    people: cleanPeople.map((person) => ({
      id: person.id,
      displayName: person.displayName,
      years: `${person.birthYear ?? "?"}–${person.deathRecord?.year ?? "?"}`,
      lifeStatus: isLiving(person) ? ("living" as const) : ("deceased" as const),
      role: "recorded",
      summary: person.summary,
      ...(person.place ? { place: person.place } : {}),
      evidence: gradeToConclusion(gradeByPerson.get(person.id) ?? "unknown"),
      sourceCount: sourceCountByPerson.get(person.id) ?? 0
    })),
    relationships: relationships.map((relationship) => ({
      id: relationship.id,
      from: relationship.fromPersonId,
      to: relationship.toPersonId,
      kind: relationship.relation,
      evidence: gradeToConclusion(
        packet.claims.find((c) => c.record.claimId === relationship.claimId)?.record.sourceGrade ?? "unknown"
      ),
      ...(relationship.label ? { label: relationship.label } : {})
    })),
    events: stories.map((story, index) => ({
      id: `story-${String(index + 1).padStart(2, "0")}`,
      year: String(
        cleanPeople.find((person) => story.aboutPersonIds.includes(person.id))?.deathRecord?.year ?? "undated"
      ),
      title: story.title,
      description: story.body.slice(0, 480),
      personIds: story.aboutPersonIds,
      evidence: "supported" as const
    })),
    researchQuestions: []
  };

  const projection: PublicProjectionNode = {
    meta: {
      owner: input.compiledByStewardId,
      provenance: { source: "derived", sourceActorId: "projectPublicSafe", recordedAt: now.toISOString() },
      version: 1,
      visibility: "public_archive",
      evaluationRule: "projectPublicSafe"
    },
    kind: "public_projection",
    id: `projection_${packet.familyId}_r${packet.revision}`,
    packetVersion: FAMILY_PACKET_VERSION,
    packetRevision: packet.revision,
    compiledAt: now.toISOString(),
    jurisdictionId: jurisdiction.id,
    includedPersonIds: cleanPeople.map((person) => person.id),
    includedRelationshipIds: relationships.map((relationship) => relationship.id),
    includedStoryArtifactIds: stories.map((story) => story.id),
    exclusions
  };

  return { projection, atlasSource };
}

// ── Succession ────────────────────────────────────────────────────────────────

export function decideSuccession(
  event: Omit<SuccessionEventNode, "outcome" | "outcomeReason">,
  now: Date
): SuccessionEventNode {
  const verdict = evaluateSuccessionRelease({
    policy: event.policy,
    triggerEvidenceVerified: event.triggerEvidenceVerified,
    triggerSource: event.triggerSource,
    approvedByPersonIds: event.approvedByPersonIds,
    triggerVerifiedAt: event.triggerVerifiedAt,
    now
  });
  return { ...event, outcome: verdict.allowed ? "released" : "refused", outcomeReason: verdict.reason };
}

// ── Export ────────────────────────────────────────────────────────────────────

export type ExportDecision =
  | { ok: true; manifest: FamilyExportManifest }
  | { ok: false; reason: string };

export function authorizeExport(input: {
  packet: FamilyPacket;
  actorRole: FamilyRole;
  actorOwnDataOnly: boolean;
  reauthenticated: boolean;
  explicitConfirmation: boolean;
  manifest: unknown;
}): ExportDecision {
  const disputed = input.packet.claims.some((node) =>
    node.record.status === "disputed" || node.record.publicationStatus === "withdrawn"
  );
  const rightsCleared = input.packet.evidence.every(
    (node) => node.record.rightsStatus !== "blocked" && node.record.rightsStatus !== "review_required"
  );

  const verdict = evaluateExportRequest({
    actorRole: input.actorRole,
    actorOwnDataOnly: input.actorOwnDataOnly,
    reauthenticated: input.reauthenticated,
    explicitConfirmation: input.explicitConfirmation,
    containsSecrets: false,
    containsDisputedOrWithdrawnData: disputed,
    containsScopeIneligibleChildData: false,
    rightsCleared
  });
  if (!verdict.allowed) return { ok: false, reason: verdict.reason };

  const parsed = exportManifestSchema.safeParse(input.manifest);
  if (!parsed.success) return { ok: false, reason: "Export manifest is invalid." };
  return { ok: true, manifest: parsed.data };
}

// ── Deletion ──────────────────────────────────────────────────────────────────

/**
 * Deletion removes the record and leaves a tombstone. The tombstone carries no content —
 * only the fact that something was removed, by whom, and at which revision — so that a later
 * projection can prove an absence was deliberate rather than a compilation bug.
 */
export function deletePerson(input: {
  packet: FamilyPacket;
  personId: string;
  deletedByStewardId: string;
  retentionBasis: FamilyTombstone["retentionBasis"];
  at: string;
}): { packet: FamilyPacket; tombstone: FamilyTombstone } {
  const target = input.packet.people.find((person) => person.id === input.personId);
  const tombstone: FamilyTombstone = {
    tombstoneId: `tomb_${input.personId}_r${input.packet.revision}`,
    subjectRef: input.personId,
    deletedAt: input.at,
    deletedByStewardId: input.deletedByStewardId,
    removedFields: target
      ? ["displayName", "summary", "birthYear", "place", "deathRecord"].filter(
          (field) => (target as Record<string, unknown>)[field] !== undefined
        )
      : ["unknown_subject"],
    retentionBasis: input.retentionBasis,
    revisionBefore: input.packet.revision
  };

  const packet: FamilyPacket = {
    ...input.packet,
    revision: input.packet.revision + 1,
    people: input.packet.people.filter((person) => person.id !== input.personId),
    relationships: input.packet.relationships.filter(
      (relationship) =>
        relationship.fromPersonId !== input.personId && relationship.toPersonId !== input.personId
    ),
    storyArtifacts: input.packet.storyArtifacts.filter(
      (story) => !story.aboutPersonIds.includes(input.personId)
    ),
    tombstones: [...input.packet.tombstones, tombstone]
  };

  return { packet, tombstone };
}

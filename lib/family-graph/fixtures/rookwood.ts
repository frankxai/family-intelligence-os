import type { FamilyPacket } from "../schema";

/**
 * The Rookwood family is entirely fictional. Every name, date, place, and record in this file
 * was invented for testing. No real relative, record, or repository appears here, and none may
 * be added — the packet fixtures are the one place a real name would be least noticed.
 *
 * The shape is deliberately adversarial: a deceased matriarch who may be projected, a living
 * daughter who consented to publication, a living son who did not, and a story artifact whose
 * text names the son so that the free-text leak has something to catch.
 */

const AT = "2026-01-04T09:00:00.000Z";

const meta = (owner: string, rule: FamilyPacket["people"][number]["meta"]["evaluationRule"], visibility: FamilyPacket["people"][number]["meta"]["visibility"]) => ({
  owner,
  provenance: { source: "family_reported" as const, sourceActorId: "steward_ada", recordedAt: AT },
  version: 1,
  visibility,
  evaluationRule: rule
});

export const rookwoodPacket: FamilyPacket = {
  packetVersion: "FamilyPacket.v1",
  familyId: "fam_rookwood",
  revision: 3,
  generatedAt: AT,
  jurisdictionId: "jur_de",
  jurisdictions: [
    {
      meta: meta("steward_ada", "neverLeavesFamily", "core_circle"),
      kind: "jurisdiction",
      id: "jur_de",
      code: "de",
      packVersion: "2026.01",
      livingPersonRule: "consent_required",
      recordEmbargoYears: 10
    }
  ],
  sensitivities: [
    {
      meta: meta("steward_ada", "stewardAuthorityOnly", "core_circle"),
      kind: "sensitivity",
      id: "sens_hist",
      targetRef: "person_marta",
      level: "low",
      rationale: "Deceased 1998, civil record available, no surviving minor children.",
      reviewedByStewardId: "steward_ada"
    },
    {
      meta: meta("steward_ada", "stewardAuthorityOnly", "core_circle"),
      kind: "sensitivity",
      id: "sens_living_high",
      targetRef: "person_ines",
      level: "high",
      rationale: "Living adult; publication only under an active self-authorised receipt."
    },
    {
      meta: meta("steward_ada", "stewardAuthorityOnly", "core_circle"),
      kind: "sensitivity",
      id: "sens_living_crit",
      targetRef: "person_tobias",
      level: "critical",
      rationale: "Living adult who declined publication; treat every mention as withheld."
    }
  ],
  consents: [
    {
      meta: meta("person_ines", "hasPublicationConsent", "public_archive"),
      kind: "consent",
      receipt: {
        consentId: "consent_ines_public",
        familyId: "fam_rookwood",
        subjectPersonId: "person_ines",
        authorizedByPersonId: "person_ines",
        authorityBasis: "self",
        purposes: ["Public family history page"],
        dataCategories: ["name", "life_dates", "biography"],
        scope: "public_archive",
        actions: ["store", "publish", "share"],
        noticeVersion: "notice-2026-01",
        noticeLanguage: "de",
        grantedAt: AT,
        status: "active"
      }
    },
    {
      meta: meta("person_tobias", "hasPublicationConsent", "core_circle"),
      kind: "consent",
      receipt: {
        consentId: "consent_tobias_private",
        familyId: "fam_rookwood",
        subjectPersonId: "person_tobias",
        authorizedByPersonId: "person_tobias",
        authorityBasis: "self",
        purposes: ["Private family record only"],
        dataCategories: ["name", "life_dates"],
        scope: "core_circle",
        actions: ["store"],
        noticeVersion: "notice-2026-01",
        noticeLanguage: "de",
        grantedAt: AT,
        status: "active"
      }
    }
  ],
  people: [
    {
      meta: meta("steward_ada", "projectPublicSafe", "public_archive"),
      kind: "person",
      id: "person_marta",
      displayName: "Marta Rookwood",
      birthYear: 1911,
      deathRecord: { year: 1998, evidenceId: "ev_civil_death", verifiedByStewardId: "steward_ada" },
      sensitivityId: "sens_hist",
      consentIds: [],
      summary: "Ran the Kelbra weaving workshop from 1946 until it closed in 1971.",
      place: "Kelbra"
    },
    {
      meta: meta("person_ines", "projectPublicSafe", "public_archive"),
      kind: "person",
      id: "person_ines",
      displayName: "Ines Rookwood",
      birthYear: 1962,
      sensitivityId: "sens_living_high",
      consentIds: ["consent_ines_public"],
      summary: "Catalogued the workshop ledgers and gave the collection to the town archive."
    },
    {
      meta: meta("person_tobias", "neverLeavesFamily", "core_circle"),
      kind: "person",
      id: "person_tobias",
      displayName: "Tobias Rookwood",
      birthYear: 1965,
      sensitivityId: "sens_living_crit",
      consentIds: ["consent_tobias_private"],
      summary: "Declined to appear in the public history."
    }
  ],
  relationships: [
    {
      meta: meta("steward_ada", "canTransitionClaim", "public_archive"),
      kind: "relationship",
      id: "rel_marta_ines",
      fromPersonId: "person_marta",
      toPersonId: "person_ines",
      relation: "parent",
      claimId: "claim_birth_ines"
    },
    {
      meta: meta("steward_ada", "canTransitionClaim", "core_circle"),
      kind: "relationship",
      id: "rel_marta_tobias",
      fromPersonId: "person_marta",
      toPersonId: "person_tobias",
      relation: "parent",
      claimId: "claim_birth_tobias"
    }
  ],
  roles: [
    {
      meta: meta("steward_ada", "stewardAuthorityOnly", "core_circle"),
      kind: "role",
      id: "role_ada",
      personId: "person_ines",
      role: "family_steward",
      scope: "family"
    }
  ],
  sources: [
    {
      meta: meta("steward_ada", "evidenceMayBePublished", "public_archive"),
      kind: "source",
      id: "src_kelbra_civil",
      repository: "Kelbra town civil registry (fictional)",
      citation: "Kelbra Standesamt, Sterberegister 1998, Nr. 214 (fictional).",
      accessedAt: AT,
      jurisdictionId: "jur_de"
    }
  ],
  evidence: [
    {
      meta: meta("steward_ada", "evidenceMayBePublished", "public_archive"),
      kind: "evidence",
      sourceId: "src_kelbra_civil",
      record: {
        evidenceId: "ev_civil_death",
        familyId: "fam_rookwood",
        kind: "civil_record",
        title: "Death register entry, Marta Rookwood, 1998 (fictional)",
        sourceGrade: "A",
        rightsStatus: "public_domain",
        allowedUses: ["private_research", "family_share", "publication"],
        sensitivity: "low",
        livingPersonsAffected: [],
        claimRefs: ["claim_birth_ines", "claim_workshop"],
        storageRef: "vault://fictional/ev_civil_death",
        providedBy: "steward_ada",
        obtainedAt: AT,
        createdAt: AT
      }
    }
  ],
  claims: [
    {
      meta: meta("steward_ada", "canTransitionClaim", "public_archive"),
      kind: "claim",
      record: {
        claimId: "claim_birth_ines",
        familyId: "fam_rookwood",
        claimantId: "person_ines",
        subject: { type: "person", id: "person_ines" },
        predicate: "child_of",
        object: { type: "person", id: "person_marta" },
        evidenceRefs: ["ev_civil_death"],
        sourceGrade: "A",
        extractedBy: "steward_ada",
        confidence: 0.95,
        status: "accepted",
        privacyScope: "public_archive",
        livingPersonsAffected: ["person_ines"],
        consentReceipts: ["consent_ines_public"],
        reviewers: ["steward_ada"],
        disputes: [],
        publicationStatus: "approved",
        createdAt: AT,
        updatedAt: AT
      }
    },
    {
      meta: meta("steward_ada", "canTransitionClaim", "core_circle"),
      kind: "claim",
      record: {
        claimId: "claim_birth_tobias",
        familyId: "fam_rookwood",
        claimantId: "person_ines",
        subject: { type: "person", id: "person_tobias" },
        predicate: "child_of",
        object: { type: "person", id: "person_marta" },
        evidenceRefs: [],
        sourceGrade: "B",
        extractedBy: "steward_ada",
        confidence: 0.8,
        status: "accepted",
        privacyScope: "core_circle",
        livingPersonsAffected: ["person_tobias"],
        consentReceipts: [],
        reviewers: ["steward_ada"],
        disputes: [],
        publicationStatus: "blocked",
        createdAt: AT,
        updatedAt: AT
      }
    },
    {
      meta: meta("steward_ada", "canTransitionClaim", "public_archive"),
      kind: "claim",
      record: {
        claimId: "claim_workshop",
        familyId: "fam_rookwood",
        claimantId: "person_ines",
        subject: { type: "person", id: "person_marta" },
        predicate: "operated",
        object: "Kelbra weaving workshop, 1946–1971",
        evidenceRefs: ["ev_civil_death"],
        sourceGrade: "A",
        extractedBy: "steward_ada",
        confidence: 0.9,
        status: "accepted",
        privacyScope: "public_archive",
        livingPersonsAffected: [],
        consentReceipts: [],
        reviewers: ["steward_ada"],
        disputes: [],
        publicationStatus: "approved",
        createdAt: AT,
        updatedAt: AT
      }
    }
  ],
  stewards: [
    {
      meta: meta("steward_ada", "stewardAuthorityOnly", "core_circle"),
      kind: "steward",
      id: "steward_ada",
      personId: "person_ines",
      role: "family_steward",
      mayApprovePublication: true,
      mayApproveExport: true,
      appointedAt: AT
    }
  ],
  successionEvents: [],
  storyArtifacts: [
    {
      meta: meta("steward_ada", "projectPublicSafe", "public_archive"),
      kind: "story_artifact",
      id: "story_workshop",
      title: "The workshop years",
      body: "Marta Rookwood kept the Kelbra workshop running for twenty-five years after the war, and the ledgers survive because the family kept them dry.",
      aboutPersonIds: ["person_marta"],
      sourceClaimIds: ["claim_workshop"],
      mediaRights: { rightsStatus: "owned", holder: "Rookwood family", allowsPublication: true }
    },
    {
      meta: meta("steward_ada", "projectPublicSafe", "core_circle"),
      kind: "story_artifact",
      id: "story_last_visit",
      title: "The last visit",
      body: "Tobias Rookwood drove up from Halle on the last Sunday and found the loom already covered.",
      aboutPersonIds: ["person_marta"],
      sourceClaimIds: ["claim_workshop"],
      mediaRights: { rightsStatus: "owned", holder: "Rookwood family", allowsPublication: true }
    }
  ],
  projections: [],
  tombstones: []
};

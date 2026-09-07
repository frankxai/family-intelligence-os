import { describe, expect, it } from "vitest";

import { rookwoodPacket } from "./fixtures/rookwood";
import { familyPacketSchema } from "./schema";
import {
  authorizeExport,
  decideSuccession,
  deletePerson,
  intakeToQuarantinedClaim,
  projectPublicSafe,
  reviewClaim,
  validatePacket
} from "./pipeline";

const NOW = new Date("2026-02-01T00:00:00.000Z");

const project = (packet = rookwoodPacket) =>
  projectPublicSafe({
    packet,
    now: NOW,
    title: "The Rookwood workshop",
    subtitle: "A fictional family, kept with its sources",
    provenanceNote: "Synthetic fixture. No real family records.",
    assurance: "synthetic",
    compiledByStewardId: "steward_ada"
  });

describe("FamilyPacket.v1", () => {
  it("accepts the fictional fixture", () => {
    const result = validatePacket(rookwoodPacket);
    expect(result.ok, result.ok ? "" : result.issues.join("\n")).toBe(true);
  });

  it("refuses a living person with no consent receipt", () => {
    const broken = {
      ...rookwoodPacket,
      people: rookwoodPacket.people.map((person) =>
        person.id === "person_ines" ? { ...person, consentIds: [] } : person
      )
    };
    const result = familyPacketSchema.safeParse(broken);
    expect(result.success).toBe(false);
  });

  it("refuses a person whose sensitivity label does not exist", () => {
    const broken = {
      ...rookwoodPacket,
      people: rookwoodPacket.people.map((person) =>
        person.id === "person_marta" ? { ...person, sensitivityId: "sens_missing" } : person
      )
    };
    const result = validatePacket(broken);
    expect(result.ok).toBe(false);
  });
});

describe("living-person leakage", () => {
  it("omits a living person who did not consent to publication", () => {
    const { projection, atlasSource } = project();
    expect(projection.includedPersonIds).not.toContain("person_tobias");
    expect(projection.exclusions).toContainEqual({
      ref: "person_tobias",
      reason: "living_person_without_publish_consent"
    });
    expect(JSON.stringify(atlasSource)).not.toContain("Tobias");
  });

  it("includes a living person who did consent", () => {
    const { projection } = project();
    expect(projection.includedPersonIds).toContain("person_ines");
  });

  it("withholds a story that names an excluded living person", () => {
    const { projection, atlasSource } = project();
    expect(projection.includedStoryArtifactIds).toEqual(["story_workshop"]);
    expect(atlasSource.events.map((event) => event.title)).not.toContain("The last visit");
  });

  it("drops a relationship whose claim was never approved for publication", () => {
    const { projection } = project();
    expect(projection.includedRelationshipIds).toEqual(["rel_marta_ines"]);
  });

  it("omits every living person when the jurisdiction says never publish", () => {
    const strict = {
      ...rookwoodPacket,
      jurisdictions: rookwoodPacket.jurisdictions.map((j) => ({ ...j, livingPersonRule: "never_publish" as const }))
    };
    const { projection } = project(strict);
    expect(projection.includedPersonIds).toEqual(["person_marta"]);
  });

  it("withholds a deceased record still inside the jurisdiction embargo", () => {
    const embargoed = {
      ...rookwoodPacket,
      jurisdictions: rookwoodPacket.jurisdictions.map((j) => ({ ...j, recordEmbargoYears: 60 }))
    };
    const { projection } = project(embargoed);
    expect(projection.includedPersonIds).not.toContain("person_marta");
  });

  // The strongest form of the rule: no matter which single person is withheld, their display
  // name must not appear anywhere in the serialized public output.
  it("never emits an excluded person's name anywhere in the atlas source", () => {
    for (const person of rookwoodPacket.people) {
      // Living, and holding only a core-circle receipt: valid in the packet, never publishable.
      const packet = {
        ...rookwoodPacket,
        people: rookwoodPacket.people.map((p) =>
          p.id === person.id
            ? { ...p, deathRecord: undefined, consentIds: ["consent_tobias_private"] }
            : p
        )
      };
      const parsed = familyPacketSchema.safeParse(packet);
      expect(parsed.success, `fixture variant for ${person.id} must stay valid`).toBe(true);
      if (!parsed.success) continue;
      const { atlasSource } = project(parsed.data);
      expect(JSON.stringify(atlasSource)).not.toContain(person.displayName);
    }
  });
});

describe("intake and claim review", () => {
  const submission = {
    submissionId: "s1",
    familyId: "fam_rookwood",
    claimantId: "person_ines",
    subject: { type: "person" as const, id: "person_marta" },
    predicate: "born_in",
    object: "Kelbra",
    evidenceRefs: [],
    sourceGrade: "C" as const,
    livingPersonsAffected: [],
    receivedAt: "2026-02-01T00:00:00.000Z"
  };

  it("quarantines every submission and blocks publication", () => {
    const claim = intakeToQuarantinedClaim(submission);
    expect(claim.status).toBe("quarantined");
    expect(claim.publicationStatus).toBe("blocked");
    expect(claim.confidence).toBe(0);
  });

  it("lets an agent normalise but never accept", () => {
    const claim = intakeToQuarantinedClaim(submission);
    const normalised = reviewClaim({
      claim,
      to: "normalized",
      actorType: "agent",
      actorRole: "agent",
      actorId: "agent_1",
      at: NOW.toISOString()
    });
    expect(normalised.changed).toBe(true);

    const accepted = reviewClaim({
      claim: normalised.claim,
      to: "accepted",
      actorType: "agent",
      actorRole: "agent",
      actorId: "agent_1",
      at: NOW.toISOString()
    });
    expect(accepted.changed).toBe(false);
  });

  it("lets a human steward accept a reviewed claim", () => {
    const claim = { ...intakeToQuarantinedClaim(submission), status: "steward_reviewed" as const };
    const accepted = reviewClaim({
      claim,
      to: "accepted",
      actorType: "human",
      actorRole: "family_steward",
      actorId: "steward_ada",
      at: NOW.toISOString()
    });
    expect(accepted.changed).toBe(true);
    expect(accepted.claim.reviewers).toContain("steward_ada");
  });
});

describe("succession, export, deletion", () => {
  const policy = {
    policyId: "pol_1",
    familyId: "fam_rookwood",
    ownerPersonId: "person_ines",
    triggerType: "death" as const,
    guardianPersonIds: ["person_ines", "person_tobias", "person_ada"],
    quorum: 2,
    verificationRequirements: ["civil death certificate"],
    coolingPeriodHours: 24,
    releaseScopes: ["core_circle"],
    secretExportAllowed: false as const,
    status: "active" as const,
    createdAt: "2026-01-01T00:00:00.000Z"
  };

  const baseEvent = {
    meta: rookwoodPacket.people[0]!.meta,
    kind: "succession_event" as const,
    id: "succ_1",
    policy,
    triggerVerifiedAt: "2026-01-01T00:00:00.000Z",
    triggerSource: "verified_human_process" as const,
    triggerEvidenceVerified: true,
    approvedByPersonIds: ["person_ines", "person_tobias"]
  };

  it("releases only on a verified human trigger with quorum", () => {
    expect(decideSuccession(baseEvent, NOW).outcome).toBe("released");
  });

  it("refuses an inactivity-timer trigger", () => {
    expect(decideSuccession({ ...baseEvent, triggerSource: "inactivity_timer" }, NOW).outcome).toBe("refused");
  });

  it("refuses an export while a claim is disputed", () => {
    const disputed = {
      ...rookwoodPacket,
      claims: rookwoodPacket.claims.map((claim, index) =>
        index === 0 ? { ...claim, record: { ...claim.record, status: "disputed" as const } } : claim
      )
    };
    const decision = authorizeExport({
      packet: disputed,
      actorRole: "family_steward",
      actorOwnDataOnly: false,
      reauthenticated: true,
      explicitConfirmation: true,
      manifest: {}
    });
    expect(decision.ok).toBe(false);
  });

  it("returns a tombstone that carries no content", () => {
    const { packet, tombstone } = deletePerson({
      packet: rookwoodPacket,
      personId: "person_tobias",
      deletedByStewardId: "steward_ada",
      retentionBasis: "none",
      at: NOW.toISOString()
    });
    expect(packet.people.map((person) => person.id)).not.toContain("person_tobias");
    expect(packet.revision).toBe(rookwoodPacket.revision + 1);
    expect(JSON.stringify(tombstone)).not.toContain("Tobias");
    expect(tombstone.removedFields).toContain("displayName");
    expect(project(packet).projection.exclusions).toContainEqual({ ref: "person_tobias", reason: "deleted" });
  });
});

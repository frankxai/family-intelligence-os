import {
  type TrustedTransitionReceipt,
  type VerifiedTransitionReceiptSet
} from "@family/security";
import { createTrustedTransitionServer } from "../../family-security/src/trusted-transition-server";
import { describe, expect, it } from "vitest";
import {
  evaluateJurisdiction as evaluateJurisdictionPolicy,
  jurisdictionActivationBinding,
  jurisdictionPackSchema,
  parseJurisdictionPack,
  type JurisdictionPack
} from "./index";

const reviewedPack = {
  packId: "jurisdiction_nl_nl_v1",
  version: "1.0.0",
  jurisdiction: { code: "NL", name: "Netherlands", level: "country" as const },
  status: "reviewed" as const,
  effectiveFrom: "2026-01-01",
  reviewDue: "2027-01-01",
  reviewer: { type: "qualified_human", reference: "human_jurisdiction_reviewer" },
  runtimeActivation: {
    receiptRef: "runtime_validation_reviewed_pack",
    evaluatedAt: "2026-07-18T00:00:00.000Z",
    reviewerIdentityVerified: true,
    reviewWindowCurrent: true,
    authorityReferencesValid: true,
    controllingAuthorityPresent: true,
    conflictsResolved: true
  },
  authorities: [
    {
      title: "Official law",
      url: "https://wetten.overheid.nl/example",
      sourceType: "official_law" as const,
      checkedAt: "2026-07-18"
    }
  ],
  rules: [
    {
      ruleId: "rule_publication_review",
      domain: "publication" as const,
      effect: "require_qualified_review" as const,
      summary: "Publication requires qualified review.",
      authorityIndexes: [0]
    },
    {
      ruleId: "rule_special_category_block",
      domain: "special_category_data" as const,
      effect: "block" as const,
      summary: "Special category data remains blocked.",
      authorityIndexes: [0]
    }
  ],
  unsupportedBehavior: "block_pending_review" as const
} satisfies JurisdictionPack;

const tenantRef = "tenant_synthetic_family";
const applicabilityRef = "applicability_synthetic_case";

function evaluateJurisdiction(
  input: Omit<Parameters<typeof evaluateJurisdictionPolicy>[0], "tenantRef" | "applicabilityRef">
) {
  return evaluateJurisdictionPolicy({ ...input, tenantRef, applicabilityRef });
}

async function verifiedReceiptsFor(
  packs: JurisdictionPack[]
): Promise<VerifiedTransitionReceiptSet> {
  const receipts: TrustedTransitionReceipt[] = packs.map((pack) => ({
    receiptId: `receipt_${pack.packId}`,
    reference: pack.runtimeActivation!.receiptRef,
    kind: "jurisdiction_activation",
    subjectRef: pack.packId,
    scopeRef: tenantRef,
    issuerServiceRef: "service_jurisdiction_policy",
    issuedAt: "2026-07-18T00:00:00.000Z",
    verifiedAt: "2026-07-18T01:00:00.000Z",
    expiresAt: "2026-07-19T00:00:00.000Z",
    revokedAt: null,
    verificationDigest: "a".repeat(64),
    claims: {
      qualified_human_reviewer_verified: true,
      controlling_authority_present: true,
      authority_references_valid: true,
      review_window_current: true,
      conflicts_resolved: true
    },
    binding: jurisdictionActivationBinding({ pack, tenantRef, applicabilityRef })
  }));
  const byReference = new Map(receipts.map((receipt) => [receipt.reference, receipt]));
  return createTrustedTransitionServer({
    repository: { resolve: async (reference) => byReference.get(reference) ?? null },
    trustedIssuerServiceRefsByKind: {
      jurisdiction_activation: ["service_jurisdiction_policy"]
    }
  }).resolve({
    references: receipts.map((receipt) => receipt.reference),
    now: new Date("2026-07-18T12:00:00.000Z")
  });
}

describe("jurisdiction policy gate", () => {
  it("blocks research-only packs", async () => {
    const result = await evaluateJurisdiction({
      packs: [{ ...reviewedPack, status: "research_only", reviewer: { type: "unassigned", reference: "review required" } }],
      requiredPackIds: [reviewedPack.packId],
      matchedRuleIds: [],
      applicabilityResolved: true,
      communityAuthorityResolved: true,
      asOf: new Date("2026-07-18T12:00:00.000Z")
    });

    expect(result).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("blocks missing required packs", async () => {
    expect(
      await evaluateJurisdiction({
        packs: [reviewedPack],
        requiredPackIds: [reviewedPack.packId, "jurisdiction_de_de_v1"],
        matchedRuleIds: [],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("blocks expired review and unresolved applicability or community authority", async () => {
    const expired = { ...reviewedPack, reviewDue: "2026-01-01" };
    const verifiedReceipts = await verifiedReceiptsFor([reviewedPack]);
    for (const input of [
      { packs: [expired], applicabilityResolved: true, communityAuthorityResolved: true },
      { packs: [reviewedPack], applicabilityResolved: false, communityAuthorityResolved: true },
      { packs: [reviewedPack], applicabilityResolved: true, communityAuthorityResolved: false }
    ]) {
      expect(
        await evaluateJurisdiction({
          ...input,
          requiredPackIds: [reviewedPack.packId],
          matchedRuleIds: [],
          verifiedReceipts,
          asOf: new Date("2026-07-18T12:00:00.000Z")
        })
      ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
    }
  });

  it("blocks a matched blocking rule", async () => {
    const verifiedReceipts = await verifiedReceiptsFor([reviewedPack]);
    expect(
      await evaluateJurisdiction({
        packs: [reviewedPack],
        requiredPackIds: [reviewedPack.packId],
        matchedRuleIds: ["rule_special_category_block"],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        verifiedReceipts,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("routes a reviewed current pack to qualified human review without auto-allowing", async () => {
    const verifiedReceipts = await verifiedReceiptsFor([reviewedPack]);
    expect(
      await evaluateJurisdiction({
        packs: [reviewedPack],
        requiredPackIds: [reviewedPack.packId],
        matchedRuleIds: ["rule_publication_review"],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        verifiedReceipts,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({
      eligibleForHumanReview: true,
      decision: "qualified_human_review_required",
      activePackIds: [reviewedPack.packId]
    });
  });

  it("blocks replay across tenants or modified pack content", async () => {
    const verifiedReceipts = await verifiedReceiptsFor([reviewedPack]);
    expect(
      await evaluateJurisdictionPolicy({
        packs: [reviewedPack],
        requiredPackIds: [reviewedPack.packId],
        matchedRuleIds: [],
        applicabilityResolved: true,
        applicabilityRef,
        tenantRef: "tenant_other_family",
        communityAuthorityResolved: true,
        verifiedReceipts,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });

    const modifiedPack = {
      ...reviewedPack,
      rules: reviewedPack.rules.map((rule, index) =>
        index === 0 ? { ...rule, summary: "A materially different reviewed rule summary." } : rule
      )
    };
    expect(
      await evaluateJurisdiction({
        packs: [modifiedPack],
        requiredPackIds: [modifiedPack.packId],
        matchedRuleIds: [],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        verifiedReceipts,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("blocks a reviewed pack whose activation receipt was not independently resolved", async () => {
    expect(
      await evaluateJurisdiction({
        packs: [reviewedPack],
        requiredPackIds: [reviewedPack.packId],
        matchedRuleIds: [],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("blocks a required pack set that includes a superseded reviewed pack", async () => {
    const replacement = {
      ...reviewedPack,
      packId: "jurisdiction_nl_nl_v2",
      version: "2.0.0",
      supersedes: reviewedPack.packId,
      runtimeActivation: {
        ...reviewedPack.runtimeActivation,
        receiptRef: "runtime_validation_replacement_pack"
      }
    };
    const verifiedReceipts = await verifiedReceiptsFor([reviewedPack, replacement]);
    expect(
      await evaluateJurisdiction({
        packs: [reviewedPack, replacement],
        requiredPackIds: [reviewedPack.packId],
        matchedRuleIds: [],
        applicabilityResolved: true,
        communityAuthorityResolved: true,
        verifiedReceipts,
        asOf: new Date("2026-07-18T12:00:00.000Z")
      })
    ).toMatchObject({ eligibleForHumanReview: false, decision: "block_pending_review" });
  });

  it("rejects reviewed packs without a qualified human reviewer", () => {
    expect(() =>
      jurisdictionPackSchema.parse({
        ...reviewedPack,
        reviewer: { type: "unassigned", reference: "review required" }
      })
    ).toThrow();
  });

  it("rejects reviewed packs without a trusted runtime activation receipt", () => {
    const { runtimeActivation: _runtimeActivation, ...withoutActivation } = reviewedPack;
    expect(() => jurisdictionPackSchema.parse(withoutActivation)).toThrow();
  });

  it("rejects reviewed packs backed only by independent research", () => {
    expect(() =>
      jurisdictionPackSchema.parse({
        ...reviewedPack,
        authorities: reviewedPack.authorities.map((authority) => ({ ...authority, sourceType: "independent_research" }))
      })
    ).toThrow();
  });

  it("rejects rule citations that do not resolve to an authority", () => {
    expect(() =>
      jurisdictionPackSchema.parse({
        ...reviewedPack,
        rules: reviewedPack.rules.map((rule) => ({ ...rule, authorityIndexes: [99] }))
      })
    ).toThrow();
  });

  it("parses the canonical snake-case doctrine contract", () => {
    const canonical = {
      pack_id: reviewedPack.packId,
      version: reviewedPack.version,
      jurisdiction: reviewedPack.jurisdiction,
      status: reviewedPack.status,
      effective_from: reviewedPack.effectiveFrom,
      review_due: reviewedPack.reviewDue,
      reviewer: reviewedPack.reviewer,
      runtime_activation: {
        receipt_ref: reviewedPack.runtimeActivation.receiptRef,
        evaluated_at: reviewedPack.runtimeActivation.evaluatedAt,
        reviewer_identity_verified: reviewedPack.runtimeActivation.reviewerIdentityVerified,
        review_window_current: reviewedPack.runtimeActivation.reviewWindowCurrent,
        authority_references_valid: reviewedPack.runtimeActivation.authorityReferencesValid,
        controlling_authority_present: reviewedPack.runtimeActivation.controllingAuthorityPresent,
        conflicts_resolved: reviewedPack.runtimeActivation.conflictsResolved
      },
      authorities: reviewedPack.authorities.map((authority) => ({
        title: authority.title,
        url: authority.url,
        source_type: authority.sourceType,
        checked_at: authority.checkedAt
      })),
      rules: reviewedPack.rules.map((rule) => ({
        rule_id: rule.ruleId,
        domain: rule.domain,
        effect: rule.effect,
        summary: rule.summary,
        authority_indexes: rule.authorityIndexes
      })),
      unsupported_behavior: reviewedPack.unsupportedBehavior
    };

    expect(parseJurisdictionPack(canonical)).toMatchObject({
      packId: reviewedPack.packId,
      status: "reviewed",
      unsupportedBehavior: "block_pending_review"
    });
  });

  it("rejects unknown fields instead of silently stripping policy input", () => {
    expect(() => jurisdictionPackSchema.parse({ ...reviewedPack, hiddenOverride: "allow" })).toThrow();
  });
});

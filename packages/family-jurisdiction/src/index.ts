import { createHash } from "node:crypto";
import {
  hasVerifiedTransitionReceipt,
  type JurisdictionActivationBinding,
  type VerifiedTransitionReceiptSet
} from "@family/security";
import { z } from "zod";

const packStatuses = ["research_only", "reviewed", "expired", "withdrawn"] as const;
const jurisdictionLevels = ["international", "supranational", "country", "state_province", "local", "community"] as const;
const sourceTypes = ["official_law", "official_archive", "regulator", "standard", "community_authority", "independent_research"] as const;
const ruleDomains = ["privacy", "civil_records", "children", "special_category_data", "copyright", "portrait_personality", "archive_access", "retention", "export_transfer", "publication", "succession", "community_authority"] as const;
const ruleEffects = ["allow_with_review", "require_consent", "require_qualified_review", "restrict", "block", "informational"] as const;

const isoDate = z.string().regex(/^\d{4}-\d{2}-\d{2}$/);

export const jurisdictionPackSchema = z
  .object({
    packId: z.string().regex(/^jurisdiction_[A-Za-z0-9_-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    jurisdiction: z
      .object({
        code: z.string().min(2).max(32),
        name: z.string().min(2).max(160),
        level: z.enum(jurisdictionLevels)
      })
      .strict(),
    status: z.enum(packStatuses),
    effectiveFrom: isoDate,
    reviewDue: isoDate,
    reviewer: z
      .object({
        type: z.enum(["unassigned", "qualified_human"]),
        reference: z.string().min(1).max(240)
      })
      .strict(),
    runtimeActivation: z
      .object({
        receiptRef: z.string().regex(/^runtime_validation_[A-Za-z0-9_-]+$/),
        evaluatedAt: z.string().datetime({ offset: true }),
        reviewerIdentityVerified: z.literal(true),
        reviewWindowCurrent: z.literal(true),
        authorityReferencesValid: z.literal(true),
        controllingAuthorityPresent: z.literal(true),
        conflictsResolved: z.literal(true)
      })
      .strict()
      .optional(),
    authorities: z
      .array(
        z
          .object({
            title: z.string().min(3).max(240),
            url: z.string().url().max(1000),
            sourceType: z.enum(sourceTypes),
            checkedAt: isoDate
          })
          .strict()
      )
      .min(1),
    rules: z
      .array(
        z
          .object({
            ruleId: z.string().regex(/^rule_[A-Za-z0-9_-]+$/),
            domain: z.enum(ruleDomains),
            effect: z.enum(ruleEffects),
            summary: z.string().min(5).max(1200),
            authorityIndexes: z.array(z.number().int().nonnegative()).min(1),
            parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
          })
          .strict()
      )
      .min(1),
    supersedes: z.string().regex(/^jurisdiction_[A-Za-z0-9_-]+$/).optional(),
    unsupportedBehavior: z.literal("block_pending_review")
  })
  .strict()
  .superRefine((pack, context) => {
    if (pack.status === "reviewed") {
      if (pack.reviewer.type !== "qualified_human" || !/^human_[A-Za-z0-9_-]+$/.test(pack.reviewer.reference)) {
        context.addIssue({ code: "custom", path: ["reviewer"], message: "Reviewed packs require a verified qualified human reviewer reference." });
      }
      if (!pack.runtimeActivation) {
        context.addIssue({ code: "custom", path: ["runtimeActivation"], message: "Reviewed packs require a trusted runtime activation receipt." });
      }
      if (pack.authorities.every((authority) => authority.sourceType === "independent_research")) {
        context.addIssue({ code: "custom", path: ["authorities"], message: "Reviewed packs require at least one controlling authority source." });
      }
    }

    const ruleIds = pack.rules.map((rule) => rule.ruleId);
    if (new Set(ruleIds).size !== ruleIds.length) {
      context.addIssue({ code: "custom", path: ["rules"], message: "Rule IDs must be unique within a pack." });
    }

    for (const [ruleIndex, rule] of pack.rules.entries()) {
      if (rule.authorityIndexes.some((index) => index >= pack.authorities.length)) {
        context.addIssue({
          code: "custom",
          path: ["rules", ruleIndex, "authorityIndexes"],
          message: "Every rule authority index must resolve to an authoritative citation."
        });
      }
    }
  });

export type JurisdictionPack = z.infer<typeof jurisdictionPackSchema>;

function canonicalizeForDigest(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(canonicalizeForDigest);
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([key]) => key !== "runtimeActivation")
        .sort(([left], [right]) => left.localeCompare(right))
        .map(([key, nested]) => [key, canonicalizeForDigest(nested)])
    );
  }
  return value;
}

export function digestJurisdictionPack(pack: JurisdictionPack): string {
  const parsed = jurisdictionPackSchema.parse(pack);
  return createHash("sha256").update(JSON.stringify(canonicalizeForDigest(parsed))).digest("hex");
}

export function jurisdictionAuthorityRefs(pack: JurisdictionPack): string[] {
  const parsed = jurisdictionPackSchema.parse(pack);
  return parsed.authorities.map((authority) =>
    `authority_${createHash("sha256")
      .update(JSON.stringify(canonicalizeForDigest(authority)))
      .digest("hex")}`
  ).sort();
}

export function jurisdictionActivationBinding(input: {
  pack: JurisdictionPack;
  tenantRef: string;
  applicabilityRef: string;
}): JurisdictionActivationBinding {
  return {
    kind: "jurisdiction_activation",
    packId: input.pack.packId,
    packVersion: input.pack.version,
    packDigest: digestJurisdictionPack(input.pack),
    tenantRef: input.tenantRef,
    applicabilityRef: input.applicabilityRef,
    reviewerRef: input.pack.reviewer.reference,
    authorityRefs: jurisdictionAuthorityRefs(input.pack)
  };
}

const canonicalJurisdictionPackSchema = z
  .object({
    pack_id: z.string().regex(/^jurisdiction_[A-Za-z0-9_-]+$/),
    version: z.string().regex(/^\d+\.\d+\.\d+$/),
    jurisdiction: z
      .object({
        code: z.string().min(2).max(32),
        name: z.string().min(2).max(160),
        level: z.enum(jurisdictionLevels)
      })
      .strict(),
    status: z.enum(packStatuses),
    effective_from: isoDate,
    review_due: isoDate,
    reviewer: z
      .object({
        type: z.enum(["unassigned", "qualified_human"]),
        reference: z.string().min(1).max(240)
      })
      .strict(),
    runtime_activation: z
      .object({
        receipt_ref: z.string().regex(/^runtime_validation_[A-Za-z0-9_-]+$/),
        evaluated_at: z.string().datetime({ offset: true }),
        reviewer_identity_verified: z.literal(true),
        review_window_current: z.literal(true),
        authority_references_valid: z.literal(true),
        controlling_authority_present: z.literal(true),
        conflicts_resolved: z.literal(true)
      })
      .strict()
      .optional(),
    authorities: z
      .array(
        z
          .object({
            title: z.string().min(3).max(240),
            url: z.string().url().max(1000),
            source_type: z.enum(sourceTypes),
            checked_at: isoDate
          })
          .strict()
      )
      .min(1),
    rules: z
      .array(
        z
          .object({
            rule_id: z.string().regex(/^rule_[A-Za-z0-9_-]+$/),
            domain: z.enum(ruleDomains),
            effect: z.enum(ruleEffects),
            summary: z.string().min(5).max(1200),
            authority_indexes: z.array(z.number().int().nonnegative()).min(1),
            parameters: z.record(z.string(), z.union([z.string(), z.number(), z.boolean()])).optional()
          })
          .strict()
      )
      .min(1),
    supersedes: z.string().regex(/^jurisdiction_[A-Za-z0-9_-]+$/).optional(),
    unsupported_behavior: z.literal("block_pending_review")
  })
  .strict();

export function parseJurisdictionPack(input: unknown): JurisdictionPack {
  const canonical = canonicalJurisdictionPackSchema.parse(input);
  return jurisdictionPackSchema.parse({
    packId: canonical.pack_id,
    version: canonical.version,
    jurisdiction: canonical.jurisdiction,
    status: canonical.status,
    effectiveFrom: canonical.effective_from,
    reviewDue: canonical.review_due,
    reviewer: canonical.reviewer,
    ...(canonical.runtime_activation
      ? {
          runtimeActivation: {
            receiptRef: canonical.runtime_activation.receipt_ref,
            evaluatedAt: canonical.runtime_activation.evaluated_at,
            reviewerIdentityVerified: canonical.runtime_activation.reviewer_identity_verified,
            reviewWindowCurrent: canonical.runtime_activation.review_window_current,
            authorityReferencesValid: canonical.runtime_activation.authority_references_valid,
            controllingAuthorityPresent: canonical.runtime_activation.controlling_authority_present,
            conflictsResolved: canonical.runtime_activation.conflicts_resolved
          }
        }
      : {}),
    authorities: canonical.authorities.map((authority) => ({
      title: authority.title,
      url: authority.url,
      sourceType: authority.source_type,
      checkedAt: authority.checked_at
    })),
    rules: canonical.rules.map((rule) => ({
      ruleId: rule.rule_id,
      domain: rule.domain,
      effect: rule.effect,
      summary: rule.summary,
      authorityIndexes: rule.authority_indexes,
      ...(rule.parameters ? { parameters: rule.parameters } : {})
    })),
    ...(canonical.supersedes ? { supersedes: canonical.supersedes } : {}),
    unsupportedBehavior: canonical.unsupported_behavior
  });
}

export type JurisdictionDecision = {
  eligibleForHumanReview: boolean;
  decision: "block_pending_review" | "qualified_human_review_required";
  reasons: string[];
  activePackIds: string[];
};

export async function evaluateJurisdiction(input: {
  packs: unknown[];
  requiredPackIds: string[];
  matchedRuleIds: string[];
  applicabilityResolved: boolean;
  applicabilityRef: string;
  tenantRef: string;
  communityAuthorityResolved: boolean;
  verifiedReceipts?: VerifiedTransitionReceiptSet;
  asOf: Date;
}): Promise<JurisdictionDecision> {
  const reasons: string[] = [];
  const parsedPacks = new Map<string, JurisdictionPack>();

  for (const candidate of input.packs) {
    const parsed = jurisdictionPackSchema.safeParse(candidate);
    if (!parsed.success) {
      reasons.push("A jurisdiction pack failed validation.");
      continue;
    }
    if (parsedPacks.has(parsed.data.packId)) {
      reasons.push(`Duplicate jurisdiction pack: ${parsed.data.packId}.`);
      continue;
    }
    parsedPacks.set(parsed.data.packId, parsed.data);
  }

  if (!input.applicabilityResolved) {
    reasons.push("Jurisdiction applicability remains unresolved.");
  }
  if (!input.communityAuthorityResolved) {
    reasons.push("Community authority remains unresolved.");
  }
  if (input.requiredPackIds.length === 0) {
    reasons.push("At least one required jurisdiction pack must be resolved.");
  }

  const activePacks: JurisdictionPack[] = [];
  const asOfTime = input.asOf.getTime();
  for (const requiredPackId of new Set(input.requiredPackIds)) {
    const currentReplacement = Array.from(parsedPacks.values()).find((candidate) => {
      if (candidate.supersedes !== requiredPackId || candidate.status !== "reviewed") return false;
      const starts = Date.parse(`${candidate.effectiveFrom}T00:00:00.000Z`);
      const ends = Date.parse(`${candidate.reviewDue}T23:59:59.999Z`);
      return Number.isFinite(asOfTime) && starts <= asOfTime && asOfTime <= ends;
    });
    if (currentReplacement) {
      reasons.push(`Required jurisdiction pack is obsolete because a current reviewed replacement exists: ${requiredPackId}.`);
    }
  }

  for (const packId of new Set(input.requiredPackIds)) {
    const pack = parsedPacks.get(packId);
    if (!pack) {
      reasons.push(`Required jurisdiction pack is missing or invalid: ${packId}.`);
      continue;
    }

    if (pack.status !== "reviewed") {
      reasons.push(`Jurisdiction pack is not reviewed: ${packId}.`);
      continue;
    }

    if (
      !pack.runtimeActivation ||
      !(await hasVerifiedTransitionReceipt(input.verifiedReceipts, {
        reference: pack.runtimeActivation.receiptRef,
        kind: "jurisdiction_activation",
        subjectRef: pack.packId,
        scopeRef: input.tenantRef,
        binding: jurisdictionActivationBinding({
          pack,
          tenantRef: input.tenantRef,
          applicabilityRef: input.applicabilityRef
        }),
        now: input.asOf,
        requiredClaims: [
          "qualified_human_reviewer_verified",
          "controlling_authority_present",
          "authority_references_valid",
          "review_window_current",
          "conflicts_resolved"
        ]
      }))
    ) {
      reasons.push(`Jurisdiction activation receipt is not independently resolved by the trusted repository: ${packId}.`);
      continue;
    }

    const effectiveFrom = Date.parse(`${pack.effectiveFrom}T00:00:00.000Z`);
    const reviewEnds = Date.parse(`${pack.reviewDue}T23:59:59.999Z`);
    const asOfTime = input.asOf.getTime();
    const activationTime = pack.runtimeActivation ? Date.parse(pack.runtimeActivation.evaluatedAt) : Number.NaN;
    if (
      !Number.isFinite(effectiveFrom) ||
      !Number.isFinite(reviewEnds) ||
      !Number.isFinite(asOfTime) ||
      !Number.isFinite(activationTime) ||
      asOfTime < effectiveFrom ||
      asOfTime > reviewEnds ||
      activationTime < effectiveFrom ||
      activationTime > asOfTime
    ) {
      reasons.push(`Jurisdiction pack is not current or its activation receipt is invalid: ${packId}.`);
      continue;
    }

    activePacks.push(pack);
  }

  const activePackIds = new Set(activePacks.map((pack) => pack.packId));
  for (const pack of activePacks) {
    if (pack.supersedes && activePackIds.has(pack.supersedes)) {
      reasons.push(`Required jurisdiction pack is superseded by another active required pack: ${pack.supersedes}.`);
    }
  }

  const activeRules = new Map(activePacks.flatMap((pack) => pack.rules.map((rule) => [rule.ruleId, rule] as const)));
  for (const ruleId of new Set(input.matchedRuleIds)) {
    const rule = activeRules.get(ruleId);
    if (!rule) {
      reasons.push(`Matched jurisdiction rule is missing or inactive: ${ruleId}.`);
      continue;
    }
    if (rule.effect === "block") {
      reasons.push(`Matched jurisdiction rule blocks processing: ${ruleId}.`);
    }
  }

  if (reasons.length > 0 || activePacks.length !== new Set(input.requiredPackIds).size) {
    return {
      eligibleForHumanReview: false,
      decision: "block_pending_review",
      reasons,
      activePackIds: activePacks.map((pack) => pack.packId)
    };
  }

  return {
    eligibleForHumanReview: true,
    decision: "qualified_human_review_required",
    reasons: ["Reviewed jurisdiction packs are current; a qualified human decision is still required."],
    activePackIds: activePacks.map((pack) => pack.packId)
  };
}

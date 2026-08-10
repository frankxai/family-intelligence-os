import {
  createVerifiedAgentAuthorizationContextForServer,
  validateAgentAuthorizationReceiptForServer,
  type TrustedAgentAuthorizationReceipt,
  type VerifiedAgentAuthorizationContext
} from "./trusted-agent-authorization";
import {
  createVerifiedTransitionReceiptSetForServer,
  transitionKinds,
  validateReceiptForTrustedServer,
  type TransitionKind,
  type TrustedTransitionReceipt,
  type VerifiedTransitionReceiptSet
} from "./trusted-transitions";

/**
 * Test/internal integration seam only. This module is deliberately absent from
 * the @family/security package exports. A sovereign deployment must own its
 * repository and issuer configuration outside request-handler and agent code.
 */
export type TrustedTransitionReceiptRepository = Readonly<{
  resolve(reference: string): Promise<unknown>;
}>;

export type TrustedIssuerServiceRefsByKind = Readonly<
  Partial<Record<TransitionKind, readonly string[]>>
>;

export type TrustedTransitionServer = Readonly<{
  resolve(input: { references: readonly string[]; now: Date }): Promise<VerifiedTransitionReceiptSet>;
}>;

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function hasStringFields(value: Record<string, unknown>, fields: readonly string[]): boolean {
  return fields.every((field) => typeof value[field] === "string");
}

function isClaimsRecord(value: unknown): value is Record<string, boolean> {
  return isRecord(value) && Object.values(value).every((claim) => typeof claim === "boolean");
}

function isTransitionBindingCandidate(value: unknown, kind: TransitionKind): boolean {
  if (!isRecord(value) || value.kind !== kind) return false;
  switch (kind) {
    case "federation_transfer":
      return (
        hasStringFields(value, [
          "senderTenantRef",
          "recipientTenantRef",
          "recipientCapabilityRef",
          "recipientReceiptRef",
          "withdrawalCallbackRef"
        ]) &&
        Array.isArray(value.bilateralApprovalRefs) &&
        value.bilateralApprovalRefs.every((item) => typeof item === "string")
      );
    case "community_activation":
      return (
        hasStringFields(value, ["decisionRef", "authorityRef", "appointedDecisionMakerRef", "recordedByHumanRef"]) &&
        Array.isArray(value.restrictionRefs) &&
        value.restrictionRefs.every((item) => typeof item === "string")
      );
    case "jurisdiction_activation":
      return (
        hasStringFields(value, [
          "packId",
          "packVersion",
          "packDigest",
          "tenantRef",
          "applicabilityRef",
          "reviewerRef"
        ]) &&
        Array.isArray(value.authorityRefs) &&
        value.authorityRefs.every((item) => typeof item === "string")
      );
    case "deaccession_authorization":
      return hasStringFields(value, [
        "artifactRef",
        "actorRef",
        "humanDecisionRef",
        "retentionCheckRef",
        "legalHoldCheckRef",
        "dependencyGraphRef",
        "derivativeSuppressionPlanRef"
      ]);
  }
}

function isTransitionReceiptCandidate(value: unknown): value is TrustedTransitionReceipt {
  if (!isRecord(value) || typeof value.kind !== "string" || !transitionKinds.includes(value.kind as TransitionKind)) {
    return false;
  }
  const kind = value.kind as TransitionKind;
  return (
    hasStringFields(value, [
      "receiptId",
      "reference",
      "subjectRef",
      "scopeRef",
      "issuerServiceRef",
      "issuedAt",
      "verifiedAt",
      "expiresAt",
      "verificationDigest"
    ]) &&
    (value.revokedAt === null || typeof value.revokedAt === "string") &&
    isClaimsRecord(value.claims) &&
    isTransitionBindingCandidate(value.binding, kind)
  );
}

function cloneReceipt(receipt: TrustedTransitionReceipt): TrustedTransitionReceipt {
  const binding = Object.freeze(
    "bilateralApprovalRefs" in receipt.binding
      ? { ...receipt.binding, bilateralApprovalRefs: Object.freeze([...receipt.binding.bilateralApprovalRefs]) }
      : "restrictionRefs" in receipt.binding
        ? { ...receipt.binding, restrictionRefs: Object.freeze([...receipt.binding.restrictionRefs]) }
        : "authorityRefs" in receipt.binding
          ? { ...receipt.binding, authorityRefs: Object.freeze([...receipt.binding.authorityRefs]) }
          : { ...receipt.binding }
  ) as TrustedTransitionReceipt["binding"];

  return Object.freeze({
    ...receipt,
    claims: Object.freeze({ ...receipt.claims }),
    binding
  });
}

export function createTrustedTransitionServer(input: {
  repository: TrustedTransitionReceiptRepository;
  trustedIssuerServiceRefsByKind: TrustedIssuerServiceRefsByKind;
}): TrustedTransitionServer {
  const trustedIssuers = new Map<TransitionKind, ReadonlySet<string>>(
    transitionKinds.map((kind) => [kind, new Set(input.trustedIssuerServiceRefsByKind[kind] ?? [])])
  );
  const repository = input.repository;
  const resolveCurrent = async (
    reference: string,
    now: Date
  ): Promise<TrustedTransitionReceipt | undefined> => {
    try {
      const candidate = await repository.resolve(reference);
      if (!isTransitionReceiptCandidate(candidate)) return undefined;
      const issuerAllowlist = trustedIssuers.get(candidate.kind) ?? new Set<string>();
      return validateReceiptForTrustedServer(candidate, reference, now, issuerAllowlist)
        ? cloneReceipt(candidate)
        : undefined;
    } catch {
      return undefined;
    }
  };

  return Object.freeze({
    async resolve(request: { references: readonly string[]; now: Date }): Promise<VerifiedTransitionReceiptSet> {
      const receipts = new Map<string, TrustedTransitionReceipt>();
      for (const reference of Array.from(new Set(request.references))) {
        const candidate = await resolveCurrent(reference, request.now);
        if (candidate) receipts.set(reference, candidate);
      }
      return createVerifiedTransitionReceiptSetForServer(receipts, request.now, resolveCurrent);
    }
  });
}

export type TrustedAgentAuthorizationReceiptRepository = Readonly<{
  resolve(reference: string): Promise<unknown>;
}>;

export type TrustedAgentAuthorizationServer = Readonly<{
  resolve(input: { reference: string; now: Date }): Promise<VerifiedAgentAuthorizationContext | undefined>;
}>;

const agentScopes = new Set(["private", "individual", "household", "family", "trusted_advisor", "public"]);

function isAgentAuthorizationReceiptCandidate(value: unknown): value is TrustedAgentAuthorizationReceipt {
  return (
    isRecord(value) &&
    hasStringFields(value, [
      "authorizationId",
      "reference",
      "issuerServiceRef",
      "issuedAt",
      "verifiedAt",
      "expiresAt",
      "verificationDigest",
      "familyId",
      "tenantId",
      "authenticatedActorId",
      "agentId",
      "action",
      "targetResourceRef",
      "targetScope",
      "policyVersion"
    ]) &&
    (value.revokedAt === null || typeof value.revokedAt === "string") &&
    agentScopes.has(value.targetScope as string)
  );
}

export function createTrustedAgentAuthorizationServer(input: {
  repository: TrustedAgentAuthorizationReceiptRepository;
  trustedIssuerServiceRefs: readonly string[];
}): TrustedAgentAuthorizationServer {
  const repository = input.repository;
  const trustedIssuers = new Set(input.trustedIssuerServiceRefs);
  const resolveCurrent = async (
    reference: string,
    now: Date
  ): Promise<TrustedAgentAuthorizationReceipt | undefined> => {
    try {
      const candidate = await repository.resolve(reference);
      if (
        !isAgentAuthorizationReceiptCandidate(candidate) ||
        !validateAgentAuthorizationReceiptForServer(candidate, reference, now, trustedIssuers)
      ) return undefined;
      return Object.freeze({ ...candidate });
    } catch {
      return undefined;
    }
  };

  return Object.freeze({
    async resolve(request: { reference: string; now: Date }): Promise<VerifiedAgentAuthorizationContext | undefined> {
      const candidate = await resolveCurrent(request.reference, request.now);
      return candidate
        ? createVerifiedAgentAuthorizationContextForServer(request.reference, request.now, resolveCurrent)
        : undefined;
    }
  });
}

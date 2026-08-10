export const transitionKinds = [
  "federation_transfer",
  "community_activation",
  "jurisdiction_activation",
  "deaccession_authorization"
] as const;

export type TransitionKind = (typeof transitionKinds)[number];

export type FederationTransferBinding = Readonly<{
  kind: "federation_transfer";
  senderTenantRef: string;
  recipientTenantRef: string;
  bilateralApprovalRefs: readonly string[];
  recipientCapabilityRef: string;
  recipientReceiptRef: string;
  withdrawalCallbackRef: string;
}>;

export type CommunityActivationBinding = Readonly<{
  kind: "community_activation";
  decisionRef: string;
  authorityRef: string;
  appointedDecisionMakerRef: string;
  recordedByHumanRef: string;
  restrictionRefs: readonly string[];
}>;

export type JurisdictionActivationBinding = Readonly<{
  kind: "jurisdiction_activation";
  packId: string;
  packVersion: string;
  packDigest: string;
  tenantRef: string;
  applicabilityRef: string;
  reviewerRef: string;
  authorityRefs: readonly string[];
}>;

export type DeaccessionAuthorizationBinding = Readonly<{
  kind: "deaccession_authorization";
  artifactRef: string;
  actorRef: string;
  humanDecisionRef: string;
  retentionCheckRef: string;
  legalHoldCheckRef: string;
  dependencyGraphRef: string;
  derivativeSuppressionPlanRef: string;
}>;

export type TransitionBinding =
  | FederationTransferBinding
  | CommunityActivationBinding
  | JurisdictionActivationBinding
  | DeaccessionAuthorizationBinding;

export type TrustedTransitionReceipt = Readonly<{
  receiptId: string;
  reference: string;
  kind: TransitionKind;
  subjectRef: string;
  scopeRef: string;
  issuerServiceRef: string;
  issuedAt: string;
  verifiedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  verificationDigest: string;
  claims: Readonly<Record<string, boolean>>;
  binding: TransitionBinding;
}>;

export type VerifiedTransitionReceiptSet = Readonly<{
  kind: "verified_transition_receipt_set";
}>;

export type TrustedTransitionReceiptRevalidator = (
  reference: string,
  now: Date
) => Promise<TrustedTransitionReceipt | undefined>;

type VerifiedTransitionReceiptState = {
  receipts: ReadonlyMap<string, TrustedTransitionReceipt>;
  resolvedAt: number;
  consumedReferences: Set<string>;
  inFlightReferences: Set<string>;
  revalidate: TrustedTransitionReceiptRevalidator;
};

const verifiedReceiptStores = new WeakMap<object, VerifiedTransitionReceiptState>();

const strictInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const referencePattern = /^[A-Za-z][A-Za-z0-9_-]{2,255}$/;
const digestPattern = /^[A-Fa-f0-9]{64}$/;

function parseStrictInstant(value: string): number {
  if (!strictInstantPattern.test(value)) return Number.NaN;
  return Date.parse(value);
}

function sortedUnique(values: readonly string[]): string[] | null {
  if (values.length === 0 || values.some((value) => !referencePattern.test(value))) return null;
  const sorted = Array.from(new Set(values)).sort();
  return sorted.length === values.length ? sorted : null;
}

function normalizeBinding(binding: TransitionBinding): Record<string, unknown> | null {
  switch (binding.kind) {
    case "federation_transfer": {
      const approvals = sortedUnique(binding.bilateralApprovalRefs);
      if (
        !approvals ||
        !referencePattern.test(binding.senderTenantRef) ||
        !referencePattern.test(binding.recipientTenantRef) ||
        binding.senderTenantRef === binding.recipientTenantRef ||
        !referencePattern.test(binding.recipientCapabilityRef) ||
        !referencePattern.test(binding.recipientReceiptRef) ||
        !referencePattern.test(binding.withdrawalCallbackRef)
      ) return null;
      return { ...binding, bilateralApprovalRefs: approvals };
    }
    case "community_activation": {
      const restrictions = sortedUnique(binding.restrictionRefs);
      if (
        !restrictions ||
        !referencePattern.test(binding.decisionRef) ||
        !referencePattern.test(binding.authorityRef) ||
        !/^human_[A-Za-z0-9_-]+$/.test(binding.appointedDecisionMakerRef) ||
        !/^human_[A-Za-z0-9_-]+$/.test(binding.recordedByHumanRef)
      ) return null;
      return { ...binding, restrictionRefs: restrictions };
    }
    case "jurisdiction_activation": {
      const authorities = sortedUnique(binding.authorityRefs);
      if (
        !authorities ||
        !referencePattern.test(binding.packId) ||
        !/^\d+\.\d+\.\d+$/.test(binding.packVersion) ||
        !digestPattern.test(binding.packDigest) ||
        !referencePattern.test(binding.tenantRef) ||
        !referencePattern.test(binding.applicabilityRef) ||
        !/^human_[A-Za-z0-9_-]+$/.test(binding.reviewerRef)
      ) return null;
      return { ...binding, authorityRefs: authorities, packDigest: binding.packDigest.toLowerCase() };
    }
    case "deaccession_authorization":
      if (
        !referencePattern.test(binding.artifactRef) ||
        !/^human_[A-Za-z0-9_-]+$/.test(binding.actorRef) ||
        !/^human_decision_[A-Za-z0-9_-]+$/.test(binding.humanDecisionRef) ||
        !/^retention_check_[A-Za-z0-9_-]+$/.test(binding.retentionCheckRef) ||
        !/^legal_hold_check_[A-Za-z0-9_-]+$/.test(binding.legalHoldCheckRef) ||
        !/^dependency_graph_[A-Za-z0-9_-]+$/.test(binding.dependencyGraphRef) ||
        !/^suppression_plan_[A-Za-z0-9_-]+$/.test(binding.derivativeSuppressionPlanRef)
      ) return null;
      return { ...binding };
  }
}

function bindingsEqual(left: TransitionBinding, right: TransitionBinding): boolean {
  const normalizedLeft = normalizeBinding(left);
  const normalizedRight = normalizeBinding(right);
  return Boolean(normalizedLeft && normalizedRight && JSON.stringify(normalizedLeft) === JSON.stringify(normalizedRight));
}

export function validateReceiptForTrustedServer(
  receipt: TrustedTransitionReceipt,
  expectedReference: string,
  now: Date,
  trustedIssuerServiceRefs: ReadonlySet<string>
): boolean {
  if (
    receipt.reference !== expectedReference ||
    !/^runtime_validation_[A-Za-z0-9_-]+$/.test(receipt.reference) ||
    !/^receipt_[A-Za-z0-9_-]+$/.test(receipt.receiptId) ||
    !transitionKinds.includes(receipt.kind) ||
    receipt.binding.kind !== receipt.kind ||
    !referencePattern.test(receipt.subjectRef) ||
    !referencePattern.test(receipt.scopeRef) ||
    !trustedIssuerServiceRefs.has(receipt.issuerServiceRef) ||
    !digestPattern.test(receipt.verificationDigest) ||
    receipt.revokedAt !== null ||
    !normalizeBinding(receipt.binding) ||
    Object.values(receipt.claims).some((claim) => typeof claim !== "boolean")
  ) return false;

  const issuedAt = parseStrictInstant(receipt.issuedAt);
  const verifiedAt = parseStrictInstant(receipt.verifiedAt);
  const expiresAt = parseStrictInstant(receipt.expiresAt);
  const nowTime = now.getTime();
  return (
    Number.isFinite(issuedAt) &&
    Number.isFinite(verifiedAt) &&
    Number.isFinite(expiresAt) &&
    Number.isFinite(nowTime) &&
    issuedAt <= verifiedAt &&
    verifiedAt <= nowTime &&
    nowTime < expiresAt
  );
}

export function createVerifiedTransitionReceiptSetForServer(
  receipts: ReadonlyMap<string, TrustedTransitionReceipt>,
  resolvedAt: Date,
  revalidate: TrustedTransitionReceiptRevalidator
): VerifiedTransitionReceiptSet {
  const verified = Object.freeze({ kind: "verified_transition_receipt_set" as const });
  verifiedReceiptStores.set(verified, {
    receipts,
    resolvedAt: resolvedAt.getTime(),
    consumedReferences: new Set<string>(),
    inFlightReferences: new Set<string>(),
    revalidate
  });
  return verified;
}

const requiredClaimsByKind: Readonly<Record<TransitionKind, readonly string[]>> = {
  federation_transfer: [
    "distinct_tenants_verified",
    "bilateral_human_approvals_verified",
    "recipient_capability_verified",
    "scope_unexpired",
    "recipient_receipt_verified"
  ],
  community_activation: [
    "authority_identity_verified",
    "appointed_human_decision_maker_verified",
    "human_recorder_verified",
    "review_window_current",
    "restrictions_bound"
  ],
  jurisdiction_activation: [
    "qualified_human_reviewer_verified",
    "controlling_authority_present",
    "authority_references_valid",
    "review_window_current",
    "conflicts_resolved"
  ],
  deaccession_authorization: [
    "human_authorizer_verified",
    "human_actor_verified",
    "retention_cleared",
    "legal_hold_cleared",
    "dependency_closure_verified",
    "suppression_plan_ready"
  ]
};

export async function hasVerifiedTransitionReceipt(
  verified: VerifiedTransitionReceiptSet | undefined,
  expected: {
    reference: string;
    kind: TransitionKind;
    subjectRef: string;
    scopeRef: string;
    binding: TransitionBinding;
    now: Date;
    requiredClaims?: readonly string[];
  }
): Promise<boolean> {
  if (!verified || expected.binding.kind !== expected.kind) return false;
  const state = verifiedReceiptStores.get(verified);
  const nowTime = expected.now.getTime();
  if (
    !state ||
    !Number.isFinite(nowTime) ||
    state.resolvedAt !== nowTime ||
    !state.receipts.has(expected.reference) ||
    state.consumedReferences.has(expected.reference) ||
    state.inFlightReferences.has(expected.reference)
  ) return false;

  state.inFlightReferences.add(expected.reference);
  let receipt: TrustedTransitionReceipt | undefined;
  try {
    receipt = await state.revalidate(expected.reference, expected.now);
  } catch {
    state.inFlightReferences.delete(expected.reference);
    return false;
  }
  const requiredClaims = expected.requiredClaims ?? requiredClaimsByKind[expected.kind];
  const issuedAt = receipt ? parseStrictInstant(receipt.issuedAt) : Number.NaN;
  const verifiedAt = receipt ? parseStrictInstant(receipt.verifiedAt) : Number.NaN;
  const expiresAt = receipt ? parseStrictInstant(receipt.expiresAt) : Number.NaN;
  const matches = Boolean(
    receipt &&
      receipt.revokedAt === null &&
      Number.isFinite(issuedAt) &&
      Number.isFinite(verifiedAt) &&
      Number.isFinite(expiresAt) &&
      issuedAt <= verifiedAt &&
      verifiedAt <= nowTime &&
      nowTime < expiresAt &&
      receipt.kind === expected.kind &&
      receipt.subjectRef === expected.subjectRef &&
      receipt.scopeRef === expected.scopeRef &&
      bindingsEqual(receipt.binding, expected.binding) &&
      requiredClaims.every((claim) => receipt.claims[claim] === true)
  );
  state.inFlightReferences.delete(expected.reference);
  if (matches) state.consumedReferences.add(expected.reference);
  return matches;
}

export async function admitTrustedTransition(input: {
  kind: TransitionKind;
  receiptRef: string;
  subjectRef: string;
  scopeRef: string;
  actorType: "human" | "agent" | "service";
  actorRef: string;
  binding: TransitionBinding;
  now: Date;
  verifiedReceipts?: VerifiedTransitionReceiptSet;
}): Promise<{ admitted: boolean; reason: string }> {
  if (input.binding.kind !== input.kind) {
    return { admitted: false, reason: "Transition binding kind does not match the requested transition." };
  }
  if (input.binding.kind === "community_activation") {
    if (input.actorType !== "human" || input.actorRef !== input.binding.recordedByHumanRef) {
      return { admitted: false, reason: "Community activation requires the exact receipt-bound human recorder." };
    }
  }
  if (input.binding.kind === "deaccession_authorization") {
    if (input.actorType !== "human" || input.actorRef !== input.binding.actorRef) {
      return { admitted: false, reason: "Deaccession requires the exact receipt-bound human actor." };
    }
  }

  const verified = await hasVerifiedTransitionReceipt(input.verifiedReceipts, {
    reference: input.receiptRef,
    kind: input.kind,
    subjectRef: input.subjectRef,
    scopeRef: input.scopeRef,
    binding: input.binding,
    now: input.now
  });

  return verified
    ? { admitted: true, reason: "Server-resolved receipt, exact bindings, issuer, validity, and controls verified." }
    : { admitted: false, reason: "Trusted transition receipt is missing, revoked, expired, mismatched, or incomplete." };
}

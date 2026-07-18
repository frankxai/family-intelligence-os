export type TrustedAgentAuthorizationReceipt = Readonly<{
  authorizationId: string;
  reference: string;
  issuerServiceRef: string;
  issuedAt: string;
  verifiedAt: string;
  expiresAt: string;
  revokedAt: string | null;
  verificationDigest: string;
  familyId: string;
  tenantId: string;
  authenticatedActorId: string;
  agentId: string;
  action: string;
  targetResourceRef: string;
  targetScope: "private" | "individual" | "household" | "family" | "trusted_advisor" | "public";
  policyVersion: string;
}>;

export type VerifiedAgentAuthorizationContext = Readonly<{
  kind: "verified_agent_authorization_context";
}>;

export type AgentAuthorizationExpectation = Readonly<
  Pick<
    TrustedAgentAuthorizationReceipt,
    | "familyId"
    | "tenantId"
    | "authenticatedActorId"
    | "agentId"
    | "action"
    | "targetResourceRef"
    | "targetScope"
    | "policyVersion"
  >
>;

export type TrustedAgentAuthorizationRevalidator = (
  reference: string,
  now: Date
) => Promise<TrustedAgentAuthorizationReceipt | undefined>;

type VerifiedAgentAuthorizationState = {
  reference: string;
  resolvedAt: number;
  status: "fresh" | "consuming" | "consumed";
  revalidate: TrustedAgentAuthorizationRevalidator;
};

const verifiedAgentAuthorizations = new WeakMap<object, VerifiedAgentAuthorizationState>();
const strictInstantPattern = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}(?:\.\d{1,9})?(?:Z|[+-]\d{2}:\d{2})$/;
const referencePattern = /^[A-Za-z][A-Za-z0-9_-]{2,255}$/;
const digestPattern = /^[A-Fa-f0-9]{64}$/;

function parseStrictInstant(value: string): number {
  return strictInstantPattern.test(value) ? Date.parse(value) : Number.NaN;
}

export function validateAgentAuthorizationReceiptForServer(
  receipt: TrustedAgentAuthorizationReceipt,
  expectedReference: string,
  now: Date,
  trustedIssuerServiceRefs: ReadonlySet<string>
): boolean {
  if (
    receipt.reference !== expectedReference ||
    !/^authorization_receipt_[A-Za-z0-9_-]+$/.test(receipt.reference) ||
    !/^authorization_[A-Za-z0-9_-]+$/.test(receipt.authorizationId) ||
    !trustedIssuerServiceRefs.has(receipt.issuerServiceRef) ||
    !digestPattern.test(receipt.verificationDigest) ||
    receipt.revokedAt !== null ||
    [
      receipt.familyId,
      receipt.tenantId,
      receipt.authenticatedActorId,
      receipt.agentId,
      receipt.action,
      receipt.targetResourceRef,
      receipt.policyVersion
    ].some((value) => !referencePattern.test(value))
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

export function createVerifiedAgentAuthorizationContextForServer(
  reference: string,
  resolvedAt: Date,
  revalidate: TrustedAgentAuthorizationRevalidator
): VerifiedAgentAuthorizationContext {
  const context = Object.freeze({ kind: "verified_agent_authorization_context" as const });
  verifiedAgentAuthorizations.set(context, {
    reference,
    resolvedAt: resolvedAt.getTime(),
    status: "fresh",
    revalidate
  });
  return context;
}

/**
 * A context is valid for exactly one protected operation and only at the same
 * authoritative operation timestamp used for trusted resolution. Consumption
 * re-queries the authoritative repository, so a revocation recorded after the
 * initial lookup still blocks the operation.
 */
export async function consumeVerifiedAgentAuthorization(
  context: VerifiedAgentAuthorizationContext | undefined,
  expected: AgentAuthorizationExpectation,
  now: Date
): Promise<boolean> {
  if (!context) return false;
  const state = verifiedAgentAuthorizations.get(context);
  const nowTime = now.getTime();
  if (!state || state.status !== "fresh" || !Number.isFinite(nowTime) || state.resolvedAt !== nowTime) return false;

  state.status = "consuming";
  let receipt: TrustedAgentAuthorizationReceipt | undefined;
  try {
    receipt = await state.revalidate(state.reference, now);
  } catch {
    state.status = "fresh";
    return false;
  }
  if (!receipt) {
    state.status = "fresh";
    return false;
  }

  const matches =
    receipt.familyId === expected.familyId &&
    receipt.tenantId === expected.tenantId &&
    receipt.authenticatedActorId === expected.authenticatedActorId &&
    receipt.agentId === expected.agentId &&
    receipt.action === expected.action &&
    receipt.targetResourceRef === expected.targetResourceRef &&
    receipt.targetScope === expected.targetScope &&
    receipt.policyVersion === expected.policyVersion;

  state.status = matches ? "consumed" : "fresh";
  return matches;
}

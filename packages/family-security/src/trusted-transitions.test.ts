import { describe, expect, it } from "vitest";
import {
  admitTrustedTransition,
  type TransitionBinding,
  type TransitionKind,
  type TrustedTransitionReceipt
} from "./trusted-transitions";
import {
  createTrustedTransitionServer,
  type TrustedTransitionReceiptRepository
} from "./trusted-transition-server";

const now = new Date("2026-07-18T12:00:00.000Z");

const bindings: Record<TransitionKind, TransitionBinding> = {
  federation_transfer: {
    kind: "federation_transfer",
    senderTenantRef: "tenant_sender",
    recipientTenantRef: "tenant_recipient",
    bilateralApprovalRefs: ["human_decision_sender", "human_decision_recipient"],
    recipientCapabilityRef: "capability_recipient",
    recipientReceiptRef: "receipt_recipient",
    withdrawalCallbackRef: "callback_withdrawal"
  },
  community_activation: {
    kind: "community_activation",
    decisionRef: "community_decision_synthetic",
    authorityRef: "authority_synthetic",
    appointedDecisionMakerRef: "human_decision_maker",
    recordedByHumanRef: "human_recorder",
    restrictionRefs: ["restriction_no_publication"]
  },
  jurisdiction_activation: {
    kind: "jurisdiction_activation",
    packId: "jurisdiction_nl_nl_v1",
    packVersion: "1.0.0",
    packDigest: "b".repeat(64),
    tenantRef: "tenant_synthetic",
    applicabilityRef: "applicability_synthetic",
    reviewerRef: "human_qualified_reviewer",
    authorityRefs: ["authority_national_law"]
  },
  deaccession_authorization: {
    kind: "deaccession_authorization",
    artifactRef: "artifact_synthetic",
    actorRef: "human_archive_steward",
    humanDecisionRef: "human_decision_deaccession",
    retentionCheckRef: "retention_check_clear",
    legalHoldCheckRef: "legal_hold_check_clear",
    dependencyGraphRef: "dependency_graph_complete",
    derivativeSuppressionPlanRef: "suppression_plan_complete"
  }
};

const claimsByKind: Record<TransitionKind, Record<string, boolean>> = {
  federation_transfer: {
    distinct_tenants_verified: true,
    bilateral_human_approvals_verified: true,
    recipient_capability_verified: true,
    scope_unexpired: true,
    recipient_receipt_verified: true
  },
  community_activation: {
    authority_identity_verified: true,
    appointed_human_decision_maker_verified: true,
    human_recorder_verified: true,
    review_window_current: true,
    restrictions_bound: true
  },
  jurisdiction_activation: {
    qualified_human_reviewer_verified: true,
    controlling_authority_present: true,
    authority_references_valid: true,
    review_window_current: true,
    conflicts_resolved: true
  },
  deaccession_authorization: {
    human_authorizer_verified: true,
    human_actor_verified: true,
    retention_cleared: true,
    legal_hold_cleared: true,
    dependency_closure_verified: true,
    suppression_plan_ready: true
  }
};

function receipt(kind: TransitionKind, overrides: Partial<TrustedTransitionReceipt> = {}): TrustedTransitionReceipt {
  return {
    receiptId: `receipt_${kind}`,
    reference: `runtime_validation_${kind}`,
    kind,
    subjectRef: kind === "jurisdiction_activation" ? "jurisdiction_nl_nl_v1" : `subject_${kind}`,
    scopeRef: kind === "jurisdiction_activation" ? "NL" : `scope_${kind}`,
    issuerServiceRef: "service_family_policy",
    issuedAt: "2026-07-18T10:00:00.000Z",
    verifiedAt: "2026-07-18T10:01:00.000Z",
    expiresAt: "2026-07-18T14:00:00.000Z",
    revokedAt: null,
    verificationDigest: "a".repeat(64),
    claims: claimsByKind[kind],
    binding: bindings[kind],
    ...overrides
  };
}

function repository(receipts: TrustedTransitionReceipt[]): TrustedTransitionReceiptRepository {
  const byReference = new Map(receipts.map((item) => [item.reference, item]));
  return { resolve: async (reference) => byReference.get(reference) ?? null };
}

function serverFor(receipts: TrustedTransitionReceipt[]) {
  return createTrustedTransitionServer({
    repository: repository(receipts),
    trustedIssuerServiceRefsByKind: {
      federation_transfer: ["service_family_policy"],
      community_activation: ["service_family_policy"],
      jurisdiction_activation: ["service_family_policy"],
      deaccession_authorization: ["service_family_policy"]
    }
  });
}

function actorFor(kind: TransitionKind): { actorType: "human" | "service"; actorRef: string } {
  if (kind === "community_activation") return { actorType: "human", actorRef: "human_recorder" };
  if (kind === "deaccession_authorization") return { actorType: "human", actorRef: "human_archive_steward" };
  return { actorType: "service", actorRef: "service_family_policy" };
}

describe("trusted transition admission", () => {
  it("admits only a server-resolved federation receipt with exact bindings and every required claim", async () => {
    const candidate = receipt("federation_transfer");
    const verifiedReceipts = await serverFor([candidate]).resolve({ references: [candidate.reference], now });
    expect(
      await admitTrustedTransition({
        kind: candidate.kind,
        receiptRef: candidate.reference,
        subjectRef: candidate.subjectRef,
        scopeRef: candidate.scopeRef,
        ...actorFor(candidate.kind),
        binding: bindings[candidate.kind],
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: true });
  });

  it("rejects a caller-controlled or unresolved receipt reference", async () => {
    expect(
      await admitTrustedTransition({
        kind: "federation_transfer",
        receiptRef: "runtime_validation_spoofed",
        subjectRef: "subject_federation_transfer",
        scopeRef: "scope_federation_transfer",
        actorType: "service",
        actorRef: "service_family_policy",
        binding: bindings.federation_transfer,
        now
      })
    ).toMatchObject({ admitted: false });
  });

  it.each(["federation_transfer", "community_activation", "jurisdiction_activation"] as const)(
    "rejects expired or incomplete %s receipts",
    async (kind) => {
      const candidate = receipt(kind, {
        expiresAt: "2026-07-18T11:00:00.000Z",
        claims: { ...claimsByKind[kind], [Object.keys(claimsByKind[kind])[0]!]: false }
      });
      const verifiedReceipts = await serverFor([candidate]).resolve({ references: [candidate.reference], now });
      expect(
        await admitTrustedTransition({
          kind,
          receiptRef: candidate.reference,
          subjectRef: candidate.subjectRef,
          scopeRef: candidate.scopeRef,
          ...actorFor(kind),
          binding: bindings[kind],
          now,
          verifiedReceipts
        })
      ).toMatchObject({ admitted: false });
    }
  );

  it("rejects agent-originated deaccession even with a valid human-control receipt", async () => {
    const candidate = receipt("deaccession_authorization");
    const verifiedReceipts = await serverFor([candidate]).resolve({ references: [candidate.reference], now });
    expect(
      await admitTrustedTransition({
        kind: candidate.kind,
        receiptRef: candidate.reference,
        subjectRef: candidate.subjectRef,
        scopeRef: candidate.scopeRef,
        actorType: "agent",
        actorRef: "agent_preservation",
        binding: bindings.deaccession_authorization,
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: false });
  });

  it("rejects revoked, ambiguous-time, mismatched, and exact-binding failures", async () => {
    const revoked = receipt("jurisdiction_activation", { revokedAt: "2026-07-18T11:00:00.000Z" });
    const ambiguous = receipt("jurisdiction_activation", { issuedAt: "2026-07-18" });
    const valid = receipt("jurisdiction_activation");
    const server = serverFor([revoked, ambiguous, valid]);
    const verifiedReceipts = await server.resolve({ references: [revoked.reference, ambiguous.reference, valid.reference], now });

    expect(
      await admitTrustedTransition({
        kind: valid.kind,
        receiptRef: valid.reference,
        subjectRef: valid.subjectRef,
        scopeRef: valid.scopeRef,
        ...actorFor(valid.kind),
        binding: {
          ...(bindings.jurisdiction_activation as Extract<TransitionBinding, { kind: "jurisdiction_activation" }>),
          tenantRef: "tenant_other"
        },
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: false });
  });

  it("rejects cached receipts after resolution, expiry, or later revocation", async () => {
    const candidate = receipt("federation_transfer");
    const server = serverFor([candidate]);
    const verifiedReceipts = await server.resolve({ references: [candidate.reference], now });
    const operation = {
      kind: candidate.kind,
      receiptRef: candidate.reference,
      subjectRef: candidate.subjectRef,
      scopeRef: candidate.scopeRef,
      ...actorFor(candidate.kind),
      binding: bindings[candidate.kind],
      now,
      verifiedReceipts
    } as const;

    expect(await admitTrustedTransition(operation)).toMatchObject({ admitted: true });
    expect(await admitTrustedTransition(operation)).toMatchObject({ admitted: false });

    const concurrentContext = await server.resolve({ references: [candidate.reference], now });
    const concurrentOperation = { ...operation, verifiedReceipts: concurrentContext };
    const concurrentResults = await Promise.all([
      admitTrustedTransition(concurrentOperation),
      admitTrustedTransition(concurrentOperation)
    ]);
    expect(concurrentResults.filter((result) => result.admitted)).toHaveLength(1);

    const expiryContext = await server.resolve({ references: [candidate.reference], now });
    expect(
      await admitTrustedTransition({
        ...operation,
        now: new Date("2026-07-18T15:00:00Z"),
        verifiedReceipts: expiryContext
      })
    ).toMatchObject({ admitted: false });

    const revocable = { ...receipt("federation_transfer"), revokedAt: null as string | null };
    const revocationServer = serverFor([revocable]);
    const preRevocation = await revocationServer.resolve({ references: [revocable.reference], now });
    revocable.revokedAt = "2026-07-18T12:00:01Z";
    expect(
      await admitTrustedTransition({
        ...operation,
        receiptRef: revocable.reference,
        now,
        verifiedReceipts: preRevocation
      })
    ).toMatchObject({ admitted: false });
  });
});

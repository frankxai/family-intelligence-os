import { describe, expect, it } from "vitest";
import {
  createTrustedAgentAuthorizationServer,
  type TrustedAgentAuthorizationReceiptRepository
} from "../../family-security/src/trusted-transition-server";
import type { TrustedAgentAuthorizationReceipt } from "@family/security";
import { evaluateAgentAction as evaluateAgentActionPolicy } from "./agent-packs";

const receipt: TrustedAgentAuthorizationReceipt = {
  authorizationId: "authorization_synthetic",
  reference: "authorization_receipt_synthetic",
  issuerServiceRef: "service_family_authorization",
  issuedAt: "2026-07-18T10:00:00.000Z",
  verifiedAt: "2026-07-18T10:01:00.000Z",
  expiresAt: "2026-07-18T14:00:00.000Z",
  revokedAt: null,
  verificationDigest: "c".repeat(64),
  familyId: "family_synthetic",
  tenantId: "tenant_synthetic",
  authenticatedActorId: "human_operator",
  agentId: "family_historian_agent",
  action: "read",
  targetResourceRef: "resource_archive_item",
  targetScope: "private",
  policyVersion: "policy_v1"
};

const repository: TrustedAgentAuthorizationReceiptRepository = {
  resolve: async (reference) => (reference === receipt.reference ? receipt : null)
};

function evaluate(
  overrides: Partial<Parameters<typeof evaluateAgentActionPolicy>[0]> = {}
) {
  return evaluateAgentActionPolicy({
    familyId: receipt.familyId,
    tenantId: receipt.tenantId,
    authenticatedActorId: receipt.authenticatedActorId,
    agentId: receipt.agentId,
    action: receipt.action,
    targetResourceRef: receipt.targetResourceRef,
    targetScope: receipt.targetScope,
    policyVersion: receipt.policyVersion,
    now: new Date("2026-07-18T12:00:00Z"),
    ...overrides
  });
}

describe("agent action trusted authorization", () => {
  it("rejects caller-authored verification flags and requires a server-resolved exact context", async () => {
    expect(
      await evaluate({
        authorizationContext: { targetScope: "private", targetScopeVerified: true } as never
      })
    ).toMatchObject({ allowed: false });

    const server = createTrustedAgentAuthorizationServer({
      repository,
      trustedIssuerServiceRefs: ["service_family_authorization"]
    });
    const operationNow = new Date("2026-07-18T12:00:00Z");
    const resolveContext = () => server.resolve({ reference: receipt.reference, now: operationNow });
    const authorizationContext = await resolveContext();

    expect(await evaluate({ authorizationContext, now: operationNow })).toMatchObject({ allowed: true });
    expect(await evaluate({ authorizationContext, now: operationNow })).toMatchObject({ allowed: false });

    const concurrentContext = await resolveContext();
    const concurrentResults = await Promise.all([
      evaluate({ authorizationContext: concurrentContext, now: operationNow }),
      evaluate({ authorizationContext: concurrentContext, now: operationNow })
    ]);
    expect(concurrentResults.filter((result) => result.allowed)).toHaveLength(1);

    expect(
      await evaluate({
        targetResourceRef: "resource_other",
        authorizationContext: await resolveContext(),
        now: operationNow
      })
    ).toMatchObject({ allowed: false });

    for (const mismatchedOperation of [
      { familyId: "family_other" },
      { tenantId: "tenant_other" },
      { authenticatedActorId: "human_other" },
      { targetScope: "family" as const },
      { policyVersion: "policy_v2" }
    ]) {
      expect(
        await evaluate({ ...mismatchedOperation, authorizationContext: await resolveContext(), now: operationNow })
      ).toMatchObject({ allowed: false });
    }

    expect(
      await evaluate({
        authorizationContext: await resolveContext(),
        now: new Date("2026-07-18T15:00:00Z")
      })
    ).toMatchObject({ allowed: false });

    const revocableReceipt: TrustedAgentAuthorizationReceipt = { ...receipt, revokedAt: null };
    const revocationServer = createTrustedAgentAuthorizationServer({
      repository: { resolve: async () => revocableReceipt },
      trustedIssuerServiceRefs: ["service_family_authorization"]
    });
    const preRevocationContext = await revocationServer.resolve({ reference: receipt.reference, now: operationNow });
    Object.assign(revocableReceipt, { revokedAt: "2026-07-18T12:00:01Z" });
    expect(
      await evaluate({
        authorizationContext: preRevocationContext,
        now: operationNow
      })
    ).toMatchObject({ allowed: false });
  });
});

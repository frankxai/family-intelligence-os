import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";
import * as publicSecurityApi from "./index";
import { admitTrustedTransition, type TrustedTransitionReceipt } from "./trusted-transitions";
import {
  createTrustedTransitionServer,
  type TrustedTransitionReceiptRepository
} from "./trusted-transition-server";

const now = new Date("2026-07-18T12:00:00.000Z");

const deaccessionBinding = {
  kind: "deaccession_authorization" as const,
  artifactRef: "artifact_synthetic",
  actorRef: "human_archive_steward",
  humanDecisionRef: "human_decision_deaccession",
  retentionCheckRef: "retention_check_clear",
  legalHoldCheckRef: "legal_hold_check_clear",
  dependencyGraphRef: "dependency_graph_complete",
  derivativeSuppressionPlanRef: "suppression_plan_complete"
};

function receipt(overrides: Partial<TrustedTransitionReceipt> = {}): TrustedTransitionReceipt {
  return {
    receiptId: "receipt_deaccession_synthetic",
    reference: "runtime_validation_deaccession_synthetic",
    kind: "deaccession_authorization",
    subjectRef: "artifact_synthetic",
    scopeRef: "tenant_synthetic",
    issuerServiceRef: "service_family_policy",
    issuedAt: "2026-07-18T10:00:00.000Z",
    verifiedAt: "2026-07-18T10:01:00.000Z",
    expiresAt: "2026-07-18T14:00:00.000Z",
    revokedAt: null,
    verificationDigest: "a".repeat(64),
    claims: {
      human_authorizer_verified: true,
      human_actor_verified: true,
      retention_cleared: true,
      legal_hold_cleared: true,
      dependency_closure_verified: true,
      suppression_plan_ready: true
    },
    binding: deaccessionBinding,
    ...overrides
  };
}

function repository(candidate: TrustedTransitionReceipt): TrustedTransitionReceiptRepository {
  return { resolve: async (reference) => (reference === candidate.reference ? candidate : null) };
}

describe("trusted transition server boundary", () => {
  it("does not expose caller-configurable receipt bootstrap through package exports", () => {
    const packageJson = JSON.parse(
      readFileSync(new URL("../package.json", import.meta.url), "utf8")
    ) as { exports: Record<string, string> };
    expect(packageJson.exports).toEqual({ ".": "./src/index.ts" });
    expect("./server" in packageJson.exports).toBe(false);
    expect("resolveTrustedTransitionReceipts" in publicSecurityApi).toBe(false);
    expect("createTrustedTransitionServer" in publicSecurityApi).toBe(false);
    expect("createTrustedAgentAuthorizationServer" in publicSecurityApi).toBe(false);
  });

  it("rejects a repository receipt from an issuer outside the transition-specific allowlist", async () => {
    const candidate = receipt({ issuerServiceRef: "service_unallowlisted" });
    const server = createTrustedTransitionServer({
      repository: repository(candidate),
      trustedIssuerServiceRefsByKind: { deaccession_authorization: ["service_family_policy"] }
    });
    const verifiedReceipts = await server.resolve({ references: [candidate.reference], now });
    expect(
      await admitTrustedTransition({
        kind: candidate.kind,
        receiptRef: candidate.reference,
        subjectRef: candidate.subjectRef,
        scopeRef: candidate.scopeRef,
        actorType: "human",
        actorRef: deaccessionBinding.actorRef,
        binding: deaccessionBinding,
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: false });
  });

  it("converts malformed repository rows and resolver failures into blocked results", async () => {
    const malformedCandidates: unknown[] = [
      null,
      [],
      { ...receipt(), binding: null },
      { ...receipt(), claims: undefined },
      { ...receipt(), binding: { kind: "deaccession_authorization" } }
    ];

    for (const candidate of malformedCandidates) {
      const server = createTrustedTransitionServer({
        repository: { resolve: async () => candidate },
        trustedIssuerServiceRefsByKind: { deaccession_authorization: ["service_family_policy"] }
      });
      const verifiedReceipts = await server.resolve({
        references: ["runtime_validation_deaccession_synthetic"],
        now
      });
      expect(
        await admitTrustedTransition({
          kind: "deaccession_authorization",
          receiptRef: "runtime_validation_deaccession_synthetic",
          subjectRef: "artifact_synthetic",
          scopeRef: "tenant_synthetic",
          actorType: "human",
          actorRef: deaccessionBinding.actorRef,
          binding: deaccessionBinding,
          now,
          verifiedReceipts
        })
      ).toMatchObject({ admitted: false });
    }

    const rejectingServer = createTrustedTransitionServer({
      repository: { resolve: async () => { throw new Error("repository unavailable"); } },
      trustedIssuerServiceRefsByKind: { deaccession_authorization: ["service_family_policy"] }
    });
    const verifiedReceipts = await rejectingServer.resolve({
      references: ["runtime_validation_deaccession_synthetic"],
      now
    });
    expect(
      await admitTrustedTransition({
        kind: "deaccession_authorization",
        receiptRef: "runtime_validation_deaccession_synthetic",
        subjectRef: "artifact_synthetic",
        scopeRef: "tenant_synthetic",
        actorType: "human",
        actorRef: deaccessionBinding.actorRef,
        binding: deaccessionBinding,
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: false });
  });

  it("binds the exact recorded deaccession actor and controls", async () => {
    const candidate = receipt();
    const server = createTrustedTransitionServer({
      repository: repository(candidate),
      trustedIssuerServiceRefsByKind: { deaccession_authorization: ["service_family_policy"] }
    });
    const verifiedReceipts = await server.resolve({ references: [candidate.reference], now });

    expect(
      await admitTrustedTransition({
        kind: candidate.kind,
        receiptRef: candidate.reference,
        subjectRef: candidate.subjectRef,
        scopeRef: candidate.scopeRef,
        actorType: "human",
        actorRef: "human_other",
        binding: { ...deaccessionBinding, actorRef: "human_other" },
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: false });

    expect(
      await admitTrustedTransition({
        kind: candidate.kind,
        receiptRef: candidate.reference,
        subjectRef: candidate.subjectRef,
        scopeRef: candidate.scopeRef,
        actorType: "human",
        actorRef: deaccessionBinding.actorRef,
        binding: deaccessionBinding,
        now,
        verifiedReceipts
      })
    ).toMatchObject({ admitted: true });
  });
});

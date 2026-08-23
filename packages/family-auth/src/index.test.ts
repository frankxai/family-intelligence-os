import { describe, expect, it } from "vitest";
import {
  resolveFamilyPortalSession,
  resolveMcpGatewayActorContext,
  resolvePortalAccess,
  validateFamilyPortalSession
} from "./index";

const validSession = {
  familyId: "family_1",
  actorId: "person_1",
  actorRole: "family_steward" as const,
  sessionId: "session_12345678",
  authenticatedAt: "2026-07-12T00:00:00.000Z",
  expiresAt: "2026-07-12T12:00:00.000Z",
  assurance: "mfa" as const
};

describe("family portal access", () => {
  it("never enables demo mode in production", () => {
    expect(
      resolvePortalAccess({ nodeEnv: "production", demoEnabled: true, authConfigured: false })
    ).toMatchObject({ mode: "locked" });
  });

  it("allows a synthetic demo outside production", () => {
    expect(
      resolvePortalAccess({ nodeEnv: "development", demoEnabled: true, authConfigured: false })
    ).toMatchObject({ mode: "demo" });
  });

  it("requires both configured auth and a family-scoped session", () => {
    expect(
      resolvePortalAccess({
        nodeEnv: "production",
        demoEnabled: false,
        authConfigured: true,
        session: validSession,
        now: new Date("2026-07-12T01:00:00.000Z")
      })
    ).toMatchObject({ mode: "authorized" });
  });

  it("revalidates the session at the portal authorization decision", () => {
    expect(
      resolvePortalAccess({
        nodeEnv: "production",
        demoEnabled: false,
        authConfigured: true,
        session: validSession,
        now: new Date("2026-07-12T13:00:00.000Z")
      })
    ).toMatchObject({ mode: "locked" });
  });

  it("validates a bounded human family session", () => {
    expect(validateFamilyPortalSession(validSession, new Date("2026-07-12T01:00:00.000Z"))).toEqual(validSession);
  });

  it.each(["agent", "service_account"])("rejects %s identities at the human portal boundary", (actorRole) => {
    expect(
      validateFamilyPortalSession({ ...validSession, actorRole }, new Date("2026-07-12T01:00:00.000Z"))
    ).toBeNull();
  });

  it("rejects expired, future-issued, malformed, and unscoped sessions", () => {
    const now = new Date("2026-07-12T13:00:00.000Z");
    expect(validateFamilyPortalSession(validSession, now)).toBeNull();
    expect(validateFamilyPortalSession({ ...validSession, authenticatedAt: "2026-07-12T13:06:00.000Z", expiresAt: "2026-07-13T00:00:00.000Z" }, now)).toBeNull();
    expect(validateFamilyPortalSession({ ...validSession, expiresAt: "tomorrow" }, now)).toBeNull();
    expect(validateFamilyPortalSession({ ...validSession, familyId: "" }, now)).toBeNull();
  });

  it("fails closed when the deployment-owned session adapter fails", async () => {
    await expect(
      resolveFamilyPortalSession({ resolveSession: async () => { throw new Error("provider unavailable"); } })
    ).resolves.toBeNull();
  });

  it("fails closed when the MCP gateway has no trusted actor binding", () => {
    expect(() =>
      resolveMcpGatewayActorContext({ nodeEnv: "production", demoEnabled: false })
    ).toThrow("requires a trusted family, actor, and role binding");
  });

  it("rejects human-role impersonation on the stdio MCP boundary", () => {
    expect(() =>
      resolveMcpGatewayActorContext({
        nodeEnv: "production",
        demoEnabled: false,
        familyId: "family_1",
        actorId: "person_1",
        actorRole: "family_owner"
      })
    ).toThrow("only an agent or service-account identity");
  });

  it("accepts a production service account with an explicit tenant binding", () => {
    expect(
      resolveMcpGatewayActorContext({
        nodeEnv: "production",
        demoEnabled: false,
        familyId: "family_1",
        actorId: "service_1",
        actorRole: "service_account"
      })
    ).toEqual({ familyId: "family_1", actorId: "service_1", actorRole: "service_account" });
  });
});

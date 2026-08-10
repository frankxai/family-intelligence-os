import { describe, expect, it } from "vitest";
import { resolveMcpGatewayActorContext, resolvePortalAccess } from "./index";

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
        session: {
          familyId: "family_1",
          actorId: "person_1",
          actorRole: "family_steward",
          authenticatedAt: "2026-07-12T00:00:00.000Z"
        }
      })
    ).toMatchObject({ mode: "authorized" });
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

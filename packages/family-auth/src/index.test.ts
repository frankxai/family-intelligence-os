import { describe, expect, it } from "vitest";
import { resolvePortalAccess } from "./index";

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
});

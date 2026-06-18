import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "./index";

const base = {
  familyId: "fam_1",
  actorId: "actor_1",
  actorRole: "adult_member" as const,
  actionClass: "read",
  sensitivity: "low"
};

describe("evaluatePolicy", () => {
  it("allows low-sensitivity reads", () => {
    expect(evaluatePolicy(base)).toMatchObject({ allowed: true, confirmationMode: "none" });
  });

  it("blocks unknown actions", () => {
    expect(evaluatePolicy({ ...base, actionClass: "teleport" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("blocks unknown sensitivity", () => {
    expect(evaluatePolicy({ ...base, sensitivity: "mystery" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("blocks guests from high data", () => {
    expect(evaluatePolicy({ ...base, actorRole: "guest", sensitivity: "high" })).toMatchObject({
      allowed: false
    });
  });

  it("blocks child members from finance", () => {
    expect(evaluatePolicy({ ...base, actorRole: "child_member", actionClass: "finance", sensitivity: "critical" })).toMatchObject({
      allowed: false,
      confirmationMode: "blocked"
    });
  });

  it("requires explicit confirmation for agent writes", () => {
    expect(evaluatePolicy({ ...base, actorRole: "agent", actionClass: "write", sensitivity: "medium" })).toMatchObject({
      allowed: false,
      confirmationMode: "explicit"
    });
  });

  it("restricts service accounts to connector scope", () => {
    expect(
      evaluatePolicy({
        ...base,
        actorRole: "service_account",
        connectorId: "paperless_ngx",
        serviceAccountScope: ["immich"]
      })
    ).toMatchObject({ allowed: false });
  });
});


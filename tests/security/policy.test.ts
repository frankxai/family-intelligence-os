import { describe, expect, it } from "vitest";
import { evaluatePolicy } from "@family/security";

describe("security package integration", () => {
  it("blocks credential actions by default", () => {
    expect(
      evaluatePolicy({
        familyId: "fam",
        actorId: "owner",
        actorRole: "family_owner",
        actionClass: "credential",
        sensitivity: "critical"
      })
    ).toMatchObject({ allowed: false, confirmationMode: "blocked" });
  });
});


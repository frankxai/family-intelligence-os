import { describe, expect, it } from "vitest";
import { evaluateExportRequest, exportManifestSchema } from "./index";

const approvedRequest = {
  actorRole: "family_steward" as const,
  actorOwnDataOnly: false,
  reauthenticated: true,
  explicitConfirmation: true,
  containsSecrets: false,
  containsDisputedOrWithdrawnData: false,
  containsScopeIneligibleChildData: false,
  rightsCleared: true
};

describe("family export", () => {
  it("requires encrypted manifests and restore testing", () => {
    expect(() => exportManifestSchema.parse({
      exportId: "export_1",
      familyId: "family_1",
      createdByPersonId: "person_1",
      createdAt: "2026-07-12T00:00:00.000Z",
      formatVersion: "1.0",
      scope: ["core_circle"],
      encryption: { required: false, algorithm: "none", keyDelivery: "separate_verified_channel" },
      files: [],
      excludedCategories: [],
      restoreTestRequired: true
    })).toThrow();
  });

  it("blocks secrets, disputed data, and ineligible child data", () => {
    expect(evaluateExportRequest({ ...approvedRequest, containsSecrets: true }).allowed).toBe(false);
    expect(evaluateExportRequest({ ...approvedRequest, containsDisputedOrWithdrawnData: true }).allowed).toBe(false);
    expect(evaluateExportRequest({ ...approvedRequest, containsScopeIneligibleChildData: true }).allowed).toBe(false);
  });

  it("limits ordinary members to their own eligible data", () => {
    expect(evaluateExportRequest({ ...approvedRequest, actorRole: "adult_member", actorOwnDataOnly: false }).allowed).toBe(false);
    expect(evaluateExportRequest({ ...approvedRequest, actorRole: "adult_member", actorOwnDataOnly: true }).allowed).toBe(true);
  });
});

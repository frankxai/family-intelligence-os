import { describe, expect, it } from "vitest";
import { connectorManifestSchema, connectorManifests } from "@family/connectors";

describe("connector manifests", () => {
  it("validates every connector manifest", () => {
    for (const manifest of connectorManifests) {
      expect(() => connectorManifestSchema.parse(manifest)).not.toThrow();
    }
  });

  it("keeps all MVP capabilities read-only", () => {
    for (const manifest of connectorManifests) {
      for (const capability of manifest.capabilities) {
        expect(capability.write).toBe(false);
        expect(capability.destructive).toBe(false);
      }
    }
  });
});


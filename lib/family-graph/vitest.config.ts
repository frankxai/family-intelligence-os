import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The root vitest config only globs `packages/**` and `tests/**`. This config runs the
// family-graph slice on its own without editing a file another harness is currently holding.
const pkg = (name: string) =>
  fileURLToPath(new URL(`../../packages/${name}/src/index.ts`, import.meta.url));

export default defineConfig({
  resolve: {
    alias: {
      "@family/claims": pkg("family-claims"),
      "@family/consent": pkg("family-consent"),
      "@family/core": pkg("family-core"),
      "@family/evidence": pkg("family-evidence"),
      "@family/export": pkg("family-export"),
      "@family/succession": pkg("family-succession")
    }
  },
  test: {
    include: ["lib/family-graph/**/*.test.ts"],
    root: fileURLToPath(new URL("../..", import.meta.url)),
    environment: "node"
  }
});

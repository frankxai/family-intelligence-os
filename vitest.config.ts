import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

export default defineConfig({
  resolve: {
    alias: {
      "@family/audit": fileURLToPath(new URL("./packages/family-audit/src/index.ts", import.meta.url)),
      "@family/auth": fileURLToPath(new URL("./packages/family-auth/src/index.ts", import.meta.url)),
      "@family/connectors": fileURLToPath(new URL("./packages/family-connectors/src/index.ts", import.meta.url)),
      "@family/core": fileURLToPath(new URL("./packages/family-core/src/index.ts", import.meta.url)),
      "@family/intake": fileURLToPath(new URL("./packages/family-intake/src/index.ts", import.meta.url)),
      "@family/mcp": fileURLToPath(new URL("./packages/family-mcp/src/index.ts", import.meta.url)),
      "@family/security": fileURLToPath(new URL("./packages/family-security/src/index.ts", import.meta.url))
    }
  },
  test: {
    include: ["packages/**/*.test.ts", "tests/**/*.test.ts"],
    globals: true,
    environment: "node"
  }
});

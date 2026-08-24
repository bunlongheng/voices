import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      "@": fileURLToPath(new URL(".", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.{ts,tsx}"],
    // default node env; component tests opt into jsdom via a file-level pragma
    environment: "node",
    coverage: {
      provider: "v8",
      include: ["lib/**", "app/api/**", "components/**"],
      reporter: ["text-summary", "lcov"],
    },
  },
});

import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: {
    tsconfigPaths: true,
  },
  test: {
    environment: "jsdom",
    setupFiles: ["./vitest.setup.ts"],
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
    css: false,
    // Annotate failing tests inline on the PR when running in GitHub Actions.
    reporters: process.env.GITHUB_ACTIONS ? ["default", "github-actions"] : ["default"],
    coverage: {
      provider: "v8",
      // text/html for local use; json + json-summary feed the CI coverage report.
      reporter: ["text", "html", "json", "json-summary"],
      // Coverage scope = business logic. UI components and RSC pages are covered
      // by the Playwright e2e suite; non-testable infra (DB client, env, auth
      // wiring, socket client, browser canvas, storage adapters) is excluded.
      include: ["src/lib/**/*.ts", "src/server/**/*.ts", "realtime/server.ts", "realtime/auth.ts"],
      exclude: [
        "src/**/*.{test,spec}.{ts,tsx}",
        "**/*.d.ts",
        "src/lib/prisma.ts",
        "src/lib/env.ts",
        "src/lib/auth.ts",
        "src/lib/auth.config.ts",
        "src/lib/realtime.ts",
        "src/lib/image.ts",
        "src/lib/site.ts",
        "src/lib/storage/**",
        "src/lib/ai/index.ts",
      ],
      // Ratchet set just under the level currently achieved so coverage can only
      // hold or climb. The pre-commit hook blocks any commit that drops below.
      thresholds: {
        statements: 95,
        branches: 87,
        functions: 95,
        lines: 95,
      },
    },
  },
});

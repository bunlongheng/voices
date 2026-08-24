import { defineConfig, devices } from "@playwright/test";

// E2E smoke suite. Runs against a real production build of the app. Kept out of
// the fast pre-push/CI gate (it needs a running server); intended for nightly.
const PORT = 3037;
const BASE = process.env.E2E_BASE_URL || `http://localhost:${PORT}`;

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  reporter: "list",
  use: { baseURL: BASE, trace: "on-first-retry" },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  // start the app only when testing a local base URL (skip if E2E_BASE_URL is set)
  webServer: process.env.E2E_BASE_URL
    ? undefined
    : {
        command: "npm run build && npm start",
        url: BASE,
        timeout: 120_000,
        reuseExistingServer: true,
      },
});

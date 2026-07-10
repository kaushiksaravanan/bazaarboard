import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright config for BazaarBoard end-to-end tests.
 *
 * These tests run against the LIVE production deployment on Vercel — not a
 * local dev server. The site is a static Next.js 16 app that talks to a
 * server-side /api/generate endpoint; free-tier Gemini has zero image-gen
 * quota, so the pipeline typically returns the deterministic SVG fallback.
 * Tests treat both real PNGs and the SVG fallback as valid renders.
 */
export default defineConfig({
  testDir: "./e2e",
  timeout: 30_000,
  retries: 2,
  fullyParallel: true,
  reporter: [["list"]],
  use: {
    baseURL: "https://bazaarboard.vercel.app",
    screenshot: "only-on-failure",
    trace: "retain-on-failure",
    actionTimeout: 10_000,
    navigationTimeout: 20_000,
  },
  projects: [
    {
      name: "chromium",
      use: { ...devices["Desktop Chrome"] },
    },
  ],
});

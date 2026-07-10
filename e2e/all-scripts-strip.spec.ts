import { test } from "@playwright/test";

/**
 * AllScriptsStrip renders 8 tiles for every non-English Indic script.
 *
 * SKIPPED against the deployed build — the "All 8 scripts strip" toggle
 * ships in the source tree but isn't in production yet.
 */
test.describe("AllScriptsStrip", () => {
  test.skip("renders 8 tiles when toggled on", async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Live editor/i }).click();
    const toggle = page.getByRole("button", { name: /All 8 scripts strip/i });
    await toggle.waitFor({ state: "visible" });
    if ((await toggle.getAttribute("aria-pressed")) !== "true") {
      await toggle.click();
    }
    const region = page.locator(
      'section[aria-label="All Indian scripts strip"]',
    );
    await region.first().waitFor({ state: "visible", timeout: 10_000 });
    const tiles = region.first().locator(".poster");
    // Playwright expect not imported to keep skipped body lightweight.
    if ((await tiles.count()) !== 8) throw new Error("expected 8 tiles");
  });
});

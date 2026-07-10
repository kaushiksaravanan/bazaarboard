import { expect, test } from "@playwright/test";

/**
 * Baseline smoke: does the shipped bundle load, does the shell paint, and
 * do the core widgets (tabs, language grid, preset chips) render?
 *
 * NOTE: These tests target the LIVE production deployment. Some newer
 * components in the source tree (BYOK modal, AllScriptsStrip, print
 * button, CSV import) aren't in the currently-deployed build yet — tests
 * for those features are marked `.skip` with a clear reason. Once a new
 * production build ships, unskip them.
 */
test.describe("smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
  });

  test("home page loads with BazaarBoard title", async ({ page }) => {
    await expect(page.getByRole("heading", { level: 1, name: "BazaarBoard" })).toBeVisible();
  });

  test("header tagline is visible on desktop", async ({ page }) => {
    await expect(
      page.getByText(/Type once\. Print, post, share/i),
    ).toBeVisible();
  });

  test("Live editor and Bulk pipeline tabs are visible", async ({ page }) => {
    await expect(page.getByRole("tab", { name: /Live editor/i })).toBeVisible();
    await expect(page.getByRole("tab", { name: /Bulk pipeline/i })).toBeVisible();
  });

  test("language grid renders 9 language chips", async ({ page }) => {
    // Every language chip has aria-pressed — that's a stable way to count
    // them regardless of the container's role wiring.
    const chips = page.locator('aside button[aria-pressed]').filter({
      hasText: /English|Hindi|Tamil|Bengali|Telugu|Kannada|Malayalam|Punjabi|Gujarati/,
    });
    await expect(chips).toHaveCount(9);
  });

  test("retail vertical preset chips render", async ({ page }) => {
    await expect(page.getByText("Retail vertical", { exact: true })).toBeVisible();
    // Match the 5 preset chips by their visible label text — this is what
    // ships in the accessibility tree of the current production build.
    for (const label of [
      "Kirana (grocery)",
      "Sweet shop (mithai)",
      "Chaat & street food",
      "Textile / saree shop",
      "Neighbourhood pharmacy",
    ]) {
      await expect(
        page.getByRole("button", { name: label, exact: true }),
      ).toBeVisible();
    }
  });
});

import { expect, test, type Page } from "@playwright/test";

/**
 * Baseline smoke: does the shipped bundle load, does the shell paint, and
 * do the core widgets (tabs, language grid, preset chips) render?
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    await dismissOnboarding(page);
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

import { expect, test, type Page } from "@playwright/test";

/**
 * AllScriptsStrip renders 8 tiles for every non-English Indic script.
 * The strip is ON by default in single mode.
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("AllScriptsStrip", () => {
  test("renders 8 tiles by default in single mode", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("tab", { name: /Live editor/i }).click();

    // Toggle should be present and aria-pressed=true by default.
    const toggle = page.getByRole("button", { name: /All 8 scripts strip/i });
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute("aria-pressed", "true");

    const region = page.locator(
      'section[aria-label="All Indian scripts strip"]',
    );
    await expect(region.first()).toBeVisible({ timeout: 10_000 });
    const tiles = region.first().locator(".poster");
    await expect(tiles).toHaveCount(8);
  });
});

import { expect, test, type Page } from "@playwright/test";

/**
 * BeforeAfterCompare renders two tiles (Latin vs Indic).
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("BeforeAfter comparator", () => {
  test("toggle exists and switching it on renders 2 tiles", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("tab", { name: /Live editor/i }).click();
    const toggle = page.getByRole("button", {
      name: /Before\/After: Latin/i,
    });
    await expect(toggle).toBeVisible();
    if ((await toggle.getAttribute("aria-pressed")) !== "true") {
      await toggle.click();
    }
    const region = page.locator(
      'section[aria-label="Latin vs Indic-script comparison"]',
    );
    await expect(region).toBeVisible({ timeout: 10_000 });
    const tiles = region.locator(".poster");
    await expect(tiles).toHaveCount(2);
  });
});

import { expect, test, type Page } from "@playwright/test";

/**
 * Print button: after a tile renders, a "print A4" affordance appears
 * and clicking it mounts the PrintPreview overlay.
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("print preview overlay", () => {
  test("Print button opens the print preview overlay", async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("tab", { name: /Live editor/i }).click();
    await page
      .getByRole("textbox", { name: /Alphonso mango pulp/i })
      .fill("E2E Print Product");
    const printBtn = page
      .getByRole("button", { name: /Print .* poster on A4/i })
      .first();
    await expect(printBtn).toBeVisible({ timeout: 25_000 });
    await page.evaluate(() => {
      // Silence the native print dialog in headless Chromium.
      window.print = (): void => {};
    });
    await printBtn.click();
    await expect(
      page.getByRole("dialog", { name: /Print preview/i }),
    ).toBeVisible({ timeout: 5_000 });
  });
});

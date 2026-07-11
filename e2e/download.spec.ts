import { expect, test, type Page } from "@playwright/test";

/**
 * Once at least one poster tile has a rendered image (real PNG or SVG
 * fallback — both valid), a "Download" button appears on that tile.
 * Clicking it fires a Blob-based anchor click which Playwright surfaces
 * as a `download` event.
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("download", () => {
  test("Download button initiates a browser download with the expected filename shape", async ({
    page,
  }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("tab", { name: /Live editor/i }).click();
    await page
      .getByRole("textbox", { name: /Alphonso mango pulp/i })
      .fill("E2E Test Product");

    const downloadBtn = page
      .getByRole("button", { name: /Download.*poster/i })
      .first();
    await expect(downloadBtn).toBeVisible({ timeout: 25_000 });

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15_000 }),
      downloadBtn.click(),
    ]);

    const filename = download.suggestedFilename();
    // {slug}--{lang}--{surface}.png OR .svg (SVG fallback is valid).
    expect(filename).toMatch(
      /^[a-z0-9-]+--[a-z]{2}--(poster|whatsapp|square)\.(png|svg)$/,
    );
  });
});

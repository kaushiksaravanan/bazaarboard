import { expect, test } from "@playwright/test";

/**
 * Once at least one poster tile has a rendered image (real PNG or SVG
 * fallback — both valid), a "Download" button appears on that tile.
 * Clicking it fires a Blob-based anchor click which Playwright surfaces
 * as a `download` event.
 *
 * The deployed build renders the download affordance with an aria-label
 * that starts with "Download " and ends with " poster". Match that.
 */
test.describe("download", () => {
  test("Download button initiates a browser download with the expected filename shape", async ({
    page,
  }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Live editor/i }).click();
    await page
      .getByRole("textbox", { name: /Alphonso mango pulp/i })
      .fill("E2E Test Product");

    // Deployed build's aria-label is "Download this poster"; newer source
    // uses "Download <lang> poster". Accept both.
    const downloadBtn = page
      .getByRole("button", { name: /Download.*poster/i })
      .first();
    await expect(downloadBtn).toBeVisible({ timeout: 25_000 });

    const [download] = await Promise.all([
      page.waitForEvent("download", { timeout: 15_000 }),
      downloadBtn.click(),
    ]);

    const filename = download.suggestedFilename();
    // filename shape: {slug}--{lang}--{surface}.png
    // Slug of "E2E Test Product" -> "e2e-test-product". Slug of the
    // preset default -> "alphonso-mango-pulp". Either is fine.
    expect(filename).toMatch(/^[a-z0-9-]+--[a-z]{2}--(poster|whatsapp|square)\.png$/);
  });
});

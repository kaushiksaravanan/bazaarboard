import { test } from "@playwright/test";

/**
 * Print button: after a tile renders, a "print A4" affordance appears
 * and clicking it mounts the PrintPreview overlay.
 *
 * SKIPPED against the deployed build — the print button ships in the
 * source tree but hasn't been redeployed. Unskip once shipped.
 */
test.describe("print preview overlay", () => {
  test.skip(
    "Print button opens the print preview overlay",
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("tab", { name: /Live editor/i }).click();
      await page
        .getByRole("textbox", { name: /Alphonso mango pulp/i })
        .fill("E2E Print Product");
      const printBtn = page
        .getByRole("button", { name: /Print .* poster on A4/i })
        .first();
      await printBtn.waitFor({ state: "visible", timeout: 25_000 });
      await page.evaluate(() => {
        // Silence the native print dialog in headless Chromium.
        window.print = () => {};
      });
      await printBtn.click();
      await page
        .getByRole("dialog", { name: /Print preview/i })
        .waitFor({ state: "visible", timeout: 5_000 });
    },
  );
});

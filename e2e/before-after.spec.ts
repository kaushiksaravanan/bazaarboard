import { test } from "@playwright/test";

/**
 * BeforeAfterCompare renders two tiles (Latin vs Indic).
 *
 * SKIPPED against the deployed build — the Before/After toggle ships in
 * the source tree but isn't in production yet.
 */
test.describe("BeforeAfter comparator", () => {
  test.skip(
    "toggle exists and switching it on renders 2 tiles",
    async ({ page }) => {
      await page.goto("/");
      await page.getByRole("tab", { name: /Live editor/i }).click();
      const toggle = page.getByRole("button", {
        name: /Before\/After: Latin/i,
      });
      await toggle.waitFor({ state: "visible" });
      if ((await toggle.getAttribute("aria-pressed")) !== "true") {
        await toggle.click();
      }
      const region = page.locator(
        'section[aria-label="Latin vs Indic-script comparison"]',
      );
      await region.waitFor({ state: "visible", timeout: 10_000 });
      const tiles = region.locator(".poster");
      if ((await tiles.count()) !== 2) throw new Error("expected 2 tiles");
    },
  );
});

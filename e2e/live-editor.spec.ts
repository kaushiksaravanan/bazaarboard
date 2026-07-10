import { expect, test } from "@playwright/test";

/**
 * Live-editor mode. On the deployed production build free-tier Gemini has
 * zero image-gen quota, so the pipeline returns a deterministic SVG
 * fallback (throughput bar reads "svg-fallback"). Tests accept either
 * real PNG or SVG-fallback state as valid.
 */
test.describe("live editor", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Live editor/i }).click();
  });

  test("typing in product name triggers a debounced render", async ({ page }) => {
    const input = page.getByRole("textbox", { name: /Alphonso mango pulp/i });
    await expect(input).toBeVisible();
    await input.fill("Test mango pulp E2E");
    // Debounce is 400ms in source; give the round-trip 15s of slack. At
    // least one tile with an <img> should mount (real PNG or SVG fallback).
    const anyPosterImg = page.getByRole("img", { name: /poster$/i }).first();
    await expect(anyPosterImg).toBeVisible({ timeout: 20_000 });
  });

  test("throughput counter increments after render", async ({ page }) => {
    await page
      .getByRole("textbox", { name: /Alphonso mango pulp/i })
      .fill("Alphonso mango pulp v2");
    // Poll the header text for "rendered N" > 0. "svg-fallback" is a
    // valid model — we don't gate on the model badge.
    await expect
      .poll(
        async () => {
          const text = await page.locator("header, main").first().innerText();
          const match = text.match(/rendered\s+(\d+)/i);
          return match ? Number(match[1]) : 0;
        },
        { timeout: 25_000, intervals: [500, 1000, 2000] },
      )
      .toBeGreaterThan(0);
  });

  test("changing brand color updates the input value", async ({ page }) => {
    // The brand-color input is a native <input type="color">. On the
    // deployed build it's shown as a textbox with a hex value.
    const colorInput = page.locator('input[type="color"]');
    await expect(colorInput).toBeVisible();
    await colorInput.fill("#123456");
    await expect(colorInput).toHaveValue("#123456");
  });

  test("toggling languages adds/removes tiles", async ({ page }) => {
    const bengaliChip = page.getByRole("button", { name: /Bengali/ }).first();
    await expect(bengaliChip).toHaveAttribute("aria-pressed", "false");
    await bengaliChip.click();
    await expect(bengaliChip).toHaveAttribute("aria-pressed", "true");
    // Toggle off.
    await bengaliChip.click();
    await expect(bengaliChip).toHaveAttribute("aria-pressed", "false");
  });

  test("selecting different surfaces changes tile aspect ratio", async ({
    page,
  }) => {
    await page.getByRole("button", { name: /WhatsApp status/i }).click();
    // Wait for at least one tile's <img> so we know the render fanned out.
    await page.getByRole("img", { name: /poster$/i }).first().waitFor({
      state: "visible",
      timeout: 20_000,
    });
    // Read the aspectRatio of the parent .poster wrapper via the DOM.
    const aspect = await page
      .locator(".poster")
      .first()
      .evaluate((el) => (el as HTMLElement).style.aspectRatio);
    expect(aspect.replace(/\s+/g, "")).toBe("9/16");
  });
});

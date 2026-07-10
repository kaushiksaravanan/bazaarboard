import { expect, test } from "@playwright/test";

test.describe("bulk pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await page.getByRole("tab", { name: /Bulk pipeline/i }).click();
  });

  test("switching to bulk mode shows the textarea", async ({ page }) => {
    // The deployed build renders a <textarea> whose accessible name is
    // derived from its placeholder — not from a <label htmlFor>. Locate
    // by placeholder text to stay stable across builds.
    await expect(
      page.getByPlaceholder(/Alphonso mango pulp \| ₹120/i),
    ).toBeVisible();
  });

  test("editing textarea updates the projected N × L × S = X poster count", async ({
    page,
  }) => {
    const textarea = page.getByPlaceholder(/Alphonso mango pulp \| ₹120/i);
    await textarea.fill("Item A | ₹100\nItem B | ₹200\nItem C | ₹300");
    // 3 items × 4 default langs × 1 surface = 12 posters.
    await expect(
      page.getByText(/3 items × 4 languages × 1 surfaces =\s*12\s*posters/i),
    ).toBeVisible();
  });

  test("clicking Run bulk pipeline starts a render", async ({ page }) => {
    const textarea = page.getByPlaceholder(/Alphonso mango pulp \| ₹120/i);
    await textarea.fill("Item A | ₹100\nItem B | ₹200");
    await page.getByRole("button", { name: /^Run bulk pipeline$/i }).click();
    // Either a progressbar mounts (newer build) or the first tile's img
    // appears (older build without progressbar). Both prove the run
    // fanned out to /api/generate.
    const progressbar = page.getByRole("progressbar", {
      name: /Bulk render progress/i,
    });
    const firstPosterImg = page.getByRole("img", { name: /poster$/i }).first();
    await expect(async () => {
      const pbVisible = await progressbar.isVisible().catch(() => false);
      const imgVisible = await firstPosterImg.isVisible().catch(() => false);
      expect(pbVisible || imgVisible).toBe(true);
    }).toPass({ timeout: 15_000 });
  });

  test.skip(
    "cancel button aborts a running bulk pipeline",
    // The deployed build renders a "Download ZIP" button alongside "Run
    // bulk pipeline" and skips the mid-run Cancel affordance. Test lives
    // for the newer source-tree build.
    async ({ page }) => {
      const textarea = page.getByPlaceholder(/Alphonso mango pulp \| ₹120/i);
      await textarea.fill(
        Array.from({ length: 10 }, (_, i) => `Item ${i + 1} | ₹${100 + i}`).join(
          "\n",
        ),
      );
      await page.getByRole("button", { name: /^Run bulk pipeline$/i }).click();
      const cancelBtn = page.getByRole("button", { name: /^Cancel$/ });
      await expect(cancelBtn).toBeVisible({ timeout: 10_000 });
      await cancelBtn.click();
      await expect(cancelBtn).toBeHidden({ timeout: 10_000 });
    },
  );

  test.skip(
    "CSV Import button exists and file input accepts .csv",
    // Import CSV is a newer feature that's not in the deployed build yet.
    async ({ page }) => {
      await expect(page.getByRole("button", { name: /Import CSV/i })).toBeVisible();
      const fileInput = page.getByLabel(/Import CSV file/i);
      await expect(fileInput).toHaveAttribute("type", "file");
      const accept = await fileInput.getAttribute("accept");
      expect(accept ?? "").toMatch(/\.csv/);
    },
  );
});

import { expect, test, type Page } from "@playwright/test";

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("bulk pipeline", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.getByRole("tab", { name: /Bulk pipeline/i }).click();
  });

  test("switching to bulk mode shows the textarea", async ({ page }) => {
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

  test("cancel button aborts a running bulk pipeline", async ({ page }) => {
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
  });

  test("CSV Import button exists and file input accepts .csv", async ({
    page,
  }) => {
    await expect(
      page.getByRole("button", { name: /Import CSV/i }),
    ).toBeVisible();
    const fileInput = page.getByLabel(/Import CSV file/i);
    await expect(fileInput).toHaveAttribute("type", "file");
    const accept = await fileInput.getAttribute("accept");
    expect(accept ?? "").toMatch(/\.csv/);
  });
});

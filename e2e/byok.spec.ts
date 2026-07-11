import { expect, test, type Page } from "@playwright/test";

/**
 * BYOK modal: writes only to sessionStorage under bazaarboard.byokGeminiKey.
 */

async function dismissOnboarding(page: Page): Promise<void> {
  const startBtn = page.getByRole("button", { name: /start creating/i });
  if (await startBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
    await startBtn.click();
    await page.waitForTimeout(300);
  }
}

test.describe("bring your own key", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/");
    await dismissOnboarding(page);
    await page.evaluate(() => {
      try {
        window.sessionStorage.removeItem("bazaarboard.byokGeminiKey");
        window.localStorage.removeItem("bazaarboard.byokGeminiKey");
      } catch {
        /* ignore */
      }
    });
  });

  test('"Set Gemini key" button exists in header', async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Set your Gemini API key/i }),
    ).toBeVisible();
  });

  test("clicking Set Gemini key opens a modal", async ({ page }) => {
    await page.getByRole("button", { name: /Set your Gemini API key/i }).click();
    await expect(
      page.getByRole("dialog", { name: /Set Gemini API key/i }),
    ).toBeVisible();
  });

  test("pasting a fake key and clicking Save closes the modal + writes to sessionStorage only", async ({
    page,
  }) => {
    await page
      .getByRole("button", { name: /Set your Gemini API key/i })
      .click();
    const dialog = page.getByRole("dialog", { name: /Set Gemini API key/i });
    await dialog
      .getByLabel(/Gemini API key/i)
      .fill("AIzaFakeE2ETestKey1234567890");
    await dialog.getByRole("button", { name: /Save key/i }).click();
    await expect(dialog).toBeHidden({ timeout: 3_000 });

    // Contract: key lives in sessionStorage, never localStorage.
    const sessionValue = await page.evaluate(() =>
      window.sessionStorage.getItem("bazaarboard.byokGeminiKey"),
    );
    expect(sessionValue).toBe("AIzaFakeE2ETestKey1234567890");
    const localValue = await page.evaluate(() =>
      window.localStorage.getItem("bazaarboard.byokGeminiKey"),
    );
    expect(localValue).toBeNull();
  });

  test("reopening shows the key set + Clear button, and Clear empties state", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        "bazaarboard.byokGeminiKey",
        "AIzaFakeE2ETestKey1234567890",
      );
    });
    await page.reload();
    await dismissOnboarding(page);
    await expect(
      page.getByRole("button", {
        name: /Change or clear your Gemini API key/i,
      }),
    ).toBeVisible();
    await page
      .getByRole("button", {
        name: /Change or clear your Gemini API key/i,
      })
      .click();
    const dialog = page.getByRole("dialog", { name: /Set Gemini API key/i });
    const input = dialog.getByLabel(/Gemini API key/i);
    await expect(input).toHaveAttribute("type", "password");
    await expect(input).toHaveValue("AIzaFakeE2ETestKey1234567890");
    const clearBtn = dialog.getByRole("button", { name: /Clear key/i });
    await expect(clearBtn).toBeVisible();
    await clearBtn.click();
    await expect(dialog).toBeHidden({ timeout: 3_000 });

    const sessionValue = await page.evaluate(() =>
      window.sessionStorage.getItem("bazaarboard.byokGeminiKey"),
    );
    expect(sessionValue).toBeNull();
  });

  test("key is written to sessionStorage — never localStorage (contract test)", async ({
    page,
  }) => {
    await page.evaluate(() => {
      window.sessionStorage.setItem(
        "bazaarboard.byokGeminiKey",
        "AIzaContract123",
      );
    });
    const sessionValue = await page.evaluate(() =>
      window.sessionStorage.getItem("bazaarboard.byokGeminiKey"),
    );
    expect(sessionValue).toBe("AIzaContract123");
    const localValue = await page.evaluate(() =>
      window.localStorage.getItem("bazaarboard.byokGeminiKey"),
    );
    expect(localValue).toBeNull();
  });
});

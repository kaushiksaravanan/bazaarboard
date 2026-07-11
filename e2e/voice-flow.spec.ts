import { expect, test } from "@playwright/test";

/**
 * End-to-end coverage for the /voice page — the voice-first flow.
 *
 * We cannot send actual audio through Playwright, so we assert the DOM
 * scaffolding (mic + language chips + mode pill) and then POST directly
 * to /api/chat with a synthetic Hindi conversation via page.evaluate().
 * The response shape must be one of the two discriminated variants.
 */

test.describe("voice flow", () => {
  test("mic button and language chips are visible on /voice", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    // Mic button — labeled via aria-label matching the initial idle state.
    const mic = page.getByRole("button", { name: /Tap.*speak.*Indian language/i });
    await expect(mic).toBeVisible();

    // The chip group is aria-label='Preferred language...'
    const group = page.getByRole("group", { name: /Preferred language/i });
    await expect(group).toBeVisible();

    // Nine language chips + one auto-detect
    const chips = group.getByRole("button");
    await expect(chips).toHaveCount(10);
  });

  test("Hindi chip toggles aria-pressed", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    const hindi = page.getByRole("button", { name: /Speak in Hindi/i });
    await expect(hindi).toBeVisible();
    await expect(hindi).toHaveAttribute("aria-pressed", "false");

    await hindi.click();
    await expect(hindi).toHaveAttribute("aria-pressed", "true");
  });

  test("Auto-detect chip is the default active chip", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");
    const auto = page.getByRole("button", { name: /Auto-detect/i });
    await expect(auto).toHaveAttribute("aria-pressed", "true");
  });

  test("/voice shows the ⌨️ Text mode link", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");
    const link = page.getByLabel(/Switch to text mode/i);
    await expect(link).toBeVisible();
    await expect(link).toHaveText(/⌨️.*Text mode/);
  });

  test("/voice header shows 'Voice mode' pill", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");
    await expect(page.getByText("Voice mode", { exact: true })).toBeVisible();
  });

  test("home page shows '🎤 Voice mode' pill/link", async ({ page }) => {
    await page.goto("/");
    await page.waitForLoadState("domcontentloaded");
    // The home page links to /voice with the '🎤 Voice mode' label.
    await expect(page.getByText(/🎤.*Voice mode/)).toBeVisible();
  });

  test("POST /api/chat via page.evaluate returns a valid discriminated union", async ({
    page,
  }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "नमस्ते, मुझे एक पोस्टर चाहिए।" },
          ],
          languageHint: "hi",
        }),
      });
      return {
        status: res.status,
        body: (await res.json()) as Record<string, unknown>,
      };
    });

    expect(result.status).toBe(200);
    expect(["message", "finalize"]).toContain(result.body.kind);
    if (result.body.kind === "message") {
      expect(typeof result.body.text).toBe("string");
      expect((result.body.text as string).length).toBeGreaterThan(0);
    } else {
      expect(result.body.order).toBeDefined();
    }
  });

  test("POST /api/chat with a multi-turn Hindi conversation returns 200", async ({
    page,
  }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            { role: "user", content: "नमस्ते" },
            { role: "assistant", content: "आपका उत्पाद क्या है?" },
            { role: "user", content: "मैं आम बेच रहा हूं ₹120 प्रति किलो" },
          ],
          languageHint: "hi",
        }),
      });
      return {
        status: res.status,
        body: (await res.json()) as Record<string, unknown>,
      };
    });

    expect(result.status).toBe(200);
    expect(["message", "finalize"]).toContain(result.body.kind);
  });

  test("POST /api/chat rejects an empty messages array", async ({ page }) => {
    await page.goto("/voice");
    await page.waitForLoadState("domcontentloaded");

    const result = await page.evaluate(async () => {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: [] }),
      });
      return { status: res.status };
    });

    expect(result.status).toBe(400);
  });
});

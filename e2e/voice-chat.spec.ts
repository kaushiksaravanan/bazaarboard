import { expect, test } from "@playwright/test";

/**
 * Voice chat brain — talks to the deployed /api/chat endpoint.
 *
 * The endpoint is deterministic in shape even without a billing key:
 *  - fallback path returns kind=message with a preview-mode string
 *  - live path returns kind=message OR kind=finalize
 * Either way the response is 200 JSON with a stable discriminator.
 */
test.describe("voice chat api", () => {
  test("POST /api/chat with a Hindi user message returns 200 JSON", async ({
    request,
  }) => {
    const res = await request.post("/api/chat", {
      data: {
        messages: [
          { role: "user", content: "नमस्ते, मुझे एक पोस्टर चाहिए।" },
        ],
      },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as {
      kind?: string;
      text?: string;
      language?: string;
      order?: unknown;
    };
    expect(["message", "finalize"]).toContain(body.kind);
    if (body.kind === "message") {
      expect(typeof body.text).toBe("string");
      expect(body.text!.length).toBeGreaterThan(0);
    } else {
      expect(body.order).toBeDefined();
    }
  });

  test("POST /api/chat with English message returns 200 JSON", async ({
    request,
  }) => {
    const res = await request.post("/api/chat", {
      data: {
        messages: [{ role: "user", content: "Hi, I need a poster" }],
      },
    });
    expect(res.status()).toBe(200);
    const body = (await res.json()) as { kind?: string };
    expect(["message", "finalize"]).toContain(body.kind);
  });

  test("POST /api/chat rejects empty messages", async ({ request }) => {
    const res = await request.post("/api/chat", {
      data: { messages: [] },
    });
    expect(res.status()).toBe(400);
  });
});

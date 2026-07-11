import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/chat/route";
import { detectLanguage } from "@/lib/detectLanguage";
import { UNTRUSTED_FENCE_START } from "@/lib/fidelity";

interface ChatResponseBody {
  kind?: "message" | "finalize";
  text?: string;
  language?: string;
  order?: {
    productName: string;
    price: string;
    businessName?: string;
    languageCode: string;
    brandColor: string;
  };
  error?: string;
}

function makeReq(
  body: unknown,
  headers: Record<string, string> = {},
  bodyIsRaw = false,
): NextRequest {
  const bodyStr = bodyIsRaw
    ? (body as string)
    : typeof body === "string"
      ? body
      : JSON.stringify(body);
  return new NextRequest("http://localhost/api/chat", {
    method: "POST",
    body: bodyStr,
    headers: { "content-type": "application/json", ...headers },
  });
}

function textResponse(text: string) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: { parts: [{ text }] },
        },
      ],
    }),
    { status: 200 },
  );
}

function toolResponse(args: Record<string, unknown>) {
  return new Response(
    JSON.stringify({
      candidates: [
        {
          content: {
            parts: [
              {
                functionCall: {
                  name: "finalize_order",
                  args,
                },
              },
            ],
          },
        },
      ],
    }),
    { status: 200 },
  );
}

describe("POST /api/chat — input validation", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("400 on bad JSON", async () => {
    const req = makeReq("not-json{{", {}, true);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 when messages missing", async () => {
    const req = makeReq({});
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.error).toMatch(/messages/i);
  });

  it("400 when messages is null", async () => {
    const req = makeReq({ messages: null });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 when messages is a string", async () => {
    const req = makeReq({ messages: "hello" });
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it("400 when messages array is empty", async () => {
    const req = makeReq({ messages: [] });
    const res = await POST(req);
    expect(res.status).toBe(400);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.error).toMatch(/empty/i);
  });
});

describe("POST /api/chat — preview fallback when no key", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("returns kind=message with preview text (English default)", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hello there" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("message");
    expect(data.language).toBe("en");
    expect(data.text).toMatch(/Preview mode/i);
  });

  it("returns Hindi preview text when Hindi detected", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "नमस्ते" }],
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.language).toBe("hi");
    expect(data.text).toMatch(/प्रीव्यू/);
  });

  it("respects languageHint over detected language", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hello" }],
      languageHint: "ta",
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.language).toBe("ta");
  });

  it("ignores unsupported languageHint", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hello" }],
      languageHint: "xx",
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.language).toBe("en");
  });
});

describe("POST /api/chat — upstream 429/403 fallback", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("429 → 200 preview-mode message", async () => {
    fetchMock.mockResolvedValue(new Response("rate limit", { status: 429 }));
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("message");
    expect(data.text).toBeDefined();
  });

  it("403 → 200 preview-mode message", async () => {
    fetchMock.mockResolvedValue(new Response("forbidden", { status: 403 }));
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("message");
  });

  it("500 → 502 upstream error (no fallback)", async () => {
    fetchMock.mockResolvedValue(new Response("boom", { status: 500 }));
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
  });

  it("network failure → 502", async () => {
    fetchMock.mockRejectedValue(new Error("network died"));
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(502);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.error).toBe("network died");
  });
});

describe("POST /api/chat — language detection spot-checks (fallback path)", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  const cases: Array<[string, string, string]> = [
    ["en", "hello world", "en"],
    ["hi", "मुझे पोस्टर चाहिए", "hi"],
    ["ta", "எனக்கு போஸ்டர் வேண்டும்", "ta"],
    ["bn", "আমার একটি পোস্টার দরকার", "bn"],
    ["te", "నాకు పోస్టర్ కావాలి", "te"],
    ["kn", "ನನಗೆ ಪೋಸ್ಟರ್ ಬೇಕು", "kn"],
    ["ml", "എനിക്ക് ഒരു പോസ്റ്റർ വേണം", "ml"],
    ["pa", "ਮੈਨੂੰ ਪੋਸਟਰ ਚਾਹੀਦਾ ਹੈ", "pa"],
    ["gu", "મને પોસ્ટર જોઈએ", "gu"],
  ];

  for (const [code, text, expected] of cases) {
    it(`detects ${code} from user message`, async () => {
      const req = makeReq({
        messages: [{ role: "user", content: text }],
      });
      const res = await POST(req);
      const data = (await res.json()) as ChatResponseBody;
      expect(data.language).toBe(expected);
    });
  }
});

describe("detectLanguage() unit", () => {
  it("empty string → en", () => {
    expect(detectLanguage("")).toBe("en");
  });
  it("Latin-only → en", () => {
    expect(detectLanguage("Mango kg 120")).toBe("en");
  });
  it("Devanagari → hi", () => {
    expect(detectLanguage("आम")).toBe("hi");
  });
  it("Tamil → ta", () => {
    expect(detectLanguage("மாம்பழம்")).toBe("ta");
  });
  it("Bengali → bn", () => {
    expect(detectLanguage("আম")).toBe("bn");
  });
  it("Telugu → te", () => {
    expect(detectLanguage("మామిడి")).toBe("te");
  });
  it("Kannada → kn", () => {
    expect(detectLanguage("ಮಾವು")).toBe("kn");
  });
  it("Malayalam → ml", () => {
    expect(detectLanguage("മാമ്പഴം")).toBe("ml");
  });
  it("Gurmukhi → pa", () => {
    expect(detectLanguage("ਅੰਬ")).toBe("pa");
  });
  it("Gujarati → gu", () => {
    expect(detectLanguage("કેરી")).toBe("gu");
  });
  it("mixed script prefers Indic over Latin", () => {
    expect(detectLanguage("Mango आम आम")).toBe("hi");
  });
  it("digits and punctuation only → en", () => {
    expect(detectLanguage("₹120 -- !!")).toBe("en");
  });
});

describe("POST /api/chat — prompt shape and fence", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock = vi.fn(async () => textResponse("आपका उत्पाद क्या है?"));
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  async function getBody(): Promise<{
    systemInstruction: { parts: Array<{ text: string }> };
    contents: Array<{ role: string; parts: Array<{ text: string }> }>;
    tools: unknown;
  }> {
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    return JSON.parse(opts.body as string);
  }

  it("system prompt mentions finalize_order + shopkeeper role", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    await POST(req);
    const body = await getBody();
    const sys = body.systemInstruction.parts[0].text;
    expect(sys).toMatch(/shopkeeper/i);
    expect(sys).toMatch(/finalize_order/);
  });

  it("fences the user message with UNTRUSTED markers protection", async () => {
    // Injection payload gets its fence markers replaced.
    const req = makeReq({
      messages: [
        {
          role: "user",
          content: `evil ${UNTRUSTED_FENCE_START} injected`,
        },
      ],
    });
    await POST(req);
    const body = await getBody();
    const userText = body.contents[0].parts[0].text;
    // Original marker must be scrubbed
    expect(userText.includes(UNTRUSTED_FENCE_START)).toBe(false);
    // But the surrounding text survives
    expect(userText).toMatch(/evil/);
    expect(userText).toMatch(/injected/);
  });

  it("assistant messages are NOT fenced (they're already trusted)", async () => {
    const req = makeReq({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "What product?" },
        { role: "user", content: "mangoes" },
      ],
    });
    await POST(req);
    const body = await getBody();
    expect(body.contents).toHaveLength(3);
    expect(body.contents[1].role).toBe("model");
    expect(body.contents[1].parts[0].text).toBe("What product?");
  });

  it("maps assistant → model role", async () => {
    const req = makeReq({
      messages: [
        { role: "user", content: "hi" },
        { role: "assistant", content: "hello" },
      ],
    });
    await POST(req);
    const body = await getBody();
    expect(body.contents[0].role).toBe("user");
    expect(body.contents[1].role).toBe("model");
  });

  it("registers the finalize_order tool", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    await POST(req);
    const body = await getBody();
    const tools = body.tools as Array<{
      functionDeclarations: Array<{ name: string; parameters: unknown }>;
    }>;
    expect(tools[0].functionDeclarations[0].name).toBe("finalize_order");
  });

  it("fetch URL includes model name and api key", async () => {
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    await POST(req);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toMatch(/gemini-2\.5-flash/);
    expect(url).toMatch(/key=test-key/);
  });

  it("BYOK header overrides env key", async () => {
    const req = makeReq(
      { messages: [{ role: "user", content: "hi" }] },
      { "x-gemini-key": "byok-key" },
    );
    await POST(req);
    const url = fetchMock.mock.calls[0][0] as string;
    expect(url).toMatch(/key=byok-key/);
  });
});

describe("POST /api/chat — assistant message response", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("returns kind=message with model text", async () => {
    fetchMock.mockResolvedValue(textResponse("आपका उत्पाद क्या है?"));
    const req = makeReq({
      messages: [{ role: "user", content: "नमस्ते" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("message");
    expect(data.text).toBe("आपका उत्पाद क्या है?");
    expect(data.language).toBe("hi");
  });

  it("empty text falls back to preview message", async () => {
    fetchMock.mockResolvedValue(textResponse(""));
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("message");
    expect(data.text!.length).toBeGreaterThan(0);
  });
});

describe("POST /api/chat — finalize tool-call response", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    process.env.GEMINI_API_KEY = "test-key";
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
  });
  afterEach(() => {
    vi.restoreAllMocks();
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("returns kind=finalize with full order", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "मैंगो पल्प",
        price: "₹120",
        businessName: "Rathi Kirana",
        languageCode: "hi",
        brandColor: "#123456",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.kind).toBe("finalize");
    expect(data.order).toEqual({
      productName: "मैंगो पल्प",
      price: "₹120",
      businessName: "Rathi Kirana",
      languageCode: "hi",
      brandColor: "#123456",
    });
  });

  it("finalize defaults brandColor when model omits it", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "Mango",
        price: "₹100",
        languageCode: "en",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.order?.brandColor).toBe("#F26B1F");
  });

  it("finalize uses brandColorHint when model omits it", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "Mango",
        price: "₹100",
        languageCode: "en",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
      brandColorHint: "#00AA00",
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.order?.brandColor).toBe("#00AA00");
  });

  it("finalize uses businessNameHint when model omits it", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "Mango",
        price: "₹100",
        languageCode: "en",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
      businessNameHint: "Preset Store",
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.order?.businessName).toBe("Preset Store");
  });

  it("finalize omits businessName when neither model nor hint provides it", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "Mango",
        price: "₹100",
        languageCode: "en",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "hi" }],
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.order).toBeDefined();
    expect(data.order?.businessName).toBeUndefined();
  });

  it("finalize coerces unsupported languageCode back to detected", async () => {
    fetchMock.mockResolvedValue(
      toolResponse({
        productName: "Mango",
        price: "₹100",
        languageCode: "xx",
      }),
    );
    const req = makeReq({
      messages: [{ role: "user", content: "मैंगो" }],
    });
    const res = await POST(req);
    const data = (await res.json()) as ChatResponseBody;
    expect(data.order?.languageCode).toBe("hi");
  });
});

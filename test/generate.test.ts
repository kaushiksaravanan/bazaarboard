import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import {
  generate,
  isError,
  batchGenerate,
  getByokKey,
  setByokKey,
  type GenerateInput,
  type GenerateResult,
  type GenerateError,
} from "@/lib/generate";

const validInput: GenerateInput = {
  productName: "Mango",
  price: "₹120",
  languageCode: "hi",
  surfaceKind: "poster",
};

function makeResult(overrides: Partial<GenerateResult> = {}): GenerateResult {
  return {
    image: "b64",
    mimeType: "image/png",
    model: "svg-fallback",
    latencyMs: 100,
    ...overrides,
  };
}

describe("isError()", () => {
  it("true for {error:string}", () => {
    expect(isError({ error: "x" })).toBe(true);
  });

  it("true for {error, detail}", () => {
    expect(isError({ error: "x", detail: "y" })).toBe(true);
  });

  it("false for GenerateResult", () => {
    expect(isError(makeResult())).toBe(false);
  });

  it("false for null", () => {
    expect(isError(null)).toBe(false);
  });

  it("false for undefined", () => {
    expect(isError(undefined)).toBe(false);
  });

  it("false for empty object", () => {
    expect(isError({})).toBe(false);
  });

  it("false for string", () => {
    expect(isError("error")).toBe(false);
  });

  it("false for number", () => {
    expect(isError(42)).toBe(false);
  });

  it("false for array", () => {
    expect(isError([])).toBe(false);
  });

  it("false for boolean", () => {
    expect(isError(true)).toBe(false);
  });

  it("acts as type guard", () => {
    const x: unknown = { error: "boom" };
    if (isError(x)) {
      expect(x.error).toBe("boom");
    } else {
      throw new Error("should have narrowed");
    }
  });
});

describe("BYOK key", () => {
  beforeEach(() => {
    window.sessionStorage.clear();
  });

  it("getByokKey returns null if unset", () => {
    expect(getByokKey()).toBeNull();
  });

  it("setByokKey stores in sessionStorage", () => {
    setByokKey("my-key");
    expect(window.sessionStorage.getItem("bazaarboard.byokGeminiKey")).toBe(
      "my-key",
    );
  });

  it("setByokKey then getByokKey round-trips", () => {
    setByokKey("abc");
    expect(getByokKey()).toBe("abc");
  });

  it("setByokKey trims whitespace", () => {
    setByokKey("  key  ");
    expect(getByokKey()).toBe("key");
  });

  it("setByokKey with null clears storage", () => {
    setByokKey("temp");
    setByokKey(null);
    expect(getByokKey()).toBeNull();
  });

  it("setByokKey with empty string clears", () => {
    setByokKey("x");
    setByokKey("");
    expect(getByokKey()).toBeNull();
  });

  it("setByokKey with whitespace-only clears", () => {
    setByokKey("x");
    setByokKey("   ");
    expect(getByokKey()).toBeNull();
  });
});

describe("generate() — fetch behavior", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("posts to /api/generate", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput);
    expect(fetchMock).toHaveBeenCalledWith(
      "/api/generate",
      expect.objectContaining({ method: "POST" }),
    );
  });

  it("sends JSON body with input", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput);
    const call = fetchMock.mock.calls[0];
    const opts = call[1] as RequestInit;
    expect(JSON.parse(opts.body as string)).toEqual(validInput);
  });

  it("sends Content-Type: application/json", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput);
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/json");
  });

  it("attaches X-Gemini-Key header when BYOK set", async () => {
    setByokKey("byok-secret");
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput);
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(headers["X-Gemini-Key"]).toBe("byok-secret");
  });

  it("omits X-Gemini-Key header when BYOK unset", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput);
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    const headers = opts.headers as Record<string, string>;
    expect(headers["X-Gemini-Key"]).toBeUndefined();
  });

  it("passes AbortSignal to fetch", async () => {
    const controller = new AbortController();
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    await generate(validInput, controller.signal);
    const opts = fetchMock.mock.calls[0][1] as RequestInit;
    expect(opts.signal).toBe(controller.signal);
  });

  it("returns parsed JSON on 200", async () => {
    const payload = makeResult({ latencyMs: 250 });
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(payload), { status: 200 }),
    );
    const result = await generate(validInput);
    expect(result).toEqual(payload);
  });

  it("returns error on 400", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "bad input" }), { status: 400 }),
    );
    const result = await generate(validInput);
    expect(isError(result)).toBe(true);
    expect((result as GenerateError).error).toBe("bad input");
  });

  it("returns error on 500", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "boom" }), { status: 500 }),
    );
    const result = await generate(validInput);
    expect(isError(result)).toBe(true);
  });

  it("returns HTTP status if body has no error key", async () => {
    fetchMock.mockResolvedValue(new Response("{}", { status: 502 }));
    const result = await generate(validInput);
    expect(isError(result)).toBe(true);
    expect((result as GenerateError).error).toBe("HTTP 502");
  });

  it("returns error if body isn't JSON", async () => {
    fetchMock.mockResolvedValue(new Response("not json", { status: 502 }));
    const result = await generate(validInput);
    expect(isError(result)).toBe(true);
  });

  it("returns error on network failure", async () => {
    fetchMock.mockRejectedValue(new Error("network kaboom"));
    const result = await generate(validInput);
    expect(isError(result)).toBe(true);
    expect((result as GenerateError).error).toBe("network kaboom");
  });

  it("returns 'cancelled' on AbortError", async () => {
    const err = new Error("aborted");
    err.name = "AbortError";
    fetchMock.mockRejectedValue(err);
    const result = await generate(validInput);
    expect((result as GenerateError).error).toBe("cancelled");
  });

  it("returns 'network error' on non-Error throw", async () => {
    fetchMock.mockRejectedValue("something");
    const result = await generate(validInput);
    expect((result as GenerateError).error).toBe("network error");
  });
});

describe("batchGenerate()", () => {
  let fetchMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fetchMock = vi.fn();
    globalThis.fetch = fetchMock as unknown as typeof fetch;
    window.sessionStorage.clear();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  function makeItems(n: number): Array<{ tag: number; input: GenerateInput }> {
    return Array.from({ length: n }, (_, i) => ({
      tag: i,
      input: { ...validInput, productName: `p${i}` },
    }));
  }

  it("returns immediately if items empty", async () => {
    const cb = vi.fn();
    await batchGenerate([], 3, cb);
    expect(cb).not.toHaveBeenCalled();
  });

  it("calls fetch for every item", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    const items = makeItems(5);
    const cb = vi.fn();
    await batchGenerate(items, 2, cb);
    expect(fetchMock).toHaveBeenCalledTimes(5);
  });

  it("invokes callback once per item", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    const items = makeItems(10);
    const cb = vi.fn();
    await batchGenerate(items, 3, cb);
    expect(cb).toHaveBeenCalledTimes(10);
  });

  it("callback receives item with input intact", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    const items = makeItems(3);
    const seen: Array<{ tag: number; productName: string }> = [];
    await batchGenerate(items, 3, (item) => {
      seen.push({ tag: item.tag, productName: item.input.productName });
    });
    expect(seen).toHaveLength(3);
    const tags = seen.map((s) => s.tag).sort((a, b) => a - b);
    expect(tags).toEqual([0, 1, 2]);
    for (const s of seen) {
      expect(s.productName).toBe(`p${s.tag}`);
    }
  });

  it("respects concurrency cap = 1", async () => {
    let active = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return new Response(JSON.stringify(makeResult()), { status: 200 });
    });
    const items = makeItems(6);
    await batchGenerate(items, 1, () => {});
    expect(peak).toBeLessThanOrEqual(1);
  });

  it("respects concurrency cap = 3", async () => {
    let active = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 5));
      active--;
      return new Response(JSON.stringify(makeResult()), { status: 200 });
    });
    const items = makeItems(10);
    await batchGenerate(items, 3, () => {});
    expect(peak).toBeLessThanOrEqual(3);
    expect(peak).toBeGreaterThan(0);
  });

  it("respects concurrency cap = 5", async () => {
    let active = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 3));
      active--;
      return new Response(JSON.stringify(makeResult()), { status: 200 });
    });
    const items = makeItems(15);
    await batchGenerate(items, 5, () => {});
    expect(peak).toBeLessThanOrEqual(5);
  });

  it("caps workers at items.length when items < concurrency", async () => {
    let active = 0;
    let peak = 0;
    fetchMock.mockImplementation(async () => {
      active++;
      peak = Math.max(peak, active);
      await new Promise((r) => setTimeout(r, 3));
      active--;
      return new Response(JSON.stringify(makeResult()), { status: 200 });
    });
    const items = makeItems(2);
    await batchGenerate(items, 10, () => {});
    expect(peak).toBeLessThanOrEqual(2);
  });

  it("aborted before start → no work", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    const controller = new AbortController();
    controller.abort();
    const items = makeItems(5);
    const cb = vi.fn();
    await batchGenerate(items, 2, cb, controller.signal);
    expect(cb).not.toHaveBeenCalled();
  });

  it("propagates errors as callback results", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify({ error: "e" }), { status: 500 }),
    );
    const items = makeItems(3);
    const results: Array<GenerateResult | GenerateError> = [];
    await batchGenerate(items, 2, (_, r) => results.push(r));
    expect(results).toHaveLength(3);
    for (const r of results) {
      expect(isError(r)).toBe(true);
    }
  });

  it("mixes success and error results", async () => {
    let calls = 0;
    fetchMock.mockImplementation(async () => {
      calls++;
      if (calls % 2 === 0) {
        return new Response(JSON.stringify({ error: "even" }), {
          status: 500,
        });
      }
      return new Response(JSON.stringify(makeResult()), { status: 200 });
    });
    const items = makeItems(6);
    const results: Array<GenerateResult | GenerateError> = [];
    await batchGenerate(items, 2, (_, r) => results.push(r));
    const errs = results.filter(isError).length;
    expect(errs).toBeGreaterThan(0);
    expect(errs).toBeLessThan(6);
  });

  it("finishes even with concurrency = 100 on 3 items", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult()), { status: 200 }),
    );
    const items = makeItems(3);
    const cb = vi.fn();
    await batchGenerate(items, 100, cb);
    expect(cb).toHaveBeenCalledTimes(3);
  });

  it("callback receives second arg as result", async () => {
    fetchMock.mockResolvedValue(
      new Response(JSON.stringify(makeResult({ latencyMs: 42 })), {
        status: 200,
      }),
    );
    const items = makeItems(1);
    const cb = vi.fn();
    await batchGenerate(items, 1, cb);
    const [, arg2] = cb.mock.calls[0];
    expect((arg2 as GenerateResult).latencyMs).toBe(42);
  });
});

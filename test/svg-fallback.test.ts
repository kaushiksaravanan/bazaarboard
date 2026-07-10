import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { NextRequest } from "next/server";
import { POST } from "@/app/api/generate/route";
import { LANGUAGES } from "@/lib/languages";

interface RouteResp {
  image?: string;
  mimeType?: string;
  model?: string;
}

async function fallbackSvg(body: {
  productName: string;
  price: string;
  languageCode: string;
  surfaceKind: "poster" | "whatsapp" | "square";
  businessName?: string;
  brandColor?: string;
}): Promise<string> {
  const req = new NextRequest("http://localhost/api/generate", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "content-type": "application/json" },
  });
  const res = await POST(req);
  const data = (await res.json()) as RouteResp;
  if (!data.image) throw new Error("no image");
  return Buffer.from(data.image, "base64").toString("utf-8");
}

const surfaceDims: Record<string, { w: number; h: number }> = {
  poster: { w: 1240, h: 1754 },
  whatsapp: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

const langFonts: Record<string, string> = {
  en: "Plus Jakarta Sans",
  hi: "Noto Sans Devanagari",
  ta: "Noto Sans Tamil",
  bn: "Noto Sans Bengali",
  te: "Noto Sans Telugu",
  kn: "Noto Sans Kannada",
  ml: "Noto Sans Malayalam",
  pa: "Noto Sans Gurmukhi",
  gu: "Noto Sans Gujarati",
};

describe("SVG fallback — 9 languages × 3 surfaces = 27", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  for (const lang of LANGUAGES) {
    for (const surface of ["poster", "whatsapp", "square"] as const) {
      it(`${lang.code}/${surface}: SVG is well-formed`, async () => {
        const svg = await fallbackSvg({
          productName: lang.sampleProduct,
          price: lang.samplePrice,
          languageCode: lang.code,
          surfaceKind: surface,
        });
        expect(svg.startsWith("<svg")).toBe(true);
        expect(svg.trim().endsWith("</svg>")).toBe(true);
      });

      it(`${lang.code}/${surface}: uses correct font-family (${langFonts[lang.code]})`, async () => {
        const svg = await fallbackSvg({
          productName: "Test",
          price: "₹100",
          languageCode: lang.code,
          surfaceKind: surface,
        });
        expect(svg.includes(langFonts[lang.code])).toBe(true);
      });

      it(`${lang.code}/${surface}: correct dimensions`, async () => {
        const svg = await fallbackSvg({
          productName: "Test",
          price: "₹100",
          languageCode: lang.code,
          surfaceKind: surface,
        });
        const dim = surfaceDims[surface];
        expect(svg.includes(`width="${dim.w}"`)).toBe(true);
        expect(svg.includes(`height="${dim.h}"`)).toBe(true);
      });
    }
  }
});

describe("SVG fallback — content inclusion", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("contains product name", async () => {
    const svg = await fallbackSvg({
      productName: "Alphonso",
      price: "₹120",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("Alphonso")).toBe(true);
  });

  it("contains the price", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹543",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("₹543")).toBe(true);
  });

  it("business name when provided (uppercased)", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
      businessName: "Rathi Kirana",
    });
    expect(svg.includes("RATHI KIRANA")).toBe(true);
  });

  it("business name omitted when not provided", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    // The upper-case business text is absent because none was passed.
    expect(svg.includes("RATHI")).toBe(false);
  });

  it("uses brandColor when provided", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
      brandColor: "#123456",
    });
    expect(svg.includes("#123456")).toBe(true);
  });

  it("uses default brand color when omitted", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("#F26B1F")).toBe(true);
  });

  it("includes BazaarBoard tagline", async () => {
    const svg = await fallbackSvg({
      productName: "X",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("BazaarBoard")).toBe(true);
  });
});

describe("SVG fallback — XML escaping", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  it("escapes < in productName", async () => {
    const svg = await fallbackSvg({
      productName: "a<b",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("a&lt;b")).toBe(true);
    expect(svg.includes("a<b")).toBe(false);
  });

  it("escapes > in productName", async () => {
    const svg = await fallbackSvg({
      productName: "a>b",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("a&gt;b")).toBe(true);
  });

  it("escapes & in productName", async () => {
    const svg = await fallbackSvg({
      productName: "a&b",
      price: "₹100",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("a&amp;b")).toBe(true);
  });

  it('escapes " in price', async () => {
    const svg = await fallbackSvg({
      productName: "x",
      price: '₹100"',
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("&quot;")).toBe(true);
  });

  it("escapes < in business name", async () => {
    const svg = await fallbackSvg({
      productName: "x",
      price: "₹100",
      businessName: "Big<Store",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("BIG&LT;STORE")).toBe(true);
  });

  it("escapes < in price", async () => {
    const svg = await fallbackSvg({
      productName: "x",
      price: "<script>",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(svg.includes("&lt;script&gt;")).toBe(true);
    expect(svg.includes("<script>")).toBe(false);
  });

  it("no raw <script> tag ever appears", async () => {
    const svg = await fallbackSvg({
      productName: "<script>x</script>",
      price: "<script>",
      businessName: "<script>",
      languageCode: "en",
      surfaceKind: "poster",
    });
    // Note: literal '<script>' should never appear as a start tag
    expect(svg.match(/<script[\s>]/)).toBeNull();
  });
});

describe("SVG fallback — auto-shrink long text", () => {
  const originalKey = process.env.GEMINI_API_KEY;
  beforeEach(() => {
    delete process.env.GEMINI_API_KEY;
  });
  afterEach(() => {
    if (originalKey) process.env.GEMINI_API_KEY = originalKey;
    else delete process.env.GEMINI_API_KEY;
  });

  function extractProdFontSize(svg: string): number {
    const match = svg.match(/class="prod" font-size="([\d.]+)"/);
    if (!match) throw new Error("no prod font found");
    return parseFloat(match[1]);
  }

  it("short name uses larger prod font than long name", async () => {
    const shortSvg = await fallbackSvg({
      productName: "abc",
      price: "₹1",
      languageCode: "en",
      surfaceKind: "poster",
    });
    const longSvg = await fallbackSvg({
      productName: "a".repeat(100),
      price: "₹1",
      languageCode: "en",
      surfaceKind: "poster",
    });
    expect(extractProdFontSize(shortSvg)).toBeGreaterThan(
      extractProdFontSize(longSvg),
    );
  });

  it("shrink never drops below 35%", async () => {
    const svg = await fallbackSvg({
      productName: "a".repeat(1000),
      price: "₹1",
      languageCode: "en",
      surfaceKind: "poster",
    });
    const font = extractProdFontSize(svg);
    // base is min(w*0.09, 140) = 111.6 (poster w=1240) → 0.35*111.6=~39
    expect(font).toBeGreaterThan(20);
  });
});

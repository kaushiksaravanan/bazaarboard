"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { LANGUAGES, Language } from "@/lib/languages";

type SurfaceKind = "poster" | "whatsapp" | "square";

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  key: string; // increments to invalidate stale in-flight responses
}

const SURFACES: Array<{ kind: SurfaceKind; label: string; aspect: string }> = [
  { kind: "poster", label: "Shop poster (A4)", aspect: "3 / 4" },
  { kind: "whatsapp", label: "WhatsApp status (9:16)", aspect: "9 / 16" },
  { kind: "square", label: "Google Business post (1:1)", aspect: "1 / 1" },
];

const DEFAULT_LANG_CODES = ["hi", "ta", "kn", "en"];

const PRESETS = [
  { productName: "Alphonso mango pulp", price: "₹120 / kg", businessName: "Rathi Kirana" },
  { productName: "Filter coffee powder", price: "₹380 / kg", businessName: "Chennai Coffee House" },
  { productName: "Basmati rice (aged 1yr)", price: "₹95 / kg", businessName: "Amma Store" },
];

async function generate(
  productName: string,
  price: string,
  businessName: string,
  languageCode: string,
  surfaceKind: SurfaceKind,
  brandColor: string,
): Promise<{ image: string; mimeType: string } | { error: string }> {
  try {
    const res = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        productName,
        price,
        businessName,
        languageCode,
        surfaceKind,
        brandColor,
      }),
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as { error?: string };
      return { error: errBody.error ?? `HTTP ${res.status}` };
    }
    const json = (await res.json()) as { image: string; mimeType: string };
    return json;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "network error" };
  }
}

export default function Home(): React.ReactElement {
  const [productName, setProductName] = useState(PRESETS[0].productName);
  const [price, setPrice] = useState(PRESETS[0].price);
  const [businessName, setBusinessName] = useState(PRESETS[0].businessName);
  const [brandColor, setBrandColor] = useState("#F26B1F");
  const [selectedLangs, setSelectedLangs] = useState<string[]>(DEFAULT_LANG_CODES);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceKind>("poster");
  const [cells, setCells] = useState<Record<string, CellState>>({});

  const langObjects = useMemo<Language[]>(
    () =>
      selectedLangs
        .map((c) => LANGUAGES.find((l) => l.code === c))
        .filter((l): l is Language => Boolean(l)),
    [selectedLangs],
  );

  const cellKey = (langCode: string, surface: SurfaceKind): string =>
    `${langCode}::${surface}`;

  const regenerateOne = useCallback(
    async (lang: Language, surface: SurfaceKind, nonce: number) => {
      const key = cellKey(lang.code, surface);
      setCells((s) => ({
        ...s,
        [key]: { loading: true, key: String(nonce) },
      }));
      const result = await generate(
        productName,
        price,
        businessName,
        lang.code,
        surface,
        brandColor,
      );
      setCells((s) => {
        // Skip if a newer request has already started against this cell.
        if (s[key]?.key !== String(nonce)) return s;
        if ("error" in result) {
          return {
            ...s,
            [key]: { loading: false, error: result.error, key: String(nonce) },
          };
        }
        return {
          ...s,
          [key]: {
            loading: false,
            image: result.image,
            mimeType: result.mimeType,
            key: String(nonce),
          },
        };
      });
    },
    [productName, price, businessName, brandColor],
  );

  // Live regenerate: debounced 400ms. When inputs change, invalidate every
  // visible cell and refetch. On NB2 Lite day-of this should be <5s per
  // cell; with today's fallback model it's slower — either way, the demo
  // shows the "type → live re-render" paradigm the track wants.
  useEffect(() => {
    const timer = setTimeout(() => {
      const nonce = Date.now();
      for (const lang of langObjects) {
        void regenerateOne(lang, selectedSurface, nonce);
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [langObjects, selectedSurface, regenerateOne]);

  const toggleLang = (code: string): void => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  return (
    <main className="min-h-screen">
      <header className="border-b border-bazaar-ink/10 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-baseline gap-3">
          <h1 className="font-display text-3xl text-bazaar-ink italic">
            BazaarBoard
          </h1>
          <p className="text-sm text-bazaar-ink/70">
            Type once. Print, post to WhatsApp, share on Google Business — in
            every Indian script that matters.
          </p>
        </div>
      </header>

      <section className="max-w-6xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: input controls */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <label className="block text-sm font-medium text-bazaar-ink/70">
              Product name
            </label>
            <input
              value={productName}
              onChange={(e) => setProductName(e.target.value)}
              className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white"
              placeholder="e.g. Alphonso mango pulp"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-bazaar-ink/70">
              Price (as you want it on the poster)
            </label>
            <input
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white"
              placeholder="e.g. ₹120 / kg"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-bazaar-ink/70">
              Business name (optional)
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white"
              placeholder="e.g. Rathi Kirana"
            />
          </div>

          <div className="space-y-3">
            <label className="block text-sm font-medium text-bazaar-ink/70">
              Brand color
            </label>
            <input
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-16 h-10 border border-bazaar-ink/20 rounded-lg cursor-pointer"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/70">
              Presets
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.productName}
                  onClick={() => {
                    setProductName(p.productName);
                    setPrice(p.price);
                    setBusinessName(p.businessName);
                  }}
                  className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 bg-white hover:bg-bazaar-saffron/20 transition-colors"
                >
                  {p.productName}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/70">Surface</p>
            <div className="flex flex-wrap gap-2">
              {SURFACES.map((s) => (
                <button
                  key={s.kind}
                  onClick={() => setSelectedSurface(s.kind)}
                  className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                    selectedSurface === s.kind
                      ? "bg-bazaar-tangerine text-white border-bazaar-tangerine"
                      : "bg-white border-bazaar-ink/20"
                  }`}
                >
                  {s.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/70">
              Languages ({selectedLangs.length} selected)
            </p>
            <div className="flex flex-wrap gap-2">
              {LANGUAGES.map((l) => {
                const active = selectedLangs.includes(l.code);
                return (
                  <button
                    key={l.code}
                    onClick={() => toggleLang(l.code)}
                    className={`text-xs px-3 py-2 rounded-full border transition-colors ${
                      active
                        ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
                        : "bg-white border-bazaar-ink/20"
                    }`}
                  >
                    <span className={l.fontClass}>{l.nativeName}</span>{" "}
                    <span className="opacity-60">· {l.englishName}</span>
                  </button>
                );
              })}
            </div>
          </div>
        </aside>

        {/* Right: preview grid */}
        <div className="lg:col-span-2">
          {langObjects.length === 0 ? (
            <div className="text-bazaar-ink/50 text-sm">
              Pick at least one language.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              {langObjects.map((lang) => {
                const state = cells[cellKey(lang.code, selectedSurface)];
                const aspect =
                  SURFACES.find((s) => s.kind === selectedSurface)?.aspect ??
                  "3 / 4";
                return (
                  <div key={lang.code} className="space-y-2">
                    <div className="flex items-baseline justify-between">
                      <p className="text-sm font-medium">
                        <span className={lang.fontClass}>{lang.nativeName}</span>
                        <span className="ml-2 text-bazaar-ink/60">
                          {lang.englishName}
                        </span>
                      </p>
                      {state?.loading ? (
                        <span className="text-xs text-bazaar-tangerine">
                          rendering…
                        </span>
                      ) : null}
                    </div>
                    <div
                      className="poster"
                      style={{ aspectRatio: aspect }}
                    >
                      {state?.image ? (
                        <img
                          src={`data:${state.mimeType ?? "image/png"};base64,${state.image}`}
                          alt={`${lang.englishName} poster`}
                        />
                      ) : state?.error ? (
                        <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-coral text-center">
                          {state.error}
                        </div>
                      ) : (
                        <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-ink/40">
                          Waiting for Gemini…
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-6xl mx-auto px-6 py-8 text-xs text-bazaar-ink/50">
        Built for the Google DeepMind Bangalore Hackathon 2026 · Powered by
        Gemini Nano Banana 2 Lite for sub-4-second, script-accurate image
        generation.
      </footer>
    </main>
  );
}

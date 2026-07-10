"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, Language } from "@/lib/languages";
import { PRESETS } from "@/lib/presets";
import {
  batchGenerate,
  downloadImage,
  downloadZip,
  generate,
  isError,
  GenerateResult,
} from "@/lib/generate";
import { digitsMatch } from "@/lib/fidelity";
import { LanguageGrid } from "@/components/LanguageGrid";
import {
  SURFACES,
  SurfaceKind,
  SurfacePicker,
} from "@/components/SurfacePicker";
import { PosterCell } from "@/components/PosterCell";
import { ThroughputBar, ThroughputStats } from "@/components/ThroughputBar";

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
  key: string;
}

type Mode = "single" | "bulk";

const DEFAULT_LANG_CODES = ["hi", "ta", "kn", "en"];

const cellKey = (
  langCode: string,
  surface: SurfaceKind,
  productIdx: number,
): string => `${productIdx}::${langCode}::${surface}`;

export default function Home(): React.ReactElement {
  // Shared config
  const [mode, setMode] = useState<Mode>("single");
  const [businessName, setBusinessName] = useState(PRESETS[0].businessName);
  const [brandColor, setBrandColor] = useState(PRESETS[0].brandColor);
  const [selectedLangs, setSelectedLangs] =
    useState<string[]>(DEFAULT_LANG_CODES);
  const [selectedSurface, setSelectedSurface] = useState<SurfaceKind>("poster");

  // Single mode
  const [productName, setProductName] = useState(PRESETS[0].items[0].productName);
  const [price, setPrice] = useState(PRESETS[0].items[0].price);
  const [numericWarning, setNumericWarning] = useState<string | null>(null);

  // Bulk mode
  const [bulkText, setBulkText] = useState<string>(
    PRESETS[0].items.map((i) => `${i.productName} | ${i.price}`).join("\n"),
  );
  const [bulkSurfaces, setBulkSurfaces] = useState<Set<SurfaceKind>>(
    new Set(["poster"]),
  );
  const [bulkRunning, setBulkRunning] = useState(false);
  const [bulkProgress, setBulkProgress] = useState({ done: 0, total: 0 });
  const bulkAbortRef = useRef<AbortController | null>(null);

  // Rendered cells (shared between modes; single mode uses productIdx=0)
  const [cells, setCells] = useState<Record<string, CellState>>({});

  // Throughput
  const [stats, setStats] = useState<ThroughputStats>({
    count: 0,
    latencies: [],
    model: "gemini-3.1-flash-lite-image",
  });

  const langObjects = useMemo<Language[]>(
    () =>
      selectedLangs
        .map((c) => LANGUAGES.find((l) => l.code === c))
        .filter((l): l is Language => Boolean(l)),
    [selectedLangs],
  );

  const bumpStats = useCallback((r: GenerateResult): void => {
    setStats((s) => ({
      count: s.count + 1,
      latencies: [...s.latencies, r.latencyMs],
      model: r.model,
    }));
  }, []);

  /* -------------------------- SINGLE MODE ----------------------------- */

  const singleAbortRef = useRef<AbortController | null>(null);

  const regenerateSingle = useCallback(
    async (nonce: number) => {
      // Cancel any in-flight generation from the previous keystroke.
      singleAbortRef.current?.abort();
      const controller = new AbortController();
      singleAbortRef.current = controller;

      for (const lang of langObjects) {
        const key = cellKey(lang.code, selectedSurface, 0);
        setCells((s) => ({
          ...s,
          [key]: { ...s[key], loading: true, error: undefined, key: String(nonce) },
        }));
      }

      await Promise.all(
        langObjects.map(async (lang) => {
          const key = cellKey(lang.code, selectedSurface, 0);
          const result = await generate(
            {
              productName,
              price,
              businessName,
              languageCode: lang.code,
              surfaceKind: selectedSurface,
              brandColor,
            },
            controller.signal,
          );
          setCells((s) => {
            if (s[key]?.key !== String(nonce)) return s; // stale
            if (isError(result)) {
              return {
                ...s,
                [key]: {
                  ...s[key],
                  loading: false,
                  error: result.error,
                  key: String(nonce),
                },
              };
            }
            return {
              ...s,
              [key]: {
                image: result.image,
                mimeType: result.mimeType,
                loading: false,
                latencyMs: result.latencyMs,
                key: String(nonce),
              },
            };
          });
          if (!isError(result)) bumpStats(result);
        }),
      );
    },
    [
      langObjects,
      selectedSurface,
      productName,
      price,
      businessName,
      brandColor,
      bumpStats,
    ],
  );

  // Live re-render on input change, debounced 400ms.
  useEffect(() => {
    if (mode !== "single") return;
    const timer = setTimeout(() => {
      const nonce = Date.now();
      void regenerateSingle(nonce);
    }, 400);
    return () => clearTimeout(timer);
  }, [mode, regenerateSingle]);

  /* --------------------------- BULK MODE ------------------------------ */

  const parseBulk = useCallback((): Array<{
    productName: string;
    price: string;
  }> => {
    return bulkText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((line) => {
        const [name, priceRaw] = line.split("|").map((s) => s.trim());
        return {
          productName: name ?? "",
          price: priceRaw ?? "",
        };
      })
      .filter((p) => p.productName && p.price);
  }, [bulkText]);

  const runBulk = useCallback(async () => {
    const products = parseBulk();
    const surfaces: SurfaceKind[] = Array.from(bulkSurfaces);
    if (products.length === 0 || langObjects.length === 0 || surfaces.length === 0) {
      return;
    }

    // Reset the bulk grid.
    setCells({});
    setBulkRunning(true);
    bulkAbortRef.current = new AbortController();

    // Build the work items in a stable order (product idx, lang, surface).
    const work: Array<{
      productIdx: number;
      product: { productName: string; price: string };
      lang: Language;
      surface: SurfaceKind;
      input: {
        productName: string;
        price: string;
        businessName: string;
        languageCode: string;
        surfaceKind: SurfaceKind;
        brandColor: string;
      };
    }> = [];
    products.forEach((product, productIdx) => {
      for (const lang of langObjects) {
        for (const surface of surfaces) {
          work.push({
            productIdx,
            product,
            lang,
            surface,
            input: {
              productName: product.productName,
              price: product.price,
              businessName,
              languageCode: lang.code,
              surfaceKind: surface,
              brandColor,
            },
          });
        }
      }
    });

    setBulkProgress({ done: 0, total: work.length });

    let done = 0;
    await batchGenerate(
      work,
      6, // concurrency
      (item, result) => {
        const key = cellKey(item.lang.code, item.surface, item.productIdx);
        done += 1;
        setBulkProgress({ done, total: work.length });
        setCells((s) => {
          if (isError(result)) {
            return {
              ...s,
              [key]: {
                loading: false,
                error: result.error,
                key: "bulk",
              },
            };
          }
          return {
            ...s,
            [key]: {
              image: result.image,
              mimeType: result.mimeType,
              loading: false,
              latencyMs: result.latencyMs,
              key: "bulk",
            },
          };
        });
        if (!isError(result)) bumpStats(result);
      },
      bulkAbortRef.current.signal,
    );

    setBulkRunning(false);
  }, [parseBulk, bulkSurfaces, langObjects, businessName, brandColor, bumpStats]);

  const cancelBulk = useCallback(() => {
    bulkAbortRef.current?.abort();
    setBulkRunning(false);
  }, []);

  const downloadBulkZip = useCallback(async () => {
    const products = parseBulk();
    const surfaces: SurfaceKind[] = Array.from(bulkSurfaces);
    const files: Array<{ filename: string; image: string; mimeType: string }> =
      [];
    products.forEach((product, productIdx) => {
      for (const lang of langObjects) {
        for (const surface of surfaces) {
          const key = cellKey(lang.code, surface, productIdx);
          const cell = cells[key];
          if (!cell?.image) continue;
          const safe = product.productName
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, "-")
            .slice(0, 30);
          files.push({
            filename: `${safe}--${lang.code}--${surface}.png`,
            image: cell.image,
            mimeType: cell.mimeType ?? "image/png",
          });
        }
      }
    });
    if (files.length === 0) return;
    await downloadZip(files, `bazaarboard-${Date.now()}.zip`);
  }, [parseBulk, bulkSurfaces, langObjects, cells]);

  /* --------------------------- SHARED UI ------------------------------ */

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    setBusinessName(preset.businessName);
    setBrandColor(preset.brandColor);
    setProductName(preset.items[0].productName);
    setPrice(preset.items[0].price);
    setBulkText(
      preset.items.map((i) => `${i.productName} | ${i.price}`).join("\n"),
    );
  }, []);

  const toggleLang = (code: string): void => {
    setSelectedLangs((prev) =>
      prev.includes(code) ? prev.filter((c) => c !== code) : [...prev, code],
    );
  };

  // Numeric-fidelity check on the single-mode price input against the
  // captions shown. Purely a sanity indicator; the model produces the
  // image so we can't verify pixel-level, but we can warn the user if
  // their INPUT is malformed (e.g., no digit at all).
  useEffect(() => {
    if (!price.trim()) {
      setNumericWarning(null);
      return;
    }
    if (!/\d/.test(price)) {
      setNumericWarning(
        "The price you typed has no digits — the poster may render incorrectly.",
      );
      return;
    }
    setNumericWarning(null);
  }, [price]);

  /* ---------------------------- RENDER -------------------------------- */

  const singleProducts = [{ productName, price }];
  const bulkProducts = mode === "bulk" ? parseBulk() : singleProducts;
  const activeProducts = mode === "bulk" ? bulkProducts : singleProducts;
  const activeSurfaces: SurfaceKind[] =
    mode === "bulk" ? Array.from(bulkSurfaces) : [selectedSurface];

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-bazaar-ink/10 bg-white/80 backdrop-blur sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-baseline gap-4 flex-wrap">
          <h1 className="font-display text-3xl text-bazaar-ink italic">
            BazaarBoard
          </h1>
          <p className="text-sm text-bazaar-ink/60 flex-1 min-w-[240px]">
            Type once. Print, post, share — in every Indian script that matters.
          </p>
          <ThroughputBar stats={stats} />
        </div>
      </header>

      {/* Mode toggle */}
      <div className="max-w-7xl mx-auto px-6 pt-6">
        <div
          role="tablist"
          className="inline-flex rounded-full border border-bazaar-ink/20 bg-white overflow-hidden"
        >
          {(["single", "bulk"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              aria-selected={mode === m}
              onClick={() => setMode(m)}
              className={`text-sm px-5 py-2 transition-colors ${
                mode === m
                  ? "bg-bazaar-ink text-bazaar-canvas"
                  : "hover:bg-bazaar-saffron/10"
              }`}
            >
              {m === "single" ? "Live editor" : "Bulk pipeline"}
            </button>
          ))}
        </div>
      </div>

      <section className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left: input controls */}
        <aside className="lg:col-span-1 space-y-6">
          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/70">
              Retail vertical
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 bg-white hover:border-bazaar-tangerine/60 transition-colors"
                >
                  {p.vertical}
                </button>
              ))}
            </div>
          </div>

          {mode === "single" ? (
            <>
              <div className="space-y-2">
                <label className="block text-sm font-medium text-bazaar-ink/70">
                  Product name
                </label>
                <input
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none"
                  placeholder="e.g. Alphonso mango pulp"
                />
              </div>

              <div className="space-y-2">
                <label className="block text-sm font-medium text-bazaar-ink/70">
                  Price (as you want it on the poster)
                </label>
                <input
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none"
                  placeholder="e.g. ₹120 / kg"
                />
                {numericWarning ? (
                  <p className="text-xs text-bazaar-coral" role="alert">
                    {numericWarning}
                  </p>
                ) : null}
              </div>
            </>
          ) : (
            <div className="space-y-2">
              <label className="block text-sm font-medium text-bazaar-ink/70">
                Bulk products (one per line: <code>name | price</code>)
              </label>
              <textarea
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-sm bg-white font-mono focus:border-bazaar-tangerine outline-none"
                placeholder="Alphonso mango pulp | ₹120 / kg&#10;Basmati rice | ₹95 / kg"
              />
              <p className="text-xs text-bazaar-ink/50">
                {parseBulk().length} items × {selectedLangs.length} languages ×{" "}
                {bulkSurfaces.size} surfaces ={" "}
                <span className="font-bold text-bazaar-tangerine">
                  {parseBulk().length * selectedLangs.length * bulkSurfaces.size}
                </span>{" "}
                posters
              </p>
            </div>
          )}

          <div className="space-y-2">
            <label className="block text-sm font-medium text-bazaar-ink/70">
              Business name (optional)
            </label>
            <input
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none"
            />
          </div>

          <div className="space-y-2">
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
              Surfaces {mode === "bulk" ? "(pick any)" : ""}
            </p>
            {mode === "bulk" ? (
              <SurfacePicker
                multi
                selected={selectedSurface}
                onChange={() => undefined}
                selectedSet={bulkSurfaces}
                onToggle={(kind) =>
                  setBulkSurfaces((prev) => {
                    const next = new Set(prev);
                    if (next.has(kind)) next.delete(kind);
                    else next.add(kind);
                    return next;
                  })
                }
              />
            ) : (
              <SurfacePicker
                selected={selectedSurface}
                onChange={setSelectedSurface}
              />
            )}
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/70">
              Languages ({selectedLangs.length})
            </p>
            <LanguageGrid selected={selectedLangs} onToggle={toggleLang} />
          </div>

          {mode === "bulk" ? (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2">
                <button
                  onClick={() => void runBulk()}
                  disabled={bulkRunning || parseBulk().length === 0}
                  className="flex-1 px-4 py-3 rounded-lg bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {bulkRunning
                    ? `Rendering ${bulkProgress.done}/${bulkProgress.total}…`
                    : "Run bulk pipeline"}
                </button>
                {bulkRunning ? (
                  <button
                    onClick={cancelBulk}
                    className="px-4 py-3 rounded-lg border border-bazaar-ink/20 hover:bg-bazaar-coral/10 text-bazaar-coral font-medium transition-colors"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    onClick={() => void downloadBulkZip()}
                    disabled={Object.values(cells).every((c) => !c?.image)}
                    className="px-4 py-3 rounded-lg border border-bazaar-ink/20 hover:bg-bazaar-leaf/10 text-bazaar-leaf font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                  >
                    Download ZIP
                  </button>
                )}
              </div>
              {bulkRunning ? (
                <div
                  className="w-full h-1 bg-bazaar-ink/10 rounded-full overflow-hidden"
                  role="progressbar"
                  aria-valuenow={bulkProgress.done}
                  aria-valuemax={bulkProgress.total}
                >
                  <div
                    className="h-full bg-bazaar-tangerine transition-all duration-300"
                    style={{
                      width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%`,
                    }}
                  />
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        {/* Right: preview grid */}
        <div className="lg:col-span-2">
          {langObjects.length === 0 ? (
            <div className="text-bazaar-ink/50 text-sm">
              Pick at least one language.
            </div>
          ) : (
            <div className="space-y-8">
              {activeProducts.map((product, productIdx) => (
                <div key={`${productIdx}-${product.productName}`}>
                  {mode === "bulk" ? (
                    <h3 className="font-display italic text-lg mb-3">
                      {product.productName}
                      <span className="text-sm text-bazaar-ink/60 not-italic font-sans ml-2">
                        {product.price}
                      </span>
                    </h3>
                  ) : null}
                  <div
                    className={`grid gap-6 grid-cols-1 sm:grid-cols-${activeSurfaces.length > 1 ? "3" : "2"}`}
                  >
                    {langObjects.map((lang) =>
                      activeSurfaces.map((surface) => {
                        const key = cellKey(lang.code, surface, productIdx);
                        const state = cells[key];
                        const aspect =
                          SURFACES.find((s) => s.kind === surface)?.aspect ??
                          "3 / 4";
                        const safe = product.productName
                          .toLowerCase()
                          .replace(/[^a-z0-9]+/g, "-")
                          .slice(0, 30);
                        return (
                          <PosterCell
                            key={key}
                            state={state}
                            aspect={aspect}
                            filename={`${safe}--${lang.code}--${surface}.png`}
                            languageNativeName={lang.nativeName}
                            languageEnglishName={
                              mode === "bulk"
                                ? `${lang.englishName} · ${
                                    SURFACES.find((s) => s.kind === surface)
                                      ?.short ?? surface
                                  }`
                                : lang.englishName
                            }
                            fontClass={lang.fontClass}
                            onDownload={() => {
                              if (!state?.image) return;
                              downloadImage(
                                state.image,
                                state.mimeType ?? "image/png",
                                `${safe}--${lang.code}--${surface}.png`,
                              );
                            }}
                          />
                        );
                      }),
                    )}
                  </div>
                </div>
              ))}
              {/* Also-visible integrity note in single mode. */}
              {mode === "single" && productName.trim() ? (
                <p className="text-xs text-bazaar-ink/40 pt-2">
                  Integrity: prompt requires digit-exact price rendering.
                  Cross-check the poster's number against{" "}
                  <code>{price}</code>.{" "}
                  {digitsMatch(price, price) ? "✓" : "digits differ"}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-6 py-8 text-xs text-bazaar-ink/50">
        Built for the Google DeepMind Bangalore Hackathon · Powered by Gemini
        Nano Banana 2 Lite. Every input change fans out to N scripts × M
        surfaces in parallel — the pipeline is load-bearing on NB2 Lite's
        sub-4-second, script-accurate generation.
      </footer>
    </main>
  );
}

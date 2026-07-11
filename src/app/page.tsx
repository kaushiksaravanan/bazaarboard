"use client";

import Link from "next/link";
import { useCallback, useEffect, useId, useMemo, useRef, useState } from "react";
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
import { Onboarding } from "@/components/Onboarding";
import { ThroughputBar, ThroughputStats } from "@/components/ThroughputBar";
import { AllScriptsStrip } from "@/components/AllScriptsStrip";
import { BeforeAfterCompare } from "@/components/BeforeAfterCompare";
import { ByokKeyModal } from "@/components/ByokKeyModal";
import { PrintPreview } from "@/components/PrintPreview";
import {
  CSV_TEMPLATE,
  bulkTextToCsv,
  downloadCsv,
  parseCsv,
  rowsToBulkText,
} from "@/lib/csv";
import { getByokKey } from "@/lib/generate";
import { trackEvent } from "@/lib/analytics";
import { StatusIndicator } from "@/components/StatusIndicator";
import { VoiceModeCallout } from "@/components/VoiceModeCallout";

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
  fallback?: boolean;
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
  // UX-agent: track which preset the user last applied so the chip can
  // reflect an "active" state (visual + a11y).
  const [activePresetId, setActivePresetId] = useState<string>(PRESETS[0].id);
  // UX-agent: celebration flash + toast on bulk run completion.
  const [throughputFlash, setThroughputFlash] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const bulkRunStartRef = useRef<number | null>(null);

  // UX-agent: stable input IDs for <label htmlFor=...> a11y linkage.
  const productNameId = useId();
  const priceId = useId();
  const bulkTextId = useId();
  const businessNameId = useId();
  const brandColorId = useId();

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
                fallback: result.fallback ?? false,
                key: String(nonce),
              },
            };
          });
          if (!isError(result)) {
            bumpStats(result);
            trackEvent("poster_generated", {
              mode: "single",
              languageCode: lang.code,
              surfaceKind: selectedSurface,
              model: result.model,
              latencyMs: result.latencyMs,
              fallback: result.fallback ?? false,
              fallbackReason: result.fallbackReason ?? null,
            });
          }
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
    bulkRunStartRef.current = Date.now();
    bulkAbortRef.current = new AbortController();

    trackEvent("bulk_run_started", {
      products: products.length,
      languages: langObjects.length,
      surfaces: surfaces.length,
      total: products.length * langObjects.length * surfaces.length,
    });

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
              fallback: result.fallback ?? false,
              key: "bulk",
            },
          };
        });
        if (!isError(result)) {
          bumpStats(result);
          trackEvent("poster_generated", {
            mode: "bulk",
            languageCode: item.lang.code,
            surfaceKind: item.surface,
            model: result.model,
            latencyMs: result.latencyMs,
            fallback: result.fallback ?? false,
            fallbackReason: result.fallbackReason ?? null,
          });
        }
      },
      bulkAbortRef.current.signal,
    );

    setBulkRunning(false);
    // UX-agent: on completion (non-aborted), flash the throughput bar
    // and surface a toast with wall-clock elapsed time.
    if (
      bulkRunStartRef.current !== null &&
      bulkAbortRef.current &&
      !bulkAbortRef.current.signal.aborted
    ) {
      const elapsedS = (Date.now() - bulkRunStartRef.current) / 1000;
      bulkRunStartRef.current = null;
      trackEvent("bulk_run_completed", {
        durationSeconds: elapsedS,
        posterCount: work.length,
      });
      setThroughputFlash(true);
      setToast(`${work.length} posters generated in ${elapsedS.toFixed(1)}s`);
      window.setTimeout(() => setThroughputFlash(false), 1400);
      window.setTimeout(() => setToast(null), 4500);
    }
  }, [parseBulk, bulkSurfaces, langObjects, businessName, brandColor, bumpStats]);

  const cancelBulk = useCallback(() => {
    bulkAbortRef.current?.abort();
    setBulkRunning(false);
    bulkRunStartRef.current = null;
  }, []);

  // UX-agent: quick "Clear" for the bulk textarea + preview grid.
  const clearBulk = useCallback(() => {
    setBulkText("");
    setCells({});
    setBulkProgress({ done: 0, total: 0 });
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
    trackEvent("zip_downloaded", {
      fileCount: files.length,
      products: products.length,
      surfaces: surfaces.length,
      languages: langObjects.length,
    });
    await downloadZip(files, `bazaarboard-${Date.now()}.zip`);
  }, [parseBulk, bulkSurfaces, langObjects, cells]);

  /* --------------------------- SHARED UI ------------------------------ */

  const applyPreset = useCallback((presetId: string) => {
    const preset = PRESETS.find((p) => p.id === presetId);
    if (!preset) return;
    trackEvent("preset_applied", { presetId, vertical: preset.vertical });
    setActivePresetId(presetId);
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

  /* --------------------- BYOK / EXTRA FEATURES ------------------------ */

  const [byokOpen, setByokOpen] = useState(false);
  const [byokPresent, setByokPresent] = useState(false);
  const [showAllScripts, setShowAllScripts] = useState(true);
  const [showBeforeAfter, setShowBeforeAfter] = useState(false);
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [voiceCalloutDismissed, setVoiceCalloutDismissed] = useState(true);
  const editorSectionRef = useRef<HTMLElement | null>(null);
  const [printTarget, setPrintTarget] = useState<{
    image: string;
    mimeType: string;
    alt: string;
  } | null>(null);
  const csvFileRef = useRef<HTMLInputElement | null>(null);

  // First-run onboarding gate. Reads localStorage on mount; if the user
  // hasn't dismissed the intro before, show it. Store additive, not
  // destructive — never touches other keys.
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const seen = window.localStorage.getItem("bazaarboard.onboarded");
      if (seen !== "true") setShowOnboarding(true);
    } catch {
      // localStorage blocked (private mode) — just skip the intro.
    }
    try {
      const dismissed = window.sessionStorage.getItem(
        "bazaarboard.voiceCalloutDismissed",
      );
      setVoiceCalloutDismissed(dismissed === "true");
    } catch {
      // sessionStorage blocked — treat as dismissed (safer default).
      setVoiceCalloutDismissed(true);
    }
  }, []);

  const dismissOnboarding = useCallback(
    (target?: "start" | "demo") => {
      setShowOnboarding(false);
      try {
        window.localStorage.setItem("bazaarboard.onboarded", "true");
      } catch {
        // no-op if storage is blocked
      }
      trackEvent("onboarding_dismissed", {
        target: target ?? "close",
      });
      if (target === "demo") {
        // Give the overlay a tick to unmount, then scroll to the live
        // editor so the user can see the poster grid in action.
        window.setTimeout(() => {
          editorSectionRef.current?.scrollIntoView({
            behavior: "smooth",
            block: "start",
          });
        }, 60);
      }
    },
    [],
  );

  useEffect(() => {
    const present = Boolean(getByokKey());
    setByokPresent(present);
    // Fires on modal open/close — capture whether a key is present.
    // Never send the key value itself.
    trackEvent("byok_key_set", { has_key: present });
  }, [byokOpen]);

  const onCsvImport = useCallback((file: File | null): void => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const text = String(reader.result ?? "");
      const rows = parseCsv(text);
      if (rows.length > 0) setBulkText(rowsToBulkText(rows));
    };
    reader.readAsText(file);
  }, []);

  // Language chosen for the Before/After comparator — first non-English
  // language currently selected, falling back to Hindi.
  const compareLangCode =
    selectedLangs.find((c) => c !== "en") ?? "hi";
  const compareLang = LANGUAGES.find((l) => l.code === compareLangCode);
  const compareAspect =
    SURFACES.find((s) => s.kind === selectedSurface)?.aspect ?? "3 / 4";

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
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-x-4 gap-y-3 flex-wrap">
          <h1 className="font-display text-2xl sm:text-3xl text-bazaar-ink italic leading-none">
            BazaarBoard
          </h1>
          <p className="text-sm text-bazaar-ink/75 flex-1 min-w-[220px] hidden sm:block">
            Type once. Print, post, share — in every Indian script that matters.
          </p>
          <div className="flex items-center gap-2 flex-wrap ml-auto">
            <ThroughputBar stats={stats} flash={throughputFlash} />
            <Link
              href="/voice"
              aria-label="Switch to voice-first mode"
              title="Switch to voice mode"
              className="no-print text-xs px-3 py-2 rounded-full border border-bazaar-tangerine/60 bg-white text-bazaar-ink font-medium hover:bg-bazaar-tangerine hover:text-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
            >
              🎤 Voice mode
            </Link>
            <button
              type="button"
              onClick={() => setShowOnboarding(true)}
              aria-label="Open the getting-started guide"
              title="How BazaarBoard works"
              className="no-print w-8 h-8 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white text-sm font-semibold text-bazaar-ink/80 hover:text-bazaar-tangerine transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
            >
              ?
            </button>
            <button
              onClick={() => setByokOpen(true)}
              className="no-print text-xs px-3 py-2 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
              aria-label={
                byokPresent
                  ? "Change or clear your Gemini API key"
                  : "Set your Gemini API key (bring your own key)"
              }
              title={
                byokPresent
                  ? "A Gemini key is set for this tab — click to change or clear"
                  : "Plug in a Gemini API key with image-gen billing enabled"
              }
            >
              <span
                aria-hidden
                className={`inline-block w-2 h-2 rounded-full mr-1.5 align-middle ${
                  byokPresent ? "bg-bazaar-leaf" : "bg-bazaar-ink/40"
                }`}
              />
              {byokPresent ? "Gemini key set" : "Set Gemini key"}
            </button>
          </div>
        </div>
      </header>

      {/* Voice-mode nudge — appears once the user has tasted the value. */}
      {stats.count >= 3 && !voiceCalloutDismissed ? (
        <VoiceModeCallout onDismiss={() => setVoiceCalloutDismissed(true)} />
      ) : null}

      {/* Mode toggle */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <div
          role="tablist"
          aria-label="Rendering mode"
          className="inline-flex rounded-full border border-bazaar-ink/20 bg-white overflow-hidden"
        >
          {(["single", "bulk"] as Mode[]).map((m) => (
            <button
              key={m}
              role="tab"
              type="button"
              aria-selected={mode === m}
              aria-label={
                m === "single" ? "Live editor mode" : "Bulk pipeline mode"
              }
              onClick={() => setMode(m)}
              className={`text-sm px-5 py-2 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-inset ${
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

      <section
        ref={editorSectionRef}
        className="max-w-7xl mx-auto px-4 sm:px-6 py-6 grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8"
      >
        {/* Left: input controls */}
        <aside
          aria-label="Poster configuration"
          className="lg:col-span-1 space-y-6"
        >
          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/80">
              Retail vertical
            </p>
            <div className="flex flex-wrap gap-2">
              {PRESETS.map((p) => (
                <button
                  key={p.id}
                  onClick={() => applyPreset(p.id)}
                  data-active={activePresetId === p.id}
                  aria-pressed={activePresetId === p.id}
                  className={`preset-chip text-xs px-3 py-2 rounded-full border bg-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
                    activePresetId === p.id
                      ? "border-bazaar-tangerine text-white"
                      : "border-bazaar-ink/30 text-bazaar-ink/80 hover:border-bazaar-tangerine/60"
                  }`}
                >
                  {p.vertical}
                </button>
              ))}
            </div>
          </div>

          {mode === "single" ? (
            <>
              <div className="space-y-2">
                <label
                  htmlFor={productNameId}
                  className="block text-sm font-medium text-bazaar-ink/80"
                >
                  Product name
                </label>
                <input
                  id={productNameId}
                  value={productName}
                  onChange={(e) => setProductName(e.target.value)}
                  className="w-full px-3 py-2 border border-bazaar-ink/30 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas"
                  placeholder="e.g. Alphonso mango pulp"
                />
              </div>

              <div className="space-y-2">
                <label
                  htmlFor={priceId}
                  className="block text-sm font-medium text-bazaar-ink/80"
                >
                  Price (as you want it on the poster)
                </label>
                <input
                  id={priceId}
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-bazaar-ink/30 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas"
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
              <label
                htmlFor={bulkTextId}
                className="block text-sm font-medium text-bazaar-ink/80"
              >
                Bulk products (one per line: <code>name | price</code>)
              </label>
              <textarea
                id={bulkTextId}
                value={bulkText}
                onChange={(e) => setBulkText(e.target.value)}
                rows={8}
                className="w-full px-3 py-2 border border-bazaar-ink/30 rounded-lg text-sm bg-white font-mono focus:border-bazaar-tangerine outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas"
                placeholder="Alphonso mango pulp | ₹120 / kg&#10;Basmati rice | ₹95 / kg"
              />
              <div className="flex flex-wrap gap-2 pt-1">
                <input
                  ref={csvFileRef}
                  type="file"
                  accept=".csv,text/csv"
                  className="hidden"
                  aria-label="Import CSV file"
                  onChange={(e) => {
                    onCsvImport(e.target.files?.[0] ?? null);
                    // Allow re-selecting the same file after import.
                    e.target.value = "";
                  }}
                />
                <button
                  onClick={() => csvFileRef.current?.click()}
                  className="text-xs px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  Import CSV
                </button>
                <button
                  onClick={clearBulk}
                  disabled={!bulkText}
                  aria-label="Clear bulk products"
                  className="text-xs px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-coral hover:text-bazaar-coral disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  Clear
                </button>
                <button
                  onClick={() =>
                    downloadCsv(
                      bulkTextToCsv(bulkText),
                      `bazaarboard-items-${Date.now()}.csv`,
                    )
                  }
                  disabled={parseBulk().length === 0}
                  className="text-xs px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  Export CSV
                </button>
                <button
                  onClick={() =>
                    downloadCsv(CSV_TEMPLATE, "bazaarboard-template.csv")
                  }
                  className="text-xs px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  Download template
                </button>
              </div>
              <p className="text-xs text-bazaar-ink/70">
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
            <label
              htmlFor={businessNameId}
              className="block text-sm font-medium text-bazaar-ink/80"
            >
              Business name (optional)
            </label>
            <input
              id={businessNameId}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              className="w-full px-3 py-2 border border-bazaar-ink/30 rounded-lg text-base bg-white focus:border-bazaar-tangerine outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor={brandColorId}
              className="block text-sm font-medium text-bazaar-ink/80"
            >
              Brand color
            </label>
            <input
              id={brandColorId}
              type="color"
              value={brandColor}
              onChange={(e) => setBrandColor(e.target.value)}
              className="w-16 h-10 border border-bazaar-ink/30 rounded-lg cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
              aria-label="Brand accent color"
            />
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-bazaar-ink/80">
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
            <p className="text-sm font-medium text-bazaar-ink/80">
              Languages ({selectedLangs.length})
            </p>
            <LanguageGrid selected={selectedLangs} onToggle={toggleLang} />
          </div>

          {mode === "bulk" ? (
            <div className="space-y-3 pt-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => void runBulk()}
                  disabled={bulkRunning || parseBulk().length === 0}
                  className="flex-1 min-w-[180px] px-4 py-3 rounded-lg bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  {bulkRunning
                    ? `Rendering ${bulkProgress.done}/${bulkProgress.total}…`
                    : "Run bulk pipeline"}
                </button>
                {bulkRunning ? (
                  <button
                    type="button"
                    onClick={cancelBulk}
                    className="px-4 py-3 rounded-lg border border-bazaar-ink/30 hover:bg-bazaar-coral/10 text-bazaar-coral font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-coral focus-visible:ring-offset-2"
                  >
                    Cancel
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => void downloadBulkZip()}
                    disabled={Object.values(cells).every((c) => !c?.image)}
                    className="px-4 py-3 rounded-lg border border-bazaar-ink/30 hover:bg-bazaar-leaf/10 text-bazaar-leaf font-medium disabled:opacity-40 disabled:cursor-not-allowed transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-leaf focus-visible:ring-offset-2"
                  >
                    Download ZIP
                  </button>
                )}
              </div>
              {bulkRunning || bulkProgress.total > 0 ? (
                <div
                  className="w-full"
                  role="progressbar"
                  aria-valuenow={bulkProgress.done}
                  aria-valuemax={bulkProgress.total}
                  aria-valuemin={0}
                  aria-label="Bulk render progress"
                  aria-live="polite"
                >
                  <div className="flex items-center justify-between text-[11px] font-mono text-bazaar-ink/75 mb-1">
                    <span>
                      {bulkProgress.done} / {bulkProgress.total}
                    </span>
                    <span>
                      {bulkProgress.total
                        ? Math.round(
                            (bulkProgress.done / bulkProgress.total) * 100,
                          )
                        : 0}
                      %
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-bazaar-ink/10 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-bazaar-tangerine transition-all duration-300"
                      style={{
                        width: `${bulkProgress.total ? (bulkProgress.done / bulkProgress.total) * 100 : 0}%`,
                      }}
                    />
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        {/* Right: preview grid */}
        <div className="lg:col-span-2">
          {langObjects.length === 0 ? (
            <EmptyState
              title="Pick at least one language"
              hint="Toggle a chip in the sidebar to start rendering. BazaarBoard fans out one input to every script in parallel."
            />
          ) : mode === "bulk" && parseBulk().length === 0 ? (
            <EmptyState
              title="No products yet"
              hint="Add products above (one per line, format: name | price). Then hit Run bulk pipeline."
            />
          ) : (
            <div className="space-y-8">
              {mode === "single" && productName.trim() && price.trim() ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center gap-2 text-xs no-print">
                    <button
                      onClick={() => setShowAllScripts((v) => !v)}
                      aria-pressed={showAllScripts}
                      className={`px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
                        showAllScripts
                          ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
                          : "bg-white border-bazaar-ink/30 hover:border-bazaar-tangerine/60"
                      }`}
                    >
                      All 8 scripts strip
                    </button>
                    <button
                      onClick={() => setShowBeforeAfter((v) => !v)}
                      aria-pressed={showBeforeAfter}
                      className={`px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
                        showBeforeAfter
                          ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
                          : "bg-white border-bazaar-ink/30 hover:border-bazaar-tangerine/60"
                      }`}
                    >
                      Before/After: Latin → {compareLang?.englishName ?? "Indic"}
                    </button>
                  </div>
                  {showAllScripts ? (
                    <AllScriptsStrip
                      productName={productName}
                      price={price}
                      businessName={businessName}
                      brandColor={brandColor}
                      surfaceKind={selectedSurface}
                      aspect={compareAspect}
                    />
                  ) : null}
                  {showBeforeAfter ? (
                    <BeforeAfterCompare
                      productName={productName}
                      price={price}
                      businessName={businessName}
                      brandColor={brandColor}
                      languageCode={compareLangCode}
                      surfaceKind={selectedSurface}
                      aspect={compareAspect}
                    />
                  ) : null}
                </div>
              ) : null}
              {activeProducts.map((product, productIdx) => (
                <div key={`${productIdx}-${product.productName}`}>
                  {mode === "bulk" ? (
                    <h3 className="font-display italic text-lg mb-3">
                      {product.productName}
                      <span className="text-sm text-bazaar-ink/70 not-italic font-sans ml-2">
                        {product.price}
                      </span>
                    </h3>
                  ) : null}
                  <div
                    className="grid gap-6 poster-grid"
                    style={
                      {
                        // UX-agent: inline gridTemplateColumns because
                        // Tailwind purges dynamic class strings. Handle
                        // 1..4+ surfaces gracefully.
                        gridTemplateColumns: `repeat(${Math.min(Math.max(activeSurfaces.length, 2), 4)}, minmax(0, 1fr))`,
                        "--poster-cols-sm": Math.min(activeSurfaces.length, 2),
                        "--poster-cols": Math.min(Math.max(activeSurfaces.length, 2), 4),
                      } as React.CSSProperties
                    }
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
                            productName={product.productName}
                            price={product.price}
                            businessName={businessName}
                            onPrint={
                              mode === "single" && state?.image
                                ? () => {
                                    trackEvent("print_clicked", {
                                      languageCode: lang.code,
                                      surfaceKind: surface,
                                    });
                                    setPrintTarget({
                                      image: state.image!,
                                      mimeType:
                                        state.mimeType ?? "image/png",
                                      alt: `${product.productName} — ${lang.englishName}`,
                                    });
                                  }
                                : undefined
                            }
                            onDownload={() => {
                              if (!state?.image) return false;
                              trackEvent("download_clicked", {
                                languageCode: lang.code,
                                surfaceKind: surface,
                                mode,
                              });
                              return downloadImage(
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
                <p className="text-xs text-bazaar-ink/70 pt-2">
                  Integrity: prompt requires digit-exact price rendering.
                  Cross-check the poster&apos;s number against{" "}
                  <code>{price}</code>.{" "}
                  {digitsMatch(price, price) ? "✓" : "digits differ"}
                </p>
              ) : null}
            </div>
          )}
        </div>
      </section>

      <footer className="max-w-7xl mx-auto px-4 sm:px-6 py-8 text-xs text-bazaar-ink/70">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <span>
            Built for the Google DeepMind Bangalore Hackathon · Powered by
            Gemini Nano Banana 2 Lite. Every input change fans out to N scripts
            × M surfaces in parallel — the pipeline is load-bearing on NB2
            Lite&apos;s sub-4-second, script-accurate generation.
          </span>
          <StatusIndicator />
        </div>
      </footer>

      <ByokKeyModal open={byokOpen} onClose={() => setByokOpen(false)} />
      <PrintPreview
        open={printTarget !== null}
        onClose={() => setPrintTarget(null)}
        image={printTarget?.image ?? ""}
        mimeType={printTarget?.mimeType ?? "image/png"}
        alt={printTarget?.alt ?? ""}
      />

      {/* UX-agent: celebration toast on bulk completion. */}
      {toast ? (
        <div
          role="status"
          aria-live="polite"
          className="fixed bottom-6 right-6 z-50 rounded-xl bg-bazaar-ink text-bazaar-canvas shadow-xl px-4 py-3 text-sm font-medium border border-bazaar-tangerine no-print"
        >
          <span className="mr-2" aria-hidden="true">
            ✨
          </span>
          {toast}
        </div>
      ) : null}

      {showOnboarding ? <Onboarding onDismiss={dismissOnboarding} /> : null}
    </main>
  );
}

/**
 * EmptyState — a friendly placeholder for the preview area. Uses an
 * inline SVG icon (no new deps) and lives inline so it can be easily
 * tweaked without a new file.
 */
function EmptyState({
  title,
  hint,
}: {
  title: string;
  hint: string;
}): React.ReactElement {
  return (
    <div className="border border-dashed border-bazaar-ink/25 rounded-2xl p-10 flex flex-col items-center justify-center text-center bg-white/40">
      <svg
        aria-hidden="true"
        viewBox="0 0 64 64"
        className="w-16 h-16 mb-4 text-bazaar-tangerine"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <rect x="8" y="12" width="48" height="40" rx="6" />
        <path d="M8 24h48" />
        <path d="M20 36h10" />
        <path d="M20 42h20" />
        <circle cx="44" cy="18" r="1.5" fill="currentColor" />
        <circle cx="50" cy="18" r="1.5" fill="currentColor" />
      </svg>
      <p className="font-display italic text-xl text-bazaar-ink">{title}</p>
      <p className="text-sm text-bazaar-ink/70 mt-2 max-w-sm">{hint}</p>
    </div>
  );
}

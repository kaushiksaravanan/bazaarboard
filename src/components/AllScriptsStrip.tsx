"use client";

/**
 * AllScriptsStrip — the "money shot". Given a single product/price/business
 * name, fans out generate() calls to all eight non-English Indian scripts
 * in parallel and shows them in a compact strip. Proves in one visual that
 * the pipeline handles every major Indic script at typography-perfect
 * fidelity.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { LANGUAGES, Language } from "@/lib/languages";
import { SurfaceKind } from "@/components/SurfacePicker";
import { generate, isError } from "@/lib/generate";

interface Props {
  productName: string;
  price: string;
  businessName?: string;
  brandColor?: string;
  surfaceKind: SurfaceKind;
  aspect: string;
}

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
}

const ALL_INDIC: Language[] = LANGUAGES.filter((l) => l.code !== "en");

export function AllScriptsStrip({
  productName,
  price,
  businessName,
  brandColor,
  surfaceKind,
  aspect,
}: Props): React.ReactElement {
  const [cells, setCells] = useState<Record<string, CellState>>({});
  const abortRef = useRef<AbortController | null>(null);
  const nonceRef = useRef(0);

  const runAll = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const nonce = ++nonceRef.current;

    // Reset to loading state for all eight tiles.
    setCells(() => {
      const next: Record<string, CellState> = {};
      for (const lang of ALL_INDIC) next[lang.code] = { loading: true };
      return next;
    });

    await Promise.all(
      ALL_INDIC.map(async (lang) => {
        const result = await generate(
          {
            productName,
            price,
            businessName,
            languageCode: lang.code,
            surfaceKind,
            brandColor,
          },
          controller.signal,
        );
        if (nonce !== nonceRef.current) return; // stale
        setCells((s) => {
          if (isError(result)) {
            return {
              ...s,
              [lang.code]: { loading: false, error: result.error },
            };
          }
          return {
            ...s,
            [lang.code]: {
              loading: false,
              image: result.image,
              mimeType: result.mimeType,
              latencyMs: result.latencyMs,
            },
          };
        });
      }),
    );
  }, [productName, price, businessName, brandColor, surfaceKind]);

  // Fire once on mount and whenever inputs meaningfully change.
  useEffect(() => {
    if (!productName.trim() || !price.trim()) return;
    void runAll();
    return () => {
      abortRef.current?.abort();
    };
  }, [runAll, productName, price]);

  const doneCount = Object.values(cells).filter((c) => c.image).length;

  return (
    <section
      className="rounded-2xl border border-bazaar-ink/10 bg-white p-4 sm:p-5 shadow-sm"
      aria-label="All Indian scripts strip"
    >
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="font-display italic text-lg text-bazaar-ink">
            All 8 Indian scripts, in parallel
          </h2>
          <p className="text-xs text-bazaar-ink/60">
            {doneCount === ALL_INDIC.length
              ? `All ${ALL_INDIC.length} scripts rendered.`
              : `${doneCount} / ${ALL_INDIC.length} rendered…`}{" "}
            One prompt, eight scripts, one fan-out.
          </p>
        </div>
        <button
          onClick={() => void runAll()}
          className="text-xs px-3 py-2 rounded-full border border-bazaar-tangerine text-bazaar-tangerine hover:bg-bazaar-tangerine hover:text-white transition-colors"
        >
          Regenerate all 8
        </button>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {ALL_INDIC.map((lang) => {
          const state = cells[lang.code];
          const hasImage = Boolean(state?.image);
          return (
            <div key={lang.code} className="space-y-1">
              <div
                className="poster"
                style={{ aspectRatio: aspect }}
                title={`${lang.englishName} · ${lang.nativeName}`}
              >
                {hasImage && state?.image ? (
                  <img
                    src={`data:${state.mimeType ?? "image/png"};base64,${state.image}`}
                    alt={`${lang.englishName} poster`}
                  />
                ) : state?.error ? (
                  <div className="p-2 h-full flex items-center justify-center text-[10px] text-bazaar-coral text-center leading-tight">
                    {state.error.slice(0, 60)}
                  </div>
                ) : (
                  <div className="p-2 h-full flex items-center justify-center text-[10px] text-bazaar-ink/40 animate-pulse">
                    …
                  </div>
                )}
              </div>
              <p className="text-[10px] text-center leading-tight">
                <span className={lang.fontClass}>{lang.nativeName}</span>
                <span className="block text-bazaar-ink/50">
                  {lang.englishName}
                </span>
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

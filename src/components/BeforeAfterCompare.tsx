"use client";

/**
 * BeforeAfterCompare — the "impact-in-India moat" tile. Renders two
 * generate() calls side-by-side for the same product: LEFT in Latin
 * transliteration (languageCode = "en") and RIGHT in the currently
 * selected Indic script. Judges see instantly why a Canva/Figma template
 * that only supports Latin fails on a Basmati-rice ad in Kannada.
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { findLanguage } from "@/lib/languages";
import { SurfaceKind } from "@/components/SurfacePicker";
import { generate, isError } from "@/lib/generate";

interface Props {
  productName: string;
  price: string;
  businessName?: string;
  brandColor?: string;
  languageCode: string;
  surfaceKind: SurfaceKind;
  aspect: string;
}

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
}

export function BeforeAfterCompare({
  productName,
  price,
  businessName,
  brandColor,
  languageCode,
  surfaceKind,
  aspect,
}: Props): React.ReactElement | null {
  const [latin, setLatin] = useState<CellState>({ loading: false });
  const [indic, setIndic] = useState<CellState>({ loading: false });
  const abortRef = useRef<AbortController | null>(null);
  const nonceRef = useRef(0);

  const lang = findLanguage(languageCode);
  const isEnglish = languageCode === "en";

  const runPair = useCallback(async () => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    const nonce = ++nonceRef.current;

    setLatin({ loading: true });
    setIndic({ loading: true });

    const shared = {
      productName,
      price,
      businessName,
      surfaceKind,
      brandColor,
    };

    const [latinResult, indicResult] = await Promise.all([
      generate({ ...shared, languageCode: "en" }, controller.signal),
      generate({ ...shared, languageCode }, controller.signal),
    ]);

    if (nonce !== nonceRef.current) return;

    if (isError(latinResult)) {
      setLatin({ loading: false, error: latinResult.error });
    } else {
      setLatin({
        loading: false,
        image: latinResult.image,
        mimeType: latinResult.mimeType,
      });
    }

    if (isError(indicResult)) {
      setIndic({ loading: false, error: indicResult.error });
    } else {
      setIndic({
        loading: false,
        image: indicResult.image,
        mimeType: indicResult.mimeType,
      });
    }
  }, [productName, price, businessName, brandColor, languageCode, surfaceKind]);

  useEffect(() => {
    if (!productName.trim() || !price.trim()) return;
    if (isEnglish) return;
    void runPair();
    return () => {
      abortRef.current?.abort();
    };
  }, [runPair, productName, price, isEnglish]);

  if (isEnglish) {
    return (
      <div className="rounded-2xl border border-bazaar-ink/10 bg-white p-4 text-xs text-bazaar-ink/60">
        Pick a non-English language to see the Latin vs Indic-script comparison.
      </div>
    );
  }

  return (
    <section
      className="rounded-2xl border border-bazaar-ink/10 bg-white p-4 sm:p-5 shadow-sm"
      aria-label="Latin vs Indic-script comparison"
    >
      <div className="flex items-baseline justify-between flex-wrap gap-2 mb-3">
        <div>
          <h2 className="font-display italic text-lg text-bazaar-ink">
            Latin transliteration vs {lang?.englishName ?? languageCode} script
          </h2>
          <p className="text-xs text-bazaar-ink/60">
            Canva &amp; Figma templates ship the tile on the left. Real
            shopfronts in India need the one on the right.
          </p>
        </div>
        <button
          onClick={() => void runPair()}
          className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 hover:border-bazaar-tangerine/60 transition-colors"
        >
          Regenerate pair
        </button>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {[
          {
            title: "Before",
            subtitle: "Latin script (industry default)",
            state: latin,
            fontClass: "font-sans",
            nativeName: "English",
          },
          {
            title: "After",
            subtitle: `${lang?.scriptHint?.split(".")[0] ?? "Indic"} — BazaarBoard`,
            state: indic,
            fontClass: lang?.fontClass ?? "font-sans",
            nativeName: lang?.nativeName ?? languageCode,
          },
        ].map((col) => (
          <div key={col.title} className="space-y-2">
            <div className="flex items-baseline justify-between">
              <p className="text-sm font-medium text-bazaar-ink">
                {col.title}
              </p>
              <p className="text-xs text-bazaar-ink/60">
                <span className={col.fontClass}>{col.nativeName}</span>
              </p>
            </div>
            <div className="poster" style={{ aspectRatio: aspect }}>
              {col.state.image ? (
                <img
                  src={`data:${col.state.mimeType ?? "image/png"};base64,${col.state.image}`}
                  alt={`${col.title} tile`}
                />
              ) : col.state.error ? (
                <div className="p-3 h-full flex items-center justify-center text-xs text-bazaar-coral text-center">
                  {col.state.error}
                </div>
              ) : (
                <div className="p-3 h-full flex items-center justify-center text-xs text-bazaar-ink/40 animate-pulse">
                  rendering…
                </div>
              )}
            </div>
            <p className="text-[11px] text-bazaar-ink/60 leading-snug">
              {col.subtitle}
            </p>
          </div>
        ))}
      </div>
    </section>
  );
}

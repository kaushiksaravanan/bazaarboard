"use client";

/**
 * VoiceLanguageChips — nine language chips (English + 8 Indic).
 * Reuses LANGUAGES from lib/languages.ts — the single source of truth
 * for supported scripts. When a chip is active it pins the interaction
 * language, overriding auto-detection.
 */

import { LANGUAGES } from "@/lib/languages";

interface Props {
  active: string | null;
  onPick: (code: string | null) => void;
}

export function VoiceLanguageChips({ active, onPick }: Props): React.ReactElement {
  return (
    <div
      role="group"
      aria-label="Preferred language (optional — otherwise auto-detected)"
      className="flex flex-wrap justify-center gap-2"
    >
      <button
        type="button"
        onClick={() => onPick(null)}
        aria-pressed={active === null}
        className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
          active === null
            ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
            : "bg-white border-bazaar-ink/30 text-bazaar-ink/80 hover:border-bazaar-tangerine/60"
        }`}
      >
        Auto-detect
      </button>
      {LANGUAGES.map((lang) => (
        <button
          key={lang.code}
          type="button"
          onClick={() => onPick(lang.code)}
          aria-pressed={active === lang.code}
          aria-label={`Speak in ${lang.englishName}`}
          className={`text-xs px-3 py-1.5 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${lang.fontClass} ${
            active === lang.code
              ? "bg-bazaar-tangerine text-white border-bazaar-tangerine"
              : "bg-white border-bazaar-ink/30 text-bazaar-ink/80 hover:border-bazaar-tangerine/60"
          }`}
        >
          {lang.nativeName}
        </button>
      ))}
    </div>
  );
}

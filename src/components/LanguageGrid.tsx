"use client";

import { LANGUAGES } from "@/lib/languages";

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
}

export function LanguageGrid({ selected, onToggle }: Props): React.ReactElement {
  return (
    <div
      role="group"
      aria-label="Poster languages"
      className="grid grid-cols-2 gap-2 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:flex-wrap"
    >
      {LANGUAGES.map((l) => {
        const active = selected.includes(l.code);
        return (
          <button
            key={l.code}
            type="button"
            onClick={() => onToggle(l.code)}
            aria-pressed={active}
            aria-label={`${l.englishName} (${l.nativeName})${active ? ", selected" : ""}`}
            className={`text-xs px-3 py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
              active
                ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
                : "bg-white border-bazaar-ink/30 hover:border-bazaar-tangerine/60"
            }`}
          >
            <span className={l.fontClass}>{l.nativeName}</span>
            <span className="opacity-70 ml-1.5">· {l.englishName}</span>
          </button>
        );
      })}
    </div>
  );
}

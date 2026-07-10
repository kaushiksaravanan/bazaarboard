"use client";

import { LANGUAGES } from "@/lib/languages";

interface Props {
  selected: string[];
  onToggle: (code: string) => void;
}

export function LanguageGrid({ selected, onToggle }: Props): React.ReactElement {
  return (
    <div className="flex flex-wrap gap-2">
      {LANGUAGES.map((l) => {
        const active = selected.includes(l.code);
        return (
          <button
            key={l.code}
            onClick={() => onToggle(l.code)}
            aria-pressed={active}
            className={`text-xs px-3 py-2 rounded-full border transition-colors ${
              active
                ? "bg-bazaar-ink text-bazaar-canvas border-bazaar-ink"
                : "bg-white border-bazaar-ink/20 hover:border-bazaar-tangerine/60"
            }`}
          >
            <span className={l.fontClass}>{l.nativeName}</span>
            <span className="opacity-60 ml-1.5">· {l.englishName}</span>
          </button>
        );
      })}
    </div>
  );
}

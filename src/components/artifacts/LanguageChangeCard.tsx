"use client";

/**
 * LanguageChangeCard — tangerine chip strip artifact for set_language.
 */

import { findLanguage } from "@/lib/languages";

interface Props {
  codes: string[];
}

export function LanguageChangeCard({ codes }: Props): React.ReactElement {
  return (
    <div
      role="status"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-tangerine/40 bg-bazaar-tangerine/10 px-3 py-2 text-xs text-bazaar-ink flex items-center gap-2 flex-wrap shadow-sm"
    >
      <span aria-hidden="true">🌐</span>
      <span className="font-medium">Language</span>
      <span aria-hidden="true" className="text-bazaar-ink/40">
        →
      </span>
      <div className="flex items-center gap-1 flex-wrap">
        {codes.map((code) => {
          const lang = findLanguage(code);
          return (
            <span
              key={code}
              className={`inline-flex items-center gap-1 rounded-full bg-white/80 border border-bazaar-tangerine/50 px-2 py-0.5 ${
                lang?.fontClass ?? ""
              }`}
            >
              {lang?.nativeName ?? code}
              <span className="text-[10px] font-sans text-bazaar-ink/50">
                {lang?.englishName ?? ""}
              </span>
            </span>
          );
        })}
      </div>
    </div>
  );
}

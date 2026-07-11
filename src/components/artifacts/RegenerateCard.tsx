"use client";

/**
 * RegenerateCard — collapsible group card for the `regenerate` tool call.
 * Shows a running counter of poster tiles as they complete, plus mini
 * thumbnails once each cell is ready. Elapsed time shown when done.
 */

import { useEffect, useState } from "react";
import { findLanguage } from "@/lib/languages";
import type { PosterCell } from "@/lib/voiceReducer";

interface Props {
  /** language codes being rendered in this batch */
  codes: string[];
  /** live state — read directly from the reducer's cells */
  cells: PosterCell[];
  startedAt: number;
}

export function RegenerateCard({
  codes,
  cells,
  startedAt,
}: Props): React.ReactElement {
  const [, tick] = useState(0);
  const scoped = cells.filter((c) => codes.includes(c.langCode));
  const done = scoped.filter((c) => !c.loading).length;
  const total = codes.length;
  const finished = done === total && total > 0;
  const elapsedSec = ((finished ? Date.now() : Date.now()) - startedAt) / 1000;

  // Re-render every 250ms while pending so the elapsed counter ticks.
  useEffect(() => {
    if (finished) return;
    const id = window.setInterval(() => tick((n) => n + 1), 250);
    return () => window.clearInterval(id);
  }, [finished]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-ink/10 bg-white px-3 py-2.5 shadow-sm"
    >
      <div className="flex items-center gap-2 text-sm text-bazaar-ink">
        <span aria-hidden="true">🎨</span>
        <span className="font-medium">
          {finished
            ? `Rendered ${done} poster${done === 1 ? "" : "s"}`
            : `Rendering ${total} poster${total === 1 ? "" : "s"}…`}
        </span>
        <span className="ml-auto text-[11px] text-bazaar-ink/50 font-mono">
          {elapsedSec.toFixed(1)}s
        </span>
      </div>
      {scoped.length > 0 ? (
        <div className="mt-2 grid grid-cols-8 gap-1">
          {scoped.map((cell) => {
            const lang = findLanguage(cell.langCode);
            return (
              <div
                key={cell.langCode}
                className="aspect-[3/4] rounded-md overflow-hidden bg-bazaar-canvas border border-bazaar-ink/10 flex items-center justify-center"
                title={lang?.englishName ?? cell.langCode}
              >
                {cell.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${cell.mimeType ?? "image/png"};base64,${cell.image}`}
                    alt={`${lang?.englishName ?? cell.langCode} thumbnail`}
                    className="w-full h-full object-cover"
                  />
                ) : cell.error ? (
                  <span className="text-[9px] text-bazaar-coral">×</span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-bazaar-tangerine/50 animate-pulse" />
                )}
              </div>
            );
          })}
        </div>
      ) : null}
    </div>
  );
}

"use client";

/**
 * VoiceModeCallout — a small, dismissable banner that nudges the user
 * toward voice mode after they've felt the value of text mode. Shown
 * only on `/` after 3+ posters have been generated, and dismissal is
 * remembered for the tab (sessionStorage).
 */

import Link from "next/link";
import { useCallback } from "react";

interface Props {
  onDismiss: () => void;
}

export function VoiceModeCallout({ onDismiss }: Props): React.ReactElement {
  const handleDismiss = useCallback(() => {
    try {
      window.sessionStorage.setItem(
        "bazaarboard.voiceCalloutDismissed",
        "true",
      );
    } catch {
      // sessionStorage blocked — swallow, still dismiss in memory.
    }
    onDismiss();
  }, [onDismiss]);

  return (
    <div
      role="status"
      aria-live="polite"
      className="max-w-7xl mx-auto px-4 sm:px-6 pt-4 no-print"
    >
      <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-bazaar-tangerine/40 bg-bazaar-tangerine/10 px-4 py-3 text-sm text-bazaar-ink">
        <span aria-hidden="true" className="text-base leading-none">
          💡
        </span>
        <p className="flex-1 min-w-[220px] leading-snug">
          Prefer talking? Voice mode is one tap — try it.
        </p>
        <Link
          href="/voice"
          aria-label="Try voice-first mode"
          className="inline-flex items-center gap-1 px-4 py-1.5 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        >
          🎤 Try voice
        </Link>
        <button
          type="button"
          onClick={handleDismiss}
          aria-label="Dismiss voice mode suggestion"
          className="w-8 h-8 rounded-full flex items-center justify-center text-bazaar-ink/70 hover:text-bazaar-ink hover:bg-bazaar-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="text-lg leading-none">
            ×
          </span>
        </button>
      </div>
    </div>
  );
}

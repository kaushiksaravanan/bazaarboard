"use client";

/**
 * Onboarding — first-run friendly overlay that appears on top of the
 * whole app until the shop owner dismisses it. No technical terms;
 * this is aimed at kirana/sweet-shop owners who just want to make
 * posters for their shop.
 *
 * Accessibility: focus trap, Escape to dismiss, aria-labelledby /
 * aria-describedby wiring, focus-visible rings, high contrast text.
 */

import Link from "next/link";
import { useCallback, useEffect, useId, useRef } from "react";

interface Props {
  onDismiss: (target?: "start" | "demo") => void;
}

interface StepCardProps {
  n: string;
  title: string;
  body: string;
}

function StepCard({ n, title, body }: StepCardProps): React.ReactElement {
  return (
    <div className="flex-1 min-w-[220px] rounded-2xl border border-bazaar-ink/15 bg-white p-5 sm:p-6 shadow-sm flex flex-col gap-2">
      <span
        aria-hidden="true"
        className="text-3xl leading-none select-none"
      >
        {n}
      </span>
      <p className="font-display italic text-lg text-bazaar-ink">{title}</p>
      <p className="text-sm text-bazaar-ink/75 leading-relaxed">{body}</p>
    </div>
  );
}

export function Onboarding({ onDismiss }: Props): React.ReactElement {
  const titleId = useId();
  const descId = useId();
  const panelRef = useRef<HTMLDivElement | null>(null);
  const startBtnRef = useRef<HTMLButtonElement | null>(null);
  const previouslyFocusedRef = useRef<HTMLElement | null>(null);

  const handleDismiss = useCallback(
    (target?: "start" | "demo") => {
      onDismiss(target);
    },
    [onDismiss],
  );

  // Escape key and focus trap.
  useEffect(() => {
    previouslyFocusedRef.current =
      (document.activeElement as HTMLElement | null) ?? null;

    // Focus the primary CTA on mount for keyboard users.
    startBtnRef.current?.focus();

    const onKeyDown = (e: KeyboardEvent): void => {
      if (e.key === "Escape") {
        e.preventDefault();
        handleDismiss();
        return;
      }
      if (e.key !== "Tab") return;
      const panel = panelRef.current;
      if (!panel) return;
      const focusables = panel.querySelectorAll<HTMLElement>(
        'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])',
      );
      if (focusables.length === 0) return;
      const first = focusables[0];
      const last = focusables[focusables.length - 1];
      const active = document.activeElement as HTMLElement | null;
      if (e.shiftKey) {
        if (active === first || !panel.contains(active)) {
          e.preventDefault();
          last.focus();
        }
      } else {
        if (active === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };

    document.addEventListener("keydown", onKeyDown);
    // Prevent body scroll while overlay is open.
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.body.style.overflow = prevOverflow;
      previouslyFocusedRef.current?.focus?.();
    };
  }, [handleDismiss]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={titleId}
      aria-describedby={descId}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-bazaar-ink/40 backdrop-blur-sm no-print"
    >
      <div
        ref={panelRef}
        className="relative w-full max-w-3xl max-h-[92vh] overflow-y-auto rounded-3xl bg-bazaar-canvas border border-bazaar-ink/10 shadow-2xl p-6 sm:p-10"
      >
        <button
          type="button"
          onClick={() => handleDismiss()}
          aria-label="Close introduction"
          className="absolute top-4 right-4 w-9 h-9 rounded-full flex items-center justify-center text-bazaar-ink/70 hover:text-bazaar-ink hover:bg-bazaar-ink/5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        >
          <span aria-hidden="true" className="text-xl leading-none">
            ×
          </span>
        </button>

        <div className="space-y-3 sm:space-y-4">
          <p className="inline-block text-[11px] uppercase tracking-widest text-bazaar-tangerine font-semibold">
            Welcome to BazaarBoard
          </p>
          <h2
            id={titleId}
            className="font-display italic text-3xl sm:text-4xl leading-tight text-bazaar-ink break-words"
          >
            Make posters for your shop — in every Indian language.
          </h2>
          <p
            id={descId}
            className="text-base sm:text-lg text-bazaar-ink/80 leading-relaxed max-w-2xl"
          >
            Type once. We render posters in Hindi, Tamil, Bengali, Telugu,
            Kannada, Malayalam, Punjabi, and Gujarati — in about 4 seconds each.
          </p>
        </div>

        <div className="mt-7">
          <Link
            href="/voice"
            onClick={() => {
              try {
                window.localStorage.setItem(
                  "bazaarboard.onboarded",
                  "true",
                );
              } catch {
                // localStorage blocked — no-op.
              }
            }}
            aria-label="Switch to voice-first mode"
            className="group block rounded-2xl border-2 border-bazaar-tangerine/60 bg-bazaar-tangerine/10 hover:bg-bazaar-tangerine/20 p-5 sm:p-6 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            <div className="flex items-start gap-4">
              <span
                aria-hidden="true"
                className="text-3xl leading-none select-none"
              >
                🎤
              </span>
              <div className="flex-1 min-w-0">
                <p className="font-display italic text-lg text-bazaar-ink">
                  Talk to it instead
                </p>
                <p className="text-sm text-bazaar-ink/80 leading-relaxed mt-1">
                  Speak in any Indian language — Hindi, Tamil, Bengali…
                  BazaarBoard understands.
                </p>
                <p className="text-sm font-medium text-bazaar-tangerine mt-2 group-hover:underline underline-offset-4">
                  Tap to try voice mode →
                </p>
              </div>
            </div>
          </Link>
        </div>

        <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:gap-4">
          <StepCard
            n="1️⃣"
            title="Pick your shop type"
            body="Kirana, sweet shop, chaat, bakery — tap the one that matches your shop."
          />
          <StepCard
            n="2️⃣"
            title="Type your product + price"
            body="For example: Alphonso mango pulp — ₹120/kg. That's all we need."
          />
          <StepCard
            n="3️⃣"
            title="Download or share to WhatsApp"
            body="All 8 languages ready to print, post, or send to customers."
          />
        </div>

        <div className="mt-8 flex flex-wrap items-center gap-3">
          <button
            ref={startBtnRef}
            type="button"
            onClick={() => handleDismiss("start")}
            className="px-6 py-3 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Start creating
          </button>
          <button
            type="button"
            onClick={() => handleDismiss("demo")}
            className="px-4 py-3 rounded-full text-bazaar-ink underline underline-offset-4 hover:text-bazaar-tangerine transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Watch demo
          </button>
        </div>

        <p className="mt-6 text-xs text-bazaar-ink/60 leading-relaxed">
          No account. No login. Free trial. Print-ready A4 / 1080×1920 /
          1080×1080.
        </p>
        <p className="mt-2 text-xs text-bazaar-ink/70 leading-relaxed">
          Or tap the mic anywhere to change things by voice.
        </p>
      </div>
    </div>
  );
}

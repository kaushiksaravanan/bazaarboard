"use client";

/**
 * Global App Router error boundary. Next.js mounts this whenever a
 * client-side render throws or a Server Component route segment errors
 * out. Shows a friendly retry UI and reports the crash to analytics so
 * we can see it in Vercel logs after the fact.
 */

import { useEffect } from "react";
import { trackEvent } from "@/lib/analytics";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}): React.ReactElement {
  useEffect(() => {
    trackEvent("error_boundary", {
      message: error.message,
      name: error.name,
      digest: error.digest ?? null,
      // Keep the stack short so we don't blow past the 32KB endpoint cap.
      stack: (error.stack ?? "").slice(0, 1000),
    });
  }, [error]);

  return (
    <div
      role="alert"
      className="min-h-screen flex flex-col items-center justify-center text-center px-6 py-10 bg-bazaar-canvas"
    >
      <div className="max-w-lg">
        <p className="text-xs uppercase tracking-widest text-bazaar-coral mb-3">
          Something went sideways
        </p>
        <h1 className="font-display italic text-3xl sm:text-4xl text-bazaar-ink mb-3">
          BazaarBoard hit a snag.
        </h1>
        <p className="text-sm text-bazaar-ink/70 mb-6">
          The interface crashed, but your BYOK key and preset are still safe in
          this tab&apos;s sessionStorage. Try again — most of the time this is
          a transient hiccup with the model or your connection.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            type="button"
            onClick={() => reset()}
            className="px-4 py-2 rounded-lg bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Try again
          </button>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="px-4 py-2 rounded-lg border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 text-bazaar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Reload the whole page
          </button>
        </div>
        {error.digest ? (
          <p className="text-[11px] font-mono text-bazaar-ink/50 mt-6">
            Error id: {error.digest}
          </p>
        ) : null}
      </div>
    </div>
  );
}

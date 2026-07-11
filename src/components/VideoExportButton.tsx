"use client";

/**
 * VideoExportButton — stitches accumulated poster renders into a short
 * slideshow video. Hidden entirely when the browser can't run the
 * MediaRecorder + captureStream pipeline. Progress bar animates while
 * encoding; final blob downloads via an anchor click.
 */

import { useState } from "react";
import {
  canStitch,
  downloadStitched,
  stitchSlideshow,
  type StitchImage,
} from "@/lib/videoStitch";
import { synthIdentAsync } from "@/lib/narrationCapture";

interface Props {
  images: StitchImage[];
  /** Optional narration ArrayBuffer. If omitted, we fall back to a 3-note ident. */
  narrationAudio?: ArrayBuffer;
  /** Show while images are still rendering — button disables. */
  disabled?: boolean;
}

type Status = "idle" | "encoding" | "done" | "error";

export function VideoExportButton({
  images,
  narrationAudio,
  disabled,
}: Props): React.ReactElement | null {
  const [status, setStatus] = useState<Status>("idle");
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  if (typeof window !== "undefined" && !canStitch()) {
    return (
      <div className="text-xs text-bazaar-ink/60 italic">
        Video export needs a modern browser.
      </div>
    );
  }

  const onClick = async (): Promise<void> => {
    if (images.length === 0) return;
    setStatus("encoding");
    setProgress(0);
    setError(null);
    try {
      const audio = narrationAudio ?? (await synthIdentAsync(2.5));
      const result = await stitchSlideshow({
        images,
        perImageSeconds: 0.85,
        fadeMs: 300,
        narrationAudio: audio,
        onProgress: (f) => setProgress(f),
      });
      downloadStitched(result);
      setStatus("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "encoding failed");
      setStatus("error");
    }
  };

  const label = (() => {
    if (status === "encoding") return `Encoding… ${Math.round(progress * 100)}%`;
    if (status === "done") return "Video downloaded";
    if (status === "error") return "Retry video export";
    return "🎬 Play video";
  })();

  return (
    <div className="flex flex-col gap-2 items-center">
      <button
        type="button"
        onClick={onClick}
        disabled={disabled || status === "encoding" || images.length === 0}
        className="px-4 py-2 rounded-full bg-bazaar-tangerine text-white font-medium text-sm disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        aria-label="Export slideshow video"
      >
        {label}
      </button>
      {status === "encoding" && (
        <div
          className="h-1 w-40 bg-bazaar-ink/10 rounded overflow-hidden"
          role="progressbar"
          aria-valuenow={Math.round(progress * 100)}
          aria-valuemin={0}
          aria-valuemax={100}
        >
          <div
            className="h-full bg-bazaar-tangerine transition-[width] duration-100"
            style={{ width: `${Math.round(progress * 100)}%` }}
          />
        </div>
      )}
      {error && (
        <div className="text-xs text-red-700" role="alert">
          {error}
        </div>
      )}
    </div>
  );
}

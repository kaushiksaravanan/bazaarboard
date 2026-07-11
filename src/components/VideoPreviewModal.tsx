"use client";

/**
 * VideoPreviewModal — displays a stitched slideshow blob in an
 * accessible modal dialog. Autoplays muted (per browser policy) with
 * standard controls, and exposes Download + Share (Web Share API when
 * available, clipboard fallback otherwise). Backdrop click or the Esc
 * key dismisses the modal.
 */

import { useCallback, useEffect, useMemo, useRef } from "react";
import { downloadStitched, type StitchResult } from "@/lib/videoStitch";

interface Props {
  result: StitchResult;
  onClose: () => void;
}

export function VideoPreviewModal({ result, onClose }: Props): React.ReactElement {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const closeBtnRef = useRef<HTMLButtonElement | null>(null);

  // Object URL for the blob — released when the modal unmounts.
  const objectUrl = useMemo<string>(() => {
    if (typeof URL === "undefined" || !result.blob) return "";
    return URL.createObjectURL(result.blob);
  }, [result.blob]);

  useEffect(() => {
    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [objectUrl]);

  // Escape to close + move initial focus onto the Close button.
  useEffect(() => {
    const onKey = (ev: KeyboardEvent): void => {
      if (ev.key === "Escape") {
        ev.preventDefault();
        onClose();
      }
    };
    window.addEventListener("keydown", onKey);
    closeBtnRef.current?.focus();
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const onBackdrop = useCallback(
    (ev: React.MouseEvent<HTMLDivElement>) => {
      if (ev.target === ev.currentTarget) onClose();
    },
    [onClose],
  );

  const onDownload = useCallback(() => {
    downloadStitched(result);
  }, [result]);

  const onShare = useCallback(async () => {
    // navigator.share needs a user gesture — we're inside a click, so
    // this is fine. Prefer file-share, fallback to URL copy.
    const nav = typeof navigator !== "undefined" ? navigator : null;
    if (!nav) return;
    const ext = result.mimeType.includes("mp4") ? "mp4" : "webm";
    const filename = `bazaarboard-${Date.now()}.${ext}`;
    try {
      const file = new File([result.blob], filename, { type: result.mimeType });
      const shareData: ShareData & { files?: File[] } = {
        title: "BazaarBoard poster reel",
        text: "My multilingual poster reel from BazaarBoard.",
        files: [file],
      };
      const canShareFiles =
        typeof (nav as Navigator & { canShare?: (d: ShareData) => boolean })
          .canShare === "function"
          ? (nav as Navigator & { canShare: (d: ShareData) => boolean }).canShare(
              shareData,
            )
          : false;
      if (canShareFiles && typeof nav.share === "function") {
        await nav.share(shareData);
        return;
      }
    } catch {
      // ignore — user aborted or share not permitted; fall through.
    }
    // Clipboard fallback — copy the object URL.
    try {
      await nav.clipboard?.writeText(objectUrl);
    } catch {
      // no-op
    }
  }, [result, objectUrl]);

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Video preview"
      onClick={onBackdrop}
      className="fixed inset-0 z-50 bg-black/70 flex items-center justify-center p-4"
      data-testid="video-preview-modal"
    >
      <div
        className="bg-bazaar-canvas rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
        onClick={(ev) => ev.stopPropagation()}
      >
        <div className="flex items-center justify-between px-4 py-3 border-b border-bazaar-ink/10">
          <h2 className="font-display italic text-xl text-bazaar-ink">
            🎬 Your reel
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            onClick={onClose}
            aria-label="Close video preview"
            className="text-sm px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Close
          </button>
        </div>
        <div className="bg-black">
          {objectUrl ? (
            /* eslint-disable-next-line jsx-a11y/media-has-caption */
            <video
              ref={videoRef}
              src={objectUrl}
              controls
              autoPlay
              muted
              playsInline
              className="w-full max-h-[70vh] bg-black"
              data-testid="video-preview-player"
            />
          ) : null}
        </div>
        <div className="flex items-center justify-end gap-2 px-4 py-3 border-t border-bazaar-ink/10">
          <button
            type="button"
            onClick={onShare}
            data-testid="video-share-button"
            className="text-sm px-4 py-2 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Share
          </button>
          <button
            type="button"
            onClick={onDownload}
            data-testid="video-download-button"
            className="text-sm px-4 py-2 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            ⬇ Download
          </button>
        </div>
      </div>
    </div>
  );
}

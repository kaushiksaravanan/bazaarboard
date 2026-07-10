"use client";

/**
 * PosterCell — a single generated poster tile. Renders one of five
 * states: idle placeholder, loading, error, done (image + download),
 * and stale (image visible but new one is loading in).
 *
 * Beyond the image, each cell exposes:
 *   - download (PNG file, with a data-URL fallback if the blob path
 *     fails, and a "Save Image instead" toast if both strategies fail)
 *   - WhatsApp share (copies the image to clipboard, then opens wa.me
 *     with the caption pre-filled — because wa.me can't attach images,
 *     the clipboard-copy is what lets the user paste it into the chat)
 *   - print A4 (only shown when onPrint is provided)
 *   - a friendly "Live status pill" driven by the fallback flag on the
 *     generate result: "AI rendering active" when a real model
 *     answered, or "Preview mode" when the SVG fallback did.
 */

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
  fallback?: boolean;
}

interface Props {
  state: CellState | undefined;
  aspect: string;
  filename: string;
  languageNativeName: string;
  languageEnglishName: string;
  fontClass: string;
  /**
   * Called when the download button is clicked. Should return true if
   * the browser was successfully asked to download the file, false if
   * every strategy failed (in which case we surface a toast telling the
   * user to right-click + Save Image).
   */
  onDownload: () => boolean | Promise<boolean> | void;
  productName?: string;
  price?: string;
  businessName?: string;
  onPrint?: () => void;
}

async function copyImageToClipboard(
  base64: string,
  mimeType: string,
): Promise<boolean> {
  try {
    if (typeof navigator === "undefined") return false;
    const clip = navigator.clipboard as
      | (Clipboard & {
          write?: (items: ClipboardItem[]) => Promise<void>;
        })
      | undefined;
    if (!clip?.write || typeof ClipboardItem === "undefined") return false;
    // SVG can't be reliably copied as an image blob in most browsers; the
    // wa.me deep link still fires with the caption, so this is a graceful
    // "text-only" degrade.
    if (mimeType === "image/svg+xml") return false;
    const bin = atob(base64);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    await clip.write([new ClipboardItem({ [mimeType]: blob })]);
    return true;
  } catch {
    return false;
  }
}

export function PosterCell({
  state,
  aspect,
  languageNativeName,
  languageEnglishName,
  fontClass,
  onDownload,
  productName,
  price,
  businessName,
  onPrint,
}: Props): React.ReactElement {
  const hasImage = Boolean(state?.image);
  const [waStatus, setWaStatus] = useState<"idle" | "copied" | "text-only">(
    "idle",
  );
  const [downloadMsg, setDownloadMsg] = useState<string | null>(null);

  const handleDownload = async (): Promise<void> => {
    try {
      const result = await Promise.resolve(onDownload());
      if (result === false) {
        setDownloadMsg(
          "Couldn't download — right-click the poster and Save Image instead.",
        );
        window.setTimeout(() => setDownloadMsg(null), 5000);
      }
    } catch {
      setDownloadMsg(
        "Couldn't download — right-click the poster and Save Image instead.",
      );
      window.setTimeout(() => setDownloadMsg(null), 5000);
    }
  };

  const shareWhatsApp = async (): Promise<void> => {
    if (!state?.image) return;
    const copied = await copyImageToClipboard(
      state.image,
      state.mimeType ?? "image/png",
    );
    trackEvent("whatsapp_share_clicked", {
      languageEnglishName,
      copied,
      mimeType: state.mimeType ?? "image/png",
    });
    setWaStatus(copied ? "copied" : "text-only");
    setTimeout(() => setWaStatus("idle"), 2200);
    const captionParts: string[] = [];
    if (businessName?.trim()) {
      captionParts.push(`New offer from ${businessName.trim()}:`);
    } else {
      captionParts.push("New offer:");
    }
    if (productName?.trim() && price?.trim()) {
      captionParts.push(`${productName.trim()} at ${price.trim()}`);
    } else if (productName?.trim()) {
      captionParts.push(productName.trim());
    } else if (price?.trim()) {
      captionParts.push(price.trim());
    }
    const message = captionParts.join(" ");
    const url = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(url, "_blank", "noopener,noreferrer");
  };

  const isFallback = state?.fallback === true;

  return (
    <div className="space-y-2 min-w-0 max-w-full">
      <div className="flex items-baseline justify-between gap-2 flex-wrap min-w-0">
        <p className="text-sm font-medium min-w-0 break-words">
          <span className={fontClass}>{languageNativeName}</span>
          <span className="ml-2 text-bazaar-ink/70">
            {languageEnglishName}
          </span>
        </p>
        <div className="flex items-center gap-2 text-xs flex-wrap">
          {state?.loading ? (
            <span
              className="text-bazaar-tangerine animate-pulse"
              aria-live="polite"
            >
              rendering…
            </span>
          ) : state?.latencyMs !== undefined ? (
            <span className="text-bazaar-ink/60 font-mono">
              {(state.latencyMs / 1000).toFixed(1)}s
            </span>
          ) : null}
          {hasImage ? (
            <>
              <button
                onClick={() => void handleDownload()}
                className="no-print text-bazaar-ink/70 hover:text-bazaar-tangerine transition-colors underline-offset-2 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                aria-label={`Download ${languageEnglishName} poster`}
              >
                download
              </button>
              <button
                onClick={() => void shareWhatsApp()}
                className="no-print text-bazaar-leaf/80 hover:text-bazaar-leaf transition-colors underline-offset-2 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                aria-label={`Share ${languageEnglishName} poster to WhatsApp`}
                title={
                  waStatus === "copied"
                    ? "Image copied — paste into WhatsApp"
                    : waStatus === "text-only"
                      ? "Opened WhatsApp with caption (couldn't copy image)"
                      : "Copy image + open WhatsApp"
                }
              >
                {waStatus === "copied"
                  ? "copied · WA"
                  : waStatus === "text-only"
                    ? "caption · WA"
                    : "WhatsApp"}
              </button>
              {onPrint ? (
                <button
                  onClick={onPrint}
                  className="no-print text-bazaar-ink/70 hover:text-bazaar-tangerine transition-colors underline-offset-2 hover:underline rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                  aria-label={`Print ${languageEnglishName} poster on A4`}
                >
                  print A4
                </button>
              ) : null}
            </>
          ) : null}
        </div>
      </div>
      {/* Live status pill — human-friendly rendering-mode indicator. */}
      {hasImage ? (
        <div className="flex flex-wrap items-center gap-2 min-w-0">
          {isFallback ? (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-bazaar-saffron/20 text-bazaar-ink/80 border border-bazaar-saffron/50 px-2.5 py-0.5 text-[11px] font-medium max-w-full"
              title="A design-only preview is shown. Add a Gemini key to unlock full AI rendering."
            >
              <span aria-hidden="true">✨</span>
              <span className="truncate">
                Preview mode — set a Gemini key for full AI rendering
              </span>
            </span>
          ) : (
            <span
              className="inline-flex items-center gap-1 rounded-full bg-bazaar-leaf/10 text-bazaar-leaf border border-bazaar-leaf/40 px-2.5 py-0.5 text-[11px] font-medium max-w-full"
              title="Rendered by the AI image model."
            >
              <span aria-hidden="true">🎨</span>
              <span className="truncate">AI rendering active</span>
            </span>
          )}
        </div>
      ) : null}
      <div
        className={`poster transition-opacity ${state?.loading && hasImage ? "opacity-70" : "opacity-100"}`}
        style={{
          aspectRatio: aspect,
          overflow: "hidden",
          maxWidth: "100%",
        }}
        role="img"
        aria-label={
          hasImage
            ? `${languageEnglishName} poster preview`
            : state?.error
              ? `${languageEnglishName} poster failed to render`
              : state?.loading
                ? `${languageEnglishName} poster is rendering`
                : `${languageEnglishName} poster queued`
        }
      >
        {hasImage && state?.image ? (
          <img
            src={`data:${state.mimeType ?? "image/png"};base64,${state.image}`}
            alt={`${languageEnglishName} poster`}
            style={{ maxWidth: "100%" }}
          />
        ) : state?.error ? (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-coral text-center leading-relaxed break-words">
            {state.error}
          </div>
        ) : state?.loading ? (
          <div className="skeleton h-full w-full flex items-end justify-center">
            <span className="mb-3 text-[10px] uppercase tracking-wider text-bazaar-ink/60 font-mono animate-pulse">
              Gemini rendering
            </span>
          </div>
        ) : (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-ink/50">
            queued
          </div>
        )}
      </div>
      {downloadMsg ? (
        <p
          role="status"
          aria-live="polite"
          className="text-[11px] text-bazaar-coral leading-snug break-words"
        >
          {downloadMsg}
        </p>
      ) : null}
    </div>
  );
}

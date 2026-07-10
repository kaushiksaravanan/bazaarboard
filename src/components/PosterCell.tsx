"use client";

/**
 * PosterCell — a single generated poster tile. Renders one of five
 * states: idle placeholder, loading, error, done (image + download),
 * and stale (image visible but new one is loading in).
 *
 * Beyond the image, each cell exposes:
 *   - download (PNG file)
 *   - WhatsApp share (copies the image to clipboard, then opens wa.me
 *     with the caption pre-filled — because wa.me can't attach images,
 *     the clipboard-copy is what lets the user paste it into the chat)
 *   - print A4 (only shown when onPrint is provided)
 */

import { useState } from "react";
import { trackEvent } from "@/lib/analytics";

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
}

interface Props {
  state: CellState | undefined;
  aspect: string;
  filename: string;
  languageNativeName: string;
  languageEnglishName: string;
  fontClass: string;
  onDownload: () => void;
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

  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between gap-2 flex-wrap">
        <p className="text-sm font-medium">
          <span className={fontClass}>{languageNativeName}</span>
          <span className="ml-2 text-bazaar-ink/70">
            {languageEnglishName}
          </span>
        </p>
        <div className="flex items-center gap-2 text-xs">
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
                onClick={onDownload}
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
      <div
        className={`poster transition-opacity ${state?.loading && hasImage ? "opacity-70" : "opacity-100"}`}
        style={{ aspectRatio: aspect }}
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
          />
        ) : state?.error ? (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-coral text-center leading-relaxed">
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
    </div>
  );
}

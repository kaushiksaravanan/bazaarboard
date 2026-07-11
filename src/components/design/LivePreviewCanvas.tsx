"use client";

/**
 * LivePreviewCanvas — the center of /design. Shows an instant SVG preview
 * (composed locally from the current brief so the canvas is never empty)
 * with the AI-rendered Gemini image cross-fading in on top once
 * generation completes for the primary language.
 *
 * The parent hands us the currently-selected language's PosterCell state
 * (image + mimeType + loading flag). We never mutate; render only.
 */

import type { Brief, PosterCell } from "@/lib/voiceReducer";
import { findLanguage } from "@/lib/languages";
import { SURFACES } from "@/components/SurfacePicker";

interface Props {
  brief: Brief;
  primaryCell: PosterCell | undefined;
  primaryLangCode: string;
}

function svgFallback(brief: Brief, langCode: string): string {
  const lang = findLanguage(langCode);
  const product = brief.productName || "Your product";
  const price = brief.price || "₹—";
  const business = brief.businessName || "";
  const badges = brief.badges;
  const bg = brief.brandColor || "#F26B1F";
  const surface = SURFACES.find((s) => s.kind === brief.surface);
  const [w, h] =
    brief.surface === "whatsapp"
      ? [720, 1280]
      : brief.surface === "square"
        ? [1080, 1080]
        : [900, 1200];
  const script = lang?.nativeName ?? "";
  // Basic SVG poster — big color block, product name, price. Not final art
  // but always visible so the canvas is never blank during the first speech
  // → extract round-trip.
  return (
    `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 ${w} ${h}'>` +
    `<rect width='100%' height='100%' fill='${bg}'/>` +
    `<rect x='40' y='40' width='${w - 80}' height='${h - 80}' fill='#F5EFE3' rx='24'/>` +
    (script
      ? `<text x='${w / 2}' y='${h * 0.18}' text-anchor='middle' font-family='sans-serif' font-size='36' fill='#1F1409' opacity='0.55'>${script}</text>`
      : "") +
    `<text x='${w / 2}' y='${h * 0.42}' text-anchor='middle' font-family='sans-serif' font-size='72' font-weight='700' fill='#1F1409'>${escapeXml(product)}</text>` +
    `<text x='${w / 2}' y='${h * 0.58}' text-anchor='middle' font-family='sans-serif' font-size='96' font-weight='800' fill='${bg}'>${escapeXml(price)}</text>` +
    (business
      ? `<text x='${w / 2}' y='${h * 0.82}' text-anchor='middle' font-family='sans-serif' font-size='34' fill='#1F1409' opacity='0.75'>${escapeXml(business)}</text>`
      : "") +
    badges
      .map(
        (b, i) =>
          `<g transform='translate(${w - 200 - i * 40} ${120 + i * 60}) rotate(-6)'>` +
          `<rect width='160' height='48' rx='24' fill='#1F1409'/>` +
          `<text x='80' y='31' text-anchor='middle' font-family='sans-serif' font-size='22' fill='#F5EFE3' font-weight='700'>${escapeXml(b)}</text>` +
          `</g>`,
      )
      .join("") +
    (surface
      ? `<text x='40' y='${h - 24}' font-family='sans-serif' font-size='18' fill='#1F1409' opacity='0.5'>${escapeXml(surface.short)}</text>`
      : "") +
    `</svg>`
  );
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export function LivePreviewCanvas({
  brief,
  primaryCell,
  primaryLangCode,
}: Props): React.ReactElement {
  const svg = svgFallback(brief, primaryLangCode);
  const svgDataUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
  const hasImage = Boolean(primaryCell?.image);
  const aspect =
    SURFACES.find((s) => s.kind === brief.surface)?.aspect ?? "3 / 4";
  const loading = Boolean(primaryCell?.loading);
  return (
    <div
      className="relative w-full max-w-lg mx-auto"
      style={{ aspectRatio: aspect }}
      role="img"
      aria-label={
        hasImage
          ? "Live poster preview (AI rendering)"
          : "Live poster preview (design fallback)"
      }
      aria-busy={loading}
      data-testid="live-preview"
    >
      <img
        src={svgDataUrl}
        alt=""
        aria-hidden="true"
        className="absolute inset-0 w-full h-full rounded-2xl shadow-lg"
      />
      {hasImage && primaryCell?.image ? (
        <img
          src={`data:${primaryCell.mimeType ?? "image/png"};base64,${primaryCell.image}`}
          alt="AI-rendered poster"
          className="absolute inset-0 w-full h-full rounded-2xl shadow-xl transition-opacity duration-700"
          style={{ opacity: loading ? 0.6 : 1 }}
        />
      ) : null}
      {loading ? (
        <div
          className="absolute bottom-3 left-3 right-3 flex justify-center pointer-events-none"
          aria-live="polite"
        >
          <span className="text-[11px] font-mono uppercase tracking-wider px-3 py-1 rounded-full bg-bazaar-ink/80 text-bazaar-canvas backdrop-blur">
            Gemini rendering…
          </span>
        </div>
      ) : null}
    </div>
  );
}

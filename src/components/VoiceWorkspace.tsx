"use client";

/**
 * VoiceWorkspace — right-pane live preview of the current brief. Shows
 * the metadata (product, price, business, brand color chip, selected
 * languages, surface) plus a mini grid of the rendered posters. This is
 * effectively "what would export right now" — a WYSIWYG mirror for the
 * chat-driven design.
 */

import { findLanguage } from "@/lib/languages";
import type { Brief } from "@/lib/voiceReducer";

interface Props {
  brief: Brief;
  /** rendered by /voice — kept identical to brief.cells for consistency */
}

export function VoiceWorkspace({ brief }: Props): React.ReactElement {
  const {
    productName,
    price,
    businessName,
    brandColor,
    languageCodes,
    surface,
    badges,
    cells,
  } = brief;
  const isEmpty =
    !productName &&
    !price &&
    !businessName &&
    languageCodes.length === 0 &&
    cells.length === 0;

  return (
    <aside
      aria-label="Current brief workspace"
      className="w-full h-full bg-white/70 backdrop-blur border-l border-bazaar-ink/10 flex flex-col"
    >
      <header className="px-4 py-3 border-b border-bazaar-ink/10 flex items-center gap-2">
        <span
          className="inline-block w-2.5 h-2.5 rounded-full bg-bazaar-leaf"
          aria-hidden="true"
        />
        <h2 className="font-display italic text-lg text-bazaar-ink">
          Workspace
        </h2>
        <span className="ml-auto text-[11px] text-bazaar-ink/50 uppercase tracking-wide">
          live preview
        </span>
      </header>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {isEmpty ? (
          <div className="rounded-xl border border-dashed border-bazaar-ink/20 p-6 text-center text-sm text-bazaar-ink/50">
            <div className="text-3xl mb-2" aria-hidden="true">
              🎨
            </div>
            <p>Your brief will appear here as you talk to the assistant.</p>
          </div>
        ) : (
          <>
            <BriefMeta
              productName={productName}
              price={price}
              businessName={businessName}
              brandColor={brandColor}
              surface={surface}
              badges={badges}
              languageCodes={languageCodes}
            />
            {cells.length > 0 ? <MiniGrid cells={cells} /> : null}
          </>
        )}
      </div>
    </aside>
  );
}

function BriefMeta({
  productName,
  price,
  businessName,
  brandColor,
  surface,
  badges,
  languageCodes,
}: {
  productName: string;
  price: string;
  businessName: string;
  brandColor: string;
  surface: string;
  badges: string[];
  languageCodes: string[];
}): React.ReactElement {
  return (
    <section className="space-y-3">
      <div className="grid grid-cols-1 gap-2 text-sm">
        <Row label="Product" value={productName || <Empty />} />
        <Row label="Price" value={price || <Empty />} />
        <Row label="Business" value={businessName || <Empty />} />
        <Row
          label="Brand color"
          value={
            <span className="inline-flex items-center gap-2">
              <span
                className="inline-block w-4 h-4 rounded-full border border-bazaar-ink/20"
                style={{ backgroundColor: brandColor }}
                aria-hidden="true"
              />
              <span className="font-mono text-xs">{brandColor}</span>
            </span>
          }
        />
        <Row
          label="Surface"
          value={<span className="capitalize">{surface}</span>}
        />
      </div>

      {languageCodes.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-bazaar-ink/50 mb-1">
            Languages
          </p>
          <div className="flex flex-wrap gap-1">
            {languageCodes.map((code) => {
              const lang = findLanguage(code);
              return (
                <span
                  key={code}
                  className={`inline-flex items-center gap-1 rounded-full bg-bazaar-tangerine/10 border border-bazaar-tangerine/40 px-2 py-0.5 text-xs ${
                    lang?.fontClass ?? ""
                  }`}
                >
                  {lang?.nativeName ?? code}
                </span>
              );
            })}
          </div>
        </div>
      ) : null}

      {badges.length > 0 ? (
        <div>
          <p className="text-[11px] uppercase tracking-wide text-bazaar-ink/50 mb-1">
            Badges
          </p>
          <div className="flex flex-wrap gap-1">
            {badges.map((b) => (
              <span
                key={b}
                className="inline-flex items-center rounded-full bg-bazaar-tangerine text-white px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
              >
                {b}
              </span>
            ))}
          </div>
        </div>
      ) : null}
    </section>
  );
}

function Row({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}): React.ReactElement {
  return (
    <div className="flex items-baseline gap-3 min-w-0">
      <span className="text-[11px] uppercase tracking-wide text-bazaar-ink/50 w-20 shrink-0">
        {label}
      </span>
      <span className="text-sm text-bazaar-ink min-w-0 truncate">{value}</span>
    </div>
  );
}

function Empty(): React.ReactElement {
  return <span className="text-bazaar-ink/30 italic">—</span>;
}

function MiniGrid({
  cells,
}: {
  cells: Brief["cells"];
}): React.ReactElement {
  return (
    <section aria-label="Rendered posters preview">
      <p className="text-[11px] uppercase tracking-wide text-bazaar-ink/50 mb-2">
        Posters
      </p>
      <div className="grid grid-cols-3 gap-2">
        {cells.map((c) => {
          const lang = findLanguage(c.langCode);
          return (
            <div
              key={c.langCode}
              className="rounded-md overflow-hidden border border-bazaar-ink/10 bg-white"
              title={lang?.englishName ?? c.langCode}
            >
              <div className="aspect-[3/4] flex items-center justify-center bg-bazaar-canvas">
                {c.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={`data:${c.mimeType ?? "image/png"};base64,${c.image}`}
                    alt={`${lang?.englishName ?? c.langCode} poster preview`}
                    className="w-full h-full object-cover"
                  />
                ) : c.error ? (
                  <span className="text-[9px] text-bazaar-coral p-1 text-center">
                    ×
                  </span>
                ) : (
                  <span className="w-2 h-2 rounded-full bg-bazaar-tangerine/60 animate-pulse" />
                )}
              </div>
              <p
                className={`px-1.5 py-1 text-[10px] text-center leading-tight ${
                  lang?.fontClass ?? ""
                }`}
              >
                {lang?.nativeName ?? c.langCode}
              </p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

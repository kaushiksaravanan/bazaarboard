"use client";

/**
 * SlotEditCard — inline artifact card shown when the agent updates a
 * brief slot (product name / price / business name / brand color). Grey
 * card, tiny, one line — designed to sit between chat bubbles.
 */

import type { SlotField } from "@/lib/voiceReducer";

interface Props {
  field: SlotField;
  value: string;
}

const LABELS: Record<SlotField, string> = {
  productName: "Product",
  price: "Price",
  businessName: "Business",
  brandColor: "Brand color",
};

export function SlotEditCard({ field, value }: Props): React.ReactElement {
  const isColor = field === "brandColor";
  return (
    <div
      role="status"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-ink/10 bg-white/70 px-3 py-2 text-xs text-bazaar-ink/80 flex items-center gap-2 shadow-sm"
    >
      <span aria-hidden="true">✏️</span>
      <span className="font-medium text-bazaar-ink">{LABELS[field]}</span>
      <span aria-hidden="true" className="text-bazaar-ink/40">
        →
      </span>
      {isColor ? (
        <>
          <span
            className="inline-block w-3.5 h-3.5 rounded-full border border-bazaar-ink/20"
            style={{ backgroundColor: value }}
            aria-hidden="true"
          />
          <span className="font-mono text-[11px]">{value}</span>
        </>
      ) : (
        <span className="truncate">&ldquo;{value}&rdquo;</span>
      )}
    </div>
  );
}

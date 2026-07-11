"use client";

/**
 * LayerPanel — the left column on /design. Renders one LayerRow per slot
 * in the brief. Clicking a row selects it (highlight); the delete button
 * clears optional slots (badges, business name). Locking is advisory —
 * a locked slot won't accept extracted updates.
 */

import type { Brief } from "@/lib/voiceReducer";
import { LayerRow } from "./LayerRow";

export type LayerId =
  | "background"
  | "productName"
  | "price"
  | "businessName"
  | "badge"
  | "language"
  | "surface";

interface Props {
  brief: Brief;
  activeLayer: LayerId | null;
  locked: Record<LayerId, boolean>;
  interimText: string;
  onSelect: (layer: LayerId) => void;
  onToggleLock: (layer: LayerId) => void;
  onClearSlot: (layer: LayerId) => void;
}

export function LayerPanel({
  brief,
  activeLayer,
  locked,
  interimText,
  onSelect,
  onToggleLock,
  onClearSlot,
}: Props): React.ReactElement {
  const listening = interimText.trim().length > 0;
  return (
    <aside
      aria-label="Layer panel"
      className="w-full md:w-[280px] shrink-0 md:border-r border-bazaar-ink/10 bg-bazaar-canvas/80 backdrop-blur"
    >
      <div className="px-4 py-3 border-b border-bazaar-ink/10">
        <p className="font-display italic text-lg text-bazaar-ink">Layers</p>
        <p className="text-[11px] text-bazaar-ink/60">
          Speak — layers fill in live.
        </p>
      </div>
      <div className="p-3 space-y-2 overflow-y-auto">
        <LayerRow
          id="background"
          icon="🖼️"
          name="Background"
          value={brief.brandColor}
          placeholder="#F26B1F"
          active={activeLayer === "background"}
          locked={locked.background}
          loading={listening && !brief.brandColor}
          onSelect={() => onSelect("background")}
          onToggleLock={() => onToggleLock("background")}
        />
        <LayerRow
          id="productName"
          icon="📝"
          name="Product name"
          value={brief.productName}
          placeholder="Say what you're selling"
          active={activeLayer === "productName"}
          locked={locked.productName}
          loading={listening && !brief.productName}
          onSelect={() => onSelect("productName")}
          onToggleLock={() => onToggleLock("productName")}
          onDelete={
            brief.productName ? () => onClearSlot("productName") : undefined
          }
        />
        <LayerRow
          id="price"
          icon="💵"
          name="Price"
          value={brief.price}
          placeholder="Say the price"
          active={activeLayer === "price"}
          locked={locked.price}
          loading={listening && !brief.price}
          onSelect={() => onSelect("price")}
          onToggleLock={() => onToggleLock("price")}
          onDelete={brief.price ? () => onClearSlot("price") : undefined}
        />
        <LayerRow
          id="businessName"
          icon="🏪"
          name="Business name"
          value={brief.businessName}
          placeholder="Optional"
          active={activeLayer === "businessName"}
          locked={locked.businessName}
          loading={listening && !brief.businessName}
          onSelect={() => onSelect("businessName")}
          onToggleLock={() => onToggleLock("businessName")}
          onDelete={
            brief.businessName ? () => onClearSlot("businessName") : undefined
          }
        />
        {brief.badges.length > 0 ? (
          <LayerRow
            id="badge"
            icon="🎉"
            name="Badge"
            value={brief.badges.join(", ")}
            placeholder="Say 'add badge'"
            active={activeLayer === "badge"}
            locked={locked.badge}
            onSelect={() => onSelect("badge")}
            onToggleLock={() => onToggleLock("badge")}
            onDelete={() => onClearSlot("badge")}
          />
        ) : null}
        <LayerRow
          id="language"
          icon="🌐"
          name="Language"
          value={
            brief.languageCodes.length > 0
              ? brief.languageCodes.join(" · ")
              : ""
          }
          placeholder="Auto-detected"
          active={activeLayer === "language"}
          locked={locked.language}
          onSelect={() => onSelect("language")}
          onToggleLock={() => onToggleLock("language")}
        />
        <LayerRow
          id="surface"
          icon="📐"
          name="Surface"
          value={brief.surface}
          placeholder="poster"
          active={activeLayer === "surface"}
          locked={locked.surface}
          onSelect={() => onSelect("surface")}
          onToggleLock={() => onToggleLock("surface")}
        />
      </div>
    </aside>
  );
}

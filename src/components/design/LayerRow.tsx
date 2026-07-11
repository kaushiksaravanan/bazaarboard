"use client";

/**
 * LayerRow — a single Photoshop-style layer entry in the LayerPanel.
 *
 * Each brief slot (background, product name, price, etc.) is represented as
 * one of these rows. The parent owns the "active layer" state; this
 * component just paints and forwards click / lock / delete events.
 */

interface Props {
  id: string;
  icon: string;
  name: string;
  value: string;
  placeholder: string;
  active: boolean;
  locked: boolean;
  loading?: boolean;
  onSelect: () => void;
  onToggleLock: () => void;
  onDelete?: () => void;
}

export function LayerRow({
  icon,
  name,
  value,
  placeholder,
  active,
  locked,
  loading,
  onSelect,
  onToggleLock,
  onDelete,
}: Props): React.ReactElement {
  const hasValue = value.trim().length > 0;
  return (
    <div
      role="group"
      aria-label={`Layer: ${name}`}
      className={`relative rounded-xl border transition-colors ${
        active
          ? "border-bazaar-tangerine bg-bazaar-tangerine/10"
          : "border-bazaar-ink/15 bg-white/70 hover:border-bazaar-tangerine/50"
      }`}
    >
      <button
        type="button"
        onClick={onSelect}
        aria-pressed={active}
        aria-label={`Select ${name} layer${
          hasValue ? `, value ${value}` : ", empty"
        }`}
        className="w-full text-left px-3 py-2.5 flex items-start gap-2 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
      >
        <span aria-hidden="true" className="text-lg leading-none pt-0.5">
          {icon}
        </span>
        <span className="flex-1 min-w-0">
          <span className="block text-[11px] uppercase tracking-wider text-bazaar-ink/60 font-medium">
            {name}
          </span>
          <span
            className={`block text-sm mt-0.5 truncate ${
              hasValue ? "text-bazaar-ink" : "text-bazaar-ink/40 italic"
            }`}
          >
            {hasValue ? value : loading ? "listening…" : placeholder}
          </span>
        </span>
      </button>
      <div className="absolute right-2 top-2 flex items-center gap-1">
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onToggleLock();
          }}
          aria-label={locked ? `Unlock ${name}` : `Lock ${name}`}
          aria-pressed={locked}
          className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-bazaar-ink/60 hover:text-bazaar-tangerine hover:bg-bazaar-tangerine/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine"
        >
          {locked ? "🔒" : "🔓"}
        </button>
        {onDelete ? (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onDelete();
            }}
            aria-label={`Delete ${name} layer`}
            className="w-6 h-6 rounded-full text-xs flex items-center justify-center text-bazaar-ink/60 hover:text-bazaar-coral hover:bg-bazaar-coral/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine"
          >
            ✕
          </button>
        ) : null}
      </div>
    </div>
  );
}

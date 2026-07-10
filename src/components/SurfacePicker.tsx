"use client";

export type SurfaceKind = "poster" | "whatsapp" | "square";

export const SURFACES: Array<{
  kind: SurfaceKind;
  label: string;
  aspect: string;
  short: string;
}> = [
  { kind: "poster", label: "Shop poster (A4)", aspect: "3 / 4", short: "A4" },
  {
    kind: "whatsapp",
    label: "WhatsApp status (9:16)",
    aspect: "9 / 16",
    short: "WA",
  },
  {
    kind: "square",
    label: "Google Business post (1:1)",
    aspect: "1 / 1",
    short: "GBP",
  },
];

interface Props {
  selected: SurfaceKind;
  onChange: (kind: SurfaceKind) => void;
  multi?: boolean;
  selectedSet?: Set<SurfaceKind>;
  onToggle?: (kind: SurfaceKind) => void;
}

export function SurfacePicker({
  selected,
  onChange,
  multi,
  selectedSet,
  onToggle,
}: Props): React.ReactElement {
  return (
    <div
      role="group"
      aria-label="Poster surfaces"
      className="flex flex-wrap gap-2"
    >
      {SURFACES.map((s) => {
        const active = multi
          ? Boolean(selectedSet?.has(s.kind))
          : selected === s.kind;
        return (
          <button
            key={s.kind}
            type="button"
            onClick={() =>
              multi && onToggle ? onToggle(s.kind) : onChange(s.kind)
            }
            aria-pressed={active}
            aria-label={`${s.label}${active ? ", selected" : ""}`}
            className={`text-xs px-3 py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
              active
                ? "bg-bazaar-tangerine text-white border-bazaar-tangerine"
                : "bg-white border-bazaar-ink/30 hover:border-bazaar-tangerine/60"
            }`}
          >
            {s.label}
          </button>
        );
      })}
    </div>
  );
}

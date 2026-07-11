"use client";

/**
 * DesignToolboxTray — the "+" tray of quick-action chips that opens
 * above the composer. Sends synthetic user messages back into the chat
 * ("Change language", "Add a FESTIVE badge", "Export as ZIP", "Start
 * over") so the agent's tool-call flow drives all mutations — the tray
 * never touches state directly.
 */

interface Props {
  open: boolean;
  onClose: () => void;
  onQuickAction: (text: string) => void;
}

interface Chip {
  label: string;
  emoji: string;
  text: string;
}

const CHIPS: Chip[] = [
  { label: "Change language", emoji: "🌐", text: "Change the language" },
  { label: "Add badge", emoji: "🎉", text: "Add a FESTIVE badge" },
  { label: "Export ZIP", emoji: "📦", text: "Export all posters as a ZIP" },
  { label: "Export PDF", emoji: "📄", text: "Export all posters as a PDF" },
  { label: "Export MP4", emoji: "🎬", text: "Export a slideshow video" },
  { label: "Undo", emoji: "↺", text: "Undo the last change" },
  { label: "Start over", emoji: "🧹", text: "Start over from scratch" },
];

export function DesignToolboxTray({
  open,
  onClose,
  onQuickAction,
}: Props): React.ReactElement | null {
  if (!open) return null;
  return (
    <div
      role="dialog"
      aria-label="Design toolbox"
      className="rounded-2xl border border-bazaar-ink/10 bg-white shadow-lg p-3 space-y-2"
    >
      <div className="flex items-center gap-2 pb-1 border-b border-bazaar-ink/10">
        <span
          className="w-5 h-5 rounded-full bg-bazaar-tangerine/10 flex items-center justify-center text-xs"
          aria-hidden="true"
        >
          +
        </span>
        <span className="text-xs font-medium text-bazaar-ink">
          Quick actions
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close toolbox"
          className="ml-auto text-xs text-bazaar-ink/50 hover:text-bazaar-ink rounded focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        >
          ✕
        </button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {CHIPS.map((chip) => (
          <button
            key={chip.label}
            type="button"
            onClick={() => {
              onQuickAction(chip.text);
              onClose();
            }}
            className="inline-flex items-center gap-1.5 rounded-full border border-bazaar-ink/20 bg-bazaar-canvas hover:border-bazaar-tangerine/60 hover:bg-bazaar-tangerine/5 transition-colors px-3 py-1.5 text-xs text-bazaar-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            <span aria-hidden="true">{chip.emoji}</span>
            <span>{chip.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

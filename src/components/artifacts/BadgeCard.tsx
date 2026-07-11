"use client";

/**
 * BadgeCard — sticker artifact when the agent adds or removes a badge.
 */

interface Props {
  badge: string;
  removed?: boolean;
}

export function BadgeCard({ badge, removed }: Props): React.ReactElement {
  return (
    <div
      role="status"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-saffron/50 bg-bazaar-saffron/10 px-3 py-2 text-xs text-bazaar-ink flex items-center gap-2 shadow-sm"
    >
      <span aria-hidden="true">{removed ? "🗑️" : "🎉"}</span>
      <span className="font-medium">
        {removed ? "Removed badge" : "Added badge"}
      </span>
      <span
        className="inline-flex items-center rounded-full bg-bazaar-tangerine text-white px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase"
        aria-label={`Badge: ${badge}`}
      >
        {badge}
      </span>
    </div>
  );
}

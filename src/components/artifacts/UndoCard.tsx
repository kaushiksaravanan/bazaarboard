"use client";

/**
 * UndoCard — subtle "↺ Undid last edit" artifact.
 */

interface Props {
  summary?: string;
}

export function UndoCard({ summary }: Props): React.ReactElement {
  return (
    <div
      role="status"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-ink/10 bg-bazaar-ink/[0.03] px-3 py-1.5 text-[11px] text-bazaar-ink/60 flex items-center gap-2"
    >
      <span aria-hidden="true">↺</span>
      <span>{summary ?? "Undid last edit"}</span>
    </div>
  );
}

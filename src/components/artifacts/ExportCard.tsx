"use client";

/**
 * ExportCard — download artifact for export_zip / export_pdf / export_mp4.
 * Shows filename, size, format, and a big Save button. In "preparing" mode
 * the button is disabled and a spinner shows.
 */

export type ExportKind = "zip" | "pdf" | "mp4";

interface Props {
  kind: ExportKind;
  status: "preparing" | "ready" | "error";
  filename?: string;
  sizeBytes?: number;
  count?: number;
  errorMessage?: string;
  onSave?: () => void;
}

const KIND_LABEL: Record<ExportKind, { icon: string; noun: string }> = {
  zip: { icon: "📦", noun: "ZIP" },
  pdf: { icon: "📄", noun: "PDF" },
  mp4: { icon: "🎬", noun: "MP4" },
};

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(1)} MB`;
}

export function ExportCard({
  kind,
  status,
  filename,
  sizeBytes,
  count,
  errorMessage,
  onSave,
}: Props): React.ReactElement {
  const meta = KIND_LABEL[kind];
  return (
    <div
      role="status"
      className="mx-auto max-w-[85%] w-full rounded-xl border border-bazaar-ink/10 bg-white p-3 shadow-sm flex items-center gap-3"
    >
      <div className="w-10 h-10 rounded-lg bg-bazaar-tangerine/10 flex items-center justify-center text-lg" aria-hidden="true">
        {meta.icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-bazaar-ink truncate">
          {filename ?? `bazaarboard.${kind}`}
        </p>
        <p className="text-[11px] text-bazaar-ink/60 flex items-center gap-2">
          <span>{meta.noun}</span>
          {count !== undefined ? (
            <>
              <span>·</span>
              <span>
                {count} poster{count === 1 ? "" : "s"}
              </span>
            </>
          ) : null}
          {sizeBytes !== undefined && status === "ready" ? (
            <>
              <span>·</span>
              <span>{formatBytes(sizeBytes)}</span>
            </>
          ) : null}
          {status === "preparing" ? (
            <>
              <span>·</span>
              <span className="text-bazaar-tangerine animate-pulse">
                preparing…
              </span>
            </>
          ) : null}
          {status === "error" ? (
            <>
              <span>·</span>
              <span className="text-bazaar-coral">
                {errorMessage ?? "failed"}
              </span>
            </>
          ) : null}
        </p>
      </div>
      <button
        type="button"
        onClick={onSave}
        disabled={status !== "ready"}
        className="text-xs px-3 py-2 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
      >
        ⬇ Save
      </button>
    </div>
  );
}

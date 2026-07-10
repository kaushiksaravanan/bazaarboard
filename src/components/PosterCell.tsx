"use client";

/**
 * PosterCell — a single generated poster tile. Renders one of five
 * states: idle placeholder, loading, error, done (image + download),
 * and stale (image visible but new one is loading in).
 */

interface CellState {
  image?: string;
  mimeType?: string;
  loading: boolean;
  error?: string;
  latencyMs?: number;
}

interface Props {
  state: CellState | undefined;
  aspect: string;
  filename: string;
  languageNativeName: string;
  languageEnglishName: string;
  fontClass: string;
  onDownload: () => void;
}

export function PosterCell({
  state,
  aspect,
  languageNativeName,
  languageEnglishName,
  fontClass,
  onDownload,
}: Props): React.ReactElement {
  const hasImage = Boolean(state?.image);
  return (
    <div className="space-y-2">
      <div className="flex items-baseline justify-between">
        <p className="text-sm font-medium">
          <span className={fontClass}>{languageNativeName}</span>
          <span className="ml-2 text-bazaar-ink/60">
            {languageEnglishName}
          </span>
        </p>
        <div className="flex items-center gap-2 text-xs">
          {state?.loading ? (
            <span className="text-bazaar-tangerine animate-pulse">
              rendering…
            </span>
          ) : state?.latencyMs !== undefined ? (
            <span className="text-bazaar-ink/50 font-mono">
              {(state.latencyMs / 1000).toFixed(1)}s
            </span>
          ) : null}
          {hasImage ? (
            <button
              onClick={onDownload}
              className="text-bazaar-ink/60 hover:text-bazaar-tangerine transition-colors underline-offset-2 hover:underline"
              aria-label="Download this poster"
            >
              download
            </button>
          ) : null}
        </div>
      </div>
      <div
        className={`poster transition-opacity ${state?.loading && hasImage ? "opacity-70" : "opacity-100"}`}
        style={{ aspectRatio: aspect }}
      >
        {hasImage && state?.image ? (
          <img
            src={`data:${state.mimeType ?? "image/png"};base64,${state.image}`}
            alt={`${languageEnglishName} poster`}
          />
        ) : state?.error ? (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-coral text-center leading-relaxed">
            {state.error}
          </div>
        ) : state?.loading ? (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-ink/40">
            <div className="animate-pulse">Gemini is rendering…</div>
          </div>
        ) : (
          <div className="p-4 h-full flex items-center justify-center text-xs text-bazaar-ink/30">
            queued
          </div>
        )}
      </div>
    </div>
  );
}

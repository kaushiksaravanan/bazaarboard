"use client";

/**
 * Live throughput counter — the moment-of-truth demo widget. Sits in
 * the header, updates in real time as the generate() pipeline flushes
 * results in. Shows:
 *
 *   - Total posters rendered this session
 *   - Rolling avg latency (last 20 renders)
 *   - Estimated cost at NB2 Lite's published rate
 *   - Provider/fallback badge (SVG fallback visibly flagged)
 *
 * Reason: judges have heard "AI image gen" pitches all day. What they
 * haven't seen is a live counter that ticks up at 3+ posters/second
 * while the presenter types.
 */

import { useEffect, useMemo, useRef, useState } from "react";

export interface ThroughputStats {
  count: number;
  latencies: number[]; // ms, per successful generate
  model: string;
}

// NB2 Lite pricing per the participant guide: $0.034 per 1000 images.
const NB2_LITE_COST_PER_IMAGE = 0.034 / 1000;

// Pre-day-of fallback (gemini-2.5-flash-image-preview) is roughly 10×
// pricier per Google's public preview pricing. Used only when the env
// forces the fallback model.
const FALLBACK_COST_PER_IMAGE = 0.039 / 1000;

function costPerImage(model: string): number {
  return model.includes("flash-lite-image")
    ? NB2_LITE_COST_PER_IMAGE
    : FALLBACK_COST_PER_IMAGE;
}

function formatUsd(x: number): string {
  if (x < 0.01) return `$${x.toFixed(4)}`;
  if (x < 1) return `$${x.toFixed(3)}`;
  return `$${x.toFixed(2)}`;
}

interface Props {
  stats: ThroughputStats;
  /** When true, triggers a one-shot celebratory flash animation. */
  flash?: boolean;
}

export function ThroughputBar({ stats, flash }: Props): React.ReactElement {
  const avgLatency = useMemo(() => {
    if (stats.latencies.length === 0) return null;
    const recent = stats.latencies.slice(-20);
    const sum = recent.reduce((a, b) => a + b, 0);
    return sum / recent.length;
  }, [stats.latencies]);

  const totalCost = useMemo(
    () => stats.count * costPerImage(stats.model),
    [stats.count, stats.model],
  );

  // Local flash-latch: when parent toggles `flash` true, we run the CSS
  // animation once and then release the class so it can re-fire later.
  const [flashOn, setFlashOn] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!flash) return;
    setFlashOn(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setFlashOn(false), 1300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [flash]);

  const isFallback = !stats.model.includes("flash-lite-image");
  const isSvgFallback = stats.model.toLowerCase().includes("svg");

  return (
    <div
      className={`flex items-center gap-3 text-xs font-mono flex-wrap px-2 py-1 rounded ${flashOn ? "throughput-flash" : ""}`}
      aria-live="polite"
      aria-atomic="true"
      aria-label="Live rendering throughput"
    >
      <span>
        <span className="text-bazaar-ink/70">rendered</span>{" "}
        <span className="text-bazaar-tangerine font-bold text-sm">
          {stats.count}
        </span>
      </span>
      {avgLatency !== null ? (
        <span>
          <span className="text-bazaar-ink/70">avg</span>{" "}
          <span className="text-bazaar-ink">
            {(avgLatency / 1000).toFixed(1)}s
          </span>
        </span>
      ) : null}
      <span>
        <span className="text-bazaar-ink/70">cost</span>{" "}
        <span className="text-bazaar-leaf">{formatUsd(totalCost)}</span>
      </span>
      {isSvgFallback ? (
        <span
          className="px-2 py-0.5 rounded-full bg-bazaar-coral/15 text-bazaar-coral border border-bazaar-coral/40"
          title="Falling back to deterministic SVG render — the image API is unavailable."
        >
          SVG fallback
        </span>
      ) : isFallback ? (
        <span
          className="px-2 py-0.5 rounded-full bg-bazaar-saffron/25 text-bazaar-ink/80 border border-bazaar-saffron/60"
          title={stats.model}
        >
          preview fallback
        </span>
      ) : (
        <span
          className="px-2 py-0.5 rounded-full bg-bazaar-leaf/15 text-bazaar-leaf border border-bazaar-leaf/40"
          title={stats.model}
        >
          NB2 Lite
        </span>
      )}
    </div>
  );
}

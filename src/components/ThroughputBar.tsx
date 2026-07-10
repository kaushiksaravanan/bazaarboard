"use client";

/**
 * Live throughput counter — the moment-of-truth demo widget. Sits in
 * the header, updates in real time as the generate() pipeline flushes
 * results in. Shows:
 *
 *   - Total posters rendered this session
 *   - Rolling avg latency (last 20 renders)
 *   - Estimated cost at NB2 Lite's published rate
 *
 * Reason: judges have heard "AI image gen" pitches all day. What they
 * haven't seen is a live counter that ticks up at 3+ posters/second
 * while the presenter types.
 */

import { useMemo } from "react";

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
}

export function ThroughputBar({ stats }: Props): React.ReactElement {
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

  return (
    <div className="flex items-center gap-4 text-xs font-mono">
      <span>
        <span className="text-bazaar-ink/50">rendered</span>{" "}
        <span className="text-bazaar-tangerine font-bold text-sm">
          {stats.count}
        </span>
      </span>
      {avgLatency !== null ? (
        <span>
          <span className="text-bazaar-ink/50">avg</span>{" "}
          <span className="text-bazaar-ink">
            {(avgLatency / 1000).toFixed(1)}s
          </span>
        </span>
      ) : null}
      <span>
        <span className="text-bazaar-ink/50">cost</span>{" "}
        <span className="text-bazaar-leaf">{formatUsd(totalCost)}</span>
      </span>
      <span className="text-bazaar-ink/40" title={stats.model}>
        {stats.model.includes("flash-lite-image") ? "NB2 Lite" : "fallback"}
      </span>
    </div>
  );
}

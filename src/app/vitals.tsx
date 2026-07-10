"use client";

/**
 * Web Vitals reporter.
 *
 * Next.js's useReportWebVitals fires for each Core Web Vital (CLS, LCP,
 * FCP, INP, TTFB) as it settles. We fan each metric out to our own
 * analytics endpoint via trackEvent — the sink is /api/telemetry, which
 * logs a structured line per event.
 *
 * Rendered from layout.tsx as an invisible client component. Zero UI.
 */

import { useReportWebVitals } from "next/web-vitals";
import { trackEvent } from "@/lib/analytics";

export function WebVitals(): null {
  useReportWebVitals((metric) => {
    trackEvent("web_vital", {
      metric_name: metric.name,
      metric_id: metric.id,
      value: metric.value,
      rating: metric.rating ?? null,
      label: metric.label ?? null,
      delta: metric.delta,
    });
  });
  return null;
}

"use client";

/**
 * StatusIndicator — a tiny green/yellow/red dot in the footer.
 *
 * Pings /api/health every 30s.
 *   - green: ok, geminiKeyConfigured=true (or BYOK is set in sessionStorage).
 *   - yellow: ok, but fallback mode (server has no key AND user has no BYOK).
 *   - red: /api/health failed to respond.
 */

import { useEffect, useState } from "react";

type Status = "green" | "yellow" | "red" | "unknown";

interface HealthPayload {
  ok?: boolean;
  timestamp?: string;
  geminiKeyConfigured?: boolean;
  model?: string;
  uptime?: number;
}

const PROBE_INTERVAL_MS = 30_000;

function readByok(): boolean {
  if (typeof window === "undefined") return false;
  try {
    return Boolean(window.sessionStorage.getItem("bazaarboard.byokGeminiKey"));
  } catch {
    return false;
  }
}

export function StatusIndicator(): React.ReactElement {
  const [status, setStatus] = useState<Status>("unknown");
  const [detail, setDetail] = useState<string>("checking…");

  useEffect(() => {
    let cancelled = false;

    const probe = async (): Promise<void> => {
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const body = (await res.json()) as HealthPayload;
        if (cancelled) return;

        const hasByok = readByok();
        if (body.geminiKeyConfigured || hasByok) {
          setStatus("green");
          setDetail(
            body.geminiKeyConfigured
              ? "Live model · server key"
              : "Live model · your key",
          );
        } else {
          setStatus("yellow");
          setDetail("Fallback mode · no billing key");
        }
      } catch (err) {
        if (cancelled) return;
        setStatus("red");
        setDetail(
          err instanceof Error ? `Health check failed: ${err.message}` : "Health check failed",
        );
      }
    };

    void probe();
    const t = setInterval(() => void probe(), PROBE_INTERVAL_MS);

    // Re-probe when the tab regains focus so a user who returns after
    // plugging their key in gets a fresh signal.
    const onVis = (): void => {
      if (document.visibilityState === "visible") void probe();
    };
    document.addEventListener("visibilitychange", onVis);

    return () => {
      cancelled = true;
      clearInterval(t);
      document.removeEventListener("visibilitychange", onVis);
    };
  }, []);

  const color =
    status === "green"
      ? "bg-green-500"
      : status === "yellow"
        ? "bg-yellow-500"
        : status === "red"
          ? "bg-red-500"
          : "bg-bazaar-ink/30";

  const label =
    status === "green"
      ? "System healthy"
      : status === "yellow"
        ? "System degraded"
        : status === "red"
          ? "System offline"
          : "System status unknown";

  return (
    <span
      role="status"
      aria-live="polite"
      aria-label={`${label} — ${detail}`}
      title={`${label} — ${detail}`}
      className="inline-flex items-center gap-1.5 text-[11px] font-mono text-bazaar-ink/60"
    >
      <span
        aria-hidden="true"
        className={`inline-block w-2 h-2 rounded-full ${color}`}
      />
      <span>{label}</span>
    </span>
  );
}

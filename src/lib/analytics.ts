"use client";

/**
 * Lightweight client-side analytics.
 *
 * - No third-party trackers. Events are POSTed to our own /api/telemetry
 *   endpoint (or NEXT_PUBLIC_ANALYTICS_ENDPOINT if set), where they land
 *   in Vercel logs as structured JSON. From there they're queryable and
 *   can be shipped to any downstream sink later.
 * - Batches events in-memory. Flushes on:
 *     (1) every 5s while there are queued events,
 *     (2) document visibility change → hidden (page swap / close),
 *     (3) manual flushEvents() calls.
 * - Anonymous session id (crypto.randomUUID) stored in sessionStorage —
 *   never leaves the tab, and vanishes when the tab closes.
 * - Respects navigator.doNotTrack: if DNT=1, trackEvent is a no-op.
 *
 * SECURITY: the analytics endpoint MUST never receive the user's BYOK
 * Gemini API key. Callers should not put the key in props. As a belt-and-
 * suspenders guard, this module strips any prop whose key name contains
 * "key", "token", "secret", "auth", or "apiKey" from the payload.
 */

const ENDPOINT =
  process.env.NEXT_PUBLIC_ANALYTICS_ENDPOINT ?? "/api/telemetry";

const FLUSH_INTERVAL_MS = 5_000;
const SESSION_STORAGE_KEY = "bazaarboard.telemetrySessionId";

export type EventProps = Record<string, string | number | boolean | null>;

export interface TelemetryEvent {
  name: string;
  props: EventProps;
  ts: number;
  sessionId: string;
  url: string;
}

interface AnalyticsState {
  queue: TelemetryEvent[];
  timer: ReturnType<typeof setInterval> | null;
  wired: boolean;
}

// Module-level singleton so multiple imports share the queue.
const state: AnalyticsState = {
  queue: [],
  timer: null,
  wired: false,
};

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof document !== "undefined";
}

function doNotTrack(): boolean {
  if (!isBrowser()) return true;
  const nav = window.navigator as Navigator & { doNotTrack?: string };
  const raw = nav.doNotTrack ?? "";
  return raw === "1" || raw === "yes";
}

function getSessionId(): string {
  if (!isBrowser()) return "server";
  try {
    const existing = window.sessionStorage.getItem(SESSION_STORAGE_KEY);
    if (existing) return existing;
    const fresh = crypto.randomUUID();
    window.sessionStorage.setItem(SESSION_STORAGE_KEY, fresh);
    return fresh;
  } catch {
    // sessionStorage disabled — fall back to a per-page ephemeral id.
    return "ephemeral";
  }
}

const SENSITIVE_KEY_RE = /(key|token|secret|auth|password|credential)/i;
// Boolean-flag convention (has_key, is_authenticated, ...) is safe by design —
// callers use these to REPORT credential state without sending the credential.
const FLAG_PREFIX_RE = /^(has|is)_/i;

function sanitizeProps(props: EventProps | undefined): EventProps {
  if (!props) return {};
  const out: EventProps = {};
  for (const [k, v] of Object.entries(props)) {
    // Belt-and-suspenders: strip any prop whose key looks credential-like,
    // EXCEPT boolean flags like `has_key` / `is_authenticated` that only
    // report presence, not the credential itself.
    if (SENSITIVE_KEY_RE.test(k) && !FLAG_PREFIX_RE.test(k)) continue;
    // Also strip anything that looks like a Gemini/Google API key value.
    if (typeof v === "string" && /^AIza[0-9A-Za-z_-]{20,}$/.test(v)) continue;
    out[k] = v;
  }
  return out;
}

async function forwardToVercel(name: string, props: EventProps): Promise<void> {
  try {
    const mod = await import("@vercel/analytics");
    // Vercel's track() accepts string | number | boolean | null values, which
    // matches EventProps. The sanitizer has already stripped credential-like
    // keys and Gemini API-key-shaped values.
    mod.track(name, props);
  } catch {
    // Package missing, blocked, or not in a Vercel context — silently ignore.
  }
}

function wireFlushers(): void {
  if (!isBrowser() || state.wired) return;
  state.wired = true;

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") {
      void flushEvents(true);
    }
  });

  // Also try to flush on pagehide (fires before the tab is closed).
  window.addEventListener("pagehide", () => {
    void flushEvents(true);
  });
}

function ensureTimer(): void {
  if (!isBrowser() || state.timer !== null) return;
  state.timer = setInterval(() => {
    if (state.queue.length > 0) void flushEvents(false);
  }, FLUSH_INTERVAL_MS);
}

/**
 * Enqueue an event. No-op on the server, or when DNT is set.
 */
export function trackEvent(name: string, props?: EventProps): void {
  if (!isBrowser()) return;
  if (doNotTrack()) return;
  if (!name) return;

  wireFlushers();
  ensureTimer();

  const cleanProps = sanitizeProps(props);

  state.queue.push({
    name,
    props: cleanProps,
    ts: Date.now(),
    sessionId: getSessionId(),
    url: window.location.pathname,
  });

  // Also forward the (sanitized) event to Vercel Analytics if available.
  // Guarded so it fails gracefully outside a Vercel context (no dashboard,
  // ad-blocked, offline dev, etc.). Runs in parallel with the batched POST.
  void forwardToVercel(name, cleanProps);

  // Soft cap to avoid unbounded growth if the endpoint is unreachable.
  if (state.queue.length > 500) {
    state.queue.splice(0, state.queue.length - 500);
  }
}

/**
 * Flush the queue. When useBeacon is true (page-hide path), use
 * navigator.sendBeacon so the request survives page unload.
 */
export async function flushEvents(useBeacon: boolean): Promise<void> {
  if (!isBrowser()) return;
  if (state.queue.length === 0) return;

  const batch = state.queue.splice(0, state.queue.length);
  const payload = JSON.stringify({ events: batch });

  try {
    if (useBeacon && typeof navigator.sendBeacon === "function") {
      const blob = new Blob([payload], { type: "application/json" });
      const ok = navigator.sendBeacon(ENDPOINT, blob);
      if (ok) return;
      // Beacon refused (over quota) — fall through to fetch.
    }
    await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: payload,
      keepalive: true,
    });
  } catch {
    // Silently swallow — analytics MUST NOT break the app.
    // Re-queue the batch at the head so it retries next flush.
    state.queue.unshift(...batch);
    if (state.queue.length > 500) {
      state.queue.splice(0, state.queue.length - 500);
    }
  }
}

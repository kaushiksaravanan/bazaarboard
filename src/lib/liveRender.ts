/**
 * liveRender — client-side streaming render orchestrator.
 *
 * Consumes brief updates (from voiceReducer or /api/extract dispatches) and,
 * for each (languageCode, surface) tile, moves the tile through a small state
 * machine: idle → fallback → streaming → done | error.
 *
 * The key trick: whenever the brief changes, we IMMEDIATELY paint an
 * SVG-typography fallback (client-side, <10ms) while a fresh /api/generate
 * fetch is in-flight. When the real image arrives, we cross-fade over the
 * fallback — the UI never shows a blank/loading tile.
 *
 * Constraints (deliberate):
 *  - Pure library. No React imports. Framework-agnostic; consumed via
 *    useEffect + local state on the /design page.
 *  - No new deps. Uses fetch + AbortController only.
 *  - TypeScript strict, no `any`.
 *
 * Concurrency: a small worker pool (default 4) picks tasks off a queue.
 * Debounce: 300ms per-tile to coalesce rapid brief edits.
 * Dedupe: a stable JSON hash of the canonicalized brief is compared against
 * the last-rendered hash; identical inputs never re-fire a gen.
 */

import { findLanguage } from "@/lib/languages";

export type LiveStatus =
  | "idle"
  | "fallback"
  | "streaming"
  | "done"
  | "error";

export type LiveSurface = "poster" | "whatsapp" | "square";

export interface LiveBrief {
  productName: string;
  price: string;
  businessName?: string;
  brandColor: string;
  languageCodes: string[];
  surface: LiveSurface;
  badges?: Array<{ text: string; style: string }>;
}

export interface LiveTile {
  key: string;
  languageCode: string;
  surface: LiveSurface;
  status: LiveStatus;
  image?: string;
  mimeType?: string;
  latencyMs?: number;
  error?: string;
  brief: LiveBrief;
}

export interface LiveRenderer {
  setBrief(brief: LiveBrief): void;
  cancelAll(): void;
  onTileUpdate(cb: (tile: LiveTile) => void): () => void;
  getTiles(): LiveTile[];
}

interface RendererOpts {
  debounceMs?: number;
  concurrency?: number;
}

// ---- helpers -------------------------------------------------------------

/**
 * Product index for the tile key. In the current product each brief maps
 * to a single product; the key still carries a productIdx to leave room
 * for future multi-product briefs without a shape change.
 */
const PRODUCT_IDX = 0;

export function tileKey(
  languageCode: string,
  surface: LiveSurface,
  productIdx: number = PRODUCT_IDX,
): string {
  return `${languageCode}::${surface}::${productIdx}`;
}

/**
 * Canonicalize the fields that actually affect a rendered tile — anything
 * else (like languageCodes list, badges array ordering when unused) is
 * excluded so identical *tile-relevant* input yields identical hashes.
 */
function canonicalHash(brief: LiveBrief, languageCode: string): string {
  const canon = {
    productName: brief.productName,
    price: brief.price,
    businessName: brief.businessName ?? "",
    brandColor: brief.brandColor,
    languageCode,
    surface: brief.surface,
    badges: [...(brief.badges ?? [])].sort((a, b) =>
      a.text === b.text ? a.style.localeCompare(b.style) : a.text.localeCompare(b.text),
    ),
  };
  return JSON.stringify(canon);
}

function escXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function surfaceDims(surface: LiveSurface): { w: number; h: number } {
  if (surface === "whatsapp") return { w: 1080, h: 1920 };
  if (surface === "square") return { w: 1080, h: 1080 };
  return { w: 1240, h: 1754 };
}

function fontFamilyFor(languageCode: string): string {
  switch (languageCode) {
    case "hi":
      return "Noto Sans Devanagari";
    case "ta":
      return "Noto Sans Tamil";
    case "bn":
      return "Noto Sans Bengali";
    case "te":
      return "Noto Sans Telugu";
    case "kn":
      return "Noto Sans Kannada";
    case "ml":
      return "Noto Sans Malayalam";
    case "pa":
      return "Noto Sans Gurmukhi";
    case "gu":
      return "Noto Sans Gujarati";
    default:
      return "Plus Jakarta Sans";
  }
}

/**
 * Build a client-side SVG data URL that mirrors the server's foreignObject
 * fallback (see src/app/api/generate/route.ts). The point is a <10ms
 * "instant preview" for a tile while the real gen is on the wire.
 *
 * We keep the shape but simplify the font @import so a base64 SVG is safe
 * to inline as an <img src>. The tangerine gradient + Noto Sans family
 * make it visually consistent with the server output.
 */
export function svgFallbackDataUrl(tile: LiveTile): string {
  const b = tile.brief;
  const dim = surfaceDims(tile.surface);
  const brand = b.brandColor || "#F26B1F";
  const lang = findLanguage(tile.languageCode);
  const fontFamily = fontFamilyFor(lang?.code ?? tile.languageCode);

  const product = escXml(b.productName || "");
  const price = escXml(b.price || "");
  const business = b.businessName ? escXml(b.businessName) : "";

  const scale = (base: number, chars: number, softLimit: number): number =>
    chars <= softLimit ? base : base * Math.max(0.35, softLimit / chars);
  const prodFont = scale(
    Math.min(dim.w * 0.09, 140),
    (b.productName || "").length || 1,
    16,
  );
  const priceFont = scale(
    Math.min(dim.w * 0.11, 176),
    (b.price || "").length || 1,
    10,
  );

  const svg =
    `<svg xmlns="http://www.w3.org/2000/svg" width="${dim.w}" height="${dim.h}" viewBox="0 0 ${dim.w} ${dim.h}">` +
    `<defs>` +
    `<linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${brand}"/>` +
    `<stop offset="1" stop-color="#1f1409"/>` +
    `</linearGradient>` +
    `</defs>` +
    `<rect width="100%" height="100%" fill="url(#bg)"/>` +
    `<rect x="60" y="60" width="${dim.w - 120}" height="${dim.h - 120}" fill="none" stroke="#fff" stroke-opacity="0.18" stroke-width="4" rx="24"/>` +
    `<foreignObject x="0" y="0" width="${dim.w}" height="${dim.h}">` +
    `<div xmlns="http://www.w3.org/1999/xhtml" style="width:${dim.w}px;height:${dim.h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${dim.w * 0.08}px;box-sizing:border-box;font-family:'${fontFamily}',sans-serif;">` +
    `<div style="font-size:${prodFont}px;font-weight:800;color:#fff;text-align:center;line-height:1.15;overflow-wrap:break-word;word-break:break-word;max-width:100%;">${product}</div>` +
    `<div style="margin-top:${dim.h * 0.05}px;background:#fff;border-radius:${dim.w * 0.03}px;padding:${dim.w * 0.04}px ${dim.w * 0.06}px;max-width:80%;">` +
    `<div style="font-size:${priceFont}px;font-weight:700;color:${brand};text-align:center;line-height:1.1;white-space:nowrap;">${price}</div>` +
    `</div>` +
    (business
      ? `<div style="margin-top:${dim.h * 0.06}px;font-weight:600;color:#fff;opacity:0.85;letter-spacing:2px;font-size:${Math.min(dim.w * 0.035, 44)}px;text-align:center;text-transform:uppercase;">${business}</div>`
      : "") +
    `<div style="margin-top:${dim.h * 0.04}px;font-style:italic;color:#fff;opacity:0.55;font-size:${Math.min(dim.w * 0.022, 28)}px;">BazaarBoard · live preview</div>` +
    `</div>` +
    `</foreignObject>` +
    `</svg>`;

  const base64 =
    typeof btoa === "function"
      ? btoa(unescape(encodeURIComponent(svg)))
      : Buffer.from(svg, "utf-8").toString("base64");
  return `data:image/svg+xml;base64,${base64}`;
}

// ---- renderer -----------------------------------------------------------

interface InFlight {
  controller: AbortController;
  hash: string;
}

interface QueuedTask {
  key: string;
  languageCode: string;
  surface: LiveSurface;
  brief: LiveBrief;
  hash: string;
}

interface GenerateRoutePayload {
  productName: string;
  price: string;
  businessName?: string;
  languageCode: string;
  surfaceKind: LiveSurface;
  brandColor: string;
}

interface ApiOk {
  image: string;
  mimeType: string;
  latencyMs?: number;
}

interface ApiErr {
  error: string;
}

export function createLiveRenderer(opts?: RendererOpts): LiveRenderer {
  const debounceMs = opts?.debounceMs ?? 300;
  const concurrency = Math.max(1, opts?.concurrency ?? 4);

  const listeners = new Set<(t: LiveTile) => void>();
  const tiles = new Map<string, LiveTile>();
  const inFlight = new Map<string, InFlight>();
  const lastRenderedHash = new Map<string, string>();
  const debounceTimers = new Map<string, ReturnType<typeof setTimeout>>();
  const queue: QueuedTask[] = [];
  let activeWorkers = 0;

  function emit(tile: LiveTile): void {
    tiles.set(tile.key, tile);
    // Snapshot listeners so a callback that unsubscribes mid-emit is safe.
    for (const cb of Array.from(listeners)) {
      try {
        cb(tile);
      } catch {
        // Never let a bad listener kill the pipeline.
      }
    }
  }

  function makeTile(
    languageCode: string,
    surface: LiveSurface,
    brief: LiveBrief,
    status: LiveStatus,
    extras: Partial<LiveTile> = {},
  ): LiveTile {
    return {
      key: tileKey(languageCode, surface),
      languageCode,
      surface,
      status,
      brief,
      ...extras,
    };
  }

  async function runTask(task: QueuedTask): Promise<void> {
    const { key, languageCode, surface, brief, hash } = task;
    const controller = new AbortController();
    inFlight.set(key, { controller, hash });

    // Streaming state — the real fetch has started. UI can start
    // cross-fading the fallback out at this point.
    emit(makeTile(languageCode, surface, brief, "streaming", {
      image: undefined,
      mimeType: undefined,
    }));

    const started = Date.now();
    const payload: GenerateRoutePayload = {
      productName: brief.productName,
      price: brief.price,
      businessName: brief.businessName,
      languageCode,
      surfaceKind: surface,
      brandColor: brief.brandColor,
    };

    try {
      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };
      // Reuse the same BYOK header contract as generate() without importing
      // it (avoids a circular pull; the renderer is a peer, not a caller).
      if (typeof window !== "undefined") {
        try {
          const byok = window.sessionStorage.getItem(
            "bazaarboard.byokGeminiKey",
          );
          if (byok) headers["X-Gemini-Key"] = byok;
        } catch {
          // sessionStorage unavailable — ignore.
        }
      }

      const res = await fetch("/api/generate", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      if (!res.ok) {
        const errBody = (await res.json().catch(() => ({}))) as Partial<ApiErr>;
        emit(makeTile(languageCode, surface, brief, "error", {
          error: errBody.error ?? `HTTP ${res.status}`,
          latencyMs: Date.now() - started,
        }));
        return;
      }

      const data = (await res.json()) as ApiOk;
      // If the in-flight entry has been replaced (fresh brief cancelled us
      // but the fetch still returned), drop the result — the newer render
      // is authoritative.
      const currentEntry = inFlight.get(key);
      if (!currentEntry || currentEntry.controller !== controller) return;

      lastRenderedHash.set(key, hash);
      emit(makeTile(languageCode, surface, brief, "done", {
        image: data.image,
        mimeType: data.mimeType ?? "image/png",
        latencyMs: data.latencyMs ?? Date.now() - started,
      }));
    } catch (err) {
      if (err instanceof Error && err.name === "AbortError") {
        // Cancellation is expected on brief-changed / cancelAll — leave the
        // tile in its previous emitted state; a fresh task will re-emit.
        return;
      }
      const msg = err instanceof Error ? err.message : "network error";
      emit(makeTile(languageCode, surface, brief, "error", {
        error: msg,
        latencyMs: Date.now() - started,
      }));
    } finally {
      const cur = inFlight.get(key);
      if (cur && cur.controller === controller) {
        inFlight.delete(key);
      }
    }
  }

  function pump(): void {
    while (activeWorkers < concurrency && queue.length > 0) {
      const task = queue.shift();
      if (!task) break;
      activeWorkers++;
      void runTask(task).finally(() => {
        activeWorkers--;
        pump();
      });
    }
  }

  function enqueue(task: QueuedTask): void {
    queue.push(task);
    pump();
  }

  function scheduleTile(
    languageCode: string,
    surface: LiveSurface,
    brief: LiveBrief,
    hash: string,
  ): void {
    const key = tileKey(languageCode, surface);

    // Cancel any in-flight gen for this tile — its input is stale.
    const cur = inFlight.get(key);
    if (cur) {
      cur.controller.abort();
      inFlight.delete(key);
    }
    // Drop the pending debounce timer for this tile, if any.
    const timer = debounceTimers.get(key);
    if (timer) {
      clearTimeout(timer);
      debounceTimers.delete(key);
    }
    // Also drop any queued (not-yet-started) task for this tile — the
    // fresh one supersedes it. Match on the key alone; we're about to
    // enqueue a replacement below.
    for (let i = queue.length - 1; i >= 0; i--) {
      if (queue[i].key === key) queue.splice(i, 1);
    }

    // Show the fallback immediately — the whole point of this renderer.
    const fallbackTile = makeTile(languageCode, surface, brief, "fallback");
    emit(makeTile(languageCode, surface, brief, "fallback", {
      image: svgFallbackDataUrl(fallbackTile).split(",")[1],
      mimeType: "image/svg+xml",
    }));

    const t = setTimeout(() => {
      debounceTimers.delete(key);
      // Re-check dedupe at fire-time — a same-hash brief may have arrived
      // during the debounce window and been suppressed elsewhere.
      if (lastRenderedHash.get(key) === hash && !inFlight.has(key)) {
        // Same hash as the last successfully-rendered result → keep the
        // fallback we just emitted, no need to re-fetch.
        return;
      }
      enqueue({ key, languageCode, surface, brief, hash });
    }, debounceMs);
    debounceTimers.set(key, t);
  }

  function setBrief(brief: LiveBrief): void {
    const activeKeys = new Set<string>();
    for (const languageCode of brief.languageCodes) {
      const key = tileKey(languageCode, brief.surface);
      activeKeys.add(key);
      const hash = canonicalHash(brief, languageCode);

      // Dedupe — if this tile's *tile-relevant* inputs are unchanged and
      // we already have a done render, do nothing.
      if (lastRenderedHash.get(key) === hash) {
        const existing = tiles.get(key);
        if (existing && existing.status === "done") continue;
        // If nothing has been rendered yet under this hash, fall through.
      }

      scheduleTile(languageCode, brief.surface, brief, hash);
    }

    // Any tile no longer in the active set should have its in-flight work
    // cancelled — nobody's asking for it anymore.
    for (const [key, entry] of inFlight) {
      if (!activeKeys.has(key)) {
        entry.controller.abort();
        inFlight.delete(key);
      }
    }
    for (const [key, timer] of debounceTimers) {
      if (!activeKeys.has(key)) {
        clearTimeout(timer);
        debounceTimers.delete(key);
      }
    }
    for (let i = queue.length - 1; i >= 0; i--) {
      if (!activeKeys.has(queue[i].key)) queue.splice(i, 1);
    }
  }

  function cancelAll(): void {
    for (const entry of inFlight.values()) entry.controller.abort();
    inFlight.clear();
    for (const t of debounceTimers.values()) clearTimeout(t);
    debounceTimers.clear();
    queue.length = 0;
  }

  function onTileUpdate(cb: (tile: LiveTile) => void): () => void {
    listeners.add(cb);
    return () => {
      listeners.delete(cb);
    };
  }

  function getTiles(): LiveTile[] {
    return Array.from(tiles.values());
  }

  return { setBrief, cancelAll, onTileUpdate, getTiles };
}

"use client";

import JSZip from "jszip";

export interface GenerateInput {
  productName: string;
  price: string;
  businessName?: string;
  languageCode: string;
  surfaceKind: "poster" | "whatsapp" | "square";
  brandColor?: string;
}

export interface GenerateResult {
  image: string; // base64
  mimeType: string;
  model: string;
  latencyMs: number;
  promptTokens?: number;
  fallback?: boolean;
  fallbackReason?: string;
}

export interface GenerateError {
  error: string;
  detail?: string;
}

/**
 * Read the user's BYOK Gemini key from sessionStorage. Never persists to
 * localStorage or disk — cleared when the tab closes. Only sent on the
 * X-Gemini-Key header to our own /api/generate endpoint.
 */
export function getByokKey(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.sessionStorage.getItem("bazaarboard.byokGeminiKey");
  } catch {
    return null;
  }
}

export function setByokKey(key: string | null): void {
  if (typeof window === "undefined") return;
  try {
    if (key && key.trim()) {
      window.sessionStorage.setItem("bazaarboard.byokGeminiKey", key.trim());
    } else {
      window.sessionStorage.removeItem("bazaarboard.byokGeminiKey");
    }
  } catch {
    // sessionStorage unavailable (private mode) — silently no-op.
  }
}

export async function generate(
  input: GenerateInput,
  signal?: AbortSignal,
): Promise<GenerateResult | GenerateError> {
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const byok = getByokKey();
    if (byok) headers["X-Gemini-Key"] = byok;
    const res = await fetch("/api/generate", {
      method: "POST",
      headers,
      body: JSON.stringify(input),
      signal,
    });
    if (!res.ok) {
      const errBody = (await res.json().catch(() => ({}))) as GenerateError;
      return { error: errBody.error ?? `HTTP ${res.status}` };
    }
    return (await res.json()) as GenerateResult;
  } catch (err) {
    if (err instanceof Error && err.name === "AbortError") {
      return { error: "cancelled" };
    }
    return { error: err instanceof Error ? err.message : "network error" };
  }
}

export function isError(v: unknown): v is GenerateError {
  return typeof v === "object" && v !== null && "error" in v;
}

/**
 * Download a single base64 image as a file. Uses a Blob + object URL
 * anchor click; falls back to a plain data-URL anchor if the blob path
 * fails (some browsers block programmatic clicks on object URLs).
 *
 * Returns true when a download appears to have been triggered, false if
 * every strategy failed — callers can surface a "right-click and Save
 * Image" toast so the user still has a recovery path.
 */
export function downloadImage(
  image: string,
  mimeType: string,
  filename: string,
): boolean {
  if (typeof document === "undefined") return false;

  const clickAnchor = (href: string): boolean => {
    try {
      const a = document.createElement("a");
      a.href = href;
      a.download = filename;
      a.rel = "noopener";
      // Some Safari builds require the anchor to be in the DOM before
      // the click is honored.
      a.style.display = "none";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      return true;
    } catch {
      return false;
    }
  };

  // Primary path — base64 → Blob → object URL. Works well for binary
  // PNG/JPEG. SVG base64 also decodes fine, but some browsers refuse to
  // download blobs of certain MIME types; the fallback below handles it.
  try {
    const bin = atob(image);
    const bytes = new Uint8Array(bin.length);
    for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i);
    const blob = new Blob([bytes], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const ok = clickAnchor(url);
    // Release the object URL on the next tick so the download has time
    // to start reading it.
    setTimeout(() => URL.revokeObjectURL(url), 4000);
    if (ok) return true;
  } catch {
    // fall through to the data-URL fallback
  }

  // Fallback — plain data URL anchor. Works everywhere the primary path
  // fails (e.g. sandboxed iframes without blob: support).
  try {
    const dataUrl = `data:${mimeType};base64,${image}`;
    return clickAnchor(dataUrl);
  } catch {
    return false;
  }
}

/**
 * Bundle a set of generated images into a ZIP file, name them
 * sensibly, and trigger a download.
 */
export async function downloadZip(
  files: Array<{ filename: string; image: string; mimeType: string }>,
  zipName: string,
): Promise<void> {
  const zip = new JSZip();
  for (const f of files) {
    // JSZip accepts base64 directly with the base64 flag.
    zip.file(f.filename, f.image, { base64: true });
  }
  const blob = await zip.generateAsync({ type: "blob" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = zipName;
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * Run N generate() calls with a bounded concurrency limit. Yields
 * result callbacks as each item completes so the UI can update
 * incrementally. The order of yields is by completion time, NOT input
 * order — the caller carries the input index in the item to reassemble.
 */
export async function batchGenerate<T>(
  items: Array<T & { input: GenerateInput }>,
  concurrency: number,
  onResult: (item: T & { input: GenerateInput }, result: GenerateResult | GenerateError) => void,
  signal?: AbortSignal,
): Promise<void> {
  let cursor = 0;
  const workers: Promise<void>[] = [];

  const runOne = async (): Promise<void> => {
    while (cursor < items.length) {
      const idx = cursor++;
      const item = items[idx];
      if (signal?.aborted) return;
      const result = await generate(item.input, signal);
      onResult(item, result);
    }
  };

  for (let i = 0; i < Math.min(concurrency, items.length); i++) {
    workers.push(runOne());
  }
  await Promise.all(workers);
}

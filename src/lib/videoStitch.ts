"use client";

/**
 * Client-side slideshow-video export. Draws a series of base64 posters onto
 * a canvas with fade-in/hold/fade-out, records the canvas.captureStream()
 * with an optional narration audio track via MediaRecorder, and hands back
 * a Blob the caller can download.
 *
 * NO npm deps — Web APIs only. Preferred output is MP4 (H.264/AAC) when
 * MediaRecorder supports it; otherwise falls back to WebM (VP9/Opus, then
 * plain WebM). Feature-detect with canStitch() before showing UI.
 */

const BAZAAR_CREAM = "#F5EFE3";
const BAZAAR_INK = "#1F1B16";

export interface StitchImage {
  image: string; // base64 (no data-URL prefix)
  mimeType: string;
  label?: string; // e.g. "Hindi · हिन्दी"
}

export interface StitchInput {
  images: StitchImage[];
  perImageSeconds?: number; // default 0.8
  fadeMs?: number; // default 200 (cross-fade + fade-in/out endcaps)
  width?: number; // default 1080
  height?: number; // default 1080
  narrationAudio?: ArrayBuffer; // optional WAV/MP3 buffer
  onProgress?: (frac: number) => void;
}

export interface StitchResult {
  blob: Blob;
  mimeType: string;
  durationMs: number;
}

/** Preferred → fallback mime types for the MediaRecorder. */
const MIME_CANDIDATES: readonly string[] = [
  "video/mp4;codecs=avc1.42E01E,mp4a.40.2",
  "video/mp4;codecs=h264,mp4a",
  "video/mp4;codecs=avc1",
  "video/mp4",
  "video/webm;codecs=vp9,opus",
  "video/webm;codecs=vp8,opus",
  "video/webm",
];

function pickMimeType(): string | null {
  if (typeof MediaRecorder === "undefined") return null;
  for (const m of MIME_CANDIDATES) {
    try {
      if (MediaRecorder.isTypeSupported(m)) return m;
    } catch {
      // Some browsers throw on unknown mimes; skip.
    }
  }
  // Last resort — let the browser pick.
  return "";
}

/**
 * Feature-detect: returns true only when MediaRecorder and
 * HTMLCanvasElement.prototype.captureStream are both available. jsdom
 * lacks both by default, so unit tests can stub them in.
 */
export function canStitch(): boolean {
  if (typeof window === "undefined") return false;
  if (typeof MediaRecorder === "undefined") return false;
  if (typeof HTMLCanvasElement === "undefined") return false;
  const proto = HTMLCanvasElement.prototype as {
    captureStream?: unknown;
  };
  if (typeof proto.captureStream !== "function") return false;
  return true;
}

/**
 * Decode a base64 poster into an ImageBitmap. Uses fetch on a data URL so
 * we get a Blob → createImageBitmap path that works for PNG, JPEG, SVG,
 * and WebP without hand-rolling decoders.
 */
async function decodePoster(img: StitchImage): Promise<ImageBitmap> {
  const dataUrl = `data:${img.mimeType};base64,${img.image}`;
  const res = await fetch(dataUrl);
  const blob = await res.blob();
  return await createImageBitmap(blob);
}

/**
 * Draw an image with letterboxing (aspect-fit) onto the canvas at the
 * given opacity. Background is painted first so fade-outs reveal the
 * BazaarBoard cream instead of black.
 */
function drawFitted(
  ctx: CanvasRenderingContext2D,
  bmp: ImageBitmap,
  w: number,
  h: number,
  opacity: number,
): void {
  ctx.save();
  ctx.fillStyle = BAZAAR_CREAM;
  ctx.fillRect(0, 0, w, h);
  const scale = Math.min(w / bmp.width, h / bmp.height);
  const drawW = bmp.width * scale;
  const drawH = bmp.height * scale;
  const dx = (w - drawW) / 2;
  const dy = (h - drawH) / 2;
  ctx.globalAlpha = Math.max(0, Math.min(1, opacity));
  ctx.drawImage(bmp, dx, dy, drawW, drawH);
  ctx.restore();
}

/** Overlay wordmark + label on the current frame. */
function drawOverlay(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  label: string | undefined,
): void {
  ctx.save();
  // Semi-transparent gradient for readability at the bottom edge.
  const grad = ctx.createLinearGradient(0, h - 120, 0, h);
  grad.addColorStop(0, "rgba(31,27,22,0)");
  grad.addColorStop(1, "rgba(31,27,22,0.35)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, h - 120, w, 120);

  // Wordmark bottom-right.
  ctx.fillStyle = BAZAAR_INK;
  ctx.textBaseline = "alphabetic";
  ctx.textAlign = "right";
  ctx.font =
    "600 26px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
  ctx.fillText("BazaarBoard", w - 32, h - 32);

  // Language label bottom-left, if present.
  if (label) {
    ctx.textAlign = "left";
    ctx.font =
      "500 24px system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif";
    ctx.fillText(label, 32, h - 32);
  }
  ctx.restore();
}

/**
 * Build the audio side of the pipeline. If narrationAudio is present, we
 * decode it into an AudioBuffer and route it through a
 * MediaStreamAudioDestinationNode. Callers can also pass null → silent.
 * Returns { destination, audioCtx, start(t0) } so the video timeline can
 * kick off audio at the exact recorder-start moment.
 */
async function buildAudioSource(
  narrationAudio: ArrayBuffer | undefined,
): Promise<{
  audioCtx: AudioContext | null;
  audioTrack: MediaStreamTrack | null;
  play: (whenSec: number) => void;
  cleanup: () => void;
}> {
  if (!narrationAudio) {
    return {
      audioCtx: null,
      audioTrack: null,
      play: () => {},
      cleanup: () => {},
    };
  }
  const CtxCtor: typeof AudioContext | undefined =
    typeof window !== "undefined"
      ? (window.AudioContext ??
        (window as unknown as { webkitAudioContext?: typeof AudioContext })
          .webkitAudioContext)
      : undefined;
  if (!CtxCtor) {
    return {
      audioCtx: null,
      audioTrack: null,
      play: () => {},
      cleanup: () => {},
    };
  }
  const audioCtx = new CtxCtor();
  // decodeAudioData on some browsers mutates the input buffer, so hand
  // over a copy.
  const copy = narrationAudio.slice(0);
  const buffer = await audioCtx.decodeAudioData(copy);
  const dest = audioCtx.createMediaStreamDestination();
  let source: AudioBufferSourceNode | null = null;
  return {
    audioCtx,
    audioTrack: dest.stream.getAudioTracks()[0] ?? null,
    play: (whenSec: number) => {
      source = audioCtx.createBufferSource();
      source.buffer = buffer;
      source.connect(dest);
      source.start(whenSec);
    },
    cleanup: () => {
      try {
        source?.stop();
      } catch {
        // already stopped
      }
      audioCtx.close().catch(() => {});
    },
  };
}

/**
 * Stitch the given images into a slideshow video. Resolves once the
 * MediaRecorder has flushed its final chunk.
 */
export async function stitchSlideshow(
  input: StitchInput,
): Promise<StitchResult> {
  if (!input.images || input.images.length === 0) {
    throw new Error("stitchSlideshow: images array is empty");
  }
  if (!canStitch()) {
    throw new Error("stitchSlideshow: browser lacks MediaRecorder support");
  }

  const perImageSec = input.perImageSeconds ?? 0.8;
  const fadeMs = input.fadeMs ?? 200;
  const width = input.width ?? 1080;
  const height = input.height ?? 1080;
  const onProgress = input.onProgress ?? (() => {});

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("stitchSlideshow: 2d canvas context unavailable");

  // Decode all posters upfront — small (8) and lets us hit steady 30fps.
  const bitmaps: ImageBitmap[] = [];
  for (const img of input.images) {
    bitmaps.push(await decodePoster(img));
  }

  const fps = 30;
  const stream = canvas.captureStream(fps);
  const audio = await buildAudioSource(input.narrationAudio);
  if (audio.audioTrack) stream.addTrack(audio.audioTrack);

  const mimeType = pickMimeType();
  const recorderOpts: MediaRecorderOptions = {};
  if (mimeType) recorderOpts.mimeType = mimeType;

  let recorder: MediaRecorder;
  try {
    recorder = new MediaRecorder(stream, recorderOpts);
  } catch {
    // Some engines reject unknown mime; retry with defaults.
    recorder = new MediaRecorder(stream);
  }

  const chunks: Blob[] = [];
  recorder.ondataavailable = (ev: BlobEvent) => {
    if (ev.data && ev.data.size > 0) chunks.push(ev.data);
  };

  const stopPromise = new Promise<void>((resolve) => {
    recorder.onstop = () => resolve();
  });

  recorder.start();
  // Kick audio slightly after start so its clock aligns with the first
  // frame the recorder captures.
  if (audio.audioCtx) audio.play(audio.audioCtx.currentTime + 0.02);

  const t0 = performance.now();
  const perImageMs = perImageSec * 1000;
  const totalMs = perImageMs * input.images.length;
  const frameInterval = 1000 / fps;

  // Animation loop — walks a "time cursor" and draws the composited
  // frame for wall-clock t. cross-fade math: at the tail of image i
  // (last fadeMs), start blending image i+1 in.
  await new Promise<void>((resolve) => {
    const step = (): void => {
      const now = performance.now();
      const t = now - t0;
      if (t >= totalMs) {
        // Draw the last frame at full opacity to make sure the encoder
        // catches the tail state.
        const lastIdx = input.images.length - 1;
        drawFitted(ctx, bitmaps[lastIdx], width, height, 1);
        drawOverlay(ctx, width, height, input.images[lastIdx].label);
        onProgress(1);
        resolve();
        return;
      }

      const idx = Math.min(
        Math.floor(t / perImageMs),
        input.images.length - 1,
      );
      const localT = t - idx * perImageMs;

      // Base image at full opacity.
      drawFitted(ctx, bitmaps[idx], width, height, 1);

      // Cross-fade tail into the next image, if any.
      const tailStart = perImageMs - fadeMs;
      if (localT >= tailStart && idx < input.images.length - 1) {
        const alpha = Math.min(1, (localT - tailStart) / fadeMs);
        drawFitted(ctx, bitmaps[idx + 1], width, height, alpha);
        drawOverlay(ctx, width, height, input.images[idx + 1].label);
      } else if (localT < fadeMs && idx === 0) {
        // Endcap fade-in: darken the very first frame briefly.
        ctx.save();
        ctx.fillStyle = BAZAAR_CREAM;
        ctx.globalAlpha = 1 - localT / fadeMs;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
        drawOverlay(ctx, width, height, input.images[idx].label);
      } else {
        drawOverlay(ctx, width, height, input.images[idx].label);
      }

      onProgress(Math.min(0.99, t / totalMs));
      // requestAnimationFrame isn't available in some test envs, so we
      // fall back to setTimeout at the target frame interval.
      if (typeof requestAnimationFrame === "function") {
        requestAnimationFrame(step);
      } else {
        setTimeout(step, frameInterval);
      }
    };
    step();
  });

  recorder.stop();
  await stopPromise;
  audio.cleanup();
  stream.getTracks().forEach((tr) => tr.stop());

  const outType =
    (recorder.mimeType && recorder.mimeType.length > 0
      ? recorder.mimeType
      : mimeType) || "video/webm";
  const blob = new Blob(chunks, { type: outType });
  onProgress(1);
  return {
    blob,
    mimeType: outType,
    durationMs: Math.round(totalMs),
  };
}

/**
 * Trigger a browser download of the stitched blob. Filename defaults to
 * `bazaarboard-<epoch>.<ext>` inferred from the recorded mime type.
 */
export function downloadStitched(
  result: StitchResult,
  filename?: string,
): void {
  if (typeof document === "undefined") return;
  const ext = result.mimeType.includes("mp4") ? "mp4" : "webm";
  const name = filename ?? `bazaarboard-${Date.now()}.${ext}`;
  const url = URL.createObjectURL(result.blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.rel = "noopener";
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

"use client";

/**
 * /design — the dead-simplest voice-first surface.
 *
 * Layout:
 *   Desktop: two halves. LEFT = mic + one-line transcript + one-line hint.
 *            RIGHT = poster.
 *   Mobile:  poster on top, mic-card on bottom.
 *
 * On mount: request mic permission → auto-start listening. As the user
 * speaks, we debounce 800ms after silence, POST the transcript +
 * currentBrief to /api/chat (existing endpoint with 13 tool declarations),
 * apply any returned tool_calls to state via a compact inline reducer, and
 * re-run generate() for the current language + surface. AbortController
 * cancels in-flight gens when new state supersedes.
 *
 * No chat log. No layer panel. No tool-call cards. No settings drawer.
 * Just: speak → poster appears.
 */

import { useCallback, useEffect, useReducer, useRef, useState } from "react";
import { generate } from "@/lib/generate";
import { LANGUAGES } from "@/lib/languages";
import {
  BCP47_BY_CODE,
  createSpeechSession,
  isSpeechSupported,
  type SpeechSession,
} from "@/lib/speech";
import { detectLanguage } from "@/lib/detectLanguage";

// ------------ Types ------------

type SurfaceKind = "poster" | "whatsapp" | "square";
type SlotField = "productName" | "price" | "businessName" | "brandColor";

interface Brief {
  productName: string;
  price: string;
  businessName: string;
  brandColor: string;
  languageCode: string;
  surface: SurfaceKind;
}

interface ToolCall {
  id: string;
  name: string;
  args: Record<string, unknown>;
}

type Action =
  | { type: "set_slot"; field: SlotField; value: string }
  | { type: "set_language"; code: string }
  | { type: "set_surface"; surface: SurfaceKind }
  | { type: "reset" };

const INITIAL_BRIEF: Brief = {
  productName: "",
  price: "",
  businessName: "",
  brandColor: "#F26B1F",
  languageCode: "hi",
  surface: "square",
};

function reducer(brief: Brief, action: Action): Brief {
  switch (action.type) {
    case "set_slot":
      return { ...brief, [action.field]: action.value };
    case "set_language":
      return { ...brief, languageCode: action.code };
    case "set_surface":
      return { ...brief, surface: action.surface };
    case "reset":
      return INITIAL_BRIEF;
    default:
      return brief;
  }
}

// Apply a tool call from /api/chat to the reducer.
function applyToolCall(dispatch: React.Dispatch<Action>, tc: ToolCall): void {
  switch (tc.name) {
    case "set_slot": {
      const field = tc.args.field as SlotField | undefined;
      const value = tc.args.value as string | undefined;
      if (field && typeof value === "string") {
        dispatch({ type: "set_slot", field, value });
      }
      return;
    }
    case "set_language": {
      const code = (tc.args.code ?? (tc.args.codes as string[] | undefined)?.[0]) as string | undefined;
      if (typeof code === "string") dispatch({ type: "set_language", code });
      return;
    }
    case "set_surface": {
      const kind = tc.args.kind as SurfaceKind | undefined;
      if (kind === "poster" || kind === "whatsapp" || kind === "square") {
        dispatch({ type: "set_surface", surface: kind });
      }
      return;
    }
    default:
      // Silently ignore other tool calls (badges, exports, undo). This
      // page is deliberately minimal.
      return;
  }
}

// ------------ Hint ------------

function hint(brief: Brief, listening: boolean): string {
  if (!listening && !brief.productName) return "Tap the mic to start.";
  if (!brief.productName) return "Say what you're selling…";
  if (!brief.price) return "How much does it cost?";
  return "Anything else? Or long-press to save.";
}

// ------------ Page ------------

type MicState = "idle" | "listening" | "denied" | "unsupported";
type PosterState = "empty" | "fallback" | "streaming" | "done" | "error";

export default function DesignPage(): React.ReactElement {
  const [brief, dispatch] = useReducer(reducer, INITIAL_BRIEF);
  const [mic, setMic] = useState<MicState>("idle");
  const [transcript, setTranscript] = useState("");
  const [interim, setInterim] = useState("");
  const [posterState, setPosterState] = useState<PosterState>("empty");
  const [posterImage, setPosterImage] = useState<string | null>(null);
  const [posterMime, setPosterMime] = useState<string>("image/png");

  const sessionRef = useRef<SpeechSession | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const extractControllerRef = useRef<AbortController | null>(null);
  const generateControllerRef = useRef<AbortController | null>(null);
  const briefRef = useRef(brief);
  const lastRenderedBriefKeyRef = useRef<string>("");
  briefRef.current = brief;

  // Feature-detect once.
  useEffect(() => {
    if (!isSpeechSupported()) setMic("unsupported");
  }, []);

  const startListening = useCallback(() => {
    if (mic === "unsupported") return;
    // Ask for mic permission (SpeechRecognition triggers it too, but this
    // gives us a friendlier permission-denied signal).
    if (typeof navigator !== "undefined" && navigator.mediaDevices?.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then((stream) => {
          // Release the tracks — SpeechRecognition owns audio, this was
          // just for the permission prompt.
          stream.getTracks().forEach((t) => t.stop());
          launchRecognition();
        })
        .catch(() => setMic("denied"));
    } else {
      launchRecognition();
    }

    function launchRecognition(): void {
      const session = createSpeechSession(briefRef.current.languageCode);
      sessionRef.current = session;
      session.onResult((text, isFinal) => {
        if (isFinal) {
          setTranscript((prev) => (prev ? prev + " " + text : text));
          setInterim("");
        } else {
          setInterim(text);
        }
        scheduleExtract(text);
      });
      session.onEnd(() => {
        // Auto-restart continuous listening in Chrome (it stops after each
        // final utterance). Do it unless the user explicitly stopped.
        if (sessionRef.current === session && mic !== "denied") {
          try {
            session.start();
          } catch {
            /* ignore */
          }
        }
      });
      session.onError((err) => {
        if (err === "not-allowed" || err === "service-not-allowed") {
          setMic("denied");
          sessionRef.current = null;
        }
      });
      session.start();
      setMic("listening");
    }
  }, [mic]);

  const stopListening = useCallback(() => {
    sessionRef.current?.stop();
    sessionRef.current = null;
    setMic("idle");
  }, []);

  // Auto-start after mount.
  useEffect(() => {
    if (mic === "idle") {
      // Small delay so the page paints before the permission prompt.
      const t = setTimeout(() => startListening(), 400);
      return () => clearTimeout(t);
    }
    return undefined;
  }, [mic, startListening]);

  // Debounced /api/chat call to extract slot updates from transcript.
  const scheduleExtract = useCallback((latest: string): void => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const running = (transcript + " " + latest).trim();
      if (!running || running.length < 3) return;
      extractControllerRef.current?.abort();
      const controller = new AbortController();
      extractControllerRef.current = controller;
      fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        signal: controller.signal,
        body: JSON.stringify({
          messages: [{ role: "user", content: running }],
          languageHint: briefRef.current.languageCode,
        }),
      })
        .then((r) => r.json())
        .then((body) => {
          if (controller.signal.aborted) return;
          // /api/chat may return { kind: "message" | "tool_calls" | "finalize" }
          if (body?.kind === "tool_calls" && Array.isArray(body.toolCalls)) {
            for (const tc of body.toolCalls) applyToolCall(dispatch, tc);
          } else if (body?.kind === "finalize" && body.order) {
            const o = body.order;
            if (o.productName) dispatch({ type: "set_slot", field: "productName", value: o.productName });
            if (o.price) dispatch({ type: "set_slot", field: "price", value: o.price });
            if (o.businessName) dispatch({ type: "set_slot", field: "businessName", value: o.businessName });
            if (o.brandColor) dispatch({ type: "set_slot", field: "brandColor", value: o.brandColor });
            if (o.languageCode) dispatch({ type: "set_language", code: o.languageCode });
          }
          // Auto-detect language from the transcript's dominant script if
          // the model didn't set it.
          const detected = detectLanguage(running);
          if (detected && detected !== briefRef.current.languageCode) {
            dispatch({ type: "set_language", code: detected });
          }
        })
        .catch(() => {
          /* silent — streaming loop keeps going */
        });
    }, 800);
  }, [transcript]);

  // Kick off a poster render whenever the brief changes meaningfully.
  useEffect(() => {
    const key = JSON.stringify({
      p: brief.productName,
      pr: brief.price,
      b: brief.businessName,
      c: brief.brandColor,
      l: brief.languageCode,
      s: brief.surface,
    });
    if (!brief.productName.trim()) {
      lastRenderedBriefKeyRef.current = "";
      return;
    }
    if (lastRenderedBriefKeyRef.current === key) return;
    lastRenderedBriefKeyRef.current = key;

    // Cancel any prior in-flight gen.
    generateControllerRef.current?.abort();
    const controller = new AbortController();
    generateControllerRef.current = controller;

    // Show SVG fallback instantly.
    setPosterState("fallback");
    setPosterImage(svgFallback(brief));
    setPosterMime("image/svg+xml");

    // Fire the real gen. Give the SVG a moment to paint first.
    setPosterState("streaming");
    generate(
      {
        productName: brief.productName,
        price: brief.price || "—",
        businessName: brief.businessName || undefined,
        languageCode: brief.languageCode,
        surfaceKind: brief.surface,
        brandColor: brief.brandColor,
      },
      controller.signal,
    )
      .then((r) => {
        if (controller.signal.aborted) return;
        if ("error" in r) {
          setPosterState("error");
          return;
        }
        setPosterState("done");
        setPosterImage(`data:${r.mimeType};base64,${r.image}`);
        setPosterMime(r.mimeType);
      })
      .catch(() => {
        /* aborted or network — keep the fallback showing */
      });
  }, [brief]);

  const hintText = hint(brief, mic === "listening");

  return (
    <main className="min-h-screen w-full bg-bazaar-canvas text-bazaar-ink">
      {/* Desktop: two-column | Mobile: stacked (poster top, mic bottom) */}
      <div className="min-h-screen flex flex-col-reverse md:flex-row">
        {/* Voice column */}
        <section
          className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10 md:py-0 md:min-h-screen"
          aria-label="Voice"
        >
          {mic === "unsupported" ? (
            <UnsupportedCard />
          ) : mic === "denied" ? (
            <DeniedCard onRetry={startListening} />
          ) : (
            <>
              <MicOrb
                state={mic === "listening" ? "listening" : "idle"}
                onClick={mic === "listening" ? stopListening : startListening}
              />
              <div className="mt-8 min-h-[3rem] max-w-md w-full text-center">
                <p className="text-lg font-display italic text-bazaar-ink/80">
                  {interim ? (
                    <span className="italic opacity-70">{interim}</span>
                  ) : transcript ? (
                    <span>{lastSentence(transcript)}</span>
                  ) : (
                    <span className="opacity-40">…</span>
                  )}
                </p>
              </div>
              <p className="mt-3 text-sm text-bazaar-ink/60 min-h-[1.5rem]">
                {hintText}
              </p>
            </>
          )}
        </section>

        {/* Poster column */}
        <section
          className="w-full md:w-1/2 flex flex-col items-center justify-center px-6 py-10 md:py-0 md:min-h-screen bg-bazaar-canvas"
          aria-label="Poster preview"
          onDoubleClick={() => {
            if (!posterImage || posterState !== "done") return;
            downloadCurrentPoster(posterImage, posterMime, brief);
          }}
          onContextMenu={(e) => {
            if (posterImage && (posterState === "done" || posterState === "fallback")) {
              e.preventDefault();
              downloadCurrentPoster(posterImage, posterMime, brief);
            }
          }}
        >
          <PosterStage
            image={posterImage}
            state={posterState}
            surface={brief.surface}
            languageCode={brief.languageCode}
          />
        </section>
      </div>
    </main>
  );
}

// ------------ Components ------------

function MicOrb({
  state,
  onClick,
}: {
  state: "idle" | "listening";
  onClick: () => void;
}): React.ReactElement {
  return (
    <button
      onClick={onClick}
      aria-label={state === "listening" ? "Stop listening" : "Start listening"}
      aria-pressed={state === "listening"}
      className={`relative w-48 h-48 rounded-full flex items-center justify-center transition-transform focus-visible:ring-4 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-4 focus-visible:ring-offset-bazaar-canvas shadow-2xl ${
        state === "listening"
          ? "bg-bazaar-tangerine scale-100"
          : "bg-bazaar-tangerine hover:scale-105"
      }`}
    >
      {state === "listening" && (
        <>
          <span className="absolute inset-0 rounded-full bg-bazaar-tangerine/50 animate-ping" />
          <span className="absolute inset-0 rounded-full bg-bazaar-tangerine/30 animate-pulse" />
        </>
      )}
      <svg width="72" height="72" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M12 1a3 3 0 00-3 3v8a3 3 0 006 0V4a3 3 0 00-3-3z" />
        <path d="M19 10v2a7 7 0 01-14 0v-2" />
        <line x1="12" y1="19" x2="12" y2="23" />
        <line x1="8" y1="23" x2="16" y2="23" />
      </svg>
    </button>
  );
}

function PosterStage({
  image,
  state,
  surface,
  languageCode,
}: {
  image: string | null;
  state: PosterState;
  surface: SurfaceKind;
  languageCode: string;
}): React.ReactElement {
  const aspect =
    surface === "whatsapp" ? "9 / 16" : surface === "poster" ? "3 / 4" : "1 / 1";
  const lang = LANGUAGES.find((l) => l.code === languageCode);
  return (
    <div
      className="relative rounded-2xl overflow-hidden bg-white shadow-xl w-full max-w-[520px]"
      style={{ aspectRatio: aspect }}
    >
      {image ? (
        // Cross-fade: the img just gets swapped; the browser paints the new
        // src immediately. Add a subtle opacity transition on load.
        <img
          key={image.slice(0, 64)}
          src={image}
          alt="Poster preview"
          className="w-full h-full object-cover transition-opacity duration-300"
        />
      ) : (
        <div className="w-full h-full flex items-center justify-center bg-bazaar-saffron/30 text-bazaar-ink/40 font-display italic">
          Speak…
        </div>
      )}
      {(state === "streaming" || state === "fallback") && (
        <div className="absolute top-3 left-3 px-3 py-1 rounded-full bg-bazaar-ink/70 text-white text-xs">
          Rendering{lang ? ` in ${lang.englishName}` : ""}…
        </div>
      )}
      {state === "done" && lang && (
        <div className="absolute bottom-3 right-3 px-3 py-1 rounded-full bg-white/90 text-bazaar-ink text-xs font-medium">
          {lang.nativeName}
        </div>
      )}
      {state === "error" && (
        <div className="absolute inset-0 flex items-center justify-center bg-bazaar-coral/20">
          <p className="text-bazaar-coral">Couldn&apos;t render. Try again.</p>
        </div>
      )}
    </div>
  );
}

function UnsupportedCard(): React.ReactElement {
  return (
    <div className="max-w-sm text-center">
      <p className="text-2xl font-display italic mb-3">
        Voice needs Chrome, Edge, or Safari.
      </p>
      <a
        href="/"
        className="inline-block px-6 py-3 rounded-full bg-bazaar-tangerine text-white font-medium"
      >
        Use text mode →
      </a>
    </div>
  );
}

function DeniedCard({ onRetry }: { onRetry: () => void }): React.ReactElement {
  return (
    <div className="max-w-sm text-center">
      <p className="text-2xl font-display italic mb-2">
        We need the microphone.
      </p>
      <p className="text-sm text-bazaar-ink/60 mb-6">
        Nothing is uploaded — everything stays in this tab.
      </p>
      <button
        onClick={onRetry}
        className="inline-block px-6 py-3 rounded-full bg-bazaar-tangerine text-white font-medium mr-3"
      >
        Try again
      </button>
      <a
        href="/"
        className="inline-block px-6 py-3 rounded-full border border-bazaar-ink/20 text-bazaar-ink font-medium"
      >
        Text mode
      </a>
    </div>
  );
}

// ------------ Helpers ------------

function lastSentence(text: string): string {
  const parts = text.split(/[.?!।]/).filter((s) => s.trim());
  return parts.length ? parts[parts.length - 1].trim() : text;
}

const FONT_BY_LANG: Record<string, string> = {
  hi: "Noto Sans Devanagari",
  ta: "Noto Sans Tamil",
  bn: "Noto Sans Bengali",
  te: "Noto Sans Telugu",
  kn: "Noto Sans Kannada",
  ml: "Noto Sans Malayalam",
  pa: "Noto Sans Gurmukhi",
  gu: "Noto Sans Gujarati",
  en: "Plus Jakarta Sans",
};

const DIMS: Record<SurfaceKind, { w: number; h: number }> = {
  poster: { w: 1240, h: 1754 },
  whatsapp: { w: 1080, h: 1920 },
  square: { w: 1080, h: 1080 },
};

// Client-side SVG fallback mirroring the server-side foreignObject one.
function svgFallback(brief: Brief): string {
  const { w, h } = DIMS[brief.surface];
  const font = FONT_BY_LANG[brief.languageCode] ?? "Plus Jakarta Sans";
  const brand = brief.brandColor || "#F26B1F";
  const esc = (s: string) =>
    s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}" viewBox="0 0 ${w} ${h}">
    <defs>
      <linearGradient id="bg" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="${brand}"/>
        <stop offset="1" stop-color="#1f1409"/>
      </linearGradient>
    </defs>
    <rect width="100%" height="100%" fill="url(#bg)"/>
    <foreignObject x="0" y="0" width="${w}" height="${h}">
      <div xmlns="http://www.w3.org/1999/xhtml" style="width:${w}px;height:${h}px;display:flex;flex-direction:column;align-items:center;justify-content:center;padding:${w * 0.08}px;box-sizing:border-box;font-family:'${font}',sans-serif;">
        <div style="font-size:${Math.min(w * 0.09, 132)}px;font-weight:800;color:#fff;text-align:center;line-height:1.15;overflow-wrap:break-word;word-break:break-word;max-width:100%;">${esc(brief.productName || "…")}</div>
        ${brief.price ? `<div style="margin-top:${h * 0.05}px;background:#fff;border-radius:${w * 0.03}px;padding:${w * 0.04}px ${w * 0.06}px;max-width:80%;"><div style="font-size:${Math.min(w * 0.11, 160)}px;font-weight:700;color:${brand};text-align:center;white-space:nowrap;">${esc(brief.price)}</div></div>` : ""}
        ${brief.businessName ? `<div style="margin-top:${h * 0.06}px;font-family:'Plus Jakarta Sans','${font}',sans-serif;font-weight:600;color:#fff;opacity:0.85;letter-spacing:2px;font-size:${Math.min(w * 0.035, 44)}px;text-align:center;text-transform:uppercase;">${esc(brief.businessName)}</div>` : ""}
      </div>
    </foreignObject>
  </svg>`;
  const encoded = typeof window === "undefined"
    ? Buffer.from(svg, "utf-8").toString("base64")
    : btoa(unescape(encodeURIComponent(svg)));
  return `data:image/svg+xml;base64,${encoded}`;
}

function downloadCurrentPoster(image: string, mime: string, brief: Brief): void {
  const a = document.createElement("a");
  a.href = image;
  const safe = (brief.productName || "poster").toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 30);
  const ext = mime.includes("svg") ? "svg" : mime.includes("jpeg") ? "jpg" : "png";
  a.download = `${safe}--${brief.languageCode}--${brief.surface}.${ext}`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
}

// Silence unused-import warnings for BCP47 (imported for side-effect
// clarity elsewhere; TypeScript strict wants explicit reference).
void BCP47_BY_CODE;

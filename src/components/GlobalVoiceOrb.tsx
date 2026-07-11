"use client";

/**
 * GlobalVoiceOrb — a floating mic FAB pinned to the bottom-right of the
 * viewport. Reachable from any page and, when tapped, opens into a small
 * "listening" card with a live waveform. Sends the transcript + a snapshot
 * of the current brief to /api/chat; the server may reply with either a
 * chatty `message` (which we speak back) OR a `tool_calls` payload that
 * the parent maps to state mutations via `onToolCall`.
 *
 * This is intentionally a *lightweight* mirror of /voice — the goal is to
 * let a text-mode user say "change price to 150" without navigating away.
 * The orb hides itself entirely on browsers without Web Speech (Firefox).
 */

import { useCallback, useEffect, useRef, useState } from "react";
import {
  createSpeechSession,
  isSpeechSupported,
  speak,
  type SpeechSession,
} from "@/lib/speech";
import { getByokKey } from "@/lib/generate";

type OrbState = "idle" | "listening" | "thinking" | "speaking";

export interface GlobalVoiceOrbBrief {
  productName: string;
  price: string;
  businessName?: string;
  brandColor: string;
  selectedLangs: string[];
  selectedSurface: string;
  mode: "single" | "bulk";
}

export interface GlobalVoiceOrbProps {
  currentBrief: GlobalVoiceOrbBrief;
  onToolCall: (name: string, args: Record<string, unknown>) => void;
}

interface ChatToolCall {
  name: string;
  args: Record<string, unknown>;
}
interface ChatReplyMessage {
  kind: "message";
  text: string;
  language: string;
}
interface ChatReplyToolCalls {
  kind: "tool_calls";
  toolCalls: ChatToolCall[];
  text?: string;
  language?: string;
}
type ChatReply = ChatReplyMessage | ChatReplyToolCalls;

interface Toast {
  id: string;
  text: string;
}

// Human-readable summary of a tool call for the toast strip. Keeps the
// visible feedback small and specific so a shop owner sees exactly what
// the AI just changed.
function summarizeTool(name: string, args: Record<string, unknown>): string {
  switch (name) {
    case "set_slot": {
      const field = String(args.field ?? "");
      const value = String(args.value ?? "");
      const label =
        field === "productName"
          ? "product name"
          : field === "businessName"
            ? "business name"
            : field === "brandColor"
              ? "brand color"
              : field;
      return `Changed ${label} to ${value}`;
    }
    case "set_language": {
      const code = String(args.code ?? "");
      return `Added ${code.toUpperCase()}`;
    }
    case "set_surface": {
      const kind = String(args.kind ?? "");
      return `Switched to ${kind}`;
    }
    case "set_preset": {
      const id = String(args.presetId ?? "");
      return `Applied ${id} preset`;
    }
    case "regenerate":
      return "Regenerating posters";
    case "export_zip":
      return "Preparing ZIP";
    case "undo":
      return "Undid last change";
    default:
      return `Ran ${name}`;
  }
}

export function GlobalVoiceOrb({
  currentBrief,
  onToolCall,
}: GlobalVoiceOrbProps): React.ReactElement | null {
  const [supported, setSupported] = useState<boolean | null>(null);
  const [state, setState] = useState<OrbState>("idle");
  const [transcript, setTranscript] = useState<string>("");
  const [aiText, setAiText] = useState<string>("");
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const sessionRef = useRef<SpeechSession | null>(null);
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const abortRef = useRef<AbortController | null>(null);
  const finalTextRef = useRef<string>("");
  const briefRef = useRef<GlobalVoiceOrbBrief>(currentBrief);
  briefRef.current = currentBrief;

  // Feature-detect once on mount; if unsupported, the component returns
  // null so no broken button appears (Firefox and older Safari).
  useEffect(() => {
    setSupported(isSpeechSupported());
  }, []);

  // Auto-dismiss toasts after 2.5s each. We schedule per-toast rather
  // than a single global timer so overlapping toasts don't cut each
  // other short.
  useEffect(() => {
    if (toasts.length === 0) return;
    const last = toasts[toasts.length - 1];
    const timer = window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== last.id));
    }, 2500);
    return () => window.clearTimeout(timer);
  }, [toasts]);

  // --- Waveform (shared shape with VoiceMic; smaller radius) ---------
  const stopWaveform = useCallback((): void => {
    if (rafRef.current !== null) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    void audioCtxRef.current?.close().catch(() => undefined);
    audioCtxRef.current = null;
    analyserRef.current = null;
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext("2d");
      ctx?.clearRect(0, 0, canvas.width, canvas.height);
    }
  }, []);

  useEffect(() => {
    if (state !== "listening") {
      stopWaveform();
      return;
    }
    let cancelled = false;
    const boot = async (): Promise<void> => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const AudioCtx =
          window.AudioContext ??
          (window as unknown as { webkitAudioContext?: typeof AudioContext })
            .webkitAudioContext;
        if (!AudioCtx) return;
        const ctx = new AudioCtx();
        audioCtxRef.current = ctx;
        const source = ctx.createMediaStreamSource(stream);
        const analyser = ctx.createAnalyser();
        analyser.fftSize = 128;
        source.connect(analyser);
        analyserRef.current = analyser;
        const canvas = canvasRef.current;
        if (!canvas) return;
        const g = canvas.getContext("2d");
        if (!g) return;
        const buf = new Uint8Array(analyser.frequencyBinCount);
        const draw = (): void => {
          analyser.getByteFrequencyData(buf);
          const w = canvas.width;
          const h = canvas.height;
          g.clearRect(0, 0, w, h);
          const cx = w / 2;
          const cy = h / 2;
          const baseR = Math.min(w, h) * 0.28;
          const bars = 32;
          for (let i = 0; i < bars; i++) {
            const v = buf[Math.floor((i / bars) * buf.length)] / 255;
            const len = baseR * 0.35 + v * baseR * 0.9;
            const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
            const x1 = cx + Math.cos(angle) * baseR;
            const y1 = cy + Math.sin(angle) * baseR;
            const x2 = cx + Math.cos(angle) * (baseR + len);
            const y2 = cy + Math.sin(angle) * (baseR + len);
            g.strokeStyle = "#ffffff";
            g.lineWidth = 2;
            g.lineCap = "round";
            g.beginPath();
            g.moveTo(x1, y1);
            g.lineTo(x2, y2);
            g.stroke();
          }
          rafRef.current = requestAnimationFrame(draw);
        };
        draw();
      } catch {
        // getUserMedia denied — skip viz. STT itself will surface an error.
      }
    };
    void boot();
    return () => {
      cancelled = true;
      stopWaveform();
    };
  }, [state, stopWaveform]);

  // --- Send to /api/chat and dispatch tool calls ---------------------
  const dispatchToolCall = useCallback(
    (name: string, args: Record<string, unknown>) => {
      onToolCall(name, args);
      setToasts((prev) => [
        ...prev,
        { id: `${Date.now()}-${name}-${Math.random()}`, text: summarizeTool(name, args) },
      ]);
    },
    [onToolCall],
  );

  const sendTurn = useCallback(
    async (userText: string): Promise<void> => {
      if (!userText.trim()) {
        setState("idle");
        return;
      }
      setState("thinking");
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        const byok = getByokKey();
        if (byok) headers["X-Gemini-Key"] = byok;
        const res = await fetch("/api/chat", {
          method: "POST",
          headers,
          body: JSON.stringify({
            messages: [{ role: "user", content: userText }],
            currentBrief: briefRef.current,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `chat HTTP ${res.status}`);
        }
        const reply = (await res.json()) as ChatReply;
        if (reply.kind === "tool_calls") {
          for (const call of reply.toolCalls) {
            dispatchToolCall(call.name, call.args);
          }
          if (reply.text) {
            setAiText(reply.text);
            setState("speaking");
            speak(reply.text, reply.language ?? "en", () => {
              setState("idle");
              window.setTimeout(() => setAiText(""), 1200);
            });
          } else {
            setState("idle");
          }
          return;
        }
        // Plain message reply — speak it and drop back to idle.
        setAiText(reply.text);
        setState("speaking");
        speak(reply.text, reply.language, () => {
          setState("idle");
          window.setTimeout(() => setAiText(""), 1200);
        });
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setErrorMsg(err instanceof Error ? err.message : "Chat failed");
        setState("idle");
        window.setTimeout(() => setErrorMsg(null), 3500);
      }
    },
    [dispatchToolCall],
  );

  // --- Toggle ---------------------------------------------------------
  const beginListening = useCallback((): void => {
    finalTextRef.current = "";
    setTranscript("");
    setErrorMsg(null);
    const session = createSpeechSession("en");
    sessionRef.current = session;
    session.onResult((text, isFinal) => {
      setTranscript(text);
      if (isFinal) finalTextRef.current = text;
    });
    session.onError((err) => {
      if (err === "no-speech" || err === "aborted") {
        setState("idle");
        return;
      }
      if (err === "not-allowed" || err === "service-not-allowed") {
        setErrorMsg("Mic permission denied.");
      } else {
        setErrorMsg(`Speech error: ${err}`);
      }
      setState("idle");
      window.setTimeout(() => setErrorMsg(null), 3500);
    });
    session.onEnd(() => {
      sessionRef.current = null;
      const finalText = finalTextRef.current || transcript;
      if (finalText.trim()) {
        void sendTurn(finalText);
      } else {
        setState("idle");
      }
    });
    setState("listening");
    session.start();
  }, [sendTurn, transcript]);

  const handleClick = useCallback((): void => {
    if (state === "listening") {
      sessionRef.current?.stop();
      return;
    }
    if (state === "thinking" || state === "speaking") {
      // Interrupt: cancel in-flight work and settle to idle.
      abortRef.current?.abort();
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
      setState("idle");
      return;
    }
    beginListening();
  }, [state, beginListening]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      sessionRef.current?.stop();
      abortRef.current?.abort();
      try {
        window.speechSynthesis?.cancel();
      } catch {
        /* ignore */
      }
    };
  }, []);

  if (supported === false) return null;

  const labelForState =
    state === "listening"
      ? "Listening — tap to stop"
      : state === "thinking"
        ? "Thinking — tap to cancel"
        : state === "speaking"
          ? "Speaking — tap to interrupt"
          : "Speak a command";

  const isExpanded = state === "listening";

  return (
    <div
      className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2 no-print"
      data-testid="global-voice-orb-root"
    >
      {/* AI text bubble (small toast above the orb) */}
      {aiText ? (
        <div
          role="status"
          aria-live="polite"
          className="max-w-[260px] rounded-2xl bg-bazaar-ink text-bazaar-canvas px-3 py-2 text-xs shadow-lg"
        >
          {aiText}
        </div>
      ) : null}

      {/* Tool-call toasts */}
      {toasts.length > 0 ? (
        <div
          className="flex flex-col items-end gap-1"
          aria-live="polite"
          data-testid="orb-toasts"
        >
          {toasts.map((t) => (
            <div
              key={t.id}
              role="status"
              className="rounded-full bg-white border border-bazaar-tangerine/60 text-bazaar-ink text-xs px-3 py-1.5 shadow-md"
            >
              <span className="mr-1 text-bazaar-tangerine" aria-hidden="true">
                ✓
              </span>
              {t.text}
            </div>
          ))}
        </div>
      ) : null}

      {/* Error nudge */}
      {errorMsg ? (
        <div
          role="alert"
          className="max-w-[260px] rounded-2xl bg-white border border-bazaar-coral text-bazaar-coral px-3 py-2 text-xs shadow-lg"
        >
          {errorMsg}
        </div>
      ) : null}

      {/* Listening panel (transcript preview) */}
      {isExpanded ? (
        <div
          className="max-w-[260px] rounded-2xl bg-white border border-bazaar-ink/10 px-3 py-2 text-xs text-bazaar-ink shadow-lg"
          data-testid="orb-listening-panel"
        >
          <p className="uppercase tracking-widest text-[10px] text-bazaar-tangerine font-semibold mb-1">
            Listening…
          </p>
          <p className="leading-snug">{transcript || "Say something."}</p>
        </div>
      ) : null}

      {/* The orb itself */}
      <button
        type="button"
        onClick={handleClick}
        aria-label={labelForState}
        aria-pressed={state === "listening"}
        data-state={state}
        data-testid="global-voice-orb"
        className={`relative w-[72px] h-[72px] rounded-full flex items-center justify-center transition-all shadow-xl focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas ${
          state === "listening"
            ? "bg-bazaar-tangerine scale-105"
            : state === "thinking" || state === "speaking"
              ? "bg-bazaar-tangerine"
              : "bg-bazaar-tangerine hover:scale-105"
        }`}
      >
        {/* Idle pulse — subtle */}
        {state === "idle" ? (
          <span
            className="absolute inset-0 rounded-full bg-bazaar-tangerine/40 animate-ping"
            aria-hidden="true"
          />
        ) : null}

        {/* Waveform canvas (listening only) */}
        <canvas
          ref={canvasRef}
          width={72}
          height={72}
          aria-hidden="true"
          className={`absolute inset-0 w-full h-full rounded-full pointer-events-none ${
            state === "listening" ? "opacity-100" : "opacity-0"
          } transition-opacity`}
        />

        {/* Thinking spinner */}
        {state === "thinking" ? (
          <span
            className="absolute inset-2 rounded-full border-2 border-white/30 border-t-white animate-spin"
            aria-hidden="true"
          />
        ) : null}

        {/* Mic icon */}
        <svg
          aria-hidden="true"
          viewBox="0 0 24 24"
          className="relative w-8 h-8 text-white drop-shadow"
          fill="currentColor"
        >
          <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
          <path
            d="M5 11a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.93V21h3a1 1 0 110 2H8a1 1 0 110-2h3v-3.07A7 7 0 015 11z"
            fillRule="evenodd"
          />
        </svg>
      </button>
    </div>
  );
}

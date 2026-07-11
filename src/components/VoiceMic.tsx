"use client";

/**
 * VoiceMic — the giant mic button. Pulses when idle; renders a live
 * circular waveform when listening (Web Audio AnalyserNode driving
 * a canvas inside the button). Space bar toggles. Fully ARIA.
 *
 * The parent owns the SpeechRecognition instance because start/stop
 * timing has to line up with conversation state; this component only
 * paints and forwards `onToggle`. When `listening` is true it opens
 * a getUserMedia stream to visualize amplitude — the STT machinery
 * runs in parallel in the parent and can share the same mic; browsers
 * are fine with two consumers.
 */

import { useEffect, useRef } from "react";

type Mode = "idle" | "listening" | "thinking" | "speaking" | "rendering" | "done" | "error";

interface Props {
  mode: Mode;
  onToggle: () => void;
  disabled?: boolean;
  label: string;
}

export function VoiceMic({ mode, onToggle, disabled, label }: Props): React.ReactElement {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const rafRef = useRef<number | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);

  // Space bar toggles when the button is focused OR when nothing else
  // is focused (agent-friendly hackathon default).
  useEffect(() => {
    const onKey = (e: KeyboardEvent): void => {
      if (e.code !== "Space") return;
      const t = e.target as HTMLElement | null;
      const tag = t?.tagName ?? "";
      if (tag === "INPUT" || tag === "TEXTAREA" || t?.isContentEditable) return;
      e.preventDefault();
      if (!disabled) onToggle();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onToggle, disabled]);

  // Waveform lifecycle — only spin up the AudioContext while listening.
  useEffect(() => {
    if (mode !== "listening") {
      stopWaveform();
      return;
    }
    let cancelled = false;
    const start = async (): Promise<void> => {
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
        analyser.fftSize = 256;
        source.connect(analyser);
        analyserRef.current = analyser;
        draw();
      } catch {
        // Permission denied or no device — just skip the viz. Parent
        // handles user-facing messaging.
      }
    };
    void start();
    return () => {
      cancelled = true;
      stopWaveform();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode]);

  const stopWaveform = (): void => {
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
  };

  const draw = (): void => {
    const canvas = canvasRef.current;
    const analyser = analyserRef.current;
    if (!canvas || !analyser) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const bufferLen = analyser.frequencyBinCount;
    const data = new Uint8Array(bufferLen);
    const render = (): void => {
      analyser.getByteFrequencyData(data);
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);
      const cx = w / 2;
      const cy = h / 2;
      const baseR = Math.min(w, h) * 0.28;
      const bars = 48;
      for (let i = 0; i < bars; i++) {
        const v = data[Math.floor((i / bars) * bufferLen)] / 255;
        const len = baseR * 0.35 + v * baseR * 0.9;
        const angle = (i / bars) * Math.PI * 2 - Math.PI / 2;
        const x1 = cx + Math.cos(angle) * baseR;
        const y1 = cy + Math.sin(angle) * baseR;
        const x2 = cx + Math.cos(angle) * (baseR + len);
        const y2 = cy + Math.sin(angle) * (baseR + len);
        ctx.strokeStyle = "#F26B1F";
        ctx.lineWidth = 3;
        ctx.lineCap = "round";
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
      }
      rafRef.current = requestAnimationFrame(render);
    };
    render();
  };

  const idle = mode === "idle" || mode === "done" || mode === "error";
  const active = mode === "listening";

  return (
    <button
      type="button"
      onClick={onToggle}
      disabled={disabled}
      aria-label={label}
      aria-pressed={active}
      className={`relative w-56 h-56 sm:w-64 sm:h-64 rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-4 focus-visible:ring-offset-bazaar-canvas ${
        disabled
          ? "bg-bazaar-ink/20 cursor-not-allowed"
          : active
            ? "bg-bazaar-tangerine shadow-2xl scale-105"
            : "bg-bazaar-tangerine shadow-xl hover:scale-105"
      }`}
    >
      {/* Pulsing halo when idle */}
      {idle && !disabled ? (
        <>
          <span className="absolute inset-0 rounded-full bg-bazaar-tangerine/40 animate-ping" />
          <span className="absolute inset-3 rounded-full bg-bazaar-tangerine/60 animate-pulse" />
        </>
      ) : null}
      {/* Waveform canvas visible only when listening */}
      <canvas
        ref={canvasRef}
        width={260}
        height={260}
        aria-hidden="true"
        className={`absolute inset-0 w-full h-full rounded-full pointer-events-none ${
          active ? "opacity-100" : "opacity-0"
        } transition-opacity`}
      />
      {/* Mic icon */}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="relative w-24 h-24 sm:w-28 sm:h-28 text-white drop-shadow"
        fill="currentColor"
      >
        <path d="M12 15a3 3 0 003-3V6a3 3 0 10-6 0v6a3 3 0 003 3z" />
        <path
          d="M5 11a1 1 0 112 0 5 5 0 0010 0 1 1 0 112 0 7 7 0 01-6 6.93V21h3a1 1 0 110 2H8a1 1 0 110-2h3v-3.07A7 7 0 015 11z"
          fillRule="evenodd"
        />
      </svg>
    </button>
  );
}

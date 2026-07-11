/**
 * speech.ts — thin, TS-strict wrapper over the Web Speech API for use
 * across the app. Shared between the /voice page and the global voice
 * orb so we have one place to maintain browser-quirk handling.
 *
 * We don't touch DOM types the lib already exposes; but SpeechRecognition
 * is still non-standard (Chromium ships it under `webkitSpeechRecognition`),
 * so we declare a minimal structural interface and duck-type onto it.
 */

interface SpeechRecognitionAlternative {
  transcript: string;
  confidence: number;
}
interface SpeechRecognitionResult {
  readonly length: number;
  readonly isFinal: boolean;
  item(index: number): SpeechRecognitionAlternative;
  [index: number]: SpeechRecognitionAlternative;
}
interface SpeechRecognitionResultList {
  readonly length: number;
  item(index: number): SpeechRecognitionResult;
  [index: number]: SpeechRecognitionResult;
}
interface SpeechRecognitionEventLike extends Event {
  readonly resultIndex: number;
  readonly results: SpeechRecognitionResultList;
}
interface SpeechRecognitionErrorEventLike extends Event {
  readonly error: string;
}
interface SpeechRecognitionLike extends EventTarget {
  lang: string;
  continuous: boolean;
  interimResults: boolean;
  maxAlternatives: number;
  start(): void;
  stop(): void;
  abort(): void;
  onresult: ((ev: SpeechRecognitionEventLike) => void) | null;
  onerror: ((ev: SpeechRecognitionErrorEventLike) => void) | null;
  onend: (() => void) | null;
  onstart: (() => void) | null;
}
type SpeechRecognitionCtor = new () => SpeechRecognitionLike;

function getCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

export function isSpeechSupported(): boolean {
  return getCtor() !== null;
}

export const BCP47_BY_CODE: Record<string, string> = {
  en: "en-IN",
  hi: "hi-IN",
  ta: "ta-IN",
  bn: "bn-IN",
  te: "te-IN",
  kn: "kn-IN",
  ml: "ml-IN",
  pa: "pa-IN",
  gu: "gu-IN",
};

export interface SpeechSession {
  start(): void;
  stop(): void;
  onResult(cb: (transcript: string, isFinal: boolean) => void): void;
  onEnd(cb: () => void): void;
  onError(cb: (err: string) => void): void;
}

export function createSpeechSession(lang: string): SpeechSession {
  const Ctor = getCtor();
  if (!Ctor) {
    // Return a no-op session so callers can degrade gracefully. The
    // orb uses isSpeechSupported() to hide itself first, so this branch
    // should only be reached on truly unsupported environments.
    return {
      start(): void {
        /* no-op */
      },
      stop(): void {
        /* no-op */
      },
      onResult(): void {
        /* no-op */
      },
      onEnd(): void {
        /* no-op */
      },
      onError(): void {
        /* no-op */
      },
    };
  }

  const rec = new Ctor();
  rec.lang = BCP47_BY_CODE[lang] ?? lang ?? "en-IN";
  rec.continuous = false;
  rec.interimResults = true;
  rec.maxAlternatives = 1;

  let resultCb: ((t: string, f: boolean) => void) | null = null;
  let endCb: (() => void) | null = null;
  let errorCb: ((err: string) => void) | null = null;

  rec.onresult = (ev): void => {
    let interim = "";
    let finalPart = "";
    for (let i = ev.resultIndex; i < ev.results.length; i++) {
      const res = ev.results[i];
      const alt = res[0];
      if (res.isFinal) finalPart += alt.transcript;
      else interim += alt.transcript;
    }
    const combined = (finalPart + interim).trim();
    if (resultCb) resultCb(combined, Boolean(finalPart));
  };
  rec.onerror = (ev): void => {
    if (errorCb) errorCb(ev.error);
  };
  rec.onend = (): void => {
    if (endCb) endCb();
  };

  return {
    start(): void {
      try {
        rec.start();
      } catch {
        // Chrome throws InvalidStateError if start() is called while
        // already running — silently ignore; onend will fire.
      }
    },
    stop(): void {
      try {
        rec.stop();
      } catch {
        /* ignore */
      }
    },
    onResult(cb): void {
      resultCb = cb;
    },
    onEnd(cb): void {
      endCb = cb;
    },
    onError(cb): void {
      errorCb = cb;
    },
  };
}

/**
 * Speak `text` via SpeechSynthesis in the requested language, calling
 * `onEnd` when done (or immediately if TTS is unavailable).
 */
export function speak(text: string, lang: string, onEnd?: () => void): void {
  if (typeof window === "undefined" || !window.speechSynthesis) {
    onEnd?.();
    return;
  }
  try {
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    const bcp = BCP47_BY_CODE[lang] ?? lang ?? "en-IN";
    u.lang = bcp;
    const voices = window.speechSynthesis.getVoices();
    const match =
      voices.find((v) => v.lang.toLowerCase() === bcp.toLowerCase()) ??
      voices.find((v) =>
        v.lang.toLowerCase().startsWith(bcp.split("-")[0].toLowerCase()),
      );
    if (match) u.voice = match;
    u.rate = 1.0;
    u.pitch = 1.0;
    u.onend = () => onEnd?.();
    u.onerror = () => onEnd?.();
    window.speechSynthesis.speak(u);
  } catch {
    onEnd?.();
  }
}

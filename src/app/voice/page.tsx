"use client";

/**
 * /voice — the voice-first shopkeeper flow.
 *
 * State machine:
 *   idle → listening → thinking → speaking → (loop) listening
 *                                          → rendering → done
 *   any → error → (tap to reset) idle
 *
 * The mic captures a user turn (Web Speech API STT). We POST the full
 * conversation history to /api/chat (built by another agent). The
 * server returns EITHER an assistant text turn (which we speak with
 * SpeechSynthesis and loop back to listening) OR a function call
 * `finalize_order` — at which point we transition to `rendering` and
 * fan out `generate()` for all 9 languages in parallel.
 *
 * Language detection: if the user pinned a chip, that language wins.
 * Otherwise we sniff the transcript's Unicode block on each interim
 * result and set the STT locale on the fly.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LANGUAGES, findLanguage } from "@/lib/languages";
import { generate, isError, type GenerateResult } from "@/lib/generate";
import { VoiceMic } from "@/components/VoiceMic";
import { VoiceTranscript, type Bubble } from "@/components/VoiceTranscript";
import { VoiceLanguageChips } from "@/components/VoiceLanguageChips";
import { ByokKeyModal } from "@/components/ByokKeyModal";
import { VideoExportButton } from "@/components/VideoExportButton";
import { VideoPreviewModal } from "@/components/VideoPreviewModal";
import { getByokKey } from "@/lib/generate";
import {
  canStitch,
  stitchSlideshow,
  type StitchImage,
  type StitchResult,
} from "@/lib/videoStitch";
import { synthIdentAsync } from "@/lib/narrationCapture";

// ---- Web Speech typings (lib.dom doesn't ship them yet) --------------

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

function getSpeechRecognitionCtor(): SpeechRecognitionCtor | null {
  if (typeof window === "undefined") return null;
  const w = window as unknown as {
    SpeechRecognition?: SpeechRecognitionCtor;
    webkitSpeechRecognition?: SpeechRecognitionCtor;
  };
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null;
}

// ---- Chat API contract (matches the other agent's /api/chat) ---------

interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
  languageCode?: string;
}

interface ChatReplyText {
  kind: "message";
  text: string;
  language: string;
}
interface ChatReplyFinal {
  kind: "finalize";
  order: {
    productName: string;
    price: string;
    businessName?: string;
    languageCode: string;
    brandColor: string;
  };
  text?: string;
}
type ChatReply = ChatReplyText | ChatReplyFinal;

interface CellState {
  langCode: string;
  loading: boolean;
  image?: string;
  mimeType?: string;
  error?: string;
}

// ---- Helpers ---------------------------------------------------------

/**
 * Detect a language code from the Unicode block of the first non-Latin
 * character we see. Reused across turns so the STT can retune. Falls
 * back to null when the sample is empty or entirely Latin — the caller
 * can then keep the previous locale or default to English.
 */
function detectLanguageFromText(text: string): string | null {
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c === undefined) continue;
    if (c >= 0x0900 && c <= 0x097f) return "hi"; // Devanagari
    if (c >= 0x0b80 && c <= 0x0bff) return "ta"; // Tamil
    if (c >= 0x0980 && c <= 0x09ff) return "bn"; // Bengali
    if (c >= 0x0c00 && c <= 0x0c7f) return "te"; // Telugu
    if (c >= 0x0c80 && c <= 0x0cff) return "kn"; // Kannada
    if (c >= 0x0d00 && c <= 0x0d7f) return "ml"; // Malayalam
    if (c >= 0x0a00 && c <= 0x0a7f) return "pa"; // Gurmukhi
    if (c >= 0x0a80 && c <= 0x0aff) return "gu"; // Gujarati
  }
  return null;
}

const BCP47_BY_CODE: Record<string, string> = {
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

const OPENERS: Record<string, string> = {
  en: "Hi! I'll help you build posters. What are you selling today?",
  hi: "नमस्ते! क्या बेच रहे हैं आज?",
  ta: "வணக்கம்! இன்று என்ன விற்கிறீர்கள்?",
  bn: "নমস্কার! আজ কী বিক্রি করছেন?",
  te: "నమస్తే! ఈరోజు ఏమి అమ్ముతున్నారు?",
  kn: "ನಮಸ್ಕಾರ! ಇಂದು ಏನು ಮಾರುತ್ತಿದ್ದೀರಿ?",
  ml: "നമസ്കാരം! ഇന്ന് എന്താണ് വിൽക്കുന്നത്?",
  pa: "ਸਤ ਸ੍ਰੀ ਅਕਾਲ! ਅੱਜ ਕੀ ਵੇਚ ਰਹੇ ਹੋ?",
  gu: "નમસ્તે! આજે શું વેચી રહ્યા છો?",
};

// ---- Component -------------------------------------------------------

type Mode =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "rendering"
  | "done"
  | "error";

export default function VoicePage(): React.ReactElement {
  const [mode, setMode] = useState<Mode>("idle");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [supported, setSupported] = useState<boolean | null>(null);
  const [pinnedLang, setPinnedLang] = useState<string | null>(null);
  const [detectedLang, setDetectedLang] = useState<string>("en");
  const [bubbles, setBubbles] = useState<Bubble[]>([]);
  const [byokOpen, setByokOpen] = useState(false);
  const [cells, setCells] = useState<CellState[]>([]);

  // Refs — long-lived objects and state the render loop shouldn't
  // trigger re-renders for.
  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const interimBubbleIdRef = useRef<string | null>(null);
  const currentUserTextRef = useRef<string>("");
  const chatAbortRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const effectiveLang = pinnedLang ?? detectedLang;
  const effectiveLangObj = useMemo(() => findLanguage(effectiveLang), [effectiveLang]);

  // Support check ------------------------------------------------------
  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

  // Warm up SpeechSynthesis voices (Chrome loads async).
  useEffect(() => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const load = (): void => {
      window.speechSynthesis.getVoices();
    };
    load();
    window.speechSynthesis.onvoiceschanged = load;
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  // Speak helper -------------------------------------------------------
  const speak = useCallback(
    (text: string, langCode: string): Promise<void> =>
      new Promise((resolve) => {
        if (typeof window === "undefined" || !window.speechSynthesis) {
          resolve();
          return;
        }
        try {
          window.speechSynthesis.cancel();
          const u = new SpeechSynthesisUtterance(text);
          const bcp = BCP47_BY_CODE[langCode] ?? "en-IN";
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
          u.onend = () => resolve();
          u.onerror = () => resolve();
          utteranceRef.current = u;
          window.speechSynthesis.speak(u);
        } catch {
          resolve();
        }
      }),
    [],
  );

  const cancelSpeak = useCallback(() => {
    try {
      window.speechSynthesis?.cancel();
    } catch {
      // ignore
    }
    utteranceRef.current = null;
  }, []);

  // Poster fan-out -----------------------------------------------------
  const renderPosters = useCallback(
    async (order: ChatReplyFinal["order"]) => {
      setMode("rendering");
      const initial: CellState[] = LANGUAGES.map((l) => ({
        langCode: l.code,
        loading: true,
      }));
      setCells(initial);
      await Promise.all(
        LANGUAGES.map(async (lang) => {
          const result = await generate({
            productName: order.productName,
            price: order.price,
            businessName: order.businessName ?? "",
            languageCode: lang.code,
            surfaceKind: "poster",
            brandColor: order.brandColor ?? "#F26B1F",
          });
          setCells((prev) =>
            prev.map((c) => {
              if (c.langCode !== lang.code) return c;
              if (isError(result)) {
                return { ...c, loading: false, error: result.error };
              }
              const ok = result as GenerateResult;
              return {
                ...c,
                loading: false,
                image: ok.image,
                mimeType: ok.mimeType,
              };
            }),
          );
        }),
      );
      setMode("done");
    },
    [],
  );

  // Chat turn ----------------------------------------------------------
  const sendUserTurn = useCallback(
    async (userText: string, userLangCode: string) => {
      if (!userText.trim()) {
        setMode("idle");
        return;
      }
      historyRef.current.push({
        role: "user",
        content: userText,
        languageCode: userLangCode,
      });
      setMode("thinking");

      chatAbortRef.current?.abort();
      const controller = new AbortController();
      chatAbortRef.current = controller;

      let reply: ChatReply;
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
            messages: historyRef.current.map((m) => ({
              role: m.role === "system" ? "user" : m.role,
              content: m.content,
            })),
            languageHint: userLangCode,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as { error?: string };
          throw new Error(body.error ?? `chat HTTP ${res.status}`);
        }
        reply = (await res.json()) as ChatReply;
      } catch (err) {
        if (err instanceof Error && err.name === "AbortError") return;
        setErrorMsg(err instanceof Error ? err.message : "Chat failed");
        setMode("error");
        return;
      }

      if (reply.kind === "finalize") {
        // Speak a short confirmation in the user's language, then fan out.
        const closer =
          reply.text ??
          `${effectiveLangObj?.englishName ?? "OK"} — generating your posters.`;
        historyRef.current.push({
          role: "assistant",
          content: closer,
          languageCode: reply.order.languageCode,
        });
        setBubbles((b) => [
          ...b,
          {
            id: `ai-${Date.now()}`,
            role: "ai",
            text: closer,
            languageCode: reply.order.languageCode,
          },
        ]);
        setMode("speaking");
        await speak(closer, reply.order.languageCode);
        await renderPosters(reply.order);
        return;
      }

      // Regular message turn.
      historyRef.current.push({
        role: "assistant",
        content: reply.text,
        languageCode: reply.language,
      });
      setBubbles((b) => [
        ...b,
        {
          id: `ai-${Date.now()}`,
          role: "ai",
          text: reply.text,
          languageCode: reply.language,
        },
      ]);
      setMode("speaking");
      await speak(reply.text, reply.language);
      // Loop back into listening for the next user turn.
      startListening(reply.language);
    },
    // startListening is defined below; declared as a stable callback so
    // this closure captures the latest version via the ref pattern.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [renderPosters, speak, effectiveLangObj],
  );

  // Listening ----------------------------------------------------------
  const startListening = useCallback(
    (langHint?: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setSupported(false);
        return;
      }
      // Cancel any in-flight TTS so the mic doesn't hear our own voice.
      cancelSpeak();

      const rec = new Ctor();
      const langCode = pinnedLang ?? langHint ?? detectedLang;
      rec.lang = BCP47_BY_CODE[langCode] ?? "en-IN";
      rec.continuous = false;
      rec.interimResults = true;
      rec.maxAlternatives = 1;

      currentUserTextRef.current = "";
      interimBubbleIdRef.current = null;

      rec.onstart = () => {
        setMode("listening");
      };

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
        currentUserTextRef.current = (finalPart || interim).trim();

        // Auto-detect language if no chip pinned.
        if (!pinnedLang) {
          const detected = detectLanguageFromText(combined);
          if (detected && detected !== detectedLang) {
            setDetectedLang(detected);
          }
        }

        // Update / create the interim user bubble.
        const bubbleLang = pinnedLang ?? detectLanguageFromText(combined) ?? detectedLang;
        const id = interimBubbleIdRef.current;
        setBubbles((prev) => {
          if (id === null) {
            const newId = `user-${Date.now()}`;
            interimBubbleIdRef.current = newId;
            return [
              ...prev,
              {
                id: newId,
                role: "user",
                text: combined || "…",
                languageCode: bubbleLang,
                interim: !finalPart,
              },
            ];
          }
          return prev.map((b) =>
            b.id === id
              ? {
                  ...b,
                  text: combined || "…",
                  languageCode: bubbleLang,
                  interim: !finalPart,
                }
              : b,
          );
        });
      };

      rec.onerror = (ev): void => {
        if (ev.error === "no-speech" || ev.error === "aborted") {
          setMode("idle");
          return;
        }
        if (ev.error === "not-allowed" || ev.error === "service-not-allowed") {
          setErrorMsg(
            "Microphone permission denied. Enable mic access in your browser and try again.",
          );
        } else {
          setErrorMsg(`Speech error: ${ev.error}`);
        }
        setMode("error");
      };

      rec.onend = (): void => {
        const finalText = currentUserTextRef.current;
        recognitionRef.current = null;
        // Freeze the interim bubble as final.
        const id = interimBubbleIdRef.current;
        if (id !== null) {
          setBubbles((prev) =>
            prev.map((b) => (b.id === id ? { ...b, interim: false } : b)),
          );
        }
        interimBubbleIdRef.current = null;
        if (finalText.trim()) {
          const lang = pinnedLang ?? detectLanguageFromText(finalText) ?? detectedLang;
          void sendUserTurn(finalText, lang);
        } else {
          setMode("idle");
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        // Some browsers throw if start() is called twice quickly.
        setMode("idle");
      }
    },
    [pinnedLang, detectedLang, cancelSpeak, sendUserTurn],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  // First-turn kickoff: greet the user in the chosen (or English) language.
  const handleMicTap = useCallback(async () => {
    if (mode === "listening") {
      stopListening();
      return;
    }
    if (mode === "speaking" || mode === "thinking") {
      cancelSpeak();
      chatAbortRef.current?.abort();
      setMode("idle");
      return;
    }
    if (mode === "rendering") return;
    // Reset if we're coming back from done / error.
    if (mode === "done" || mode === "error") {
      historyRef.current = [];
      setBubbles([]);
      setCells([]);
      setErrorMsg(null);
    }
    // First user tap: emit the opener as an AI bubble + TTS, then start
    // listening. If the user picked a language, we open in it; otherwise
    // English.
    if (historyRef.current.length === 0) {
      const openerLang = pinnedLang ?? "en";
      const opener = OPENERS[openerLang] ?? OPENERS.en;
      historyRef.current.push({
        role: "assistant",
        content: opener,
        languageCode: openerLang,
      });
      setBubbles([
        {
          id: `ai-opener-${Date.now()}`,
          role: "ai",
          text: opener,
          languageCode: openerLang,
        },
      ]);
      setMode("speaking");
      await speak(opener, openerLang);
      startListening(openerLang);
      return;
    }
    // Otherwise just resume listening in the current language.
    startListening();
  }, [mode, pinnedLang, cancelSpeak, speak, startListening, stopListening]);

  // Cleanup on unmount.
  useEffect(() => {
    return () => {
      recognitionRef.current?.abort();
      chatAbortRef.current?.abort();
      cancelSpeak();
    };
  }, [cancelSpeak]);

  const micLabel = useMemo<string>(() => {
    switch (mode) {
      case "listening":
        return "Listening — tap to stop";
      case "thinking":
        return "Thinking — tap to cancel";
      case "speaking":
        return "Speaking — tap to interrupt";
      case "rendering":
        return "Generating posters — please wait";
      case "done":
        return "Done — tap to start over";
      case "error":
        return "Tap to try again";
      default:
        return "Tap and speak in any Indian language";
    }
  }, [mode]);

  const caption = useMemo<string>(() => {
    switch (mode) {
      case "listening":
        return "Listening…";
      case "thinking":
        return "Thinking…";
      case "speaking":
        return "Speaking…";
      case "rendering":
        return "Generating posters in 9 languages…";
      case "done":
        return "Ready! Your posters are below.";
      case "error":
        return errorMsg ?? "Something went wrong.";
      default:
        return "Tap the mic and speak in any Indian language.";
    }
  }, [mode, errorMsg]);

  // Unsupported-browser screen -----------------------------------------
  if (supported === false) {
    return (
      <main className="min-h-screen bg-bazaar-canvas flex flex-col">
        <VoiceHeader onOpenByok={() => setByokOpen(true)} />
        <section className="flex-1 flex flex-col items-center justify-center px-6 text-center gap-4">
          <div className="text-6xl" aria-hidden="true">
            🎤
          </div>
          <h2 className="font-display italic text-2xl text-bazaar-ink">
            Voice mode needs Chrome, Edge, or Safari
          </h2>
          <p className="text-bazaar-ink/75 max-w-md">
            Your browser doesn&rsquo;t support the Web Speech API. Try Chrome,
            Edge, or Safari — or use the text-mode editor instead.
          </p>
          <Link
            href="/"
            className="mt-2 px-5 py-2.5 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors"
          >
            ⌨️ Go to text mode
          </Link>
        </section>
        <ByokKeyModal open={byokOpen} onClose={() => setByokOpen(false)} />
      </main>
    );
  }

  // Main UI ------------------------------------------------------------
  const showChips = mode === "idle" && bubbles.length === 0;

  return (
    <main className="min-h-screen bg-bazaar-canvas flex flex-col">
      <VoiceHeader onOpenByok={() => setByokOpen(true)} />

      <section className="flex-1 flex flex-col items-center justify-center px-4 sm:px-6 py-6">
        {/* Transcript region — always mounted so screen readers get the live region */}
        {bubbles.length > 0 && mode !== "rendering" && mode !== "done" ? (
          <VoiceTranscript
            bubbles={bubbles}
            aiThinking={mode === "thinking"}
          />
        ) : null}

        {/* Rendering / done view: poster grid */}
        {mode === "rendering" || mode === "done" ? (
          <PosterFanout cells={cells} />
        ) : (
          <div className="flex flex-col items-center gap-6 mt-4">
            <VoiceMic
              mode={mode}
              onToggle={() => void handleMicTap()}
              disabled={false}
              label={micLabel}
            />
            <div className="text-center max-w-md">
              <p
                className={`font-display italic text-xl sm:text-2xl text-bazaar-ink ${
                  effectiveLangObj?.fontClass ?? ""
                }`}
                aria-live="polite"
              >
                {caption}
              </p>
              {mode === "idle" && bubbles.length === 0 ? (
                <p className="text-xs text-bazaar-ink/60 mt-2">
                  Or press <kbd className="px-1.5 py-0.5 rounded bg-bazaar-ink/10 font-mono text-[10px]">Space</kbd>
                </p>
              ) : null}
            </div>
            {showChips ? (
              <div className="pt-2">
                <VoiceLanguageChips active={pinnedLang} onPick={setPinnedLang} />
              </div>
            ) : null}
          </div>
        )}
      </section>
    </main>
  );
}

// ---- Header ----------------------------------------------------------

function VoiceHeader({ onOpenByok }: { onOpenByok: () => void }): React.ReactElement {
  return (
    <header className="border-b border-bazaar-ink/10 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-2xl sm:text-3xl text-bazaar-ink italic leading-none">
          BazaarBoard
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bazaar-tangerine/15 text-bazaar-tangerine font-medium">
          Voice mode
        </span>
        <div className="ml-auto flex items-center gap-2">
          <Link
            href="/"
            className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
            aria-label="Switch to text mode"
          >
            ⌨️ Text mode
          </Link>
          <button
            onClick={onOpenByok}
            className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Set Gemini key
          </button>
        </div>
      </div>
    </header>
  );
}

// ---- Poster fan-out grid --------------------------------------------

function PosterFanout({ cells }: { cells: CellState[] }): React.ReactElement {
  const [playing, setPlaying] = useState(false);
  const [slideIdx, setSlideIdx] = useState(0);
  const ready = cells.filter((c) => c.image);
  const allDone = cells.length > 0 && cells.every((c) => !c.loading);

  const stitchImages: StitchImage[] = ready.map((c) => {
    const lang = findLanguage(c.langCode);
    return {
      image: c.image!,
      mimeType: c.mimeType ?? "image/png",
      label: lang
        ? `${lang.englishName} · ${lang.nativeName}`
        : c.langCode,
    };
  });

  useEffect(() => {
    if (!playing) return;
    if (ready.length === 0) return;
    const id = window.setInterval(() => {
      setSlideIdx((n) => (n + 1) % ready.length);
    }, 1400);
    return () => window.clearInterval(id);
  }, [playing, ready.length]);

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {playing && ready.length > 0 ? (
        <div className="flex flex-col items-center gap-3">
          <div className="w-full max-w-md aspect-[3/4] bg-white rounded-2xl border border-bazaar-ink/10 shadow-xl overflow-hidden">
            <PosterImage cell={ready[slideIdx]} />
          </div>
          <div className="flex items-center gap-3">
            <p className={`text-sm ${findLanguage(ready[slideIdx].langCode)?.fontClass ?? ""}`}>
              {findLanguage(ready[slideIdx].langCode)?.nativeName}
              <span className="text-bazaar-ink/60 ml-2 font-sans">
                ({slideIdx + 1} / {ready.length})
              </span>
            </p>
            <button
              type="button"
              onClick={() => setPlaying(false)}
              className="text-xs px-3 py-1.5 rounded-full border border-bazaar-ink/30 hover:border-bazaar-tangerine/60 bg-white transition-colors"
            >
              Stop
            </button>
          </div>
        </div>
      ) : (
        <>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <p className="font-display italic text-xl text-bazaar-ink">
              {allDone
                ? `${ready.length} posters ready`
                : `Rendering… ${ready.length} / ${cells.length}`}
            </p>
            {allDone && ready.length > 0 ? (
              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => {
                    setSlideIdx(0);
                    setPlaying(true);
                  }}
                  className="text-sm px-4 py-2 rounded-full bg-white border border-bazaar-tangerine/60 text-bazaar-tangerine font-medium hover:bg-bazaar-tangerine/10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
                >
                  ▶ Preview slideshow
                </button>
                <VideoExportButton images={stitchImages} />
              </div>
            ) : null}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
            {cells.map((cell) => {
              const lang = findLanguage(cell.langCode);
              return (
                <div
                  key={cell.langCode}
                  className="bg-white rounded-xl border border-bazaar-ink/10 shadow-sm overflow-hidden"
                >
                  <div className="aspect-[3/4] flex items-center justify-center bg-bazaar-canvas">
                    {cell.loading ? (
                      <div className="animate-pulse text-xs text-bazaar-ink/50">
                        Rendering…
                      </div>
                    ) : cell.error ? (
                      <div className="text-xs text-bazaar-coral p-3 text-center">
                        {cell.error}
                      </div>
                    ) : (
                      <PosterImage cell={cell} />
                    )}
                  </div>
                  <div
                    className={`px-3 py-2 text-sm text-bazaar-ink flex items-center justify-between gap-2 border-t border-bazaar-ink/10 ${
                      lang?.fontClass ?? ""
                    }`}
                  >
                    <span>{lang?.nativeName ?? cell.langCode}</span>
                    <span className="text-[10px] font-sans text-bazaar-ink/50">
                      {lang?.englishName}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

function PosterImage({ cell }: { cell: CellState }): React.ReactElement | null {
  if (!cell.image) return null;
  const src = `data:${cell.mimeType ?? "image/png"};base64,${cell.image}`;
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={`Poster in ${findLanguage(cell.langCode)?.englishName ?? cell.langCode}`}
      className="w-full h-full object-cover"
    />
  );
}

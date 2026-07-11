"use client";

/**
 * /voice — chat + artifact-preview UX (Open Design pattern).
 *
 * LEFT pane: scrolling conversation. User & assistant bubbles, plus
 * inline artifact cards for every tool call the agent performs
 * (set_slot, set_language, regenerate, add_badge, export_*, undo).
 *
 * RIGHT pane: live "workspace" preview of the current brief and rendered
 * posters — a WYSIWYG mirror of what would export right now.
 *
 * Bottom-anchored composer keeps the mic reachable from every state:
 *   - hero variant (empty state): giant centered mic.
 *   - docked variant (any messages present): small mic + text input +
 *     design toolbox tray.
 *
 * State: single useReducer (`voiceReducer`). Tool calls dispatch actions,
 * append artifact cards to a timeline, and trigger async work (render,
 * ZIP/PDF/MP4 export). Coordinated with /api/chat which will start
 * returning `{kind:"tool_calls", toolCalls:[...]}` alongside the existing
 * `message`/`finalize` shapes.
 */

import Link from "next/link";
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from "react";
import { findLanguage } from "@/lib/languages";
import {
  generate,
  isError,
  getByokKey,
  downloadZip,
  type GenerateResult,
} from "@/lib/generate";
import { downloadPdf } from "@/lib/exportPdf";
import { VoiceMic } from "@/components/VoiceMic";
import { VoiceLanguageChips } from "@/components/VoiceLanguageChips";
import { VoiceComposer } from "@/components/VoiceComposer";
import { VoiceWorkspace } from "@/components/VoiceWorkspace";
import { ByokKeyModal } from "@/components/ByokKeyModal";
import { SlotEditCard } from "@/components/artifacts/SlotEditCard";
import { LanguageChangeCard } from "@/components/artifacts/LanguageChangeCard";
import { RegenerateCard } from "@/components/artifacts/RegenerateCard";
import { BadgeCard } from "@/components/artifacts/BadgeCard";
import { ExportCard, type ExportKind } from "@/components/artifacts/ExportCard";
import { UndoCard } from "@/components/artifacts/UndoCard";
import {
  INITIAL_STATE,
  voiceReducer,
  type ToolCall,
} from "@/lib/voiceReducer";
import {
  canStitch,
  stitchSlideshow,
  type StitchImage,
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

// ---- Chat API contract ------------------------------------------------

interface ChatMessage {
  role: "user" | "assistant";
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
interface ChatReplyTools {
  kind: "tool_calls";
  toolCalls: ToolCall[];
  message?: string;
  language?: string;
}
type ChatReply = ChatReplyText | ChatReplyFinal | ChatReplyTools;

// ---- Timeline entries -------------------------------------------------

type TimelineEntry =
  | {
      kind: "bubble";
      id: string;
      role: "ai" | "user";
      text: string;
      languageCode?: string;
      interim?: boolean;
    }
  | { kind: "artifact"; id: string; node: React.ReactNode };

// ---- Constants --------------------------------------------------------

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

function detectLanguageFromText(text: string): string | null {
  for (const ch of text) {
    const c = ch.codePointAt(0);
    if (c === undefined) continue;
    if (c >= 0x0900 && c <= 0x097f) return "hi";
    if (c >= 0x0b80 && c <= 0x0bff) return "ta";
    if (c >= 0x0980 && c <= 0x09ff) return "bn";
    if (c >= 0x0c00 && c <= 0x0c7f) return "te";
    if (c >= 0x0c80 && c <= 0x0cff) return "kn";
    if (c >= 0x0d00 && c <= 0x0d7f) return "ml";
    if (c >= 0x0a00 && c <= 0x0a7f) return "pa";
    if (c >= 0x0a80 && c <= 0x0aff) return "gu";
  }
  return null;
}

// ---- Component --------------------------------------------------------

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
  const [timeline, setTimeline] = useState<TimelineEntry[]>([]);
  const [byokOpen, setByokOpen] = useState(false);
  const [workspaceOpen, setWorkspaceOpen] = useState(false);
  const [state, dispatch] = useReducer(voiceReducer, INITIAL_STATE);
  const briefRef = useRef(state.brief);
  briefRef.current = state.brief;

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null);
  const historyRef = useRef<ChatMessage[]>([]);
  const interimBubbleIdRef = useRef<string | null>(null);
  const currentUserTextRef = useRef<string>("");
  const chatAbortRef = useRef<AbortController | null>(null);
  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  const effectiveLang = pinnedLang ?? detectedLang;
  const effectiveLangObj = useMemo(
    () => findLanguage(effectiveLang),
    [effectiveLang],
  );

  useEffect(() => {
    setSupported(getSpeechRecognitionCtor() !== null);
  }, []);

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

  // ---- Timeline helpers -----------------------------------------------

  const appendBubble = useCallback(
    (bubble: Omit<Extract<TimelineEntry, { kind: "bubble" }>, "kind">) => {
      setTimeline((t) => [...t, { kind: "bubble", ...bubble }]);
    },
    [],
  );
  const appendArtifact = useCallback(
    (id: string, node: React.ReactNode) => {
      setTimeline((t) => [...t, { kind: "artifact", id, node }]);
    },
    [],
  );
  const updateArtifact = useCallback(
    (id: string, node: React.ReactNode) => {
      setTimeline((t) =>
        t.map((e) =>
          e.kind === "artifact" && e.id === id
            ? { ...e, node }
            : e,
        ),
      );
    },
    [],
  );

  // ---- Poster rendering ----------------------------------------------

  const runRegenerate = useCallback(
    async (codes: string[]): Promise<void> => {
      dispatch({ type: "regenerate_start", codes });
      setMode("rendering");
      const startedAt = Date.now();
      const artifactId = `regen-${startedAt}`;
      appendArtifact(
        artifactId,
        <RegenerateCard
          codes={codes}
          cells={codes.map((c) => ({ langCode: c, loading: true }))}
          startedAt={startedAt}
        />,
      );
      await Promise.all(
        codes.map(async (code) => {
          const b = briefRef.current;
          const result = await generate({
            productName: b.productName || "Product",
            price: b.price || "₹99",
            businessName: b.businessName || "",
            languageCode: code,
            surfaceKind: b.surface,
            brandColor: b.brandColor || "#F26B1F",
          });
          if (isError(result)) {
            dispatch({
              type: "regenerate_cell_done",
              langCode: code,
              error: result.error,
            });
          } else {
            const ok = result as GenerateResult;
            dispatch({
              type: "regenerate_cell_done",
              langCode: code,
              image: ok.image,
              mimeType: ok.mimeType,
            });
          }
        }),
      );
      // Rerender the artifact with the finalized cell state (read after
      // the awaits so the mini thumbnails are populated).
      updateArtifact(
        artifactId,
        <RegenerateCard
          codes={codes}
          cells={briefRef.current.cells}
          startedAt={startedAt}
        />,
      );
      setMode("done");
    },
    [appendArtifact, updateArtifact],
  );

  // ---- Export runners -------------------------------------------------

  const timestamp = (): string => {
    const d = new Date();
    const pad = (n: number): string => n.toString().padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
  };

  const runExport = useCallback(
    async (kind: ExportKind): Promise<void> => {
      const b = briefRef.current;
      const readyCells = b.cells.filter((c) => c.image);
      const artifactId = `export-${kind}-${Date.now()}`;
      const filenameBase = `bazaarboard-${timestamp()}`;
      const count = readyCells.length;

      if (count === 0) {
        appendArtifact(
          artifactId,
          <ExportCard
            kind={kind}
            status="error"
            errorMessage="no posters to export"
          />,
        );
        return;
      }

      appendArtifact(
        artifactId,
        <ExportCard kind={kind} status="preparing" count={count} />,
      );

      try {
        if (kind === "zip") {
          const files = readyCells.map((c) => {
            const lang = findLanguage(c.langCode);
            const ext = (c.mimeType ?? "image/png").includes("svg")
              ? "svg"
              : "png";
            return {
              filename: `${lang?.englishName ?? c.langCode}.${ext}`,
              image: c.image!,
              mimeType: c.mimeType ?? "image/png",
            };
          });
          await downloadZip(files, `${filenameBase}.zip`);
          updateArtifact(
            artifactId,
            <ExportCard
              kind="zip"
              status="ready"
              count={count}
              filename={`${filenameBase}.zip`}
              onSave={() => void downloadZip(files, `${filenameBase}.zip`)}
            />,
          );
        } else if (kind === "pdf") {
          const posters = readyCells.map((c) => ({
            langCode: c.langCode,
            image: c.image!,
            mimeType: c.mimeType ?? "image/png",
          }));
          const filename = `${filenameBase}.pdf`;
          downloadPdf(posters, filename, "BazaarBoard export");
          updateArtifact(
            artifactId,
            <ExportCard
              kind="pdf"
              status="ready"
              count={count}
              filename={filename}
              onSave={() =>
                downloadPdf(posters, filename, "BazaarBoard export")
              }
            />,
          );
        } else if (kind === "mp4") {
          if (!canStitch()) {
            updateArtifact(
              artifactId,
              <ExportCard
                kind="mp4"
                status="error"
                errorMessage="video export unsupported in this browser"
              />,
            );
            return;
          }
          const images: StitchImage[] = readyCells.map((c) => {
            const lang = findLanguage(c.langCode);
            return {
              image: c.image!,
              mimeType: c.mimeType ?? "image/png",
              label: lang
                ? `${lang.englishName} · ${lang.nativeName}`
                : c.langCode,
            };
          });
          const audio = await synthIdentAsync(2.5);
          const result = await stitchSlideshow({
            images,
            perImageSeconds: 0.85,
            fadeMs: 300,
            narrationAudio: audio,
          });
          const ext = result.mimeType.includes("webm") ? "webm" : "mp4";
          const filename = `${filenameBase}.${ext}`;
          const save = (): void => {
            const url = URL.createObjectURL(result.blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            a.click();
            setTimeout(() => URL.revokeObjectURL(url), 4000);
          };
          save();
          updateArtifact(
            artifactId,
            <ExportCard
              kind="mp4"
              status="ready"
              count={count}
              filename={filename}
              sizeBytes={result.blob.size}
              onSave={save}
            />,
          );
        }
      } catch (err) {
        updateArtifact(
          artifactId,
          <ExportCard
            kind={kind}
            status="error"
            errorMessage={
              err instanceof Error ? err.message : "export failed"
            }
          />,
        );
      }
    },
    [appendArtifact, updateArtifact],
  );

  // ---- Tool-call dispatcher -------------------------------------------

  const runToolCall = useCallback(
    async (call: ToolCall): Promise<void> => {
      switch (call.name) {
        case "set_slot": {
          dispatch({
            type: "set_slot",
            field: call.args.field,
            value: call.args.value,
          });
          appendArtifact(
            call.id,
            <SlotEditCard field={call.args.field} value={call.args.value} />,
          );
          return;
        }
        case "set_language": {
          dispatch({ type: "set_language", codes: call.args.codes });
          appendArtifact(
            call.id,
            <LanguageChangeCard codes={call.args.codes} />,
          );
          return;
        }
        case "set_surface": {
          dispatch({ type: "set_surface", surface: call.args.surface });
          appendArtifact(
            call.id,
            <SlotEditCard field="brandColor" value={call.args.surface} />,
          );
          return;
        }
        case "add_badge": {
          dispatch({ type: "add_badge", badge: call.args.badge });
          appendArtifact(call.id, <BadgeCard badge={call.args.badge} />);
          return;
        }
        case "remove_badge": {
          dispatch({ type: "remove_badge", badge: call.args.badge });
          appendArtifact(
            call.id,
            <BadgeCard badge={call.args.badge} removed />,
          );
          return;
        }
        case "regenerate": {
          const codes =
            call.args.codes && call.args.codes.length > 0
              ? call.args.codes
              : briefRef.current.languageCodes.length > 0
                ? briefRef.current.languageCodes
                : [effectiveLang];
          await runRegenerate(codes);
          return;
        }
        case "export_zip":
          await runExport("zip");
          return;
        case "export_pdf":
          await runExport("pdf");
          return;
        case "export_mp4":
          await runExport("mp4");
          return;
        case "undo": {
          dispatch({ type: "undo" });
          appendArtifact(call.id, <UndoCard />);
          return;
        }
        default:
          return;
      }
    },
    [appendArtifact, runRegenerate, runExport, effectiveLang],
  );

  // ---- Chat turn ------------------------------------------------------

  const sendUserTurn = useCallback(
    async (userText: string, userLangCode: string): Promise<void> => {
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
              role: m.role,
              content: m.content,
            })),
            languageHint: userLangCode,
          }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const body = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
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
        // Back-compat with the current /api/chat: treat `finalize` as a
        // regenerate across all 9 languages using the returned order.
        const closer =
          reply.text ??
          `${effectiveLangObj?.englishName ?? "OK"} — generating your posters.`;
        historyRef.current.push({
          role: "assistant",
          content: closer,
          languageCode: reply.order.languageCode,
        });
        appendBubble({
          id: `ai-${Date.now()}`,
          role: "ai",
          text: closer,
          languageCode: reply.order.languageCode,
        });
        dispatch({
          type: "set_slot",
          field: "productName",
          value: reply.order.productName,
        });
        dispatch({
          type: "set_slot",
          field: "price",
          value: reply.order.price,
        });
        if (reply.order.businessName) {
          dispatch({
            type: "set_slot",
            field: "businessName",
            value: reply.order.businessName,
          });
        }
        dispatch({
          type: "set_slot",
          field: "brandColor",
          value: reply.order.brandColor,
        });
        setMode("speaking");
        await speak(closer, reply.order.languageCode);
        const codes = [
          "en",
          "hi",
          "ta",
          "bn",
          "te",
          "kn",
          "ml",
          "pa",
          "gu",
        ];
        dispatch({ type: "set_language", codes });
        await runRegenerate(codes);
        return;
      }

      if (reply.kind === "tool_calls") {
        // New contract from the /api/chat agent. Run each tool call in
        // order, appending artifacts. If a natural-language message came
        // along, treat it as an AI bubble first so context reads right.
        if (reply.message) {
          historyRef.current.push({
            role: "assistant",
            content: reply.message,
            languageCode: reply.language,
          });
          appendBubble({
            id: `ai-${Date.now()}`,
            role: "ai",
            text: reply.message,
            languageCode: reply.language,
          });
          if (reply.message) {
            setMode("speaking");
            await speak(reply.message, reply.language ?? effectiveLang);
          }
        }
        for (const call of reply.toolCalls) {
          await runToolCall(call);
        }
        // Loop back to listening for the next turn (unless a render is
        // in flight or the tool set already switched us to `rendering` /
        // `done`).
        setMode((m) => (m === "rendering" ? m : "idle"));
        return;
      }

      // Plain text message turn.
      historyRef.current.push({
        role: "assistant",
        content: reply.text,
        languageCode: reply.language,
      });
      appendBubble({
        id: `ai-${Date.now()}`,
        role: "ai",
        text: reply.text,
        languageCode: reply.language,
      });
      setMode("speaking");
      await speak(reply.text, reply.language);
      startListening(reply.language);
    },
    // startListening is defined below; captured via closure.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      appendBubble,
      runRegenerate,
      runToolCall,
      speak,
      effectiveLangObj,
      effectiveLang,
    ],
  );

  // ---- Listening ------------------------------------------------------

  const startListening = useCallback(
    (langHint?: string) => {
      const Ctor = getSpeechRecognitionCtor();
      if (!Ctor) {
        setSupported(false);
        return;
      }
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

        if (!pinnedLang) {
          const detected = detectLanguageFromText(combined);
          if (detected && detected !== detectedLang) {
            setDetectedLang(detected);
          }
        }
        const bubbleLang =
          pinnedLang ?? detectLanguageFromText(combined) ?? detectedLang;
        const id = interimBubbleIdRef.current;
        setTimeline((prev) => {
          if (id === null) {
            const newId = `user-${Date.now()}`;
            interimBubbleIdRef.current = newId;
            return [
              ...prev,
              {
                kind: "bubble",
                id: newId,
                role: "user",
                text: combined || "…",
                languageCode: bubbleLang,
                interim: !finalPart,
              },
            ];
          }
          return prev.map((e) =>
            e.kind === "bubble" && e.id === id
              ? {
                  ...e,
                  text: combined || "…",
                  languageCode: bubbleLang,
                  interim: !finalPart,
                }
              : e,
          );
        });
      };

      rec.onerror = (ev): void => {
        if (ev.error === "no-speech" || ev.error === "aborted") {
          setMode("idle");
          return;
        }
        if (
          ev.error === "not-allowed" ||
          ev.error === "service-not-allowed"
        ) {
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
        const id = interimBubbleIdRef.current;
        if (id !== null) {
          setTimeline((prev) =>
            prev.map((e) =>
              e.kind === "bubble" && e.id === id
                ? { ...e, interim: false }
                : e,
            ),
          );
        }
        interimBubbleIdRef.current = null;
        if (finalText.trim()) {
          const lang =
            pinnedLang ?? detectLanguageFromText(finalText) ?? detectedLang;
          void sendUserTurn(finalText, lang);
        } else {
          setMode("idle");
        }
      };

      recognitionRef.current = rec;
      try {
        rec.start();
      } catch {
        setMode("idle");
      }
    },
    [pinnedLang, detectedLang, cancelSpeak, sendUserTurn],
  );

  const stopListening = useCallback(() => {
    recognitionRef.current?.stop();
  }, []);

  const handleSendText = useCallback(
    (text: string) => {
      const t = text.trim();
      if (!t) return;
      const lang = pinnedLang ?? detectLanguageFromText(t) ?? detectedLang;
      appendBubble({
        id: `user-${Date.now()}`,
        role: "user",
        text: t,
        languageCode: lang,
      });
      void sendUserTurn(t, lang);
    },
    [pinnedLang, detectedLang, sendUserTurn, appendBubble],
  );

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
    if (mode === "done" || mode === "error") {
      // Continue the same conversation; only clear the error message.
      setErrorMsg(null);
    }
    if (historyRef.current.length === 0) {
      const openerLang = pinnedLang ?? "en";
      const opener = OPENERS[openerLang] ?? OPENERS.en;
      historyRef.current.push({
        role: "assistant",
        content: opener,
        languageCode: openerLang,
      });
      appendBubble({
        id: `ai-opener-${Date.now()}`,
        role: "ai",
        text: opener,
        languageCode: openerLang,
      });
      setMode("speaking");
      await speak(opener, openerLang);
      startListening(openerLang);
      return;
    }
    startListening();
  }, [
    mode,
    pinnedLang,
    cancelSpeak,
    speak,
    startListening,
    stopListening,
    appendBubble,
  ]);

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
        return "Done — tap to continue";
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
        return "Generating posters…";
      case "done":
        return "Ready! Ask for edits, or export.";
      case "error":
        return errorMsg ?? "Something went wrong.";
      default:
        return "Tap the mic and speak in any Indian language.";
    }
  }, [mode, errorMsg]);

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

  const isEmpty = timeline.length === 0;

  return (
    <main className="min-h-[100dvh] bg-bazaar-canvas flex flex-col">
      <VoiceHeader
        onOpenByok={() => setByokOpen(true)}
        onOpenWorkspace={() => setWorkspaceOpen(true)}
        workspaceHasContent={
          state.brief.cells.length > 0 || state.brief.productName.length > 0
        }
      />

      <div className="flex-1 flex overflow-hidden">
        {/* LEFT — chat log */}
        <section
          className="flex-1 flex flex-col min-w-0"
          aria-label="Chat log"
        >
          <div
            className="flex-1 overflow-y-auto"
            aria-live="polite"
            aria-relevant="additions text"
          >
            {isEmpty ? (
              <EmptyHero
                caption={caption}
                pinnedLang={pinnedLang}
                onPickLang={setPinnedLang}
                effectiveLangFontClass={effectiveLangObj?.fontClass ?? ""}
                onMicToggle={() => void handleMicTap()}
                mode={mode}
                micLabel={micLabel}
              />
            ) : (
              <Timeline
                entries={timeline}
                aiThinking={mode === "thinking"}
              />
            )}
          </div>

          {/* Docked composer — always shown once we have any turns. */}
          {!isEmpty ? (
            <div className="border-t border-bazaar-ink/10 bg-white/80 backdrop-blur">
              <div className="px-4 pt-2 text-center">
                <p
                  className={`text-xs text-bazaar-ink/60 ${
                    effectiveLangObj?.fontClass ?? ""
                  }`}
                  aria-live="polite"
                >
                  {caption}
                </p>
              </div>
              <VoiceComposer
                mode={mode}
                onMicToggle={() => void handleMicTap()}
                micLabel={micLabel}
                onSendText={handleSendText}
                variant="docked"
                disabled={mode === "rendering"}
              />
            </div>
          ) : null}
        </section>

        {/* RIGHT — workspace (desktop). Hidden below md; use drawer. */}
        <div className="hidden md:block w-[360px] lg:w-[420px] shrink-0">
          <VoiceWorkspace brief={state.brief} />
        </div>
      </div>

      {/* Mobile workspace drawer */}
      {workspaceOpen ? (
        <div
          role="dialog"
          aria-label="Workspace"
          className="md:hidden fixed inset-0 z-40 bg-bazaar-ink/40 flex items-end"
          onClick={() => setWorkspaceOpen(false)}
        >
          <div
            className="w-full max-h-[80vh] bg-bazaar-canvas rounded-t-2xl shadow-2xl flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-2 p-3 border-b border-bazaar-ink/10">
              <span className="font-display italic text-lg text-bazaar-ink">
                Workspace
              </span>
              <button
                type="button"
                onClick={() => setWorkspaceOpen(false)}
                aria-label="Close workspace"
                className="ml-auto text-sm px-2 py-1 rounded-full border border-bazaar-ink/20 hover:border-bazaar-tangerine/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
              >
                ✕
              </button>
            </div>
            <div className="flex-1 overflow-y-auto">
              <VoiceWorkspace brief={state.brief} />
            </div>
          </div>
        </div>
      ) : null}

      <ByokKeyModal open={byokOpen} onClose={() => setByokOpen(false)} />
    </main>
  );
}

// ---- Header ----------------------------------------------------------

function VoiceHeader({
  onOpenByok,
  onOpenWorkspace,
  workspaceHasContent,
}: {
  onOpenByok: () => void;
  onOpenWorkspace?: () => void;
  workspaceHasContent?: boolean;
}): React.ReactElement {
  return (
    <header className="border-b border-bazaar-ink/10 bg-white/80 backdrop-blur">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3 flex items-center gap-3 flex-wrap">
        <h1 className="font-display text-2xl sm:text-3xl text-bazaar-ink italic leading-none">
          BazaarBoard
        </h1>
        <span className="text-xs px-2 py-0.5 rounded-full bg-bazaar-tangerine/15 text-bazaar-tangerine font-medium">
          Voice mode
        </span>
        <div className="ml-auto flex items-center gap-2">
          {onOpenWorkspace ? (
            <button
              type="button"
              onClick={onOpenWorkspace}
              className={`md:hidden text-xs px-3 py-2 rounded-full border transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 ${
                workspaceHasContent
                  ? "border-bazaar-tangerine/60 text-bazaar-tangerine bg-bazaar-tangerine/5"
                  : "border-bazaar-ink/30 bg-white text-bazaar-ink"
              }`}
              aria-label="Open workspace"
            >
              🗂 Workspace
            </button>
          ) : null}
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

// ---- Empty hero ------------------------------------------------------

function EmptyHero({
  caption,
  pinnedLang,
  onPickLang,
  effectiveLangFontClass,
  onMicToggle,
  mode,
  micLabel,
}: {
  caption: string;
  pinnedLang: string | null;
  onPickLang: (code: string | null) => void;
  effectiveLangFontClass: string;
  onMicToggle: () => void;
  mode: Mode;
  micLabel: string;
}): React.ReactElement {
  return (
    <div className="min-h-full flex flex-col items-center justify-center px-4 sm:px-6 py-10 gap-6">
      <VoiceMic
        mode={mode}
        onToggle={onMicToggle}
        disabled={false}
        label={micLabel}
      />
      <div className="text-center max-w-md">
        <p
          className={`font-display italic text-xl sm:text-2xl text-bazaar-ink ${effectiveLangFontClass}`}
          aria-live="polite"
        >
          {caption}
        </p>
        <p className="text-xs text-bazaar-ink/60 mt-2">
          Or press{" "}
          <kbd className="px-1.5 py-0.5 rounded bg-bazaar-ink/10 font-mono text-[10px]">
            Space
          </kbd>
        </p>
      </div>
      <div className="pt-2">
        <VoiceLanguageChips active={pinnedLang} onPick={onPickLang} />
      </div>
    </div>
  );
}

// ---- Timeline --------------------------------------------------------

function Timeline({
  entries,
  aiThinking,
}: {
  entries: TimelineEntry[];
  aiThinking: boolean;
}): React.ReactElement {
  const ref = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    ref.current?.scrollTo({
      top: ref.current.scrollHeight,
      behavior: "smooth",
    });
  }, [entries, aiThinking]);
  return (
    <div
      ref={ref}
      className="w-full max-w-3xl mx-auto space-y-3 px-3 sm:px-4 py-4"
    >
      {entries.map((e) =>
        e.kind === "bubble" ? (
          <TimelineBubble
            key={e.id}
            role={e.role}
            text={e.text}
            languageCode={e.languageCode}
            interim={e.interim}
          />
        ) : (
          <div key={e.id}>{e.node}</div>
        ),
      )}
      {aiThinking ? <ThinkingBubble /> : null}
    </div>
  );
}

function TimelineBubble({
  role,
  text,
  languageCode,
  interim,
}: {
  role: "ai" | "user";
  text: string;
  languageCode?: string;
  interim?: boolean;
}): React.ReactElement {
  const isAi = role === "ai";
  const fontClass =
    languageCode !== undefined
      ? findLanguage(languageCode)?.fontClass ?? "font-sans"
      : "font-sans";
  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-base leading-relaxed ${fontClass} ${
          isAi
            ? "bg-white border border-bazaar-ink/10 text-bazaar-ink rounded-bl-sm shadow-sm"
            : "bg-bazaar-tangerine text-white rounded-br-sm shadow-sm"
        } ${interim ? "opacity-70 italic" : ""}`}
      >
        {text || " "}
      </div>
    </div>
  );
}

function ThinkingBubble(): React.ReactElement {
  return (
    <div className="flex justify-start">
      <div className="px-4 py-3 rounded-2xl bg-white border border-bazaar-ink/10 rounded-bl-sm shadow-sm flex items-center gap-1.5">
        <span
          className="w-2 h-2 rounded-full bg-bazaar-ink/40 animate-bounce"
          style={{ animationDelay: "0ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-bazaar-ink/40 animate-bounce"
          style={{ animationDelay: "150ms" }}
        />
        <span
          className="w-2 h-2 rounded-full bg-bazaar-ink/40 animate-bounce"
          style={{ animationDelay: "300ms" }}
        />
      </div>
    </div>
  );
}

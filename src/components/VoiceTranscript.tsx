"use client";

/**
 * VoiceTranscript — chat-bubble stack. AI on the left, user on the
 * right. AI bubbles get a typewriter reveal; user bubbles show
 * streaming interim results while the user is still speaking.
 *
 * No external deps — the typewriter is a plain setInterval that
 * advances a `chars` counter. Cleared on unmount / prop change to
 * keep things deterministic.
 */

import { useEffect, useRef, useState } from "react";
import { findLanguage } from "@/lib/languages";

export interface Bubble {
  id: string;
  role: "ai" | "user";
  text: string;
  languageCode?: string;
  /** true when this is still being appended (interim STT) */
  interim?: boolean;
}

interface Props {
  bubbles: Bubble[];
  aiThinking: boolean;
}

export function VoiceTranscript({ bubbles, aiThinking }: Props): React.ReactElement {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({
      top: scrollRef.current.scrollHeight,
      behavior: "smooth",
    });
  }, [bubbles, aiThinking]);

  return (
    <div
      ref={scrollRef}
      aria-live="polite"
      aria-relevant="additions text"
      className="w-full max-w-2xl mx-auto flex-1 overflow-y-auto space-y-3 px-2 pb-4"
    >
      {bubbles.map((b) => (
        <BubbleView key={b.id} bubble={b} />
      ))}
      {aiThinking ? <ThinkingBubble /> : null}
    </div>
  );
}

function BubbleView({ bubble }: { bubble: Bubble }): React.ReactElement {
  const isAi = bubble.role === "ai";
  const fontClass =
    bubble.languageCode !== undefined
      ? findLanguage(bubble.languageCode)?.fontClass ?? "font-sans"
      : "font-sans";
  // Typewriter reveal for AI text only. User bubbles show their
  // (interim or final) text immediately.
  const [chars, setChars] = useState(isAi ? 0 : bubble.text.length);
  useEffect(() => {
    if (!isAi) {
      setChars(bubble.text.length);
      return;
    }
    setChars(0);
    let n = 0;
    const id = window.setInterval(() => {
      n += 1;
      setChars(n);
      if (n >= bubble.text.length) {
        window.clearInterval(id);
      }
    }, 18);
    return () => window.clearInterval(id);
  }, [bubble.text, isAi]);

  const shown = isAi ? bubble.text.slice(0, chars) : bubble.text;

  return (
    <div className={`flex ${isAi ? "justify-start" : "justify-end"}`}>
      <div
        className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-base leading-relaxed ${fontClass} ${
          isAi
            ? "bg-white border border-bazaar-ink/10 text-bazaar-ink rounded-bl-sm shadow-sm"
            : "bg-bazaar-tangerine text-white rounded-br-sm shadow-sm"
        } ${bubble.interim ? "opacity-70 italic" : ""}`}
      >
        {shown || " "}
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

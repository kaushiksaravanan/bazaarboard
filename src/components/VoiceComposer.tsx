"use client";

/**
 * VoiceComposer — the bottom-anchored composer. Renders in two variants:
 *
 *   - hero: the giant mic centered on-canvas for the empty state.
 *   - docked: mic ~80px in the bottom-right, a text input, and a "+"
 *     toolbox trigger. Both variants keep the mic reachable from every
 *     app state, including while posters are rendering.
 */

import { useState } from "react";
import { VoiceMic } from "@/components/VoiceMic";
import { DesignToolboxTray } from "@/components/DesignToolboxTray";

type MicMode =
  | "idle"
  | "listening"
  | "thinking"
  | "speaking"
  | "rendering"
  | "done"
  | "error";

interface Props {
  mode: MicMode;
  onMicToggle: () => void;
  micLabel: string;
  /** Send a plain text turn into the chat (from the input or a toolbox chip). */
  onSendText: (text: string) => void;
  variant: "hero" | "docked";
  disabled?: boolean;
}

export function VoiceComposer({
  mode,
  onMicToggle,
  micLabel,
  onSendText,
  variant,
  disabled,
}: Props): React.ReactElement {
  const [text, setText] = useState("");
  const [trayOpen, setTrayOpen] = useState(false);

  const send = (): void => {
    const t = text.trim();
    if (!t) return;
    onSendText(t);
    setText("");
  };

  if (variant === "hero") {
    return (
      <div className="flex flex-col items-center gap-4">
        <VoiceMic
          mode={mode}
          onToggle={onMicToggle}
          disabled={disabled}
          label={micLabel}
        />
      </div>
    );
  }

  // Docked composer — mic + text input + toolbox.
  return (
    <div className="w-full max-w-3xl mx-auto space-y-2 px-3 sm:px-4 pb-3 pt-2">
      <DesignToolboxTray
        open={trayOpen}
        onClose={() => setTrayOpen(false)}
        onQuickAction={(t) => onSendText(t)}
      />
      <div className="flex items-end gap-2">
        <button
          type="button"
          onClick={() => setTrayOpen((v) => !v)}
          aria-label="Open design toolbox"
          aria-expanded={trayOpen}
          className="shrink-0 w-11 h-11 rounded-full bg-white border border-bazaar-ink/20 hover:border-bazaar-tangerine/60 text-bazaar-ink flex items-center justify-center text-lg font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
        >
          +
        </button>
        <div className="flex-1 min-w-0 rounded-2xl border border-bazaar-ink/15 bg-white shadow-sm focus-within:border-bazaar-tangerine/60 transition-colors">
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                send();
              }
            }}
            placeholder="Type a message, or use the mic…"
            rows={1}
            aria-label="Message input"
            className="w-full resize-none bg-transparent px-3 py-2.5 text-sm text-bazaar-ink placeholder:text-bazaar-ink/40 outline-none max-h-32"
          />
        </div>
        {text.trim().length > 0 ? (
          <button
            type="button"
            onClick={send}
            aria-label="Send message"
            className="shrink-0 h-11 px-4 rounded-full bg-bazaar-tangerine text-white text-sm font-medium hover:bg-bazaar-tangerine/90 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2"
          >
            Send
          </button>
        ) : null}
        <div className="shrink-0">
          <DockedMic
            mode={mode}
            onMicToggle={onMicToggle}
            micLabel={micLabel}
            disabled={disabled}
          />
        </div>
      </div>
    </div>
  );
}

/**
 * DockedMic — a compact ~64-72px round mic button. Keeps the pulsing halo
 * so it never disappears visually, but skips the fullsize waveform (would
 * be too noisy at this size).
 */
function DockedMic({
  mode,
  onMicToggle,
  micLabel,
  disabled,
}: {
  mode: MicMode;
  onMicToggle: () => void;
  micLabel: string;
  disabled?: boolean;
}): React.ReactElement {
  const idle = mode === "idle" || mode === "done" || mode === "error";
  const active = mode === "listening";
  return (
    <button
      type="button"
      onClick={onMicToggle}
      disabled={disabled}
      aria-label={micLabel}
      aria-pressed={active}
      className={`relative w-16 h-16 sm:w-[72px] sm:h-[72px] rounded-full flex items-center justify-center transition-all focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-bazaar-tangerine focus-visible:ring-offset-2 focus-visible:ring-offset-bazaar-canvas ${
        disabled
          ? "bg-bazaar-ink/20 cursor-not-allowed"
          : active
            ? "bg-bazaar-tangerine shadow-2xl scale-105"
            : "bg-bazaar-tangerine shadow-lg hover:scale-105"
      }`}
    >
      {idle && !disabled ? (
        <span className="absolute inset-0 rounded-full bg-bazaar-tangerine/40 animate-ping" />
      ) : null}
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="relative w-7 h-7 sm:w-8 sm:h-8 text-white drop-shadow"
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

"use client";

/**
 * ByokKeyModal — bring-your-own-key modal for the Gemini API. Judges plug
 * their own billing-enabled key in on hackathon day because free-tier
 * Gemini has zero image-generation quota. Key is written ONLY to
 * sessionStorage (never localStorage, never a file, never a cookie) and
 * ridden on the X-Gemini-Key request header — the server picks it up in
 * /api/generate and prefers it over process.env.GEMINI_API_KEY.
 */

import { useEffect, useState } from "react";
import { getByokKey, setByokKey } from "@/lib/generate";

interface Props {
  open: boolean;
  onClose: () => void;
}

export function ByokKeyModal({ open, onClose }: Props): React.ReactElement | null {
  const [value, setValue] = useState("");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (open) {
      setValue(getByokKey() ?? "");
      setSaved(false);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const save = (): void => {
    setByokKey(value.trim() || null);
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  const clear = (): void => {
    setByokKey(null);
    setValue("");
    setSaved(true);
    setTimeout(() => onClose(), 600);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-bazaar-ink/40 backdrop-blur-sm"
      role="dialog"
      aria-modal="true"
      aria-label="Set Gemini API key"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white rounded-2xl border border-bazaar-ink/10 shadow-xl max-w-lg w-full p-6 space-y-4">
        <div>
          <h2 className="font-display italic text-2xl text-bazaar-ink">
            Bring your own Gemini key
          </h2>
          <p className="text-sm text-bazaar-ink/70 mt-1 leading-relaxed">
            Paste a Gemini API key with image-generation billing enabled. Stored
            only in this tab&rsquo;s <code>sessionStorage</code> — never sent to
            any server other than <code>/api/generate</code>, never written to
            disk, cleared when you close the tab.
          </p>
        </div>
        <div className="space-y-2">
          <label
            className="block text-sm font-medium text-bazaar-ink/80"
            htmlFor="byok-key-input"
          >
            Gemini API key
          </label>
          <input
            id="byok-key-input"
            type="password"
            autoComplete="off"
            spellCheck={false}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") save();
            }}
            placeholder="AIza..."
            className="w-full px-3 py-2 border border-bazaar-ink/20 rounded-lg text-base font-mono bg-white focus:border-bazaar-tangerine outline-none"
          />
          <p className="text-[11px] text-bazaar-ink/50">
            Get a key from{" "}
            <a
              href="https://aistudio.google.com/apikey"
              target="_blank"
              rel="noopener noreferrer"
              className="text-bazaar-tangerine underline"
            >
              aistudio.google.com/apikey
            </a>
            . Free-tier keys have zero image-gen quota — use a billing-enabled
            project key.
          </p>
        </div>
        <div className="flex items-center justify-end gap-2 pt-2">
          {saved ? (
            <span
              className="text-xs text-bazaar-leaf mr-auto"
              role="status"
              aria-live="polite"
            >
              Saved to this tab.
            </span>
          ) : null}
          <button
            onClick={clear}
            className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 hover:border-bazaar-coral/60 hover:text-bazaar-coral transition-colors"
          >
            Clear key
          </button>
          <button
            onClick={onClose}
            className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 hover:bg-bazaar-ink/5 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={save}
            className="text-xs px-4 py-2 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors"
          >
            Save key
          </button>
        </div>
      </div>
    </div>
  );
}

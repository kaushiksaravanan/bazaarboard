"use client";

/**
 * PrintPreview — a full-screen, print-only view that renders one poster
 * edge-to-edge on A4. Toggling this component's `open` prop calls
 * window.print() after a paint tick so the browser's print dialog opens
 * with the correct content in view. Print CSS in globals.css handles the
 * @page A4 sizing and hides the rest of the app chrome.
 */

import { useEffect } from "react";

interface Props {
  open: boolean;
  onClose: () => void;
  image: string;
  mimeType: string;
  alt: string;
}

export function PrintPreview({
  open,
  onClose,
  image,
  mimeType,
  alt,
}: Props): React.ReactElement | null {
  useEffect(() => {
    if (!open) return;
    // Give the browser one paint tick to lay out the print-only surface
    // before we trigger the print dialog.
    const timer = window.setTimeout(() => {
      window.print();
    }, 60);
    // When the print dialog closes (Chrome fires focus back to window),
    // dismiss the overlay. Also allow Esc to bail.
    const onFocus = (): void => {
      onClose();
    };
    const onKey = (e: KeyboardEvent): void => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("focus", onFocus);
    window.addEventListener("keydown", onKey);
    return () => {
      clearTimeout(timer);
      window.removeEventListener("focus", onFocus);
      window.removeEventListener("keydown", onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-40 bg-white"
      role="dialog"
      aria-modal="true"
      aria-label="Print preview"
    >
      <div className="no-print absolute top-4 right-4 flex gap-2">
        <button
          onClick={() => window.print()}
          className="text-xs px-3 py-2 rounded-full bg-bazaar-tangerine text-white font-medium hover:bg-bazaar-tangerine/90 transition-colors"
        >
          Print again
        </button>
        <button
          onClick={onClose}
          className="text-xs px-3 py-2 rounded-full border border-bazaar-ink/20 hover:bg-bazaar-ink/5 transition-colors"
        >
          Close
        </button>
      </div>
      <div className="print-only">
        <img
          src={`data:${mimeType};base64,${image}`}
          alt={alt}
        />
      </div>
    </div>
  );
}

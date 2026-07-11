"use client";

/**
 * exportPdf — build a multi-page PDF from base64 poster images.
 *
 * Uses jsPDF (installed for this workflow). One poster per page, portrait
 * A4, image centered with a small caption block underneath naming the
 * language. base64 comes from generate() results; mimeType decides the
 * `format` param jsPDF uses.
 *
 * Returns a Blob so the caller can pipe it into a download anchor.
 */

import { jsPDF } from "jspdf";
import { findLanguage } from "@/lib/languages";

export interface PdfPoster {
  langCode: string;
  image: string; // base64, no prefix
  mimeType: string;
}

export interface PdfExportInput {
  posters: PdfPoster[];
  title?: string;
}

const MIME_TO_FORMAT: Record<string, "PNG" | "JPEG" | "WEBP"> = {
  "image/png": "PNG",
  "image/jpeg": "JPEG",
  "image/jpg": "JPEG",
  "image/webp": "WEBP",
};

export function buildPdf({ posters, title }: PdfExportInput): Blob {
  // A4 in mm: 210 x 297. Portrait.
  const doc = new jsPDF({
    unit: "mm",
    format: "a4",
    orientation: "portrait",
  });
  const pageW = 210;
  const pageH = 297;
  const margin = 12;
  const imgW = pageW - margin * 2;
  const imgH = pageH - margin * 2 - 20; // leave room for caption

  posters.forEach((p, idx) => {
    if (idx > 0) doc.addPage();
    const format = MIME_TO_FORMAT[p.mimeType] ?? "PNG";
    // Only PNG/JPEG/WEBP are officially supported by jsPDF.addImage. SVG
    // sneaks in via `image/svg+xml` — the SVG fallback path in this app
    // means we may see it; skip embedding and just write the caption.
    if (p.mimeType.includes("svg")) {
      doc.setFont("helvetica", "italic");
      doc.setFontSize(11);
      doc.text(
        "(SVG preview mode — plug in a Gemini key for a full render)",
        pageW / 2,
        pageH / 2,
        { align: "center" },
      );
    } else {
      try {
        const dataUrl = `data:${p.mimeType};base64,${p.image}`;
        doc.addImage(dataUrl, format, margin, margin, imgW, imgH, undefined, "FAST");
      } catch {
        // Best-effort: write a placeholder caption if the image fails to
        // decode. Never let a single bad tile kill the whole PDF.
        doc.setFontSize(10);
        doc.text("(image failed to embed)", pageW / 2, pageH / 2, {
          align: "center",
        });
      }
    }
    const lang = findLanguage(p.langCode);
    const caption = lang
      ? `${lang.englishName} · ${lang.nativeName}`
      : p.langCode;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(12);
    doc.text(caption, pageW / 2, pageH - margin - 4, { align: "center" });
    if (title) {
      doc.setFontSize(9);
      doc.setTextColor(120);
      doc.text(title, pageW / 2, pageH - margin, { align: "center" });
      doc.setTextColor(0);
    }
  });

  return doc.output("blob");
}

export function downloadPdf(
  posters: PdfPoster[],
  filename: string,
  title?: string,
): void {
  const blob = buildPdf({ posters, title });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.style.display = "none";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 4000);
}

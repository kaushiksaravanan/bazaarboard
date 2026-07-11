/**
 * detectLanguage — cheap script-based language detection for the voice
 * agent. We don't need statistical models here: the 8 Indic scripts we
 * care about are all in disjoint Unicode blocks, and Latin defaults to
 * English. If the string has no strong signal (empty / punctuation
 * only), we return "en".
 *
 * Return values match the 9 language codes in src/lib/languages.ts.
 */

export type SupportedLanguage =
  | "hi"
  | "ta"
  | "bn"
  | "te"
  | "kn"
  | "ml"
  | "pa"
  | "gu"
  | "en";

interface ScriptRange {
  code: SupportedLanguage;
  test: (cp: number) => boolean;
}

// Unicode block ranges are inclusive on both ends. Devanagari, Bengali,
// Gurmukhi, Gujarati, Tamil, Telugu, Kannada, Malayalam are the eight
// Brahmic blocks that concern us; Devanagari Extended and Vedic are
// intentionally excluded — merchant-typed input never uses them.
const RANGES: ScriptRange[] = [
  { code: "hi", test: (c) => c >= 0x0900 && c <= 0x097f }, // Devanagari
  { code: "bn", test: (c) => c >= 0x0980 && c <= 0x09ff }, // Bengali
  { code: "pa", test: (c) => c >= 0x0a00 && c <= 0x0a7f }, // Gurmukhi
  { code: "gu", test: (c) => c >= 0x0a80 && c <= 0x0aff }, // Gujarati
  { code: "ta", test: (c) => c >= 0x0b80 && c <= 0x0bff }, // Tamil
  { code: "te", test: (c) => c >= 0x0c00 && c <= 0x0c7f }, // Telugu
  { code: "kn", test: (c) => c >= 0x0c80 && c <= 0x0cff }, // Kannada
  { code: "ml", test: (c) => c >= 0x0d00 && c <= 0x0d7f }, // Malayalam
];

export function detectLanguage(input: string): SupportedLanguage {
  if (!input) return "en";
  const counts: Record<SupportedLanguage, number> = {
    hi: 0,
    ta: 0,
    bn: 0,
    te: 0,
    kn: 0,
    ml: 0,
    pa: 0,
    gu: 0,
    en: 0,
  };
  for (const ch of input) {
    const cp = ch.codePointAt(0);
    if (cp === undefined) continue;
    let hit = false;
    for (const r of RANGES) {
      if (r.test(cp)) {
        counts[r.code]++;
        hit = true;
        break;
      }
    }
    if (!hit && cp >= 0x0041 && cp <= 0x007a) {
      // Basic Latin letters — could be English or a romanized Indic
      // token; the caller can override via languageHint.
      counts.en++;
    }
  }
  let winner: SupportedLanguage = "en";
  let best = 0;
  // Iterate Indic first so a mixed-script string with any Indic letters
  // resolves to that script rather than English.
  for (const code of ["hi", "ta", "bn", "te", "kn", "ml", "pa", "gu"] as const) {
    if (counts[code] > best) {
      best = counts[code];
      winner = code;
    }
  }
  if (best === 0) {
    return counts.en > 0 ? "en" : "en";
  }
  return winner;
}

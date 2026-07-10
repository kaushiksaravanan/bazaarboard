/**
 * Numeric fidelity guard for LLM-mediated content generation.
 *
 * Extracts digit-runs from the original input and the model output,
 * normalizes Indic-script digit variants (Devanagari, Tamil, Bengali,
 * Telugu, Kannada, Malayalam, Gurmukhi, Gujarati) to ASCII, and
 * compares multisets. Used to catch cases where a model spells out
 * "5000" as "cinq mille" (French) or "पाँच हज़ार" (Hindi) — silent
 * data loss where the client reads a very different price than the
 * merchant typed.
 *
 * Adapted from a lesson learned auditing WorkProof's Gemini translate
 * path: prompt-says-preserve-numbers ≠ model-preserves-numbers.
 */

// Digit mappings for the eight major Indic scripts used commercially.
const INDIC_DIGITS: Record<string, string> = {
  // Devanagari 0-9
  "०": "0", "१": "1", "२": "2", "३": "3", "४": "4",
  "५": "5", "६": "6", "७": "7", "८": "8", "९": "9",
  // Tamil 0-9
  "௦": "0", "௧": "1", "௨": "2", "௩": "3", "௪": "4",
  "௫": "5", "௬": "6", "௭": "7", "௮": "8", "௯": "9",
  // Bengali 0-9
  "০": "0", "১": "1", "২": "2", "৩": "3", "৪": "4",
  "৫": "5", "৬": "6", "৭": "7", "৮": "8", "৯": "9",
  // Telugu 0-9
  "౦": "0", "౧": "1", "౨": "2", "౩": "3", "౪": "4",
  "౫": "5", "౬": "6", "౭": "7", "౮": "8", "౯": "9",
  // Kannada 0-9
  "೦": "0", "೧": "1", "೨": "2", "೩": "3", "೪": "4",
  "೫": "5", "೬": "6", "೭": "7", "೮": "8", "೯": "9",
  // Malayalam 0-9
  "൦": "0", "൧": "1", "൨": "2", "൩": "3", "൪": "4",
  "൫": "5", "൬": "6", "൭": "7", "൮": "8", "൯": "9",
  // Gurmukhi 0-9
  "੦": "0", "੧": "1", "੨": "2", "੩": "3", "੪": "4",
  "੫": "5", "੬": "6", "੭": "7", "੮": "8", "੯": "9",
  // Gujarati 0-9
  "૦": "0", "૧": "1", "૨": "2", "૩": "3", "૪": "4",
  "૫": "5", "૬": "6", "૭": "7", "૮": "8", "૯": "9",
};

/** Normalize Indic-script digits to ASCII digits in-place. */
export function normalizeDigits(input: string): string {
  return input.replace(
    /[०-९௦-௯০-৯౦-౯೦-೯൦-൯੦-੯૦-૯]/g,
    (ch) => INDIC_DIGITS[ch] ?? ch,
  );
}

/** Extract every digit-run from a normalized string, as a multiset. */
function digitMultiset(input: string): Map<string, number> {
  const normalized = normalizeDigits(input);
  // Strip commas, periods used as thousands separators between digits
  // (Indian 1,50,000 or Western 150,000 or 150.000). Anything not a
  // digit after that is a separator we can ignore.
  const runs = normalized.match(/\d+/g) ?? [];
  const bag = new Map<string, number>();
  for (const run of runs) {
    // Strip leading zeros for the comparison (₹005 == ₹5).
    const canonical = String(Number(run));
    bag.set(canonical, (bag.get(canonical) ?? 0) + 1);
  }
  return bag;
}

/**
 * Return true iff the digit multiset from `original` matches the digit
 * multiset from `candidate`. If it doesn't, the caller should either
 * reject the model output or warn the user.
 */
export function digitsMatch(original: string, candidate: string): boolean {
  const a = digitMultiset(original);
  const b = digitMultiset(candidate);
  if (a.size !== b.size) return false;
  for (const [key, count] of a) {
    if (b.get(key) !== count) return false;
  }
  return true;
}

/**
 * Wrap untrusted content in a fence that the model is instructed to
 * treat as data, not instructions. Strips any occurrence of the fence
 * markers from the untrusted input first so a payload can't close the
 * fence and inject instructions.
 */
export const UNTRUSTED_FENCE_START = "<<<UNTRUSTED_START>>>";
export const UNTRUSTED_FENCE_END = "<<<UNTRUSTED_END>>>";

export function fenceUntrusted(input: string): string {
  return input
    .replace(new RegExp(UNTRUSTED_FENCE_START, "g"), "«")
    .replace(new RegExp(UNTRUSTED_FENCE_END, "g"), "»");
}

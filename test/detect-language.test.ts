import { describe, it, expect } from "vitest";
import { detectLanguage } from "@/lib/detectLanguage";

/**
 * Script-based language detection for the voice agent. Every Indic block
 * we care about is a disjoint Unicode range, so we exhaustively verify
 * each script maps to the right code, plus mixed / edge cases.
 */
describe("detectLanguage — Indic scripts (single-script)", () => {
  it("Devanagari (Hindi) — नमस्ते", () => {
    expect(detectLanguage("नमस्ते")).toBe("hi");
  });
  it("Devanagari (Hindi) — मैंगो पल्प", () => {
    expect(detectLanguage("मैंगो पल्प")).toBe("hi");
  });
  it("Devanagari (Hindi) — ₹120 with digit", () => {
    expect(detectLanguage("आम ₹120")).toBe("hi");
  });

  it("Tamil — வணக்கம்", () => {
    expect(detectLanguage("வணக்கம்")).toBe("ta");
  });
  it("Tamil — மாம்பழம் கூழ்", () => {
    expect(detectLanguage("மாம்பழம் கூழ்")).toBe("ta");
  });

  it("Bengali — নমস্কার", () => {
    expect(detectLanguage("নমস্কার")).toBe("bn");
  });
  it("Bengali — আমের পাল্প", () => {
    expect(detectLanguage("আমের পাল্প")).toBe("bn");
  });

  it("Telugu — నమస్తే", () => {
    expect(detectLanguage("నమస్తే")).toBe("te");
  });
  it("Telugu — మామిడి పల్ప్", () => {
    expect(detectLanguage("మామిడి పల్ప్")).toBe("te");
  });

  it("Kannada — ನಮಸ್ಕಾರ", () => {
    expect(detectLanguage("ನಮಸ್ಕಾರ")).toBe("kn");
  });
  it("Kannada — ಮಾವಿನ ಪಲ್ಪ್", () => {
    expect(detectLanguage("ಮಾವಿನ ಪಲ್ಪ್")).toBe("kn");
  });

  it("Malayalam — നമസ്കാരം", () => {
    expect(detectLanguage("നമസ്കാരം")).toBe("ml");
  });
  it("Malayalam — മാമ്പഴ പൾപ്പ്", () => {
    expect(detectLanguage("മാമ്പഴ പൾപ്പ്")).toBe("ml");
  });

  it("Gurmukhi (Punjabi) — ਸਤ ਸ੍ਰੀ ਅਕਾਲ", () => {
    expect(detectLanguage("ਸਤ ਸ੍ਰੀ ਅਕਾਲ")).toBe("pa");
  });
  it("Gurmukhi (Punjabi) — ਅੰਬ ਦਾ ਪਲਪ", () => {
    expect(detectLanguage("ਅੰਬ ਦਾ ਪਲਪ")).toBe("pa");
  });

  it("Gujarati — નમસ્તે", () => {
    expect(detectLanguage("નમસ્તે")).toBe("gu");
  });
  it("Gujarati — કેરીનો પલ્પ", () => {
    expect(detectLanguage("કેરીનો પલ્પ")).toBe("gu");
  });
});

describe("detectLanguage — Latin / English", () => {
  it("Simple English → en", () => {
    expect(detectLanguage("hello world")).toBe("en");
  });
  it("English with digits → en", () => {
    expect(detectLanguage("Mango kg 120")).toBe("en");
  });
  it("Uppercase English → en", () => {
    expect(detectLanguage("MANGO PULP")).toBe("en");
  });
});

describe("detectLanguage — empty / punctuation edge cases", () => {
  it("Empty string → en", () => {
    expect(detectLanguage("")).toBe("en");
  });
  it("Whitespace only → en", () => {
    expect(detectLanguage("   ")).toBe("en");
  });
  it("Digits only → en", () => {
    expect(detectLanguage("123456")).toBe("en");
  });
  it("Punctuation only → en", () => {
    expect(detectLanguage("!@#$%^&*()")).toBe("en");
  });
  it("₹ symbol and digits → en", () => {
    expect(detectLanguage("₹120 -- !!")).toBe("en");
  });
});

describe("detectLanguage — mixed-script dominance", () => {
  it("English + a single Devanagari letter → hi (Indic wins)", () => {
    expect(detectLanguage("mango आ")).toBe("hi");
  });
  it("Roman + Tamil (Indic wins)", () => {
    expect(detectLanguage("Order மாம்பழம்")).toBe("ta");
  });
  it("Multiple Indic — dominant script wins (Hindi > Tamil)", () => {
    expect(detectLanguage("आम आम आम த")).toBe("hi");
  });
  it("Multiple Indic — dominant script wins (Tamil > Hindi)", () => {
    expect(detectLanguage("மா மா மா आ")).toBe("ta");
  });
  it("Bengali dominates over Telugu when Bengali has more chars", () => {
    expect(detectLanguage("আম আম త")).toBe("bn");
  });
  it("Digits + Devanagari — hi", () => {
    expect(detectLanguage("120 आ")).toBe("hi");
  });
});

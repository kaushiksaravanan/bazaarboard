import { describe, it, expect } from "vitest";
import { LANGUAGES, findLanguage, type Language } from "@/lib/languages";
import tailwindConfig from "../tailwind.config";

// Extract tailwind font family keys
const tailwindFonts = tailwindConfig.theme?.extend?.fontFamily as
  | Record<string, unknown>
  | undefined;
const tailwindFontKeys = new Set(Object.keys(tailwindFonts ?? {}));

// Expected Unicode block ranges per script.
const UNICODE_BLOCKS: Record<string, [number, number]> = {
  hi: [0x0900, 0x097f], // Devanagari
  ta: [0x0b80, 0x0bff], // Tamil
  bn: [0x0980, 0x09ff], // Bengali
  te: [0x0c00, 0x0c7f], // Telugu
  kn: [0x0c80, 0x0cff], // Kannada
  ml: [0x0d00, 0x0d7f], // Malayalam
  pa: [0x0a00, 0x0a7f], // Gurmukhi
  gu: [0x0a80, 0x0aff], // Gujarati
};

describe("LANGUAGES catalog", () => {
  it("has exactly 9 languages", () => {
    expect(LANGUAGES).toHaveLength(9);
  });

  it("is an array", () => {
    expect(Array.isArray(LANGUAGES)).toBe(true);
  });

  it("every entry is an object", () => {
    for (const l of LANGUAGES) {
      expect(typeof l).toBe("object");
    }
  });

  it("all codes are unique", () => {
    const codes = LANGUAGES.map((l) => l.code);
    expect(new Set(codes).size).toBe(codes.length);
  });

  it("all englishNames are unique", () => {
    const names = LANGUAGES.map((l) => l.englishName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all nativeNames are unique", () => {
    const names = LANGUAGES.map((l) => l.nativeName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all fontClasses are unique", () => {
    const classes = LANGUAGES.map((l) => l.fontClass);
    expect(new Set(classes).size).toBe(classes.length);
  });

  it("codes are all lowercase two-letter", () => {
    for (const l of LANGUAGES) {
      expect(l.code).toMatch(/^[a-z]{2}$/);
    }
  });

  it("contains English at index 0", () => {
    expect(LANGUAGES[0].code).toBe("en");
  });
});

describe("Language shape per entry", () => {
  const required: Array<keyof Language> = [
    "code",
    "englishName",
    "nativeName",
    "fontClass",
    "scriptHint",
    "sampleProduct",
    "samplePrice",
  ];

  for (const lang of LANGUAGES) {
    describe(`${lang.code} (${lang.englishName})`, () => {
      for (const key of required) {
        it(`has non-empty ${key}`, () => {
          expect(lang[key]).toBeDefined();
          expect(typeof lang[key]).toBe("string");
          expect((lang[key] as string).length).toBeGreaterThan(0);
        });
      }

      it("fontClass exists in tailwind config", () => {
        // fontClass is like "font-devanagari", tailwind keys are "devanagari"
        const key = lang.fontClass.replace(/^font-/, "");
        expect(tailwindFontKeys.has(key)).toBe(true);
      });

      it("fontClass starts with font-", () => {
        expect(lang.fontClass.startsWith("font-")).toBe(true);
      });

      it("samplePrice contains a digit", () => {
        // digit may be ASCII or Indic
        expect(
          /[0-9०-९௦-௯০-৯౦-౯೦-೯൦-൯੦-੯૦-૯]/.test(
            lang.samplePrice,
          ),
        ).toBe(true);
      });

      it("scriptHint mentions script by name", () => {
        expect(lang.scriptHint.length).toBeGreaterThan(5);
      });
    });
  }
});

describe("Native names use correct Unicode blocks", () => {
  for (const lang of LANGUAGES) {
    if (lang.code === "en") {
      it("en nativeName is ASCII-only", () => {
        for (const ch of lang.nativeName) {
          expect(ch.charCodeAt(0)).toBeLessThan(0x80);
        }
      });
      continue;
    }
    const [lo, hi] = UNICODE_BLOCKS[lang.code];
    it(`${lang.code} nativeName has ≥1 char in U+${lo.toString(16)}..U+${hi.toString(16)}`, () => {
      const chars = [...lang.nativeName];
      const inBlock = chars.some((ch) => {
        const cp = ch.codePointAt(0);
        return cp !== undefined && cp >= lo && cp <= hi;
      });
      expect(inBlock).toBe(true);
    });

    it(`${lang.code} sampleProduct has ≥1 char in U+${lo.toString(16)}..U+${hi.toString(16)}`, () => {
      const chars = [...lang.sampleProduct];
      const inBlock = chars.some((ch) => {
        const cp = ch.codePointAt(0);
        return cp !== undefined && cp >= lo && cp <= hi;
      });
      expect(inBlock).toBe(true);
    });
  }
});

describe("findLanguage()", () => {
  for (const lang of LANGUAGES) {
    it(`findLanguage("${lang.code}") returns entry`, () => {
      expect(findLanguage(lang.code)).toEqual(lang);
    });

    it(`findLanguage round-trip preserves englishName for ${lang.code}`, () => {
      expect(findLanguage(lang.code)?.englishName).toBe(lang.englishName);
    });

    it(`findLanguage round-trip preserves nativeName for ${lang.code}`, () => {
      expect(findLanguage(lang.code)?.nativeName).toBe(lang.nativeName);
    });
  }

  it("returns undefined for unknown code", () => {
    expect(findLanguage("xx")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(findLanguage("")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    expect(findLanguage("HI")).toBeUndefined();
  });

  it("returns undefined for null-like values passed as string", () => {
    expect(findLanguage("null")).toBeUndefined();
  });
});

describe("Expected language codes present", () => {
  const expected = ["en", "hi", "ta", "bn", "te", "kn", "ml", "pa", "gu"];
  for (const code of expected) {
    it(`has code ${code}`, () => {
      expect(LANGUAGES.some((l) => l.code === code)).toBe(true);
    });
  }
});

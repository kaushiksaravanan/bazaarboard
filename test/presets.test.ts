import { describe, it, expect } from "vitest";
import { PRESETS, findPreset, type RetailPreset } from "@/lib/presets";

const HEX = /^#[0-9A-Fa-f]{6}$/;

describe("PRESETS catalog", () => {
  it("has at least 5 presets", () => {
    expect(PRESETS.length).toBeGreaterThanOrEqual(5);
  });

  it("all preset ids are unique", () => {
    const ids = PRESETS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("all business names are unique", () => {
    const names = PRESETS.map((p) => p.businessName);
    expect(new Set(names).size).toBe(names.length);
  });

  it("all verticals are unique", () => {
    const verts = PRESETS.map((p) => p.vertical);
    expect(new Set(verts).size).toBe(verts.length);
  });

  const expectedIds = ["kirana", "sweetshop", "chaat", "textile", "pharmacy"];
  for (const id of expectedIds) {
    it(`contains preset with id ${id}`, () => {
      expect(PRESETS.some((p) => p.id === id)).toBe(true);
    });
  }

  const verticalKeywords = ["kirana", "sweet", "chaat", "textile", "pharmacy"];
  for (const kw of verticalKeywords) {
    it(`verticals cover keyword "${kw}"`, () => {
      const found = PRESETS.some((p) =>
        p.vertical.toLowerCase().includes(kw),
      );
      expect(found).toBe(true);
    });
  }
});

describe("Per-preset shape", () => {
  const required: Array<keyof RetailPreset> = [
    "id",
    "vertical",
    "businessName",
    "brandColor",
    "items",
  ];

  for (const preset of PRESETS) {
    describe(preset.id, () => {
      for (const key of required) {
        it(`has ${key}`, () => {
          expect(preset[key]).toBeDefined();
        });
      }

      it("brandColor is valid #RRGGBB", () => {
        expect(preset.brandColor).toMatch(HEX);
      });

      it("businessName is non-empty", () => {
        expect(preset.businessName.length).toBeGreaterThan(0);
      });

      it("vertical is non-empty", () => {
        expect(preset.vertical.length).toBeGreaterThan(0);
      });

      it("items is a non-empty array", () => {
        expect(Array.isArray(preset.items)).toBe(true);
        expect(preset.items.length).toBeGreaterThan(0);
      });

      it("every item has non-empty productName", () => {
        for (const item of preset.items) {
          expect(item.productName.length).toBeGreaterThan(0);
        }
      });

      it("every price contains a digit", () => {
        for (const item of preset.items) {
          expect(/\d/.test(item.price)).toBe(true);
        }
      });

      it("every price includes rupee symbol", () => {
        for (const item of preset.items) {
          expect(item.price.includes("₹")).toBe(true);
        }
      });
    });
  }
});

describe("findPreset()", () => {
  for (const p of PRESETS) {
    it(`findPreset(${p.id}) returns entry`, () => {
      expect(findPreset(p.id)).toEqual(p);
    });
  }

  it("returns undefined for unknown id", () => {
    expect(findPreset("bogus")).toBeUndefined();
  });

  it("returns undefined for empty string", () => {
    expect(findPreset("")).toBeUndefined();
  });

  it("is case-sensitive", () => {
    expect(findPreset("KIRANA")).toBeUndefined();
  });
});

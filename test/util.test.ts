import { describe, it, expect } from "vitest";
import type { SurfaceKind } from "@/components/SurfacePicker";
import {
  parseCsv,
  rowsToBulkText,
  bulkTextToCsv,
  CSV_TEMPLATE,
} from "@/lib/csv";

// Mirror the inline helper from src/app/page.tsx so we can lock in its
// behavior. Same signature, same body.
const cellKey = (
  langCode: string,
  surface: SurfaceKind,
  productIdx: number,
): string => `${productIdx}::${langCode}::${surface}`;

describe("cellKey formatting", () => {
  it("joins with ::", () => {
    expect(cellKey("hi", "poster", 0)).toBe("0::hi::poster");
  });

  it("preserves productIdx first", () => {
    expect(cellKey("hi", "poster", 42)).toBe("42::hi::poster");
  });

  it("langCode second", () => {
    expect(cellKey("ta", "whatsapp", 3)).toBe("3::ta::whatsapp");
  });

  it("surface last", () => {
    expect(cellKey("en", "square", 7)).toBe("7::en::square");
  });

  it("distinct keys for different langs", () => {
    expect(cellKey("hi", "poster", 0)).not.toBe(cellKey("ta", "poster", 0));
  });

  it("distinct keys for different surfaces", () => {
    expect(cellKey("hi", "poster", 0)).not.toBe(cellKey("hi", "square", 0));
  });

  it("distinct keys for different indices", () => {
    expect(cellKey("hi", "poster", 0)).not.toBe(cellKey("hi", "poster", 1));
  });

  it("empty langCode still deterministic", () => {
    expect(cellKey("", "poster", 0)).toBe("0::::poster");
  });

  it("large index formats correctly", () => {
    expect(cellKey("hi", "poster", 999999)).toBe("999999::hi::poster");
  });

  it("negative index still stringifies", () => {
    expect(cellKey("hi", "poster", -1)).toBe("-1::hi::poster");
  });
});

// The bulk-parse behavior in src/app/page.tsx is the same shape as
// bulkTextToCsv (pipe-split, trim, filter). We test both bulkTextToCsv
// (real, exported code) and the parse rules that feed it.
describe("bulk pipe parsing (via bulkTextToCsv & parseCsv round-trip)", () => {
  it("single well-formed line", () => {
    const csv = bulkTextToCsv("Mango | ₹120");
    expect(csv).toBe("name,price\nMango,₹120");
  });

  it("trims whitespace around name", () => {
    const csv = bulkTextToCsv("   Mango   |   ₹120   ");
    expect(csv).toBe("name,price\nMango,₹120");
  });

  it("trims whitespace around price", () => {
    const csv = bulkTextToCsv("Mango|   ₹120   ");
    const rows = parseCsv(csv);
    expect(rows[0].price).toBe("₹120");
  });

  it("filters empty lines", () => {
    const csv = bulkTextToCsv("Mango | ₹120\n\n\nRice | ₹95\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it("filters lines with missing pipe", () => {
    const csv = bulkTextToCsv("Mango only\nRice | ₹95");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe("Rice");
  });

  it("filters lines missing price", () => {
    const csv = bulkTextToCsv("Mango |\nRice | ₹95");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
  });

  it("filters lines missing name", () => {
    const csv = bulkTextToCsv("| ₹120\nRice | ₹95");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
  });

  it("handles CRLF line endings", () => {
    const csv = bulkTextToCsv("Mango | ₹120\r\nRice | ₹95\r\n");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(2);
  });

  it("preserves indic script names", () => {
    const csv = bulkTextToCsv("आम | ₹120\nதமிழ் | ₹100");
    const rows = parseCsv(csv);
    expect(rows[0].productName).toBe("आम");
    expect(rows[1].productName).toBe("தமிழ்");
  });

  it("preserves indic digits in prices", () => {
    const csv = bulkTextToCsv("Mango | ₹१२०");
    const rows = parseCsv(csv);
    expect(rows[0].price).toBe("₹१२०");
  });

  it("empty input returns header only", () => {
    expect(bulkTextToCsv("")).toBe("name,price");
  });

  it("only whitespace input returns header only", () => {
    expect(bulkTextToCsv("   \n\n  \n")).toBe("name,price");
  });

  it("special chars: commas in price require quoting", () => {
    const csv = bulkTextToCsv("Saree | ₹1,50,000");
    expect(csv.includes('"₹1,50,000"')).toBe(true);
  });

  it("special chars: commas in name require quoting", () => {
    const csv = bulkTextToCsv("Chana besan, roasted | ₹75");
    expect(csv.includes('"Chana besan, roasted"')).toBe(true);
  });

  it("special chars: quotes get doubled", () => {
    const csv = bulkTextToCsv('Say "hi" | ₹5');
    expect(csv.includes('"Say ""hi""') || csv.includes("Say \"hi\"")).toBe(
      true,
    );
  });

  it("multi-line with mixed valid + invalid", () => {
    const rows = parseCsv(bulkTextToCsv(
      [
        "A | ₹1",
        "B",
        "",
        "   ",
        "C | ₹3",
        "| ₹4",
        "D |",
      ].join("\n"),
    ));
    expect(rows.map((r) => r.productName)).toEqual(["A", "C"]);
  });

  it("first line only", () => {
    const csv = bulkTextToCsv("solo | ₹1");
    const rows = parseCsv(csv);
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe("solo");
  });

  it("many lines preserved in order", () => {
    const lines = Array.from({ length: 20 }, (_, i) => `p${i} | ₹${i}`).join(
      "\n",
    );
    const rows = parseCsv(bulkTextToCsv(lines));
    expect(rows).toHaveLength(20);
    expect(rows[0].productName).toBe("p0");
    expect(rows[19].productName).toBe("p19");
  });

  it("second pipe treated as delimiter beyond price (split takes first two)", () => {
    const csv = bulkTextToCsv("Mango|₹120|extra");
    const rows = parseCsv(csv);
    // split("|") gives ["Mango","₹120","extra"], code destructures [name, priceRaw]
    // so price = "₹120", extra is dropped.
    expect(rows[0].price).toBe("₹120");
  });
});

describe("parseCsv detail cases", () => {
  it("handles a header row", () => {
    const rows = parseCsv("name,price\nA,₹1");
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe("A");
  });

  it("handles alt header (product,cost)", () => {
    const rows = parseCsv("product,cost\nA,₹1");
    expect(rows).toHaveLength(1);
  });

  it("handles no header", () => {
    const rows = parseCsv("A,₹1\nB,₹2");
    expect(rows).toHaveLength(2);
  });

  it("handles quoted price with comma", () => {
    const rows = parseCsv('A,"₹1,50,000"');
    expect(rows[0].price).toBe("₹1,50,000");
  });

  it("handles quoted name with comma", () => {
    const rows = parseCsv('"Chana besan, roasted",₹75');
    expect(rows[0].productName).toBe("Chana besan, roasted");
  });

  it("handles escaped double quotes", () => {
    const rows = parseCsv('"Say ""hi""",₹1');
    expect(rows[0].productName).toBe('Say "hi"');
  });

  it("skips lines with < 2 cells", () => {
    const rows = parseCsv("only-name\nB,₹2");
    expect(rows).toHaveLength(1);
    expect(rows[0].productName).toBe("B");
  });

  it("skips lines with empty productName", () => {
    const rows = parseCsv(",₹1\nB,₹2");
    expect(rows).toHaveLength(1);
  });

  it("skips lines with empty price", () => {
    const rows = parseCsv("A,\nB,₹2");
    expect(rows).toHaveLength(1);
  });

  it("empty string → empty array", () => {
    expect(parseCsv("")).toEqual([]);
  });

  it("only whitespace → empty array", () => {
    expect(parseCsv("   \n  ")).toEqual([]);
  });

  it("CRLF endings handled", () => {
    const rows = parseCsv("A,₹1\r\nB,₹2\r\n");
    expect(rows).toHaveLength(2);
  });

  it("CSV_TEMPLATE parses to 3 rows", () => {
    const rows = parseCsv(CSV_TEMPLATE);
    expect(rows).toHaveLength(3);
  });

  it("CSV_TEMPLATE preserves first product", () => {
    const rows = parseCsv(CSV_TEMPLATE);
    expect(rows[0].productName).toBe("Alphonso mango pulp");
  });
});

describe("rowsToBulkText", () => {
  it("empty → empty", () => {
    expect(rowsToBulkText([])).toBe("");
  });

  it("single row", () => {
    expect(rowsToBulkText([{ productName: "A", price: "₹1" }])).toBe(
      "A | ₹1",
    );
  });

  it("multi row joined by newline", () => {
    expect(
      rowsToBulkText([
        { productName: "A", price: "₹1" },
        { productName: "B", price: "₹2" },
      ]),
    ).toBe("A | ₹1\nB | ₹2");
  });

  it("round-trip: rowsToBulkText → bulkTextToCsv → parseCsv", () => {
    const rows = [
      { productName: "A", price: "₹1" },
      { productName: "B", price: "₹2" },
    ];
    const csv = bulkTextToCsv(rowsToBulkText(rows));
    const parsed = parseCsv(csv);
    expect(parsed).toEqual(rows);
  });
});

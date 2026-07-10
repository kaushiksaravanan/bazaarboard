/**
 * CSV helpers for bulk-mode import/export. Keeps parsing self-contained
 * so we don't need a papaparse-sized dependency. Handles the common
 * kirana CSV shape (`name,price`), including quoted fields with commas
 * inside them ("Chana besan, roasted",₹75) and CRLF line endings from
 * Excel exports.
 */

export interface BulkRow {
  productName: string;
  price: string;
}

/**
 * Minimal RFC-4180-flavored CSV parser. Only handles quoted fields, "" as
 * an escaped quote, and comma delimiters. Enough for `name,price` shape
 * with prices that may contain commas (e.g. ₹1,50,000).
 */
function parseCsvLine(line: string): string[] {
  const out: string[] = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (inQuotes) {
      if (ch === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (ch === '"') {
        inQuotes = false;
      } else {
        cur += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      out.push(cur);
      cur = "";
    } else {
      cur += ch;
    }
  }
  out.push(cur);
  return out.map((s) => s.trim());
}

export function parseCsv(text: string): BulkRow[] {
  const lines = text
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length === 0) return [];

  // Detect a header row. If the first row's first cell looks like "name"
  // (case-insensitive), skip it.
  const first = parseCsvLine(lines[0]);
  const hasHeader =
    first.length >= 2 &&
    /^(name|product|item)/i.test(first[0]) &&
    /^(price|cost|mrp)/i.test(first[1]);
  const bodyStart = hasHeader ? 1 : 0;

  const rows: BulkRow[] = [];
  for (let i = bodyStart; i < lines.length; i++) {
    const cells = parseCsvLine(lines[i]);
    if (cells.length < 2) continue;
    const productName = cells[0];
    const price = cells[1];
    if (productName && price) rows.push({ productName, price });
  }
  return rows;
}

/** Convert BulkRow[] to the pipe-delimited bulkText shape the UI uses. */
export function rowsToBulkText(rows: BulkRow[]): string {
  return rows.map((r) => `${r.productName} | ${r.price}`).join("\n");
}

/** Convert bulkText (pipe-delimited) → CSV string with header. */
export function bulkTextToCsv(bulkText: string): string {
  const rows = bulkText
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, priceRaw] = line.split("|").map((s) => s.trim());
      return { productName: name ?? "", price: priceRaw ?? "" };
    })
    .filter((r) => r.productName && r.price);

  const escape = (v: string): string => {
    if (/[",\n]/.test(v)) {
      return `"${v.replace(/"/g, '""')}"`;
    }
    return v;
  };
  const header = "name,price";
  const body = rows.map((r) => `${escape(r.productName)},${escape(r.price)}`);
  return [header, ...body].join("\n");
}

/** Trigger a browser download of a CSV blob. */
export function downloadCsv(csv: string, filename: string): void {
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

/** The CSV template we hand out for judges. */
export const CSV_TEMPLATE = `name,price
Alphonso mango pulp,₹120 / kg
Basmati rice (aged 1yr),₹95 / kg
Tur dal (unpolished),₹140 / kg
`;

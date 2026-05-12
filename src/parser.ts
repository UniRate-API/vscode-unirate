export interface AmountMatch {
  amount: number;
  currency: string;
  start: number;
  end: number;
}

const CCY = "[A-Z]{3,5}";
const NUM = "-?\\d{1,3}(?:[, ]\\d{3})*(?:\\.\\d+)?|-?\\d+(?:\\.\\d+)?";

const SYMBOLS: Record<string, string> = {
  $: "USD",
  "€": "EUR",
  "£": "GBP",
  "¥": "JPY",
  "₩": "KRW",
  "₹": "INR",
  "₽": "RUB",
  "₺": "TRY",
  "₪": "ILS",
  "₫": "VND",
  "฿": "THB",
  "₱": "PHP",
};

// 100 USD / -1,234.56 GBP
const POSTFIX = new RegExp(`(${NUM})\\s+(${CCY})\\b`, "g");
// USD 100 / GBP -1,234.56
const PREFIX = new RegExp(`\\b(${CCY})\\s+(${NUM})(?!\\d)`, "g");
// $100 / €1,234.56 — symbol may be followed by an optional space
const SYMBOL = new RegExp(
  `([${Object.keys(SYMBOLS).map((s) => escapeForCharClass(s)).join("")}])\\s?(${NUM})(?!\\d)`,
  "g",
);

export function findAmounts(line: string, validCurrency: (code: string) => boolean): AmountMatch[] {
  const out: AmountMatch[] = [];
  const seen = new Set<string>();
  const push = (m: AmountMatch) => {
    const k = `${m.start}-${m.end}`;
    if (seen.has(k)) return;
    seen.add(k);
    out.push(m);
  };

  let m: RegExpExecArray | null;

  POSTFIX.lastIndex = 0;
  while ((m = POSTFIX.exec(line)) !== null) {
    const code = m[2].toUpperCase();
    if (!validCurrency(code)) continue;
    const amount = parseAmount(m[1]);
    if (amount === null) continue;
    push({ amount, currency: code, start: m.index, end: m.index + m[0].length });
  }

  PREFIX.lastIndex = 0;
  while ((m = PREFIX.exec(line)) !== null) {
    const code = m[1].toUpperCase();
    if (!validCurrency(code)) continue;
    const amount = parseAmount(m[2]);
    if (amount === null) continue;
    push({ amount, currency: code, start: m.index, end: m.index + m[0].length });
  }

  SYMBOL.lastIndex = 0;
  while ((m = SYMBOL.exec(line)) !== null) {
    const code = SYMBOLS[m[1]];
    if (!code) continue;
    const amount = parseAmount(m[2]);
    if (amount === null) continue;
    push({ amount, currency: code, start: m.index, end: m.index + m[0].length });
  }

  return out.sort((a, b) => a.start - b.start);
}

export function findAmountAt(
  line: string,
  column: number,
  validCurrency: (code: string) => boolean,
): AmountMatch | null {
  const matches = findAmounts(line, validCurrency);
  for (const m of matches) {
    if (column >= m.start && column <= m.end) return m;
  }
  return null;
}

function parseAmount(raw: string): number | null {
  const cleaned = raw.replace(/[ ,]/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function escapeForCharClass(s: string): string {
  return s.replace(/[\\\]\-^]/g, (c) => `\\${c}`);
}

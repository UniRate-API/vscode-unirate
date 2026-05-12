import { findAmountAt, findAmounts } from "../src/parser";

const known = new Set([
  "USD", "EUR", "GBP", "JPY", "CHF", "CAD", "AUD", "BTC", "ETH", "USDT", "USDC",
]);
const validCurrency = (code: string) => known.has(code.toUpperCase());

describe("findAmounts", () => {
  it("finds postfix amount+code (`100 USD`)", () => {
    const r = findAmounts("paid 100 USD for it", validCurrency);
    expect(r).toEqual([{ amount: 100, currency: "USD", start: 5, end: 12 }]);
  });

  it("finds prefix code+amount (`USD 100`)", () => {
    const r = findAmounts("total USD 99.50 today", validCurrency);
    expect(r).toEqual([{ amount: 99.5, currency: "USD", start: 6, end: 15 }]);
  });

  it("finds symbol-prefixed amounts (`$100`, `€1,234.56`)", () => {
    const r = findAmounts("cost $100 and €1,234.56 today", validCurrency);
    const codes = r.map((m) => m.currency);
    const amounts = r.map((m) => m.amount);
    expect(codes).toEqual(["USD", "EUR"]);
    expect(amounts).toEqual([100, 1234.56]);
  });

  it("ignores unknown currency codes", () => {
    const r = findAmounts("100 XYZ and 50 USD", validCurrency);
    expect(r.map((m) => m.currency)).toEqual(["USD"]);
  });

  it("handles thousands separators", () => {
    const r = findAmounts("Revenue: 1,234,567 USD", validCurrency);
    expect(r).toHaveLength(1);
    expect(r[0].amount).toBe(1234567);
  });

  it("handles negatives and decimals", () => {
    const r = findAmounts("net -1.23 USD", validCurrency);
    expect(r).toHaveLength(1);
    expect(r[0].amount).toBeCloseTo(-1.23);
  });

  it("finds multiple amounts in one line, sorted by position", () => {
    const r = findAmounts("convert 100 USD into EUR, also 50 GBP", validCurrency);
    expect(r.map((m) => m.currency)).toEqual(["USD", "GBP"]);
  });

  it("accepts 4-5 letter codes (crypto USDT)", () => {
    const r = findAmounts("1 USDT", validCurrency);
    expect(r).toEqual([{ amount: 1, currency: "USDT", start: 0, end: 6 }]);
  });
});

describe("findAmountAt", () => {
  it("returns the match the column is inside", () => {
    const line = "paid 100 USD today";
    const m = findAmountAt(line, 7, validCurrency);
    expect(m?.currency).toBe("USD");
  });

  it("returns null when no match overlaps the column", () => {
    const line = "paid 100 USD today";
    expect(findAmountAt(line, 15, validCurrency)).toBeNull();
  });

  it("accepts the boundary column at the end of a match", () => {
    const line = "100 USD";
    const m = findAmountAt(line, 7, validCurrency);
    expect(m?.currency).toBe("USD");
  });
});

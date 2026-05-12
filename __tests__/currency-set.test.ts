import { UniRateClient, type FetchLike } from "../src/client";
import { CurrencySet } from "../src/currency-set";

describe("CurrencySet", () => {
  it("recognises common fiat codes out of the box", () => {
    const s = new CurrencySet();
    expect(s.has("USD")).toBe(true);
    expect(s.has("eur")).toBe(true);
    expect(s.has("GBP")).toBe(true);
  });

  it("recognises common crypto codes out of the box", () => {
    const s = new CurrencySet();
    expect(s.has("BTC")).toBe(true);
    expect(s.has("USDT")).toBe(true);
  });

  it("rejects unknown codes", () => {
    const s = new CurrencySet();
    expect(s.has("XYZ")).toBe(false);
  });

  it("merges fetched codes from the API", async () => {
    const s = new CurrencySet();
    expect(s.has("ABC")).toBe(false);
    const fetch: FetchLike = async () => ({
      ok: true,
      status: 200,
      async text() {
        return "";
      },
      async json() {
        return { currencies: ["ABC", "DEF"] };
      },
    });
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await s.ensureLoaded(client);
    expect(s.has("ABC")).toBe(true);
    expect(s.has("DEF")).toBe(true);
  });

  it("falls back silently when the API call fails", async () => {
    const s = new CurrencySet();
    const fetch: FetchLike = async () => ({
      ok: false,
      status: 401,
      async text() {
        return "";
      },
      async json() {
        return {};
      },
    });
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await s.ensureLoaded(client);
    expect(s.has("USD")).toBe(true); // fallback still works
  });
});

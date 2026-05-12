import { UniRateClient, UniRateClientError, type FetchLike } from "../src/client";

interface MockCall {
  url: string;
  headers: Record<string, string>;
}

function makeFetch(
  responses: Array<{ status: number; body: unknown } | { throws: Error }>,
): { fetch: FetchLike; calls: MockCall[] } {
  const calls: MockCall[] = [];
  let i = 0;
  const fetchImpl: FetchLike = async (url, init) => {
    calls.push({ url, headers: { ...(init?.headers ?? {}) } });
    const r = responses[i++];
    if ("throws" in r) throw r.throws;
    return {
      ok: r.status < 400,
      status: r.status,
      async text() {
        return JSON.stringify(r.body);
      },
      async json() {
        return r.body;
      },
    };
  };
  return { fetch: fetchImpl, calls };
}

describe("UniRateClient.getRate", () => {
  it("fetches a live rate against /api/rates", async () => {
    const { fetch, calls } = makeFetch([{ status: 200, body: { rates: { EUR: 0.92 } } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    expect(await client.getRate("USD", "EUR")).toBe(0.92);
    expect(calls[0].url).toContain("/api/rates");
    expect(calls[0].url).toContain("api_key=k");
    expect(calls[0].url).toContain("from=USD");
    expect(calls[0].url).toContain("to=EUR");
    expect(calls[0].headers.Accept).toBe("application/json");
  });

  it("fetches historical rates when a date is given", async () => {
    const { fetch, calls } = makeFetch([{ status: 200, body: { rates: { EUR: 0.9 } } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await client.getRate("USD", "EUR", "2024-01-02");
    expect(calls[0].url).toContain("/api/historical/rates");
    expect(calls[0].url).toContain("date=2024-01-02");
  });

  it("uppercases currency codes", async () => {
    const { fetch, calls } = makeFetch([{ status: 200, body: { rates: { EUR: 0.92 } } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await client.getRate("usd", "eur");
    expect(calls[0].url).toContain("from=USD");
    expect(calls[0].url).toContain("to=EUR");
  });

  it("throws when the target rate is missing from the response", async () => {
    const { fetch } = makeFetch([{ status: 200, body: { rates: { GBP: 1.2 } } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await expect(client.getRate("USD", "EUR")).rejects.toThrow(/No rate/);
  });

  it("requires an API key", async () => {
    const { fetch } = makeFetch([]);
    const client = new UniRateClient({ apiKey: "", fetchImpl: fetch });
    await expect(client.getRate("USD", "EUR")).rejects.toThrow(/not set/);
  });
});

describe("UniRateClient error mapping", () => {
  const cases: Array<[number, RegExp]> = [
    [401, /Invalid UniRate API key/],
    [403, /Pro plan/],
    [404, /not found/],
    [429, /rate limit/],
    [500, /HTTP 500/],
  ];
  for (const [status, expected] of cases) {
    it(`maps HTTP ${status} to a friendly error`, async () => {
      const { fetch } = makeFetch([{ status, body: { error: "x" } }]);
      const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
      await expect(client.getRate("USD", "EUR")).rejects.toThrow(expected);
      const err = await client.getRate("USD", "EUR").catch((e) => e);
      // re-run already consumed the only response; we just want the type:
      expect(err).toBeInstanceOf(UniRateClientError);
    });
  }
});

describe("UniRateClient.convert", () => {
  it("returns amount × rate", async () => {
    const { fetch } = makeFetch([{ status: 200, body: { rates: { EUR: 0.5 } } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    const r = await client.convert("USD", "EUR", 100);
    expect(r).toEqual({ from: "USD", to: "EUR", amount: 100, rate: 0.5, result: 50 });
  });
});

describe("UniRateClient.listCurrencies", () => {
  it("returns a sorted array", async () => {
    const { fetch } = makeFetch([
      { status: 200, body: { currencies: ["USD", "EUR", "GBP", "AED"] } },
    ]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    expect(await client.listCurrencies()).toEqual(["AED", "EUR", "GBP", "USD"]);
  });

  it("rejects on unexpected shape", async () => {
    const { fetch } = makeFetch([{ status: 200, body: { wrong: [] } }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await expect(client.listCurrencies()).rejects.toThrow(/Unexpected/);
  });
});

describe("UniRateClient network errors", () => {
  it("wraps fetch-level errors", async () => {
    const { fetch } = makeFetch([{ throws: new Error("ECONNRESET") }]);
    const client = new UniRateClient({ apiKey: "k", fetchImpl: fetch });
    await expect(client.getRate("USD", "EUR")).rejects.toThrow(/Network error/);
  });
});

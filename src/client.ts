export class UniRateClientError extends Error {
  readonly status: number | null;

  constructor(message: string, status: number | null = null) {
    super(message);
    this.name = "UniRateClientError";
    this.status = status;
  }
}

export interface ConvertResult {
  from: string;
  to: string;
  amount: number;
  rate: number;
  result: number;
}

const DEFAULT_BASE = "https://api.unirateapi.com";

export type FetchLike = (
  url: string,
  init?: { method?: string; headers?: Record<string, string>; signal?: AbortSignal },
) => Promise<{
  ok: boolean;
  status: number;
  text(): Promise<string>;
  json(): Promise<unknown>;
}>;

export interface UniRateClientOptions {
  apiKey: string;
  baseUrl?: string;
  fetchImpl?: FetchLike;
  timeoutMs?: number;
}

export class UniRateClient {
  private apiKey: string;
  private readonly baseUrl: string;
  private readonly fetchImpl: FetchLike;
  private readonly timeoutMs: number;

  constructor(opts: UniRateClientOptions) {
    this.apiKey = opts.apiKey;
    this.baseUrl = opts.baseUrl ?? DEFAULT_BASE;
    this.fetchImpl = opts.fetchImpl ?? ((globalThis as { fetch?: FetchLike }).fetch as FetchLike);
    this.timeoutMs = opts.timeoutMs ?? 15000;
    if (!this.fetchImpl) {
      throw new Error("No fetch implementation available — pass `fetchImpl` explicitly.");
    }
  }

  setApiKey(key: string): void {
    this.apiKey = key;
  }

  async getRate(from: string, to: string, date: string | null = null): Promise<number> {
    this.requireKey();
    const path = date ? "/api/historical/rates" : "/api/rates";
    const params: Record<string, string> = {
      api_key: this.apiKey,
      from: from.toUpperCase(),
      to: to.toUpperCase(),
    };
    if (date) params.date = date;
    const json = await this.get(path, params);
    const rates = (json as { rates?: Record<string, number> }).rates;
    const rate = rates ? rates[to.toUpperCase()] : undefined;
    if (typeof rate !== "number") {
      throw new UniRateClientError(`No rate for ${from}->${to} in response`, null);
    }
    return rate;
  }

  async convert(
    from: string,
    to: string,
    amount: number,
    date: string | null = null,
  ): Promise<ConvertResult> {
    const rate = await this.getRate(from, to, date);
    return {
      from: from.toUpperCase(),
      to: to.toUpperCase(),
      amount,
      rate,
      result: amount * rate,
    };
  }

  async listCurrencies(): Promise<string[]> {
    this.requireKey();
    const json = await this.get("/api/currencies", { api_key: this.apiKey });
    const codes = (json as { currencies?: string[] }).currencies;
    if (!Array.isArray(codes)) {
      throw new UniRateClientError("Unexpected /api/currencies response shape", null);
    }
    return codes.slice().sort();
  }

  private async get(path: string, params: Record<string, string>): Promise<unknown> {
    const qs = new URLSearchParams(params).toString();
    const url = `${this.baseUrl}${path}?${qs}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), this.timeoutMs);
    let response;
    try {
      response = await this.fetchImpl(url, {
        method: "GET",
        headers: { Accept: "application/json" },
        signal: controller.signal,
      });
    } catch (err) {
      throw new UniRateClientError(
        `Network error contacting UniRateAPI: ${(err as Error).message}`,
        null,
      );
    } finally {
      clearTimeout(timer);
    }

    const status = response.status;
    if (status === 401) {
      throw new UniRateClientError("Invalid UniRate API key.", 401);
    }
    if (status === 403) {
      throw new UniRateClientError(
        "This endpoint requires a UniRate Pro plan (historical rates, commodities).",
        403,
      );
    }
    if (status === 404) {
      throw new UniRateClientError("Currency or endpoint not found.", 404);
    }
    if (status === 429) {
      throw new UniRateClientError("UniRate API rate limit exceeded.", 429);
    }
    if (status >= 400) {
      throw new UniRateClientError(`UniRate API error (HTTP ${status}).`, status);
    }

    try {
      return await response.json();
    } catch {
      throw new UniRateClientError("UniRate API returned a non-JSON response.", status);
    }
  }

  private requireKey(): void {
    if (!this.apiKey) {
      throw new UniRateClientError(
        "UniRate API key is not set. Configure `unirate.apiKey` in Settings.",
        null,
      );
    }
  }
}

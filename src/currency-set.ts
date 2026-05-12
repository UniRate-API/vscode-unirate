import type { UniRateClient } from "./client";

const ALWAYS_KNOWN = new Set([
  "USD", "EUR", "GBP", "JPY", "CNY", "CHF", "CAD", "AUD", "NZD", "SEK",
  "NOK", "DKK", "HKD", "SGD", "ZAR", "INR", "BRL", "MXN", "RUB", "TRY",
  "KRW", "PLN", "CZK", "HUF", "ILS", "AED", "SAR", "THB", "PHP", "IDR",
  "MYR", "VND", "TWD", "ARS", "CLP", "COP", "PEN", "EGP", "NGN", "PKR",
  "BTC", "ETH", "USDT", "USDC", "BNB", "XRP", "ADA", "SOL", "DOGE", "LTC",
  "DOT", "MATIC", "AVAX", "TRX", "LINK", "ATOM",
]);

export class CurrencySet {
  private codes: Set<string> = new Set(ALWAYS_KNOWN);
  private loaded = false;

  has(code: string): boolean {
    return this.codes.has(code.toUpperCase());
  }

  list(): string[] {
    return Array.from(this.codes).sort();
  }

  async ensureLoaded(client: UniRateClient): Promise<void> {
    if (this.loaded) return;
    try {
      const fetched = await client.listCurrencies();
      for (const code of fetched) this.codes.add(code.toUpperCase());
      this.loaded = true;
    } catch {
      // Leave the fallback set in place; the user can still convert via the
      // command palette and we'll retry next activation.
    }
  }

  reset(): void {
    this.codes = new Set(ALWAYS_KNOWN);
    this.loaded = false;
  }
}

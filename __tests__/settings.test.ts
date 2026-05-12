import { __resetConfig, __setConfig } from "../__mocks__/vscode";
import { readSettings } from "../src/settings";

beforeEach(() => __resetConfig());

describe("readSettings", () => {
  it("returns defaults when nothing is configured", () => {
    const s = readSettings();
    expect(s.apiKey).toBe("");
    expect(s.baseCurrency).toBe("USD");
    expect(s.targetCurrency).toBe("EUR");
    expect(s.statusBarEnabled).toBe(true);
    expect(s.statusBarPosition).toBe("right");
    expect(s.hoverEnabled).toBe(true);
    expect(s.rateDecimals).toBe(4);
    expect(s.moneyDecimals).toBe(2);
    expect(s.rateTtlMs).toBe(3_600_000);
    expect(s.historicalTtlMs).toBe(86_400_000);
  });

  it("normalises and uppercases currency codes", () => {
    __setConfig({
      "unirate.baseCurrency": "gbp",
      "unirate.targetCurrency": "jpy",
    });
    const s = readSettings();
    expect(s.baseCurrency).toBe("GBP");
    expect(s.targetCurrency).toBe("JPY");
  });

  it("falls back when a code is invalid", () => {
    __setConfig({ "unirate.baseCurrency": "??" });
    const s = readSettings();
    expect(s.baseCurrency).toBe("USD");
  });

  it("clamps decimals into [0, 10]", () => {
    __setConfig({ "unirate.rateDecimals": 99, "unirate.moneyDecimals": -3 });
    const s = readSettings();
    expect(s.rateDecimals).toBe(10);
    expect(s.moneyDecimals).toBe(0);
  });

  it("filters hover targets to valid codes", () => {
    __setConfig({ "unirate.hover.targets": ["usd", "??", "eur", "gbp"] });
    const s = readSettings();
    expect(s.hoverTargets).toEqual(["USD", "EUR", "GBP"]);
  });

  it("converts cache TTLs from seconds to milliseconds", () => {
    __setConfig({
      "unirate.cache.rateTtlSeconds": 60,
      "unirate.cache.historicalTtlSeconds": 120,
    });
    const s = readSettings();
    expect(s.rateTtlMs).toBe(60_000);
    expect(s.historicalTtlMs).toBe(120_000);
  });

  it("enforces a minimum 1-minute refresh interval", () => {
    __setConfig({ "unirate.statusBar.refreshMinutes": 0 });
    const s = readSettings();
    expect(s.statusBarRefreshMinutes).toBe(1);
  });
});

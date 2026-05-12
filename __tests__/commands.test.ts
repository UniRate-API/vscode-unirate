import { parseConvertInput } from "../src/commands";

describe("parseConvertInput", () => {
  it("accepts `100 USD to EUR`", () => {
    expect(parseConvertInput("100 USD to EUR")).toEqual({ amount: 100, from: "USD", to: "EUR" });
  });

  it("accepts `100 USD -> EUR`", () => {
    expect(parseConvertInput("100 USD -> EUR")).toEqual({ amount: 100, from: "USD", to: "EUR" });
  });

  it("accepts `100 USD → EUR`", () => {
    expect(parseConvertInput("100 USD → EUR")).toEqual({ amount: 100, from: "USD", to: "EUR" });
  });

  it("accepts `100 USD in EUR`", () => {
    expect(parseConvertInput("100 USD in EUR")).toEqual({ amount: 100, from: "USD", to: "EUR" });
  });

  it("upcases the currency codes", () => {
    expect(parseConvertInput("1 usd to eur")).toEqual({ amount: 1, from: "USD", to: "EUR" });
  });

  it("accepts thousands separators and decimals", () => {
    expect(parseConvertInput("1,234.56 USD to EUR")).toEqual({
      amount: 1234.56,
      from: "USD",
      to: "EUR",
    });
  });

  it("accepts 4-5 letter codes", () => {
    expect(parseConvertInput("100 USDT to USDC")).toEqual({
      amount: 100,
      from: "USDT",
      to: "USDC",
    });
  });

  it("returns null on garbage input", () => {
    expect(parseConvertInput("hello world")).toBeNull();
    expect(parseConvertInput("USD to EUR")).toBeNull();
    expect(parseConvertInput("100 USDtoEUR")).toBeNull();
  });
});

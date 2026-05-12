import { formatMoney, formatRate } from "../src/format";

describe("formatRate", () => {
  it("renders a fixed number of decimals", () => {
    expect(formatRate(1.23456, 2)).toBe("1.23");
    expect(formatRate(1.23456, 4)).toBe("1.2346");
  });

  it("pads zeros to reach the requested precision", () => {
    expect(formatRate(1.5, 4)).toBe("1.5000");
  });

  it("returns String() for non-finite values", () => {
    expect(formatRate(Number.NaN, 2)).toBe("NaN");
    expect(formatRate(Number.POSITIVE_INFINITY, 2)).toBe("Infinity");
  });

  it("clamps decimals to [0, 10]", () => {
    expect(formatRate(1.1, -3)).toBe("1");
    expect(formatRate(1.1, 99)).toMatch(/^1\.1\d*$/);
  });
});

describe("formatMoney", () => {
  it("appends the currency code with a space", () => {
    expect(formatMoney(1234.5, "EUR", 2)).toBe("1,234.50 EUR");
  });

  it("groups thousands separators", () => {
    expect(formatMoney(1000000, "USD", 0)).toBe("1,000,000 USD");
  });
});

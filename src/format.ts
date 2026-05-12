export function formatRate(value: number, decimals: number): string {
  if (!Number.isFinite(value)) return String(value);
  const clamped = clampDecimals(decimals);
  return value.toLocaleString("en-US", {
    minimumFractionDigits: clamped,
    maximumFractionDigits: clamped,
    useGrouping: false,
  });
}

export function formatMoney(value: number, currency: string, decimals: number): string {
  const clamped = clampDecimals(decimals);
  const rendered = value.toLocaleString("en-US", {
    minimumFractionDigits: clamped,
    maximumFractionDigits: clamped,
    useGrouping: true,
  });
  return `${rendered} ${currency}`;
}

function clampDecimals(d: number): number {
  if (!Number.isFinite(d)) return 2;
  if (d < 0) return 0;
  if (d > 10) return 10;
  return Math.trunc(d);
}

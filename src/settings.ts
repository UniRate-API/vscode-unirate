import * as vscode from "vscode";

export interface UniRateSettings {
  apiKey: string;
  baseCurrency: string;
  targetCurrency: string;
  statusBarEnabled: boolean;
  statusBarPosition: "left" | "right";
  statusBarRefreshMinutes: number;
  hoverEnabled: boolean;
  hoverTargets: string[];
  rateDecimals: number;
  moneyDecimals: number;
  rateTtlMs: number;
  historicalTtlMs: number;
}

const SECTION = "unirate";

export function readSettings(): UniRateSettings {
  const c = vscode.workspace.getConfiguration(SECTION);
  const hoverTargets = (c.get<string[]>("hover.targets") ?? [])
    .map((s) => s.trim().toUpperCase())
    .filter((s) => /^[A-Z]{3,5}$/.test(s));

  return {
    apiKey: c.get<string>("apiKey", "") ?? "",
    baseCurrency: normalize(c.get<string>("baseCurrency", "USD"), "USD"),
    targetCurrency: normalize(c.get<string>("targetCurrency", "EUR"), "EUR"),
    statusBarEnabled: c.get<boolean>("statusBar.enabled", true),
    statusBarPosition: (c.get<string>("statusBar.position", "right") === "left" ? "left" : "right"),
    statusBarRefreshMinutes: Math.max(1, c.get<number>("statusBar.refreshMinutes", 30) ?? 30),
    hoverEnabled: c.get<boolean>("hover.enabled", true),
    hoverTargets,
    rateDecimals: clamp(c.get<number>("rateDecimals", 4) ?? 4, 0, 10),
    moneyDecimals: clamp(c.get<number>("moneyDecimals", 2) ?? 2, 0, 10),
    rateTtlMs: Math.max(0, (c.get<number>("cache.rateTtlSeconds", 3600) ?? 3600) * 1000),
    historicalTtlMs: Math.max(0, (c.get<number>("cache.historicalTtlSeconds", 86400) ?? 86400) * 1000),
  };
}

export async function updateSetting<T>(key: string, value: T): Promise<void> {
  await vscode.workspace.getConfiguration(SECTION).update(key, value, vscode.ConfigurationTarget.Global);
}

function normalize(raw: string, fallback: string): string {
  const v = (raw ?? "").trim().toUpperCase();
  return /^[A-Z]{3,5}$/.test(v) ? v : fallback;
}

function clamp(v: number, min: number, max: number): number {
  if (!Number.isFinite(v)) return min;
  return Math.min(max, Math.max(min, Math.trunc(v)));
}

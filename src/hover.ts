import * as vscode from "vscode";
import { TTLCache } from "./cache";
import { UniRateClient } from "./client";
import { CurrencySet } from "./currency-set";
import { formatMoney, formatRate } from "./format";
import { findAmountAt } from "./parser";
import type { UniRateSettings } from "./settings";

export class UniRateHoverProvider implements vscode.HoverProvider {
  constructor(
    private readonly client: UniRateClient,
    private readonly cache: TTLCache<number>,
    private readonly currencies: CurrencySet,
    private readonly getSettings: () => UniRateSettings,
  ) {}

  async provideHover(
    document: vscode.TextDocument,
    position: vscode.Position,
    token: vscode.CancellationToken,
  ): Promise<vscode.Hover | null> {
    const settings = this.getSettings();
    if (!settings.hoverEnabled || !settings.apiKey) return null;

    const line = document.lineAt(position.line).text;
    const match = findAmountAt(line, position.character, (code) => this.currencies.has(code));
    if (!match) return null;

    const targets = (settings.hoverTargets.length > 0 ? settings.hoverTargets : [settings.targetCurrency])
      .map((c) => c.toUpperCase())
      .filter((c) => c !== match.currency);
    if (targets.length === 0) return null;

    const range = new vscode.Range(
      new vscode.Position(position.line, match.start),
      new vscode.Position(position.line, match.end),
    );

    const lines: string[] = [
      `**UniRate** — ${formatMoney(match.amount, match.currency, settings.moneyDecimals)} converts to:`,
      "",
    ];

    const results = await Promise.all(
      targets.map(async (to) => {
        if (token.isCancellationRequested) return null;
        const key = `${match.currency}->${to}`;
        try {
          const rate = await this.cache.fetch(key, settings.rateTtlMs, () =>
            this.client.getRate(match.currency, to),
          );
          return { to, rate, error: null as string | null };
        } catch (err) {
          return { to, rate: 0, error: err instanceof Error ? err.message : "error" };
        }
      }),
    );

    if (token.isCancellationRequested) return null;

    let any = false;
    for (const r of results) {
      if (!r) continue;
      if (r.error) {
        lines.push(`- ${r.to}: _${r.error}_`);
      } else {
        any = true;
        lines.push(
          `- **${formatMoney(match.amount * r.rate, r.to, settings.moneyDecimals)}** ` +
            `(1 ${match.currency} = ${formatRate(r.rate, settings.rateDecimals)} ${r.to})`,
        );
      }
    }
    if (!any && results.every((r) => r?.error)) return null;

    const md = new vscode.MarkdownString(lines.join("\n"));
    md.isTrusted = false;
    return new vscode.Hover(md, range);
  }
}

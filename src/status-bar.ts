import * as vscode from "vscode";
import { TTLCache } from "./cache";
import { UniRateClient, UniRateClientError } from "./client";
import { formatRate } from "./format";
import type { UniRateSettings } from "./settings";

const RATE_CMD = "unirate.refresh";

export class StatusBar {
  private item: vscode.StatusBarItem | null = null;
  private timer: NodeJS.Timeout | null = null;
  private lastRate: number | null = null;
  private lastFetched: Date | null = null;

  constructor(
    private readonly client: UniRateClient,
    private readonly cache: TTLCache<number>,
    private readonly getSettings: () => UniRateSettings,
  ) {}

  dispose(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
    this.item?.dispose();
    this.item = null;
  }

  /** Recreate the status bar item (e.g. after the position setting changed). */
  rebuild(): void {
    this.item?.dispose();
    this.item = null;
    this.lastRate = null;
    this.lastFetched = null;
    const settings = this.getSettings();
    if (!settings.statusBarEnabled) {
      this.cancelTimer();
      return;
    }
    const alignment =
      settings.statusBarPosition === "left"
        ? vscode.StatusBarAlignment.Left
        : vscode.StatusBarAlignment.Right;
    this.item = vscode.window.createStatusBarItem(alignment, 100);
    this.item.command = RATE_CMD;
    this.item.text = `$(sync~spin) ${settings.baseCurrency}/${settings.targetCurrency}`;
    this.item.tooltip = "Fetching UniRate exchange rate…";
    this.item.show();
    this.scheduleTimer();
    void this.refresh();
  }

  /** Re-read settings, pulling a fresh rate if the pair changed. */
  applySettingsChange(): void {
    if (!this.item) {
      this.rebuild();
      return;
    }
    this.scheduleTimer();
    void this.refresh();
  }

  async refresh(): Promise<void> {
    if (!this.item) return;
    const settings = this.getSettings();
    if (!settings.apiKey) {
      this.item.text = `$(warning) UniRate: set API key`;
      this.item.tooltip = "Configure `unirate.apiKey` in Settings to enable live rates.";
      return;
    }
    const key = `${settings.baseCurrency}->${settings.targetCurrency}`;
    try {
      const rate = await this.cache.fetch(key, settings.rateTtlMs, () =>
        this.client.getRate(settings.baseCurrency, settings.targetCurrency),
      );
      this.lastRate = rate;
      this.lastFetched = new Date();
      this.render(settings, rate);
    } catch (err) {
      this.renderError(settings, err);
    }
  }

  /** Forget the cached rate so the next refresh hits the API. */
  invalidate(): void {
    this.lastRate = null;
    this.lastFetched = null;
  }

  private render(settings: UniRateSettings, rate: number): void {
    if (!this.item) return;
    const formatted = formatRate(rate, settings.rateDecimals);
    this.item.text = `$(globe) ${settings.baseCurrency}→${settings.targetCurrency} ${formatted}`;
    const when = this.lastFetched ? this.lastFetched.toLocaleTimeString() : "—";
    this.item.tooltip = new vscode.MarkdownString(
      `**UniRate** • 1 ${settings.baseCurrency} = **${formatted}** ${settings.targetCurrency}\n\n` +
        `Last refresh: ${when}\n\nClick to refresh now.`,
    );
    this.item.backgroundColor = undefined;
  }

  private renderError(settings: UniRateSettings, err: unknown): void {
    if (!this.item) return;
    const message =
      err instanceof UniRateClientError
        ? err.message
        : err instanceof Error
          ? err.message
          : "Unknown error";
    this.item.text = `$(warning) ${settings.baseCurrency}/${settings.targetCurrency}`;
    this.item.tooltip = `UniRate error: ${message}`;
    this.item.backgroundColor = new vscode.ThemeColor("statusBarItem.warningBackground");
  }

  private scheduleTimer(): void {
    this.cancelTimer();
    const minutes = this.getSettings().statusBarRefreshMinutes;
    this.timer = setInterval(() => {
      void this.refresh();
    }, minutes * 60_000);
  }

  private cancelTimer(): void {
    if (this.timer) clearInterval(this.timer);
    this.timer = null;
  }

  /** Test-only accessor. */
  _state(): { rate: number | null; fetchedAt: Date | null } {
    return { rate: this.lastRate, fetchedAt: this.lastFetched };
  }
}

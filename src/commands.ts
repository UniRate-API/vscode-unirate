import * as vscode from "vscode";
import { TTLCache } from "./cache";
import { UniRateClient, UniRateClientError } from "./client";
import { CurrencySet } from "./currency-set";
import { formatMoney, formatRate } from "./format";
import { readSettings, updateSetting } from "./settings";
import type { StatusBar } from "./status-bar";

interface ConvertInput {
  amount: number;
  from: string;
  to: string;
}

const CONVERT_RE = /^\s*(-?\d+(?:[., ]\d+)*(?:\.\d+)?)\s+([A-Za-z]{3,5})\s+(?:to|->|→|in)\s+([A-Za-z]{3,5})\s*$/i;

export function parseConvertInput(raw: string): ConvertInput | null {
  const m = raw.match(CONVERT_RE);
  if (!m) return null;
  const amount = Number(m[1].replace(/[ ,]/g, ""));
  if (!Number.isFinite(amount)) return null;
  return { amount, from: m[2].toUpperCase(), to: m[3].toUpperCase() };
}

export function registerCommands(
  context: vscode.ExtensionContext,
  client: UniRateClient,
  cache: TTLCache<number>,
  currencies: CurrencySet,
  statusBar: StatusBar,
): void {
  context.subscriptions.push(
    vscode.commands.registerCommand("unirate.convert", () => convertCommand(client, cache, currencies)),
    vscode.commands.registerCommand("unirate.setPair", () => setPairCommand(currencies, statusBar)),
    vscode.commands.registerCommand("unirate.refresh", () => {
      statusBar.invalidate();
      cache.clear();
      void statusBar.refresh();
    }),
    vscode.commands.registerCommand("unirate.clearCache", () => {
      cache.clear();
      statusBar.invalidate();
      void vscode.window.showInformationMessage("UniRate: cached rates cleared.");
    }),
    vscode.commands.registerCommand("unirate.insertConversion", () =>
      insertConversionCommand(client, cache, currencies),
    ),
  );
}

async function convertCommand(
  client: UniRateClient,
  cache: TTLCache<number>,
  currencies: CurrencySet,
): Promise<void> {
  const settings = readSettings();
  if (!settings.apiKey) {
    const choice = await vscode.window.showWarningMessage(
      "UniRate API key is not set.",
      "Open Settings",
    );
    if (choice === "Open Settings") {
      await vscode.commands.executeCommand("workbench.action.openSettings", "unirate.apiKey");
    }
    return;
  }

  const raw = await vscode.window.showInputBox({
    title: "UniRate — convert currency",
    prompt: "Format: `100 USD to EUR` (or `→`, `->`, `in`)",
    placeHolder: "100 USD to EUR",
    value: `1 ${settings.baseCurrency} to ${settings.targetCurrency}`,
    validateInput: (v) => (parseConvertInput(v) ? null : "Use `<amount> <from> to <to>` (e.g. `100 USD to EUR`)."),
  });
  if (!raw) return;
  const input = parseConvertInput(raw);
  if (!input) return;

  if (!currencies.has(input.from) || !currencies.has(input.to)) {
    void currencies.ensureLoaded(client);
  }

  try {
    const rate = await cache.fetch(`${input.from}->${input.to}`, settings.rateTtlMs, () =>
      client.getRate(input.from, input.to),
    );
    const result = input.amount * rate;
    const summary =
      `${formatMoney(input.amount, input.from, settings.moneyDecimals)} = ` +
      `**${formatMoney(result, input.to, settings.moneyDecimals)}** ` +
      `(1 ${input.from} = ${formatRate(rate, settings.rateDecimals)} ${input.to})`;

    const choice = await vscode.window.showInformationMessage(
      stripMarkdown(summary),
      "Copy amount",
      "Copy summary",
      "Insert at cursor",
    );
    const plain = formatMoney(result, input.to, settings.moneyDecimals);
    if (choice === "Copy amount") {
      await vscode.env.clipboard.writeText(plain);
    } else if (choice === "Copy summary") {
      await vscode.env.clipboard.writeText(stripMarkdown(summary));
    } else if (choice === "Insert at cursor") {
      await insertAtCursor(plain);
    }
  } catch (err) {
    void vscode.window.showErrorMessage(
      `UniRate: ${err instanceof UniRateClientError ? err.message : (err as Error).message}`,
    );
  }
}

async function setPairCommand(currencies: CurrencySet, statusBar: StatusBar): Promise<void> {
  const settings = readSettings();
  const items = currencies.list().map((code) => ({ label: code }));

  const fromPick = await vscode.window.showQuickPick(items, {
    title: "UniRate — status-bar source currency",
    placeHolder: `Currently: ${settings.baseCurrency}`,
    matchOnDescription: true,
  });
  if (!fromPick) return;

  const toPick = await vscode.window.showQuickPick(items, {
    title: "UniRate — status-bar target currency",
    placeHolder: `Currently: ${settings.targetCurrency}`,
    matchOnDescription: true,
  });
  if (!toPick) return;

  await updateSetting("baseCurrency", fromPick.label);
  await updateSetting("targetCurrency", toPick.label);
  statusBar.invalidate();
  void statusBar.refresh();
}

async function insertConversionCommand(
  client: UniRateClient,
  cache: TTLCache<number>,
  currencies: CurrencySet,
): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) {
    void vscode.window.showInformationMessage("UniRate: open a file to insert into.");
    return;
  }
  const settings = readSettings();
  if (!settings.apiKey) {
    void vscode.window.showWarningMessage("UniRate: set `unirate.apiKey` in Settings first.");
    return;
  }

  const raw = await vscode.window.showInputBox({
    title: "UniRate — insert conversion",
    prompt: "Format: `100 USD to EUR`",
    placeHolder: "100 USD to EUR",
    value: `1 ${settings.baseCurrency} to ${settings.targetCurrency}`,
    validateInput: (v) => (parseConvertInput(v) ? null : "Use `<amount> <from> to <to>` (e.g. `100 USD to EUR`)."),
  });
  if (!raw) return;
  const input = parseConvertInput(raw);
  if (!input) return;

  if (!currencies.has(input.from) || !currencies.has(input.to)) {
    void currencies.ensureLoaded(client);
  }

  try {
    const rate = await cache.fetch(`${input.from}->${input.to}`, settings.rateTtlMs, () =>
      client.getRate(input.from, input.to),
    );
    const result = input.amount * rate;
    await editor.edit((b) => b.insert(editor.selection.active, formatMoney(result, input.to, settings.moneyDecimals)));
  } catch (err) {
    void vscode.window.showErrorMessage(
      `UniRate: ${err instanceof UniRateClientError ? err.message : (err as Error).message}`,
    );
  }
}

async function insertAtCursor(text: string): Promise<void> {
  const editor = vscode.window.activeTextEditor;
  if (!editor) return;
  await editor.edit((b) => b.insert(editor.selection.active, text));
}

function stripMarkdown(s: string): string {
  return s.replace(/\*\*/g, "");
}

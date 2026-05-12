import * as vscode from "vscode";
import { TTLCache } from "./cache";
import { UniRateClient } from "./client";
import { registerCommands } from "./commands";
import { CurrencySet } from "./currency-set";
import { UniRateHoverProvider } from "./hover";
import { readSettings } from "./settings";
import { StatusBar } from "./status-bar";

interface ActivationHandle {
  dispose(): void;
}

let handle: ActivationHandle | null = null;

export function activate(context: vscode.ExtensionContext): void {
  const settings = readSettings();
  const cache = new TTLCache<number>();
  const client = new UniRateClient({ apiKey: settings.apiKey });
  const currencies = new CurrencySet();
  const statusBar = new StatusBar(client, cache, readSettings);
  const hoverProvider = new UniRateHoverProvider(client, cache, currencies, readSettings);

  statusBar.rebuild();
  registerCommands(context, client, cache, currencies, statusBar);

  const hoverDisposable = vscode.languages.registerHoverProvider(
    [{ scheme: "file" }, { scheme: "untitled" }, { scheme: "vscode-notebook-cell" }],
    hoverProvider,
  );

  const configDisposable = vscode.workspace.onDidChangeConfiguration((evt) => {
    if (!evt.affectsConfiguration("unirate")) return;
    const next = readSettings();
    client.setApiKey(next.apiKey);
    if (
      evt.affectsConfiguration("unirate.statusBar.enabled") ||
      evt.affectsConfiguration("unirate.statusBar.position")
    ) {
      statusBar.rebuild();
    } else {
      statusBar.applySettingsChange();
    }
  });

  if (settings.apiKey) {
    void currencies.ensureLoaded(client);
  }

  context.subscriptions.push(hoverDisposable, configDisposable, {
    dispose: () => statusBar.dispose(),
  });

  handle = {
    dispose: () => {
      statusBar.dispose();
    },
  };
}

export function deactivate(): void {
  handle?.dispose();
  handle = null;
}

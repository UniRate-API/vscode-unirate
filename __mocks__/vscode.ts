/**
 * Minimal stub of the `vscode` module so non-extension-host code paths
 * (client, cache, parser, formatter, settings, currency-set, command parsing)
 * can be unit-tested with jest. We intentionally do NOT exercise the actual
 * StatusBar / HoverProvider classes here — those are integration territory.
 */

type ConfigStore = Record<string, unknown>;

let configStore: ConfigStore = {};

export function __setConfig(values: ConfigStore): void {
  configStore = { ...values };
}

export function __resetConfig(): void {
  configStore = {};
}

class WorkspaceConfiguration {
  constructor(private readonly section: string) {}

  get<T>(key: string, defaultValue?: T): T | undefined {
    const full = `${this.section}.${key}`;
    if (full in configStore) return configStore[full] as T;
    if (key in configStore) return configStore[key] as T;
    return defaultValue;
  }

  async update(key: string, value: unknown): Promise<void> {
    configStore[`${this.section}.${key}`] = value;
  }
}

export const workspace = {
  getConfiguration(section: string): WorkspaceConfiguration {
    return new WorkspaceConfiguration(section);
  },
  onDidChangeConfiguration(): { dispose(): void } {
    return { dispose: () => undefined };
  },
};

export const ConfigurationTarget = {
  Global: 1,
  Workspace: 2,
  WorkspaceFolder: 3,
};

export class MarkdownString {
  constructor(public value: string = "") {}
  isTrusted = false;
}

export class Position {
  constructor(public readonly line: number, public readonly character: number) {}
}

export class Range {
  constructor(public readonly start: Position, public readonly end: Position) {}
}

export class Hover {
  constructor(public readonly contents: unknown, public readonly range?: Range) {}
}

export const StatusBarAlignment = { Left: 1, Right: 2 };

export class ThemeColor {
  constructor(public readonly id: string) {}
}

export const window = {
  createStatusBarItem(): unknown {
    return {
      text: "",
      tooltip: "",
      command: "",
      backgroundColor: undefined,
      show() {},
      hide() {},
      dispose() {},
    };
  },
  showInformationMessage: async () => undefined,
  showWarningMessage: async () => undefined,
  showErrorMessage: async () => undefined,
  showInputBox: async () => undefined,
  showQuickPick: async () => undefined,
  activeTextEditor: undefined as unknown,
};

export const env = {
  clipboard: { async writeText(): Promise<void> {} },
};

export const commands = {
  registerCommand(): { dispose(): void } {
    return { dispose: () => undefined };
  },
  executeCommand: async (): Promise<void> => undefined,
};

export const languages = {
  registerHoverProvider(): { dispose(): void } {
    return { dispose: () => undefined };
  },
};

export default {
  workspace,
  ConfigurationTarget,
  MarkdownString,
  Position,
  Range,
  Hover,
  StatusBarAlignment,
  ThemeColor,
  window,
  env,
  commands,
  languages,
};

# UniRate Currency for VS Code

Live foreign-exchange rates in your editor, powered by [UniRateAPI](https://unirateapi.com).

- **Status-bar widget** — see the current rate for your favourite currency pair at a glance, refreshed in the background.
- **Command palette** — `UniRate: Convert currency…` accepts inputs like `100 USD to EUR`, `1,234.56 GBP -> JPY`, or `1 BTC in USDT`.
- **Hover-on-number conversion** — hover any `100 USD`, `USD 100`, `$100`, `€1,234.56`, or `1 BTC` in any file to see it converted into the target currencies of your choice.
- **170+ fiat currencies + every major crypto** — including USDT and USDC for stablecoin workflows.
- **Historical rates** — `UniRate Pro` users get exchange-rate data back to 1999-01-04 via the same commands (use the API directly until the historical UI lands in a future release).

No telemetry. The extension talks only to `api.unirateapi.com`. Rates are cached locally with a configurable TTL so a single file with many amounts produces one API call.

## Setup

1. Install the extension.
2. Get a free UniRate API key at [unirateapi.com/register](https://unirateapi.com/register). The free tier covers all live rates and the full currency list.
3. Open VS Code Settings (`⌘,` / `Ctrl+,`), search for `unirate.apiKey`, and paste your key.
4. Optionally set `unirate.baseCurrency` / `unirate.targetCurrency` to the pair you want in the status bar (defaults to USD → EUR).

## Commands

| Command | What it does |
|---|---|
| `UniRate: Convert currency…` | Prompt for `<amount> <from> to <to>` and show the result, with options to copy or insert at the cursor. |
| `UniRate: Set status-bar currency pair…` | Pick the source and target currencies for the status-bar widget. |
| `UniRate: Refresh status-bar rate` | Re-fetch the rate immediately (bypasses the cache). |
| `UniRate: Clear cached rates` | Drop the in-memory cache (useful after switching API keys). |
| `UniRate: Insert conversion at cursor…` | Same prompt as `Convert`, but the result is inserted directly into the active document. |

## Settings

All settings live under `unirate.*`:

- `unirate.apiKey` — your UniRate API key.
- `unirate.baseCurrency` / `unirate.targetCurrency` — three-to-five-letter codes (e.g. `USD`, `EUR`, `USDT`).
- `unirate.statusBar.enabled` / `unirate.statusBar.position` (`left`/`right`) / `unirate.statusBar.refreshMinutes`.
- `unirate.hover.enabled` — toggles the hover provider entirely.
- `unirate.hover.targets` — array of currency codes to convert each detected amount into (defaults to `["USD","EUR","GBP"]`).
- `unirate.rateDecimals` / `unirate.moneyDecimals` — display precision.
- `unirate.cache.rateTtlSeconds` (default `3600`) / `unirate.cache.historicalTtlSeconds` (default `86400`).

## Hover detection

The hover provider recognises:

- `100 USD`, `1,234.56 GBP`, `-50 JPY` (amount followed by code)
- `USD 100`, `EUR 1,234.56` (code followed by amount)
- `$100`, `€1,234.56`, `£99`, `¥1000`, `₹500`, `₩1000`, `฿100` and several more symbol prefixes

Codes must be a known UniRate currency. The extension preloads a fallback set of common fiat + crypto codes; on first activation with a valid API key it fetches the full currency list and caches it in memory.

## Privacy

- The only network calls go to `https://api.unirateapi.com`.
- Your API key is stored in VS Code settings — choose user or workspace scope depending on whether you want to share it across projects.
- No telemetry, no analytics, no third-party trackers.

## Building from source

```sh
npm install
npm test          # 57 unit tests
npm run typecheck
npm run build     # esbuild → out/extension.js
npm run package   # vsce → vscode-unirate.vsix
```

Open the folder in VS Code and press `F5` to launch a development host.

<!-- unirate-ecosystem-footer:start -->
## Other UniRate clients

UniRate ships official client libraries and framework integrations across the
ecosystem. The repos below are all maintained under the
[UniRate-API](https://github.com/UniRate-API) org.

- **Languages:** [Python](https://github.com/UniRate-API/unirate-api-python) · [Node.js / TypeScript](https://github.com/UniRate-API/unirate-api-nodejs) · [Go](https://github.com/UniRate-API/unirate-api-go) · [Rust](https://github.com/UniRate-API/unirate-api-rust) · [Java](https://github.com/UniRate-API/unirate-api-java) · [Ruby](https://github.com/UniRate-API/unirate-api-ruby) · [PHP](https://github.com/UniRate-API/unirate-api-php) · [.NET](https://github.com/UniRate-API/unirate-api-dotnet) · [Swift](https://github.com/UniRate-API/unirate-api-swift)
- **Web frameworks:** [NestJS](https://github.com/UniRate-API/nestjs-unirate) · [Django / Wagtail](https://github.com/UniRate-API/wagtail-unirate) · [FastAPI](https://github.com/UniRate-API/fastapi-unirate) · [Flask](https://github.com/UniRate-API/flask-unirate) · [React](https://github.com/UniRate-API/react-unirate) · [tRPC](https://github.com/UniRate-API/trpc-unirate)
- **Static-site generators:** [Astro](https://github.com/UniRate-API/astro-unirate) · [Eleventy](https://github.com/UniRate-API/eleventy-unirate) · [Hugo](https://github.com/UniRate-API/hugo-unirate)
- **Data / orchestration:** [Airflow](https://github.com/UniRate-API/airflow-provider-unirate) · [dbt](https://github.com/UniRate-API/dbt-unirate) · [LangChain](https://github.com/UniRate-API/langchain-unirate)
- **Workflow / no-code:** [n8n](https://github.com/UniRate-API/n8n-nodes-unirate) · [Google Sheets](https://github.com/UniRate-API/unirate-sheets) · [MCP server](https://github.com/UniRate-API/unirate-mcp)
- **Editors / tools:** [VS Code](https://github.com/UniRate-API/vscode-unirate) · [Obsidian](https://github.com/UniRate-API/obsidian-currency)
- **Specialty bridges:** [NodaMoney (.NET)](https://github.com/UniRate-API/UniRateApi.NodaMoney)

Get a free API key at [unirateapi.com](https://unirateapi.com).
<!-- unirate-ecosystem-footer:end -->

## License

MIT — see [LICENSE](LICENSE).

# Changelog

All notable changes to the **UniRate Currency** VS Code extension are documented in this file. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and the project adheres to [SemVer](https://semver.org/spec/v2.0.0.html).

## [0.1.0] — 2026-05-12

Initial public release.

- Status-bar widget showing the live exchange rate for a configurable pair, refreshed every 30 minutes by default. Click to force-refresh.
- `UniRate: Convert currency…` command palette entry with `<amount> <from> to <to>` parsing (also accepts `->`, `→`, and `in`).
- `UniRate: Set status-bar currency pair…`, `UniRate: Refresh status-bar rate`, `UniRate: Clear cached rates`, and `UniRate: Insert conversion at cursor…` commands.
- Hover provider that detects `100 USD`, `USD 100`, and symbol-prefixed amounts (`$100`, `€1,234.56`, …) and renders conversions into a user-configurable list of target currencies.
- In-memory cache with per-key request deduplication so a buffer with many amounts produces at most one API call per `(from, to)` pair within the cache window.
- Full settings UI under `unirate.*` covering API key, base/target currencies, status-bar position + refresh interval, hover targets, display precision, and cache TTLs.

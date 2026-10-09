# DeFi Market Risk Report

Independent, evidence-based risk intelligence for DeFi lending markets.

> **Measure → Explain → Simulate → Let the user choose.**

This repository is the standalone **Proof & Signal DeFi Market Risk Report** product. It is intentionally isolated from other repositories.

## v0.2 — Verified Data Contract

The report engine no longer trusts a naked market number. Every live metric must include:

```
source → observed_at → fetched_at → freshness → evidence → Data Quality → Risk Report
```

Core states remain **PASS / VERIFY / UNKNOWN**, but v0.2 derives them from provenance and timestamps rather than accepting a manually supplied status.

The initial primary live-data source is the official Aave MCP endpoint.

## Run

Requires Node.js 20+.

```bash
npm test
npm run report
npm run live:aave
```

- `npm run report` validates the verified-data contract and generates the sample report.
- `npm run live:aave` reads current Aave v3 USDC market data from the official Aave MCP endpoint.

See [docs/VERIFIED_DATA_CONTRACT.md](docs/VERIFIED_DATA_CONTRACT.md) and [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md).

## Release invariant

A final/paid report must be blocked unless every core metric and risk input is **PASS**.

## Next gate

Normalize the live Aave response into the verified observation contract, persist an auditable raw snapshot, and generate the first report whose APY/utilization/liquidity values all come directly from the live adapter.

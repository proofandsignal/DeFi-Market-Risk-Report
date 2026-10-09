# DeFi Market Risk Report

Independent, evidence-based risk intelligence for DeFi lending markets.

> **Measure → Explain → Simulate → Let the user choose.**

This repository is the standalone **Proof & Signal DeFi Market Risk Report** product. It is intentionally isolated from other repositories.

## v0.2 — Verified Data Contract

Every live metric carries its own provenance:

```
source → observed_at → fetched_at → freshness → evidence → Data Quality → Risk Report
```

Data Quality is derived by the engine rather than supplied manually.

### Live Aave source

The official Aave MCP endpoint is used for Aave v3 market discovery. The adapter pins the initial product market to:

- chain: Ethereum (`1`);
- market: `AaveV3Ethereum`;
- market address: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`;
- asset: USDC;
- underlying token: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`.

This matters because Aave currently exposes multiple Ethereum v3 markets; the report must not silently mix Core, Lido, EtherFi or Horizon observations.

The first verified live snapshot captured on 2026-10-09 returned 4.13% supply APY and about $138.79M available liquidity for the pinned Core USDC reserve. Utilization is explicitly derived from the same upstream response using total supplied and available liquidity.

## Run

Requires Node.js 20+.

```bash
npm test
npm run report
npm run live:aave
```

`npm run live:aave` writes both the normalized observation bundle and the untouched upstream JSON-RPC response under `reports/generated/`. GitHub Actions uploads those files as a run artifact.

See [docs/VERIFIED_DATA_CONTRACT.md](docs/VERIFIED_DATA_CONTRACT.md) and [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md).

## Release invariant

A final report is blocked unless every core metric and risk input is **PASS**.

## Commercial gate still open

The market-data pipeline is now live and auditable. The current risk-dimension numbers are still prototype calibration values. They must be replaced by evidence-backed dimension methodology before a €9–19 report is sold as a finished risk rating.

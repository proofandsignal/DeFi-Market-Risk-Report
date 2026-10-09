# DeFi Market Risk Report

Independent, evidence-based risk intelligence for DeFi lending markets.

> **Measure → Explain → Simulate → Let the user choose.**

This repository is the standalone **Proof & Signal DeFi Market Risk Report** product. It is intentionally isolated from other repositories.

## v0.1

The first build is a deterministic report engine:

```
JSON market input
      ↓
Input validation
      ↓
Data Quality Gate
PASS / VERIFY / UNKNOWN
      ↓
Weighted Risk Engine
      ↓
Advice Firewall
      ↓
Release Gate
      ↓
Markdown Risk Report
```

Risk dimensions currently include:

- protocol risk;
- asset risk;
- liquidity risk;
- oracle risk;
- stablecoin risk;
- chain risk.

## Run

Requires Node.js 20+.

```bash
npm test
npm run report
```

The sample command generates an Aave / USDC report from `examples/aave-usdc.json`.

## Product boundary

v0.1 is analytics and decision support. It does not custody assets, handle private keys, autonomously execute transactions, or generate personalized portfolio allocation instructions.

See [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md).

## Next gates

1. Prove deterministic report generation and CI.
2. Replace sample inputs with verified adapter output.
3. Add evidence timestamps and freshness rules.
4. Add historical APY/liquidity context.
5. Add Scenario Engine.
6. Test a paid €9–19 report with real users.

## Status

**v0.1 — build in progress**

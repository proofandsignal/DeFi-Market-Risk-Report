# DeFi Market Risk Report

Independent, evidence-based risk intelligence for DeFi lending markets.

> **Measure → Explain → Simulate → Let the user choose.**

## v0.3 — Evidence-Backed Risk Methodology

v0.3 removes manually assigned risk-dimension scores.

The engine now computes six dimensions from explicit factor rules and evidence:

```
Verified market data
      +
Evidence registry
      ↓
Factor rules
      ↓
Protocol / Asset / Liquidity / Oracle / Stablecoin / Chain
      ↓
Dimension confidence + evidence status
      ↓
Overall risk score
      ↓
Commercial Beta Gate
      ↓
Risk Report #001
```

The score is a comparative heuristic, not a probability of loss or personalized recommendation.

### Current pilot market

**Aave V3 Ethereum Core / USDC**

The live Aave reserve-details feed provides the market-level risk facts, including liquidity, utilization, caps, collateral parameters, price source and oracle address.

Static evidence records currently use primary/official sources from Aave, Circle, Circle's public stablecoin contract repository and ethereum.org.

## Run

Requires Node.js 20+.

```bash
npm test
npm run report
npm run live:report
```

- `npm run report` builds Risk Report #001 from the captured verified snapshot.
- `npm run live:report` refreshes the Aave reserve facts before building a report.
- deterministic CI never depends on an external network.

See [docs/RISK_METHODOLOGY_V0.3.md](docs/RISK_METHODOLOGY_V0.3.md), [docs/VERIFIED_DATA_CONTRACT.md](docs/VERIFIED_DATA_CONTRACT.md), and [docs/PRODUCT_BOUNDARY.md](docs/PRODUCT_BOUNDARY.md).

## Commercial beta gate

A low-cost beta report can be marked `PASS_BETA` only when:

- verified market data is PASS;
- every risk dimension has current evidence;
- overall evidence confidence is at least 0.85;
- no critical factor is UNKNOWN;
- the beta-methodology disclosure is present.

A beta pass is an evidence/completeness gate, not proof that the model predicts future losses.

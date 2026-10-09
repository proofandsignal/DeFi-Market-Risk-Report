# DeFi Market Risk Report

Independent, evidence-based risk intelligence for DeFi lending markets.

> **Measure → Explain → Simulate → Let the user choose.**

## Product layers

### v0.3 — Evidence-Backed Risk Methodology

The commercial beta report computes six dimensions from explicit factor rules and evidence:

`Protocol / Asset / Liquidity / Oracle / Stablecoin / Chain`

Risk Report #001 remains the Aave V3 Ethereum Core / USDC pilot.

### v0.4 — Calibration & Stress Benchmark

v0.4 adds a protocol-neutral diagnostic layer:

```
Aave + Morpho + Compound + Spark
              ↓
     normalized market records
              ↓
      Stress Pressure Score
              ↓
 historical stress replays
              ↓
 calibration / ranking diagnostics
```

The benchmark score is deliberately separate from the commercial risk score. It exists to find ranking mistakes, threshold discontinuities and missing coverage before the methodology is scaled.

Live benchmark target: **20–50 markets**.

- Aave: official Aave MCP.
- Morpho: official Morpho API.
- Compound: direct Ethereum Comet reads via `ETH_RPC_URL`.
- Spark: direct Ethereum ProtocolDataProvider reads via `ETH_RPC_URL`.

No RPC secret is committed to the repository.

## Run

Requires Node.js 20+.

```bash
npm test
npm run report
npm run live:report
npm run benchmark
```

Without `ETH_RPC_URL`, the benchmark can pass as `PASS_PARTIAL_RPC` when Aave + Morpho provide at least 20 live markets and stress gates pass. With the RPC secret configured, Compound + Spark are included and the target becomes `PASS_FULL`.

See [Risk Report #001](reports/RISK-REPORT-001-AAVE-USDC.md), [Calibration Benchmark v0.4](docs/CALIBRATION_BENCHMARK_V0.4.md), [Risk Methodology v0.3](docs/RISK_METHODOLOGY_V0.3.md), [Commercial Beta](docs/COMMERCIAL_BETA.md), [Verified Data Contract](docs/VERIFIED_DATA_CONTRACT.md), and [Product Boundary](docs/PRODUCT_BOUNDARY.md).

## Commercial beta

**Founding Beta price: €9.**

A commercial beta report is informational decision support. It is not a probability of loss, credit rating, suitability assessment, or personalized recommendation.

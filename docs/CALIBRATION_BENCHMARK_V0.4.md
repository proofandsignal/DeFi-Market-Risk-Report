# Calibration & Stress Benchmark v0.4

## Goal

Test whether the same market-pressure rules rank lending markets in a directionally sensible way across protocols and under historically anchored stress scenarios.

This is **not** a statistical validation of the commercial risk score.

## Live coverage target

The benchmark runner targets 20–50 markets:

- Aave v3 USDC markets from the official Aave MCP;
- top listed Morpho Blue markets from the official Morpho API;
- Compound III Ethereum USDC directly from the Comet contract when `ETH_RPC_URL` is configured;
- SparkLend Ethereum USDC directly from Spark's ProtocolDataProvider when `ETH_RPC_URL` is configured.

Aave and Morpho require no secret. Compound and Spark are deliberately runtime-gated by an Ethereum RPC secret rather than hardcoding a third-party RPC provider.

## Normalized fields

Each market is converted into the same diagnostic record where available:

- protocol / chain / market id;
- loan asset and collateral asset;
- supply and borrow rates;
- total supplied / borrowed USD;
- available liquidity USD;
- utilization;
- optimal utilization;
- LLTV/LTV;
- supply/borrow caps;
- freeze / pause status;
- observed timestamp and primary-source provenance.

Missing protocol-specific fields are not invented. The pressure score reports coverage percentage.

## Stress Pressure Score

Weights:

| Factor | Weight |
| --- | ---: |
| Utilization | 40% |
| Absolute available liquidity | 25% |
| Available-liquidity ratio | 20% |
| LLTV/LTV | 10% |
| Supply-cap headroom | 5% |

The score is normalized over factors actually available for a market. Coverage is reported separately so a 70/100 score with 85% coverage is not treated as equivalent evidence to 70/100 with 100% coverage.

## Historical stress anchors

The benchmark includes:

- Ethereum Black Thursday — 12 March 2020;
- stETH liquidity discount — June 2022;
- USDC / SVB depeg — March 2023;
- Curve/Vyper / CRV liquidity stress — July 2023;
- MAI stablecoin depeg — July 2023.

Replay multipliers are **calibration assumptions anchored to historical events**, not claims that every protocol experienced exactly those parameter changes.

## Benchmark gates

- **PASS_FULL** — >=20 live markets, all four protocol adapters pass, and every applicable stress replay is monotonic.
- **PASS_PARTIAL_RPC** — >=20 live markets from Aave + Morpho, stress replay passes, Compound/Spark await runtime `ETH_RPC_URL`.
- **BLOCK** — insufficient market count, core adapter failure, or a stress replay reduces measured pressure unexpectedly.

## What v0.4 can prove

It can reveal:

- threshold discontinuities;
- rankings that contradict obvious liquidity pressure;
- protocol fields that are not actually comparable;
- missing evidence / coverage;
- stress scenarios where the score moves in the wrong direction.

It cannot yet prove that a score predicts realized loss probability. That requires longitudinal outcome data and out-of-sample validation.

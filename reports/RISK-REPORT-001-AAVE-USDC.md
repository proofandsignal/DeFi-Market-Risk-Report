# DeFi Market Risk Report #001

## Aave / USDC — Ethereum

**Product status:** Founding Beta  
**Methodology:** Proof & Signal Evidence-Backed Risk Methodology 0.3.0-beta  
**Report as of:** 2026-10-09T15:51:02.870Z

## Executive snapshot

| Metric | Result |
| --- | ---: |
| Supply APY | 4.10% |
| Utilization | 94.21% |
| Available liquidity | $139,656,830 |
| Overall risk | **23/100 — MODERATE** |
| Methodology confidence | **96%** |
| Market Data Quality | **PASS** |
| Report Release Gate | **PASS** |
| Commercial Methodology Gate | **PASS_BETA** |

## Risk dimensions

| Dimension | Score | Band | Confidence | Evidence status |
| --- | ---: | --- | ---: | --- |
| Protocol | 8/100 | LOW | 94% | PASS |
| Asset | 36/100 | MODERATE | 100% | PASS |
| Liquidity | 52/100 | ELEVATED | 100% | PASS |
| Oracle | 9/100 | LOW | 100% | PASS |
| Stablecoin | 18/100 | LOW | 90% | PASS |
| Chain | 12/100 | LOW | 90% | PASS |

## What matters most

The strongest risk signal in this snapshot is **liquidity**, not protocol or oracle risk. Utilization was 94.21%, slightly above the reserve's 94.00% optimal utilization point, while immediately available liquidity represented about 5.79% of total supplied value.

The second material area is **asset exposure / caps**. Supply-cap headroom was about 19.66% and borrow-cap headroom about 15.90%.

The stablecoin dimension remains relatively low on reserve backing and transparency, but the methodology explicitly assigns risk to the issuer administrative control surface because the modeled USDC contract design supports upgrade, pause and blacklist controls.

## Highest-scoring risk factors

| Dimension | Factor | Score | Evidence-based explanation |
| --- | --- | ---: | --- |
| Liquidity | Utilization vs optimal | 65/100 | Utilization is 94.21% versus 94.00% optimal. |
| Liquidity | Available-liquidity ratio | 65/100 | Available liquidity is 5.79% of total supplied value. |
| Stablecoin | Issuer administrative control surface | 60/100 | Upgrade, pause and blacklist controls are present in the modeled Circle EVM stablecoin design. |
| Asset | Supply-cap headroom | 40/100 | Supply-cap headroom is 19.66%. |
| Asset | Borrow-cap headroom | 40/100 | Borrow-cap headroom is 15.90%. |
| Asset | Collateral LTV | 25/100 | Max LTV is 75.00%. |

## Verified live market facts

The live Aave MCP reserve-details response identified:

- market: `AaveV3Ethereum`;
- market address: `0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2`;
- USDC token: `0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48`;
- price source: `Chainlink`;
- oracle: `0x3f73F03aa83B2A48ed27E964eD0fDb590332095B`;
- reserve state: not frozen, not paused;
- max LTV: 75%;
- liquidation threshold: 78%;
- supply cap: approximately $3.0B;
- borrow cap: approximately $2.7B;
- optimal utilization: 94%.

## Evidence registry

1. [Aave protocol security controls](https://www.aave.com/docs/resources/risks)
2. [Aave reserve parameters and governance](https://www.aave.com/docs/aave-v3/concepts/reserve)
3. [Circle USDC reserve transparency](https://www.circle.com/transparency)
4. [Circle EVM stablecoin administrative controls](https://github.com/circlefin/stablecoin-evm)
5. [Ethereum proof-of-stake finality security](https://ethereum.org/developers/docs/consensus-mechanisms/pos/)
6. [Ethereum current finality latency](https://ethereum.org/roadmap/single-slot-finality)
7. [Aave MCP tools / reserve details](https://aave.com/docs/mcp/tools)

## Methodology disclosure

The v0.3 score is a transparent comparative heuristic. It is not a probability of loss, guarantee, credit rating, suitability assessment, or personalized recommendation.

A `PASS_BETA` commercial gate means the evidence and methodology completeness requirements passed for a low-cost informational beta report. It does not mean the model has been statistically calibrated to predict future losses.

## Product boundary

This report measures and explains observed market risk. It does not instruct a reader to buy, sell, supply, borrow, repay, allocate a portfolio, or otherwise transact.

**Decision-support principle:** Measure → Explain → Simulate → Let the user choose.

# Evidence-Backed Risk Methodology v0.3

## Purpose

v0.3 replaces hand-entered dimension scores with deterministic factor scoring tied to evidence.

The score is a **comparative heuristic**, not a probability of loss, credit rating, guarantee, or personalized investment recommendation.

## Dimensions and weights

| Dimension | Weight |
| --- | ---: |
| Protocol | 20% |
| Asset | 15% |
| Liquidity | 20% |
| Oracle | 15% |
| Stablecoin | 15% |
| Chain | 15% |

## Scoring principle

Each dimension contains explicit factors. A factor must have:

- a deterministic rule;
- one or more evidence references;
- an evidence freshness state;
- a confidence value;
- a plain-language explanation.

A missing or expired critical factor makes the dimension UNKNOWN and blocks commercial release.

## Factor rules

### Protocol

- **Operational state — 35%:** 0 if the reserve is enterable and neither frozen nor paused; otherwise 100.
- **Security controls — 35%:** 10 when both published external audits and a continuous bug bounty are evidenced; 40 when only one is evidenced; 80 otherwise.
- **Governance risk controls — 30%:** 15 when dynamic reserve parameters and governance voting are evidenced; 50 when partially evidenced; 80 otherwise.

### Asset

- **Collateral LTV — 30%:** <=65 → 10; <=75 → 25; <=80 → 40; <=85 → 60; >85 → 85.
- **Supply-cap headroom — 35%:** >=30% → 10; >=20% → 25; >=10% → 40; >=5% → 70; <5% → 90; cap reached → 100.
- **Borrow-cap headroom — 35%:** same thresholds as supply-cap headroom.

### Liquidity

- **Utilization vs optimal — 50%:** <=80% → 10; <=90% → 25; <= optimal → 45; <= optimal+2pp → 65; <=98% → 80; >98% → 95.
- **Absolute available liquidity — 30%:** >=$500M → 10; >=$100M → 20; >=$50M → 35; >=$10M → 55; >=$1M → 75; <$1M → 90.
- **Available-liquidity ratio — 20%:** >=30% → 10; >=20% → 20; >=10% → 40; >=5% → 65; >=2% → 80; <2% → 95.

### Oracle

- **Price source — 50%:** Chainlink → 10; CAPO → 20; other explicitly identified source → 40; unknown → UNKNOWN.
- **USD peg deviation — 30%:** <=0.10% → 5; <=0.50% → 20; <=1% → 50; <=3% → 80; >3% → 100.
- **Oracle configuration — 20%:** identified oracle address → 10; missing address → UNKNOWN.

### Stablecoin

- **Reserve coverage — 35%:** >=100% → 5; >=99.5% → 40; <99.5% → 100.
- **Reserve liquidity — 25%:** highly liquid cash/cash-equivalent composition evidenced → 10; otherwise 60.
- **Transparency / assurance — 20%:** weekly disclosure plus monthly third-party assurance → 10; one only → 35; neither → 80.
- **Issuer control surface — 20%:** upgrade + pause + blacklist capabilities → 60; two → 45; one → 30; none → 15.

Administrative controls are treated as a centralization/legal-control risk vector even when they can also mitigate operational incidents.

### Chain

- **Economic finality security — 60%:** >=33% slash threshold for finalized-state reversal → 10; >=20% → 25; lower/unknown → 60.
- **Finality latency — 20%:** <=1 min → 5; <=5 min → 10; <=15 min → 25; >15 min → 50.
- **Settlement layer — 20%:** L1 → 5; L2 → 30; bridge-dependent/appchain → 50; unknown → 70.

## Bands

- 0–19: LOW
- 20–39: MODERATE
- 40–59: ELEVATED
- 60–79: HIGH
- 80–100: CRITICAL

Bands are descriptive labels only.

## Confidence

Evidence records carry confidence between 0 and 1. Dimension confidence is the weighted average of its factor confidence. Overall confidence is the dimension-weighted average.

Commercial beta release requires:

- verified market-data release gate = PASS;
- all risk dimensions = PASS;
- overall confidence >= 0.85;
- no critical evidence item expired or UNKNOWN;
- report clearly labeled as beta methodology.

A passing commercial beta gate means the report is sufficiently evidenced for a low-cost informational beta product. It does **not** mean the methodology is statistically calibrated to predict losses.

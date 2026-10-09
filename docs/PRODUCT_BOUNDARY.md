# Product Boundary v0.1

## Core rule

**Measure → Explain → Simulate → Let the user choose.**

The product is designed as analytics and decision support.

### In scope

- protocol and market analytics;
- APY, utilization and liquidity measurements;
- deterministic risk scoring;
- data-quality states: PASS / VERIFY / UNKNOWN;
- market comparison;
- scenario simulation;
- evidence-backed reports;
- read-only wallet analytics in later versions.

### Out of scope for v0.1

- custody of user assets;
- private-key handling;
- discretionary portfolio management;
- personalized allocation instructions;
- autonomous rebalancing;
- statements such as "you should invest X" or "we recommend this for your portfolio";
- transaction execution.

## Report release rule

A paid/final report must not be marked releasable when a core data input is VERIFY or UNKNOWN.

The deterministic engine therefore returns:

- **PASS** only when all core data-quality fields are PASS and evidence is present;
- **BLOCK** otherwise.

This technical gate is a product-quality control. It is not a legal conclusion or regulatory safe harbor.

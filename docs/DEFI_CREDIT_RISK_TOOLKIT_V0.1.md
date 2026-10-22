# DeFi Credit & Risk Toolkit v0.1

## Objective

Build the Proof & Signal DeFi Credit & Risk product family as one evidence-first system rather than unrelated tools.

Core flow:

```
Protocol / vault / market / wallet evidence
                  ↓
      normalized evidence records
                  ↓
 product + governance + oracle + liquidity
                  ↓
      stress + market + credit layers
                  ↓
 report / treasury console / monitoring / API
```

## Synchronized modules

1. Market Risk — existing evidence-backed market methodology.
2. Product / Vault Evidence — allocations, collateral, curator caps and dated exposure.
3. Admin & Governance Control — upgrade, pause, emergency, multisig and timelock authority.
4. Oracle Risk — type, fallback, staleness, dependencies and deviation flags.
5. Liquidity & Exit — holder-size coverage scenarios with explicit model boundaries.
6. Historical Stress Replay — descriptive replay of verified historical events.
7. Wallet / Position Risk Monitor — integrated through the separate DeFi-Guard repository.
8. Credit Delegation / Counterparty Risk — integrated through the separate Credit-Delegation-Risk repository.
9. Treasury Risk Console — unified consumption surface after module outputs stabilize.
10. Monitoring + API — machine-readable delivery and continuous observations.

## Build policy

The modules advance in parallel behind a common evidence contract, but release gates remain independent.

No module may convert missing evidence into a PASS. VERIFY / UNKNOWN remain blocking states where the output requires verified evidence.

Existing DeFi-Guard and Credit Delegation implementations remain isolated in their own repositories. This repository defines the market/product risk analyzers and shared public evidence surface; cross-repository integration is adapter-based rather than code copying.

## Immediate commercial vertical

Morpho product/vault → admin controls → oracle → allocation → exit liquidity → historical stress → evidence pack.

This vertical is the first customer-validation path because it directly reflects requested reader requirements.

## Product boundary

Outputs are informational analytics and decision support. They are not personalized allocation advice, guarantees, custody, private-key handling or transaction execution.

# Evidence Pack #001 — Sentora RLUSD Main (V2)

## Target

- Chain: Ethereum
- Protocol: Morpho Vault V2
- Vault: Sentora RLUSD Main (V2)
- Address: `0x6dC58a0FdfC8D694e571DC59B9A52EEEa780E6bf`
- Asset: RLUSD

## Validation questions

The pack must settle four questions with dated evidence and provenance:

1. **Yield after rewards:** separate native/post-fee vault yield from temporary reward APR, identify the current reward end date, and reconstruct renewal history since the vault launched in March 2026.
2. **Allocation movement:** current allocation by market and collateral plus a 30-day movement history.
3. **Control surface:** owner, curator, allocators, sentinels/guardian-equivalent controls, caps and function-specific timelocks.
4. **Stress exit:** estimate immediately withdrawable assets and compare holder-size exit scenarios against a stated external benchmark.

## Evidence hierarchy

1. On-chain contract reads / logs.
2. Morpho official API and official Morpho documentation.
3. Merkl campaign records for rewards.
4. Third-party observations only as cross-checks, never as the sole source of a PASS claim.

## Important implementation note

Morpho Vault V2 current allocations are available through adapter/position data. A 30-day V2 allocation history is not treated as automatically available from the same historical allocation endpoint used for V1; if an official V2 historical series is unavailable, the history must be reconstructed from on-chain allocation/deallocation activity or archived verified snapshots.

## Release rule

Every material conclusion must carry:
- observed-at timestamp;
- primary reference;
- PASS / VERIFY / UNKNOWN;
- explicit calculation or derivation where applicable.

Missing historical evidence must remain UNKNOWN rather than being interpolated.

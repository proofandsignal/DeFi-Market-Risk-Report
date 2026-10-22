import test from "node:test";
import assert from "node:assert/strict";
import {
  TOOLKIT_MODULES,
  analyzeProductVault,
  analyzeAdminGovernance,
  analyzeOracleRisk,
  analyzeLiquidityExit,
  analyzeHistoricalStress
} from "../src/toolkit/index.mjs";

const evidence = [{
  id: "ev-1",
  source: "primary",
  reference: "https://example.invalid/primary",
  observedAt: "2026-10-22T00:00:00Z",
  state: "PASS"
}];

test("toolkit registry exposes the synchronized product surface", () => {
  for (const name of [
    "product-vault-evidence",
    "admin-governance-control",
    "oracle-risk-inspector",
    "liquidity-exit-analyzer",
    "historical-stress-replay",
    "wallet-position-risk-monitor",
    "credit-delegation-counterparty-risk",
    "treasury-risk-console",
    "monitoring-api"
  ]) assert.ok(TOOLKIT_MODULES.includes(name));
});

test("vault analyzer computes allocation and cap exposure", () => {
  const result = analyzeProductVault({
    productId: "morpho:test-vault",
    snapshotAt: "2026-10-22T00:00:00Z",
    totalAssetsUsd: 10_000_000,
    allocations: [
      { marketId: "market-a", valueUsd: 6_000_000, curatorCapUsd: 8_000_000, evidence },
      { marketId: "market-b", valueUsd: 3_000_000, curatorCapUsd: 5_000_000, evidence }
    ]
  });
  assert.equal(result.allocationCoveragePct, 90);
  assert.equal(result.unallocatedUsd, 1_000_000);
  assert.equal(result.evidenceGate, "PASS");
  assert.equal(result.allocations[0].curatorCapUsagePct, 75);
});

test("admin governance analyzer records powers and timelocks", () => {
  const result = analyzeAdminGovernance({
    productId: "morpho:test-vault",
    snapshotAt: "2026-10-22T00:00:00Z",
    controls: [
      { kind: "upgrade", actor: "0xmultisig", threshold: 3, signerCount: 5, timelockSeconds: 86400, evidence },
      { kind: "pause", actor: "0xguardian", evidence }
    ]
  });
  assert.equal(result.upgradeAuthorityPresent, true);
  assert.equal(result.pauseAuthorityPresent, true);
  assert.equal(result.controls[0].multisigThresholdRatio, 0.6);
  assert.equal(result.evidenceGate, "PASS");
});

test("oracle inspector flags missing fallback and stale data", () => {
  const result = analyzeOracleRisk({
    productId: "morpho:test-vault",
    snapshotAt: "2026-10-22T00:00:00Z",
    markets: [
      { marketId: "market-a", oracleType: "Chainlink", fallbackType: null, stalenessSeconds: 7200, deviationBps: 20, evidence }
    ]
  });
  assert.deepEqual(result.flaggedMarkets, ["market-a"]);
  assert.ok(result.markets[0].flags.includes("FALLBACK_NOT_EVIDENCED"));
  assert.ok(result.markets[0].flags.includes("STALE_OVER_1H"));
});

test("liquidity analyzer produces holder-size scenarios", () => {
  const result = analyzeLiquidityExit({
    productId: "morpho:test-vault",
    snapshotAt: "2026-10-22T00:00:00Z",
    availableLiquidityUsd: 2_000_000,
    utilizationPct: 92
  });
  assert.equal(result.scenarios[0].classification, "FULL_BY_AVAILABLE_LIQUIDITY");
  assert.equal(result.scenarios[1].classification, "FULL_BY_AVAILABLE_LIQUIDITY");
  assert.equal(result.scenarios[2].classification, "INSUFFICIENT");
});

test("stress replay summarizes verified event inputs without forecasting", () => {
  const result = analyzeHistoricalStress({
    productId: "morpho:test-vault",
    events: [
      { type: "depeg", timestamp: "2026-01-01T00:00:00Z", deviationBps: -180 },
      { type: "liquidity-shock", timestamp: "2026-02-01T00:00:00Z", liquidityDrawdownPct: 42, utilizationPct: 98 }
    ]
  });
  assert.equal(result.eventsAnalyzed, 2);
  assert.equal(result.maxAbsDeviationBps, 180);
  assert.equal(result.maxLiquidityDrawdownPct, 42);
});

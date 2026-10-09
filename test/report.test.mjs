import test from "node:test";
import assert from "node:assert/strict";

import { assertNoPersonalAdvice } from "../src/adviceFirewall.mjs";
import { evaluateObservation } from "../src/dataContract.mjs";
import { generateReport } from "../src/report.mjs";

const source = {
  provider: "Aave",
  endpoint: "https://mcp.aave.com",
  method: "get_markets",
  evidenceUrl: "https://aave.com/docs/mcp/tools",
};

const observation = (value, observedAt = "2026-10-09T05:58:00.000Z") => ({
  value,
  unit: "test",
  source,
  observedAt,
  fetchedAt: "2026-10-09T05:58:05.000Z",
});

const base = {
  reportAsOf: "2026-10-09T06:00:00.000Z",
  market: { protocol: "Aave", asset: "USDC", chain: "Ethereum", chainId: 1 },
  observations: {
    supplyApyPct: observation(4.81),
    utilizationPct: observation(72.4),
    availableLiquidityUsd: observation(84200000),
  },
  risk: {
    protocol: 14, asset: 18, liquidity: 9, oracle: 11, stablecoin: 17, chain: 12,
  },
  riskAssessment: {
    methodology: "Proof & Signal deterministic risk model v0.2",
    assessedAt: "2026-10-09T05:55:00.000Z",
    evidence: [{ label: "Aave docs", url: "https://aave.com/docs/mcp/tools" }],
  },
};

test("generates a releasable report only from fresh verified inputs", () => {
  const result = generateReport(base);
  assert.equal(result.risk.score, 13);
  assert.equal(result.gate.status, "PASS");
  assert.equal(result.gate.dataQuality, "PASS");
  assert.match(result.report, /Verified data provenance/);
});

test("stale observation becomes VERIFY and blocks release", () => {
  const result = generateReport({
    ...base,
    observations: {
      ...base.observations,
      supplyApyPct: observation(4.81, "2026-10-09T05:52:00.000Z"),
    },
  });
  assert.equal(result.gate.fields.apy, "VERIFY");
  assert.equal(result.gate.status, "BLOCK");
});

test("very stale observation becomes UNKNOWN", () => {
  const result = evaluateObservation(
    observation(4.81, "2026-10-09T05:30:00.000Z"),
    base.reportAsOf,
    5 * 60 * 1000,
  );
  assert.equal(result.status, "UNKNOWN");
});

test("impossible timestamp ordering becomes UNKNOWN", () => {
  const bad = {
    ...observation(4.81),
    observedAt: "2026-10-09T06:10:00.000Z",
  };
  assert.equal(evaluateObservation(bad, base.reportAsOf, 5 * 60 * 1000).status, "UNKNOWN");
});

test("advice firewall rejects personalized recommendation language", () => {
  assert.throws(
    () => assertNoPersonalAdvice("You should deposit 15000 USDC into Aave."),
    /Advice Firewall blocked/,
  );
  assert.throws(
    () => assertNoPersonalAdvice("Sell ETH and repay the loan."),
    /Advice Firewall blocked/,
  );
});

test("analyst notes also pass through the advice firewall", () => {
  assert.throws(
    () => generateReport({ ...base, analystNotes: "We recommend this market for your portfolio." }),
    /Advice Firewall blocked/,
  );
});

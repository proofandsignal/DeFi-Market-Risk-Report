import test from "node:test";
import assert from "node:assert/strict";

import { assertNoPersonalAdvice } from "../src/adviceFirewall.mjs";
import { generateReport } from "../src/report.mjs";

const base = {
  market: {
    protocol: "Aave",
    asset: "USDC",
    chain: "Ethereum",
    supplyApyPct: 4.81,
    utilizationPct: 72.4,
    availableLiquidityUsd: 84200000,
  },
  risk: {
    protocol: 14,
    asset: 18,
    liquidity: 9,
    oracle: 11,
    stablecoin: 17,
    chain: 12,
  },
  dataQuality: {
    apy: "PASS",
    utilization: "PASS",
    liquidity: "PASS",
    riskInputs: "PASS",
  },
  evidence: [
    {
      label: "Aave application",
      url: "https://app.aave.com/",
    },
  ],
};

test("generates a deterministic low-risk report", () => {
  const result = generateReport(base);
  assert.equal(result.risk.score, 13);
  assert.equal(result.risk.band, "LOW");
  assert.equal(result.gate.status, "PASS");
  assert.match(result.report, /Aave \/ USDC/);
});

test("blocks release when any core data is UNKNOWN", () => {
  const result = generateReport({
    ...base,
    dataQuality: {
      ...base.dataQuality,
      liquidity: "UNKNOWN",
    },
  });
  assert.equal(result.gate.status, "BLOCK");
  assert.equal(result.gate.dataQuality, "UNKNOWN");
});

test("advice firewall rejects personalized recommendation language", () => {
  assert.throws(
    () => assertNoPersonalAdvice("You should deposit 15000 USDC into Aave."),
    /Advice Firewall blocked/,
  );
});

test("analyst notes also pass through the advice firewall", () => {
  assert.throws(
    () =>
      generateReport({
        ...base,
        analystNotes: "We recommend this market for your portfolio.",
      }),
    /Advice Firewall blocked/,
  );
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import { assertNoPersonalAdvice } from "../src/adviceFirewall.mjs";
import { evaluateObservation } from "../src/dataContract.mjs";
import { normalizeAaveV3EthereumUsdcReserveDetails } from "../src/adapters/aaveMcp.mjs";
import { scoreEvidenceBackedRisk } from "../src/riskMethodology.mjs";
import { generateReport } from "../src/report.mjs";

const snapshot = JSON.parse(
  await readFile(
    new URL(
      "../snapshots/aave-v3-ethereum-usdc-reserve-2026-10-09T154334Z.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const evidenceRecords = JSON.parse(
  await readFile(
    new URL("../evidence/methodology-evidence-2026-10-09.json", import.meta.url),
    "utf8",
  ),
);
const normalized = normalizeAaveV3EthereumUsdcReserveDetails(snapshot);
const riskAssessment = scoreEvidenceBackedRisk({
  reserve: normalized.riskFacts,
  evidenceRecords,
  asOf: normalized.reportAsOf,
});

const base = {
  reportAsOf: normalized.reportAsOf,
  market: normalized.market,
  observations: normalized.observations,
  riskAssessment,
};

test("generates Risk Report #001 from computed evidence-backed scores", () => {
  const result = generateReport(base);
  assert.equal(result.risk.score, 23);
  assert.equal(result.risk.band, "MODERATE");
  assert.equal(result.gate.status, "PASS");
  assert.equal(result.gate.dataQuality, "PASS");
  assert.equal(result.gate.commercialStatus, "PASS_BETA");
  assert.match(result.report, /DeFi Market Risk Report #001/);
  assert.match(result.report, /Liquidity \| 52\/100/);
  assert.match(result.report, /comparative heuristic/);
});

test("stale live observation blocks report release", () => {
  const stale = structuredClone(base);
  stale.reportAsOf = "2026-10-09T15:55:00.000Z";
  stale.riskAssessment.assessedAt = stale.reportAsOf;
  const result = generateReport(stale);
  assert.equal(result.gate.status, "BLOCK");
  assert.equal(result.gate.dataQuality, "VERIFY");
});

test("very stale observation becomes UNKNOWN", () => {
  const result = evaluateObservation(
    normalized.observations.supplyApyPct,
    "2026-10-09T16:30:00.000Z",
    5 * 60 * 1000,
  );
  assert.equal(result.status, "UNKNOWN");
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
    () =>
      generateReport({
        ...base,
        analystNotes: "We recommend this market for your portfolio.",
      }),
    /Advice Firewall blocked/,
  );
});

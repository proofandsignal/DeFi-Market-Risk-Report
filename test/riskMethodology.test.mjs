import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  normalizeAaveV3EthereumUsdcReserveDetails,
} from "../src/adapters/aaveMcp.mjs";
import {
  evaluateEvidenceRecord,
  scoreEvidenceBackedRisk,
} from "../src/riskMethodology.mjs";

const snapshot = JSON.parse(
  await readFile(
    new URL(
      "../snapshots/aave-v3-ethereum-usdc-reserve-2026-10-09T154334Z.json",
      import.meta.url,
    ),
    "utf8",
  ),
);
const evidence = JSON.parse(
  await readFile(
    new URL("../evidence/methodology-evidence-2026-10-09.json", import.meta.url),
    "utf8",
  ),
);
const normalized = normalizeAaveV3EthereumUsdcReserveDetails(snapshot);

test("evidence record freshness is explicit", () => {
  const record = evidence.find((item) => item.id === "usdc_reserve_transparency");
  assert.equal(
    evaluateEvidenceRecord(record, "2026-10-09T15:43:34.561Z").status,
    "PASS",
  );
  assert.equal(
    evaluateEvidenceRecord(record, "2026-11-20T15:43:34.561Z").status,
    "UNKNOWN",
  );
});

test("scores all six dimensions from evidence-backed factors", () => {
  const assessment = scoreEvidenceBackedRisk({
    reserve: normalized.riskFacts,
    evidenceRecords: evidence,
    asOf: "2026-10-09T15:43:34.561Z",
  });

  assert.deepEqual(Object.keys(assessment.dimensions), [
    "protocol",
    "asset",
    "liquidity",
    "oracle",
    "stablecoin",
    "chain",
  ]);
  assert.equal(assessment.dimensions.protocol.score, 8);
  assert.equal(assessment.dimensions.asset.score, 36);
  assert.equal(assessment.dimensions.liquidity.score, 52);
  assert.equal(assessment.dimensions.oracle.score, 9);
  assert.equal(assessment.dimensions.stablecoin.score, 18);
  assert.equal(assessment.dimensions.chain.score, 12);
  assert.equal(assessment.overall.score, 23);
  assert.equal(assessment.overall.band, "MODERATE");
  assert.ok(assessment.overall.confidence >= 0.85);
  assert.equal(assessment.commercialGate.status, "PASS_BETA");
});

test("expired critical stablecoin evidence blocks commercial beta release", () => {
  const assessment = scoreEvidenceBackedRisk({
    reserve: {
      ...normalized.riskFacts,
      fetchedAt: "2026-11-20T15:43:34.561Z",
    },
    evidenceRecords: evidence,
    asOf: "2026-11-20T15:43:34.561Z",
  });
  assert.equal(assessment.dimensions.stablecoin.status, "UNKNOWN");
  assert.equal(assessment.commercialGate.status, "BLOCK");
});

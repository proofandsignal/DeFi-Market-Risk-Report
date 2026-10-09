import { readFile } from "node:fs/promises";

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

const result = generateReport({
  reportAsOf: normalized.reportAsOf,
  market: normalized.market,
  observations: normalized.observations,
  riskAssessment,
  analystNotes:
    "Snapshot report for Aave V3 Ethereum Core / USDC. Market facts are from the official Aave MCP reserve-details response; external methodology evidence is captured from primary or issuer sources.",
});

process.stdout.write(result.report);
if (result.gate.status !== "PASS") process.exitCode = 2;

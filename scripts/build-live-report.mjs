import { mkdir, readFile, writeFile } from "node:fs/promises";

import { fetchVerifiedAaveV3EthereumUsdcReserveDetails } from "../src/adapters/aaveMcp.mjs";
import { scoreEvidenceBackedRisk } from "../src/riskMethodology.mjs";
import { generateReport } from "../src/report.mjs";

const evidenceRecords = JSON.parse(
  await readFile(
    new URL("../evidence/methodology-evidence-2026-10-09.json", import.meta.url),
    "utf8",
  ),
);
const live = await fetchVerifiedAaveV3EthereumUsdcReserveDetails();
const normalized = live.normalized;
const riskAssessment = scoreEvidenceBackedRisk({
  reserve: normalized.riskFacts,
  evidenceRecords,
  asOf: normalized.reportAsOf,
});

const input = {
  reportAsOf: normalized.reportAsOf,
  market: normalized.market,
  observations: normalized.observations,
  riskAssessment,
  analystNotes:
    "Live beta report for Aave V3 Ethereum Core / USDC. Market facts are from the official Aave MCP reserve-details response.",
};
const result = generateReport(input);

await mkdir("reports/generated", { recursive: true });
await writeFile("reports/generated/RISK-REPORT-001-AAVE-USDC.md", result.report);
await writeFile(
  "reports/generated/RISK-REPORT-001-AAVE-USDC.input.json",
  JSON.stringify(input, null, 2) + "\n",
);
await writeFile(
  "reports/generated/RISK-REPORT-001-AAVE-USDC.raw-aave.json",
  JSON.stringify(live.raw.raw, null, 2) + "\n",
);

process.stdout.write(result.report);
if (result.gate.status !== "PASS") process.exitCode = 2;

import { mkdir, readFile, writeFile } from "node:fs/promises";

import { fetchVerifiedAaveV3EthereumUsdcReserveDetails } from "../src/adapters/aaveMcp.mjs";
import { scoreEvidenceBackedRisk } from "../src/riskMethodology.mjs";
import { generateReport } from "../src/report.mjs";

const evidenceRecords = JSON.parse(
  await readFile(new URL("../evidence/methodology-evidence-2026-10-09.json", import.meta.url), "utf8"),
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
  analystNotes: "Live beta report for Aave V3 Ethereum Core / USDC. Market facts are from the official Aave MCP reserve-details response.",
};

await mkdir("reports/generated", { recursive: true });
await writeFile("reports/generated/RISK-REPORT-001-AAVE-USDC.input.json", JSON.stringify(input, null, 2) + "\n");
await writeFile("reports/generated/RISK-REPORT-001-AAVE-USDC.raw-aave.json", JSON.stringify(live.raw.raw, null, 2) + "\n");

const incompleteDimensions = Object.entries(riskAssessment.dimensions)
  .filter(([, dimension]) => !Number.isFinite(dimension.score))
  .map(([name, dimension]) => ({ name, status: dimension.status }));
const expiredEvidence = riskAssessment.evidence
  .filter((item) => item.status !== "PASS")
  .map(({ id, status, capturedAt }) => ({ id, status, capturedAt }));
const ready = riskAssessment.commercialGate.status === "PASS_BETA"
  && Number.isFinite(riskAssessment.overall.score)
  && incompleteDimensions.length === 0;

const classification = {
  reportAsOf: normalized.reportAsOf,
  source: "Aave MCP get_reserve_details",
  sourceCapture: "COMPLETE",
  independentlyVerified: false,
  methodologyGate: riskAssessment.commercialGate.status,
  commercialRelease: "HOLD",
  liveReportGenerated: ready,
  blockedReasons: riskAssessment.commercialGate.reasons,
  incompleteDimensions,
  nonPassingEvidence: expiredEvidence,
};
await writeFile("reports/generated/live-report-classification.json", JSON.stringify(classification, null, 2) + "\n");

if (!ready) {
  console.error("LIVE_REPORT_BLOCKED: incomplete or expired methodology evidence. No numeric risk report emitted.");
  console.error(JSON.stringify(classification));
  process.exitCode = 2;
} else {
  const result = generateReport(input);
  await writeFile("reports/generated/RISK-REPORT-001-AAVE-USDC.md", result.report);
  process.stdout.write(result.report);
  if (result.gate.status !== "PASS") process.exitCode = 2;
}

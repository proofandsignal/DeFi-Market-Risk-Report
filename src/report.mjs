import { REQUIRED_DIMENSIONS } from "./constants.mjs";
import { assertNoPersonalAdvice } from "./adviceFirewall.mjs";
import { calculateRisk, releaseGate } from "./score.mjs";
import { validateInput } from "./validate.mjs";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
function pct(value) { return `${value.toFixed(2)}%`; }

export function generateReport(rawInput) {
  const input = validateInput(rawInput);
  const risk = calculateRisk(input.risk);
  const gate = releaseGate(input);
  const obs = input.observations;

  const dimensions = REQUIRED_DIMENSIONS.map(
    (dimension) => `| ${dimension[0].toUpperCase() + dimension.slice(1)} | ${input.risk[dimension]}/100 |`,
  ).join("\n");

  const provenanceRows = [
    ["Supply APY", obs.supplyApyPct, gate.fields.apy],
    ["Utilization", obs.utilizationPct, gate.fields.utilization],
    ["Available liquidity", obs.availableLiquidityUsd, gate.fields.liquidity],
  ].map(([label, item, status]) =>
    `| ${label} | ${item.source.provider} / ${item.source.method} | ${item.observedAt} | ${item.fetchedAt} | ${status} |`
  ).join("\n");

  const evidence = input.riskAssessment.evidence
    .map((item, index) => `${index + 1}. [${item.label}](${item.url})`)
    .join("\n");

  const note = input.analystNotes ? `\n## Analyst notes\n\n${input.analystNotes}\n` : "";

  const report = `# DeFi Market Risk Report

## ${input.market.protocol} / ${input.market.asset}

- **Chain:** ${input.market.chain}
- **Report as of:** ${input.reportAsOf}
- **Supply APY:** ${pct(obs.supplyApyPct.value)}
- **Utilization:** ${pct(obs.utilizationPct.value)}
- **Available liquidity:** ${money(obs.availableLiquidityUsd.value)}
- **Overall risk:** ${risk.score}/100 — **${risk.band}**
- **Data Quality:** ${gate.dataQuality}
- **Release Gate:** ${gate.status}

## Risk dimensions

| Dimension | Score |
| --- | ---: |
${dimensions}

## Verified data provenance

| Metric | Source | Observed at | Fetched at | Status |
| --- | --- | --- | --- | --- |
${provenanceRows}
| Risk inputs | ${input.riskAssessment.methodology ?? "Risk assessment"} | ${input.riskAssessment.assessedAt} | ${input.riskAssessment.assessedAt} | ${gate.fields.riskInputs} |
${note}
## Risk evidence

${evidence}

## Interpretation

This report presents market analytics, risk measurements and scenario-relevant evidence. It does not provide a personalized recommendation, portfolio allocation, or instruction to buy, sell, supply, borrow, repay, or otherwise transact.

**Decision-support principle:** Measure → Explain → Simulate → Let the user choose.
`;

  assertNoPersonalAdvice(report);
  return { report, risk, gate };
}

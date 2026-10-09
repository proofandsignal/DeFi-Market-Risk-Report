import { REQUIRED_DIMENSIONS } from "./constants.mjs";
import { assertNoPersonalAdvice } from "./adviceFirewall.mjs";
import { releaseGate } from "./score.mjs";
import { validateInput } from "./validate.mjs";

function money(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  }).format(value);
}
function pct(value) { return `${value.toFixed(2)}%`; }
function confidence(value) { return `${(value * 100).toFixed(0)}%`; }

export function generateReport(rawInput) {
  const input = validateInput(rawInput);
  const assessment = input.riskAssessment;
  const risk = assessment.overall;
  const gate = releaseGate(input);
  const obs = input.observations;

  const dimensions = REQUIRED_DIMENSIONS.map((dimension) => {
    const item = assessment.dimensions[dimension];
    return `| ${dimension[0].toUpperCase() + dimension.slice(1)} | ${item.score}/100 | ${item.band} | ${confidence(item.confidence)} | ${item.status} |`;
  }).join("\n");

  const factorRows = REQUIRED_DIMENSIONS.flatMap((dimension) =>
    assessment.dimensions[dimension].factors.map((item) => ({
      dimension,
      ...item,
    })),
  )
    .sort((a, b) => (b.score ?? -1) - (a.score ?? -1))
    .slice(0, 6)
    .map((item) =>
      `| ${item.dimension} | ${item.label} | ${item.score}/100 | ${item.explanation} |`,
    )
    .join("\n");

  const provenanceRows = [
    ["Supply APY", obs.supplyApyPct, gate.fields.apy],
    ["Utilization", obs.utilizationPct, gate.fields.utilization],
    ["Available liquidity", obs.availableLiquidityUsd, gate.fields.liquidity],
  ].map(([label, item, status]) =>
    `| ${label} | ${item.source.provider} / ${item.source.method} | ${item.observedAt} | ${item.fetchedAt} | ${status} |`,
  ).join("\n");

  const evidence = assessment.evidence
    .map((item, index) =>
      `${index + 1}. [${item.label}](${item.url}) — ${item.status}, captured ${item.capturedAt}`,
    )
    .join("\n");

  const note = input.analystNotes ? `\n## Analyst notes\n\n${input.analystNotes}\n` : "";

  const report = `# DeFi Market Risk Report #001

## ${input.market.protocol} / ${input.market.asset} — ${input.market.chain}

- **Report as of:** ${input.reportAsOf}
- **Supply APY:** ${pct(obs.supplyApyPct.value)}
- **Utilization:** ${pct(obs.utilizationPct.value)}
- **Available liquidity:** ${money(obs.availableLiquidityUsd.value)}
- **Overall risk:** ${risk.score}/100 — **${risk.band}**
- **Methodology confidence:** ${confidence(risk.confidence)}
- **Market Data Quality:** ${gate.dataQuality}
- **Report Release Gate:** ${gate.status}
- **Commercial Methodology Gate:** ${gate.commercialStatus}
- **Methodology:** ${assessment.methodology} ${assessment.version} (${assessment.methodologyStatus})

## Risk dimensions

| Dimension | Score | Band | Confidence | Evidence status |
| --- | ---: | --- | ---: | --- |
${dimensions}

## Highest-scoring risk factors

| Dimension | Factor | Risk score | Evidence-based explanation |
| --- | --- | ---: | --- |
${factorRows}

## Verified market-data provenance

| Metric | Source | Observed at | Fetched at | Status |
| --- | --- | --- | --- | --- |
${provenanceRows}
| Risk methodology | ${assessment.methodology} | ${assessment.assessedAt} | ${assessment.assessedAt} | ${gate.fields.riskInputs} |
${note}
## Evidence registry

${evidence}

## Methodology disclosure

The v0.3 score is a transparent comparative heuristic. It is not a probability of loss, guarantee, credit rating, suitability assessment, or personalized recommendation. A PASS_BETA commercial gate means the evidence and methodology completeness rules passed for a low-cost informational beta report; it does not mean the model has been statistically calibrated to predict losses.

## Interpretation

This report presents market analytics, risk measurements and evidence. It does not provide a personalized portfolio allocation or instruction to buy, sell, supply, borrow, repay, or otherwise transact.

**Decision-support principle:** Measure → Explain → Simulate → Let the user choose.
`;

  assertNoPersonalAdvice(report);
  return { report, risk, gate };
}

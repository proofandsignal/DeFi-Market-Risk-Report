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

function pct(value) {
  return `${value.toFixed(2)}%`;
}

export function generateReport(rawInput) {
  const input = validateInput(rawInput);
  const risk = calculateRisk(input.risk);
  const gate = releaseGate(input);

  const dimensions = REQUIRED_DIMENSIONS.map(
    (dimension) =>
      `| ${dimension[0].toUpperCase() + dimension.slice(1)} | ${input.risk[dimension]}/100 |`,
  ).join("\n");

  const evidence = input.evidence
    .map((item, index) => `${index + 1}. [${item.label}](${item.url})`)
    .join("\n");

  const note = input.analystNotes
    ? `\n## Analyst notes\n\n${input.analystNotes}\n`
    : "";

  const report = `# DeFi Market Risk Report

## ${input.market.protocol} / ${input.market.asset}

- **Chain:** ${input.market.chain}
- **Supply APY:** ${pct(input.market.supplyApyPct)}
- **Utilization:** ${pct(input.market.utilizationPct)}
- **Available liquidity:** ${money(input.market.availableLiquidityUsd)}
- **Overall risk:** ${risk.score}/100 — **${risk.band}**
- **Data Quality:** ${gate.dataQuality}
- **Release Gate:** ${gate.status}

## Risk dimensions

| Dimension | Score |
| --- | ---: |
${dimensions}

## Data quality

| Input | Status |
| --- | --- |
| APY | ${input.dataQuality.apy} |
| Utilization | ${input.dataQuality.utilization} |
| Liquidity | ${input.dataQuality.liquidity} |
| Risk inputs | ${input.dataQuality.riskInputs} |
${note}
## Evidence

${evidence}

## Interpretation

This report presents market analytics, risk measurements and scenario-relevant evidence. It does not provide a personalized recommendation, portfolio allocation, or instruction to buy, sell, supply, borrow, repay, or otherwise transact.

**Decision-support principle:** Measure → Explain → Simulate → Let the user choose.
`;

  assertNoPersonalAdvice(report);
  return {
    report,
    risk,
    gate,
  };
}

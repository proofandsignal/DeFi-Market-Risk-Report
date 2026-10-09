import { REQUIRED_DIMENSIONS, RISK_WEIGHTS, riskBand } from "./constants.mjs";
import { deriveDataQuality } from "./dataContract.mjs";

export function calculateRisk(risk) {
  const raw = REQUIRED_DIMENSIONS.reduce(
    (sum, dimension) => sum + risk[dimension] * RISK_WEIGHTS[dimension],
    0,
  );
  const score = Math.round(raw);
  return { score, band: riskBand(score) };
}

export function calculateDataQuality(input) {
  const dataQuality = deriveDataQuality(input);
  const values = Object.values(dataQuality);
  const overall = values.includes("UNKNOWN")
    ? "UNKNOWN"
    : values.includes("VERIFY")
      ? "VERIFY"
      : "PASS";
  return { overall, fields: dataQuality };
}

export function releaseGate(input) {
  const dataQuality = calculateDataQuality(input);
  return {
    status: dataQuality.overall === "PASS" ? "PASS" : "BLOCK",
    dataQuality: dataQuality.overall,
    fields: dataQuality.fields,
  };
}

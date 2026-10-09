import {
  REQUIRED_DIMENSIONS,
  RISK_WEIGHTS,
  riskBand,
} from "./constants.mjs";

export function calculateRisk(risk) {
  const raw = REQUIRED_DIMENSIONS.reduce(
    (sum, dimension) => sum + risk[dimension] * RISK_WEIGHTS[dimension],
    0,
  );
  const score = Math.round(raw);
  return {
    score,
    band: riskBand(score),
  };
}

export function calculateDataQuality(dataQuality) {
  const values = Object.values(dataQuality);
  if (values.includes("UNKNOWN")) return "UNKNOWN";
  if (values.includes("VERIFY")) return "VERIFY";
  return "PASS";
}

export function releaseGate(input) {
  const dataQuality = calculateDataQuality(input.dataQuality);
  const evidenceComplete =
    Array.isArray(input.evidence) &&
    input.evidence.length > 0 &&
    input.evidence.every((item) => item.label && item.url);

  return {
    status: dataQuality === "PASS" && evidenceComplete ? "PASS" : "BLOCK",
    dataQuality,
    evidenceComplete,
  };
}

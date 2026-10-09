export const RISK_WEIGHTS = Object.freeze({
  protocol: 0.20,
  asset: 0.15,
  liquidity: 0.20,
  oracle: 0.15,
  stablecoin: 0.15,
  chain: 0.15,
});

export const DATA_QUALITY_STATUSES = Object.freeze([
  "PASS",
  "VERIFY",
  "UNKNOWN",
]);

export const REQUIRED_DIMENSIONS = Object.freeze(
  Object.keys(RISK_WEIGHTS),
);

export function riskBand(score) {
  if (score < 25) return "LOW";
  if (score < 50) return "MODERATE";
  if (score < 70) return "HIGH";
  return "CRITICAL";
}

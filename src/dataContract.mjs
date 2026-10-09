export const OBSERVATION_KEYS = Object.freeze([
  "supplyApyPct",
  "utilizationPct",
  "availableLiquidityUsd",
]);

export const FRESHNESS_POLICY_MS = Object.freeze({
  supplyApyPct: 5 * 60 * 1000,
  utilizationPct: 5 * 60 * 1000,
  availableLiquidityUsd: 5 * 60 * 1000,
});

const CLOCK_SKEW_MS = 60 * 1000;
const RISK_PASS_MS = 24 * 60 * 60 * 1000;
const RISK_VERIFY_MS = 7 * 24 * 60 * 60 * 1000;

export function parseIsoTimestamp(value) {
  if (typeof value !== "string") return null;
  const ms = Date.parse(value);
  return Number.isFinite(ms) ? ms : null;
}

function sourceComplete(source) {
  if (!source?.provider || !source?.endpoint || !source?.method || !source?.evidenceUrl) {
    return false;
  }
  try {
    new URL(source.endpoint);
    new URL(source.evidenceUrl);
    return true;
  } catch {
    return false;
  }
}

export function evaluateObservation(observation, asOf, maxAgeMs) {
  if (!observation || !Number.isFinite(observation.value) || !sourceComplete(observation.source)) {
    return { status: "UNKNOWN", ageMs: null, reason: "missing_value_or_provenance" };
  }

  const asOfMs = parseIsoTimestamp(asOf);
  const observedMs = parseIsoTimestamp(observation.observedAt);
  const fetchedMs = parseIsoTimestamp(observation.fetchedAt);

  if (asOfMs === null || observedMs === null || fetchedMs === null) {
    return { status: "UNKNOWN", ageMs: null, reason: "invalid_timestamp" };
  }

  if (observedMs > fetchedMs + CLOCK_SKEW_MS || fetchedMs > asOfMs + CLOCK_SKEW_MS) {
    return { status: "UNKNOWN", ageMs: null, reason: "impossible_timestamp_order" };
  }

  const ageMs = Math.max(0, asOfMs - observedMs);
  if (ageMs <= maxAgeMs) {
    return { status: "PASS", ageMs, reason: "fresh" };
  }
  if (ageMs <= maxAgeMs * 4) {
    return { status: "VERIFY", ageMs, reason: "stale" };
  }
  return { status: "UNKNOWN", ageMs, reason: "too_stale" };
}

export function evaluateRiskAssessment(riskAssessment, asOf) {
  const asOfMs = parseIsoTimestamp(asOf);
  const assessedMs = parseIsoTimestamp(riskAssessment?.assessedAt);
  const evidence = riskAssessment?.evidence;

  if (
    asOfMs === null ||
    assessedMs === null ||
    !Array.isArray(evidence) ||
    evidence.length === 0 ||
    !evidence.every((item) => item?.label && item?.url)
  ) {
    return { status: "UNKNOWN", ageMs: null, reason: "missing_risk_evidence" };
  }

  for (const item of evidence) {
    try {
      new URL(item.url);
    } catch {
      return { status: "UNKNOWN", ageMs: null, reason: "invalid_risk_evidence_url" };
    }
  }

  const ageMs = Math.max(0, asOfMs - assessedMs);
  if (ageMs <= RISK_PASS_MS) return { status: "PASS", ageMs, reason: "fresh" };
  if (ageMs <= RISK_VERIFY_MS) return { status: "VERIFY", ageMs, reason: "stale" };
  return { status: "UNKNOWN", ageMs, reason: "too_stale" };
}

export function deriveDataQuality(input) {
  return {
    apy: evaluateObservation(
      input.observations?.supplyApyPct,
      input.reportAsOf,
      FRESHNESS_POLICY_MS.supplyApyPct,
    ).status,
    utilization: evaluateObservation(
      input.observations?.utilizationPct,
      input.reportAsOf,
      FRESHNESS_POLICY_MS.utilizationPct,
    ).status,
    liquidity: evaluateObservation(
      input.observations?.availableLiquidityUsd,
      input.reportAsOf,
      FRESHNESS_POLICY_MS.availableLiquidityUsd,
    ).status,
    riskInputs: evaluateRiskAssessment(input.riskAssessment, input.reportAsOf).status,
  };
}

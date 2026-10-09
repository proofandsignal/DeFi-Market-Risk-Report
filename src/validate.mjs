import { REQUIRED_DIMENSIONS } from "./constants.mjs";
import { assertNoPersonalAdvice } from "./adviceFirewall.mjs";
import { OBSERVATION_KEYS, parseIsoTimestamp } from "./dataContract.mjs";

function assertFiniteNumber(value, field) {
  if (!Number.isFinite(value)) throw new Error(`${field} must be a finite number`);
}

function assertScore(value, field) {
  assertFiniteNumber(value, field);
  if (value < 0 || value > 100) throw new Error(`${field} must be between 0 and 100`);
}

function validateObservation(observation, field) {
  if (!observation || typeof observation !== "object") {
    throw new Error(`observations.${field} is required`);
  }
  assertFiniteNumber(observation.value, `observations.${field}.value`);
  if (!observation.unit) throw new Error(`observations.${field}.unit is required`);
  if (!observation.source?.provider || !observation.source?.endpoint || !observation.source?.method || !observation.source?.evidenceUrl) {
    throw new Error(`observations.${field}.source provenance is required`);
  }
  for (const key of ["endpoint", "evidenceUrl"]) {
    try { new URL(observation.source[key]); }
    catch { throw new Error(`observations.${field}.source.${key} must be a valid URL`); }
  }
  if (parseIsoTimestamp(observation.observedAt) === null || parseIsoTimestamp(observation.fetchedAt) === null) {
    throw new Error(`observations.${field} timestamps must be ISO-8601 compatible`);
  }
}

export function validateInput(input) {
  if (!input || typeof input !== "object") throw new Error("input must be an object");
  if (!input.market?.protocol || !input.market?.asset || !input.market?.chain) {
    throw new Error("market.protocol, market.asset and market.chain are required");
  }
  if (parseIsoTimestamp(input.reportAsOf) === null) {
    throw new Error("reportAsOf must be ISO-8601 compatible");
  }

  for (const key of OBSERVATION_KEYS) validateObservation(input.observations?.[key], key);

  const apy = input.observations.supplyApyPct.value;
  const utilization = input.observations.utilizationPct.value;
  const liquidity = input.observations.availableLiquidityUsd.value;
  if (apy < 0) throw new Error("supply APY cannot be negative");
  if (utilization < 0 || utilization > 100) throw new Error("utilization must be between 0 and 100");
  if (liquidity < 0) throw new Error("available liquidity cannot be negative");

  for (const dimension of REQUIRED_DIMENSIONS) assertScore(input.risk?.[dimension], `risk.${dimension}`);

  if (!input.riskAssessment?.assessedAt || !Array.isArray(input.riskAssessment?.evidence)) {
    throw new Error("riskAssessment.assessedAt and evidence are required");
  }
  if (parseIsoTimestamp(input.riskAssessment.assessedAt) === null) {
    throw new Error("riskAssessment.assessedAt must be ISO-8601 compatible");
  }

  if (input.analystNotes) assertNoPersonalAdvice(input.analystNotes);
  return input;
}

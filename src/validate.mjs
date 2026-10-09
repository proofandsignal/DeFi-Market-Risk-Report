import {
  DATA_QUALITY_STATUSES,
  REQUIRED_DIMENSIONS,
} from "./constants.mjs";
import { assertNoPersonalAdvice } from "./adviceFirewall.mjs";

function assertFiniteNumber(value, field) {
  if (!Number.isFinite(value)) {
    throw new Error(`${field} must be a finite number`);
  }
}

function assertScore(value, field) {
  assertFiniteNumber(value, field);
  if (value < 0 || value > 100) {
    throw new Error(`${field} must be between 0 and 100`);
  }
}

export function validateInput(input) {
  if (!input || typeof input !== "object") {
    throw new Error("input must be an object");
  }

  if (!input.market?.protocol || !input.market?.asset || !input.market?.chain) {
    throw new Error("market.protocol, market.asset and market.chain are required");
  }

  for (const field of ["supplyApyPct", "utilizationPct", "availableLiquidityUsd"]) {
    assertFiniteNumber(input.market[field], `market.${field}`);
  }

  if (input.market.supplyApyPct < 0) {
    throw new Error("market.supplyApyPct cannot be negative");
  }
  if (input.market.utilizationPct < 0 || input.market.utilizationPct > 100) {
    throw new Error("market.utilizationPct must be between 0 and 100");
  }
  if (input.market.availableLiquidityUsd < 0) {
    throw new Error("market.availableLiquidityUsd cannot be negative");
  }

  for (const dimension of REQUIRED_DIMENSIONS) {
    assertScore(
      input.risk?.[dimension],
      `risk.${dimension}`,
    );
  }

  const dq = input.dataQuality ?? {};
  for (const key of ["apy", "utilization", "liquidity", "riskInputs"]) {
    if (!DATA_QUALITY_STATUSES.includes(dq[key])) {
      throw new Error(
        `dataQuality.${key} must be one of ${DATA_QUALITY_STATUSES.join(", ")}`,
      );
    }
  }

  if (!Array.isArray(input.evidence) || input.evidence.length === 0) {
    throw new Error("at least one evidence item is required");
  }

  for (const [index, item] of input.evidence.entries()) {
    if (!item?.label || !item?.url) {
      throw new Error(`evidence[${index}] requires label and url`);
    }
    try {
      new URL(item.url);
    } catch {
      throw new Error(`evidence[${index}].url must be a valid URL`);
    }
  }

  if (input.analystNotes) {
    assertNoPersonalAdvice(input.analystNotes);
  }

  return input;
}

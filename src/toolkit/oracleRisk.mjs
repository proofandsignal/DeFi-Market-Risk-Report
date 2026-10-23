import { evidenceState } from "./evidence.mjs";

function flags(market) {
  const out = [];
  if (!market.oracleType) out.push("ORACLE_TYPE_UNKNOWN");
  if (!market.fallbackType) out.push("FALLBACK_NOT_EVIDENCED");
  if (Number.isFinite(market.stalenessSeconds) && market.stalenessSeconds > 3600) out.push("STALE_OVER_1H");
  if (Number.isFinite(market.deviationBps) && Math.abs(market.deviationBps) > 100) out.push("DEVIATION_OVER_1PCT");
  return out;
}

export function analyzeOracleRisk(input) {
  const { productId, snapshotAt, markets = [] } = input ?? {};
  if (!productId || !snapshotAt) throw new Error("productId and snapshotAt are required");

  const normalized = markets.map((market) => {
    if (!market.marketId) throw new Error("marketId is required");
    return {
      ...market,
      evidenceState: evidenceState(market.evidence),
      flags: flags(market)
    };
  });

  return {
    module: "oracle-risk-inspector",
    productId,
    snapshotAt,
    markets: normalized,
    flaggedMarkets: normalized.filter((market) => market.flags.length > 0).map((market) => market.marketId),
    evidenceGate: normalized.length > 0 && normalized.every((market) => market.evidenceState === "PASS")
      ? "PASS"
      : "BLOCK"
  };
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

function utilizationRisk(utilizationPct, optimalUtilizationPct) {
  if (!Number.isFinite(utilizationPct)) return null;
  if (Number.isFinite(optimalUtilizationPct)) {
    if (utilizationPct <= Math.min(80, optimalUtilizationPct - 10)) return 10;
    if (utilizationPct <= Math.min(90, optimalUtilizationPct)) return 25;
    if (utilizationPct <= optimalUtilizationPct) return 45;
    if (utilizationPct <= optimalUtilizationPct + 2) return 65;
    if (utilizationPct <= 98) return 80;
    return 95;
  }
  if (utilizationPct <= 70) return 10;
  if (utilizationPct <= 85) return 25;
  if (utilizationPct <= 92) return 45;
  if (utilizationPct <= 97) return 70;
  return 95;
}

function absoluteLiquidityRisk(value) {
  if (!Number.isFinite(value)) return null;
  if (value >= 500_000_000) return 10;
  if (value >= 100_000_000) return 20;
  if (value >= 50_000_000) return 35;
  if (value >= 10_000_000) return 55;
  if (value >= 1_000_000) return 75;
  return 95;
}

function liquidityRatioRisk(liquidityUsd, supplyUsd) {
  if (!Number.isFinite(liquidityUsd) || !Number.isFinite(supplyUsd) || supplyUsd <= 0) return null;
  const pct = (liquidityUsd / supplyUsd) * 100;
  if (pct >= 30) return 10;
  if (pct >= 20) return 20;
  if (pct >= 10) return 40;
  if (pct >= 5) return 65;
  if (pct >= 2) return 80;
  return 95;
}

function lltvRisk(lltvPct) {
  if (!Number.isFinite(lltvPct)) return null;
  if (lltvPct <= 65) return 10;
  if (lltvPct <= 75) return 25;
  if (lltvPct <= 80) return 40;
  if (lltvPct <= 86) return 60;
  if (lltvPct <= 92) return 80;
  return 95;
}

function capHeadroomRisk(totalSupplyUsd, supplyCapUsd, reached) {
  if (reached === true) return 100;
  if (!Number.isFinite(totalSupplyUsd) || !Number.isFinite(supplyCapUsd) || supplyCapUsd <= 0) return null;
  const headroomPct = ((supplyCapUsd - totalSupplyUsd) / supplyCapUsd) * 100;
  if (headroomPct >= 30) return 10;
  if (headroomPct >= 20) return 25;
  if (headroomPct >= 10) return 40;
  if (headroomPct >= 5) return 70;
  return 90;
}

export function scoreStressPressure(record) {
  const definitions = [
    ["utilization", 0.40, utilizationRisk(record.utilizationPct, record.optimalUtilizationPct)],
    ["absolute_liquidity", 0.25, absoluteLiquidityRisk(record.availableLiquidityUsd)],
    ["liquidity_ratio", 0.20, liquidityRatioRisk(record.availableLiquidityUsd, record.totalSupplyUsd)],
    ["lltv", 0.10, lltvRisk(record.lltvPct)],
    ["supply_cap_headroom", 0.05, capHeadroomRisk(record.totalSupplyUsd, record.supplyCapUsd, record.supplyCapReached)],
  ];

  const factors = definitions.map(([id, weight, score]) => ({
    id,
    weight,
    score,
    available: Number.isFinite(score),
  }));

  const available = factors.filter((factor) => factor.available);
  const availableWeight = available.reduce((sum, factor) => sum + factor.weight, 0);
  const weighted = available.reduce((sum, factor) => sum + factor.score * factor.weight, 0);
  const score = availableWeight > 0 ? Math.round(weighted / availableWeight) : null;

  return {
    score: score === null ? null : clamp(score),
    coveragePct: Math.round(availableWeight * 100),
    factors,
  };
}

export function replayStress(record, stressCase) {
  const next = structuredClone(record);
  const shock = stressCase.shock ?? {};

  if (Number.isFinite(shock.utilizationAddPct) && Number.isFinite(next.utilizationPct)) {
    next.utilizationPct = clamp(next.utilizationPct + shock.utilizationAddPct);
  }
  if (Number.isFinite(shock.liquidityMultiplier) && Number.isFinite(next.availableLiquidityUsd)) {
    next.availableLiquidityUsd = Math.max(0, next.availableLiquidityUsd * shock.liquidityMultiplier);
  }
  if (Number.isFinite(shock.lltvOverridePct)) {
    next.lltvPct = shock.lltvOverridePct;
  }
  if (shock.supplyCapReached === true) {
    next.supplyCapReached = true;
  }

  return next;
}

export function stressCaseApplies(record, stressCase) {
  const applies = stressCase.appliesTo ?? {};
  if (applies.all === true) return true;
  if (Array.isArray(applies.protocols) && applies.protocols.includes(record.protocol)) return true;
  if (Array.isArray(applies.assets) && applies.assets.includes(record.asset)) return true;
  if (
    Array.isArray(applies.collateralAssets) &&
    applies.collateralAssets.includes(record.collateralAsset)
  ) return true;
  if (Array.isArray(applies.chains) && applies.chains.includes(record.chain)) return true;
  return false;
}

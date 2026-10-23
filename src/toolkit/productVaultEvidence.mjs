import { evidenceState } from "./evidence.mjs";

function pct(value, total) {
  return total > 0 ? (value / total) * 100 : 0;
}

export function analyzeProductVault(input) {
  const { productId, snapshotAt, totalAssetsUsd, allocations = [] } = input ?? {};
  if (!productId || !snapshotAt || !Number.isFinite(totalAssetsUsd) || totalAssetsUsd <= 0) {
    throw new Error("productId, snapshotAt and positive totalAssetsUsd are required");
  }

  const normalized = allocations.map((row) => {
    if (!row.marketId || !Number.isFinite(row.valueUsd) || row.valueUsd < 0) {
      throw new Error("each allocation requires marketId and non-negative valueUsd");
    }
    const weightPct = pct(row.valueUsd, totalAssetsUsd);
    const curatorCapUsagePct = Number.isFinite(row.curatorCapUsd) && row.curatorCapUsd > 0
      ? pct(row.valueUsd, row.curatorCapUsd)
      : null;
    return {
      ...row,
      weightPct,
      curatorCapUsagePct,
      evidenceState: evidenceState(row.evidence)
    };
  });

  const allocatedUsd = normalized.reduce((sum, row) => sum + row.valueUsd, 0);
  const top = [...normalized].sort((a, b) => b.valueUsd - a.valueUsd).slice(0, 3);
  const unallocatedUsd = Math.max(0, totalAssetsUsd - allocatedUsd);

  return {
    module: "product-vault-evidence",
    productId,
    snapshotAt,
    totalAssetsUsd,
    allocatedUsd,
    unallocatedUsd,
    allocationCoveragePct: pct(allocatedUsd, totalAssetsUsd),
    topConcentrationPct: top.reduce((sum, row) => sum + row.weightPct, 0),
    allocations: normalized,
    evidenceGate: normalized.every((row) => row.evidenceState === "PASS") ? "PASS" : "BLOCK"
  };
}

function classifyCoverage(coverageRatio) {
  if (coverageRatio >= 1) return "FULL_BY_AVAILABLE_LIQUIDITY";
  if (coverageRatio >= 0.5) return "CONSTRAINED";
  return "INSUFFICIENT";
}

export function analyzeLiquidityExit(input) {
  const {
    productId,
    snapshotAt,
    availableLiquidityUsd,
    utilizationPct,
    holderSizesUsd = [100_000, 1_000_000, 10_000_000]
  } = input ?? {};

  if (!productId || !snapshotAt || !Number.isFinite(availableLiquidityUsd) || availableLiquidityUsd < 0) {
    throw new Error("productId, snapshotAt and non-negative availableLiquidityUsd are required");
  }

  const scenarios = holderSizesUsd.map((sizeUsd) => {
    if (!Number.isFinite(sizeUsd) || sizeUsd <= 0) throw new Error("holder sizes must be positive");
    const coverageRatio = availableLiquidityUsd / sizeUsd;
    return {
      sizeUsd,
      coverageRatio,
      coveragePct: Math.min(100, coverageRatio * 100),
      classification: classifyCoverage(coverageRatio)
    };
  });

  return {
    module: "liquidity-exit-analyzer",
    productId,
    snapshotAt,
    availableLiquidityUsd,
    utilizationPct: Number.isFinite(utilizationPct) ? utilizationPct : null,
    scenarios,
    modelBoundary:
      "Available-liquidity coverage only; execution time, slippage, queueing, borrow changes and market impact require additional evidence."
  };
}

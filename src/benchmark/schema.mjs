export const BENCHMARK_VERSION = "0.4.0-beta";

export function finiteOrNull(value) {
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

export function fractionToPct(value) {
  const number = finiteOrNull(value);
  if (number === null) return null;
  return Math.abs(number) <= 1.5 ? number * 100 : number;
}

export function createBenchmarkRecord(input) {
  if (!input?.protocol || !input?.chain || !input?.marketId || !input?.asset) {
    throw new Error("benchmark record requires protocol, chain, marketId and asset");
  }
  if (!input?.source?.provider || !input?.source?.endpoint) {
    throw new Error("benchmark record requires source provenance");
  }

  return {
    benchmarkVersion: BENCHMARK_VERSION,
    protocol: input.protocol,
    chain: input.chain,
    chainId: input.chainId ?? null,
    marketId: input.marketId,
    asset: input.asset,
    collateralAsset: input.collateralAsset ?? null,
    supplyRatePct: finiteOrNull(input.supplyRatePct),
    borrowRatePct: finiteOrNull(input.borrowRatePct),
    totalSupplyUsd: finiteOrNull(input.totalSupplyUsd),
    totalBorrowUsd: finiteOrNull(input.totalBorrowUsd),
    availableLiquidityUsd: finiteOrNull(input.availableLiquidityUsd),
    utilizationPct: finiteOrNull(input.utilizationPct),
    optimalUtilizationPct: finiteOrNull(input.optimalUtilizationPct),
    lltvPct: finiteOrNull(input.lltvPct),
    supplyCapUsd: finiteOrNull(input.supplyCapUsd),
    borrowCapUsd: finiteOrNull(input.borrowCapUsd),
    supplyCapReached: input.supplyCapReached === true,
    borrowCapReached: input.borrowCapReached === true,
    isFrozen: input.isFrozen === true,
    isPaused: input.isPaused === true,
    observedAt: input.observedAt,
    source: input.source,
  };
}

export function chainName(chainId) {
  return {
    1: "Ethereum",
    10: "Optimism",
    56: "BNB Chain",
    100: "Gnosis",
    137: "Polygon",
    8453: "Base",
    42161: "Arbitrum",
    43114: "Avalanche",
    59144: "Linea",
    534352: "Scroll",
  }[Number(chainId)] ?? `Chain ${chainId}`;
}

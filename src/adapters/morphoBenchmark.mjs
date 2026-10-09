import {
  chainName,
  createBenchmarkRecord,
  finiteOrNull,
  fractionToPct,
} from "../benchmark/schema.mjs";

export const MORPHO_GRAPHQL = "https://api.morpho.org/graphql";

const QUERY = `
query BenchmarkMarkets($first: Int!, $chains: [Int!]) {
  markets(
    first: $first
    orderBy: SupplyAssetsUsd
    orderDirection: Desc
    where: { listed: true, chainId_in: $chains }
  ) {
    items {
      marketId
      lltv
      chain { id }
      oracle { address }
      loanAsset { address symbol decimals }
      collateralAsset { address symbol decimals }
      state {
        supplyAssets
        supplyAssetsUsd
        borrowAssets
        borrowAssetsUsd
        liquidityAssets
        liquidityAssetsUsd
        utilization
        supplyApy
        borrowApy
      }
    }
  }
}
`;

export function normalizeMorphoBenchmarkMarkets(payload, observedAt = new Date().toISOString()) {
  const items = payload?.data?.markets?.items;
  if (!Array.isArray(items)) {
    const error = payload?.errors?.[0]?.message;
    throw new Error(`Morpho benchmark response missing markets${error ? `: ${error}` : ""}`);
  }

  return items.map((market) => {
    const state = market.state ?? {};
    const chainId = Number(market.chain?.id ?? 1);
    return createBenchmarkRecord({
      protocol: "Morpho",
      chain: chainName(chainId),
      chainId,
      marketId: market.marketId,
      asset: market.loanAsset?.symbol ?? "UNKNOWN",
      collateralAsset: market.collateralAsset?.symbol ?? null,
      supplyRatePct: fractionToPct(state.supplyApy),
      borrowRatePct: fractionToPct(state.borrowApy),
      totalSupplyUsd: finiteOrNull(state.supplyAssetsUsd),
      totalBorrowUsd: finiteOrNull(state.borrowAssetsUsd),
      availableLiquidityUsd: finiteOrNull(state.liquidityAssetsUsd),
      utilizationPct: fractionToPct(state.utilization),
      lltvPct: fractionToPct(market.lltv),
      observedAt,
      source: {
        provider: "Morpho API",
        endpoint: MORPHO_GRAPHQL,
        method: "markets GraphQL",
        evidenceUrl: "https://docs.morpho.org/developers/api/morpho/",
      },
    });
  });
}

export async function fetchMorphoBenchmarkMarkets(options = {}) {
  const endpoint = options.endpoint ?? MORPHO_GRAPHQL;
  const fetchImpl = options.fetchImpl ?? fetch;
  const first = options.limit ?? 15;
  const chains = options.chainIds ?? [1, 8453];

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { first, chains },
    }),
  });
  if (!response.ok) throw new Error(`Morpho API HTTP ${response.status}`);
  const payload = await response.json();
  return normalizeMorphoBenchmarkMarkets(payload, new Date().toISOString()).slice(0, first);
}

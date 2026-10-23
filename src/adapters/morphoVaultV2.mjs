export const MORPHO_GRAPHQL = "https://api.morpho.org/graphql";

export const SENTORA_RLUSD_MAIN_V2 = Object.freeze({
  chainId: 1,
  address: "0x6dC58a0FdfC8D694e571DC59B9A52EEEa780E6bf",
  name: "Sentora RLUSD Main (V2)"
});

const QUERY = `
query VaultEvidence($address: String!, $chainId: Int!) {
  vaultV2ByAddress(address: $address, chainId: $chainId) {
    address
    name
    symbol
    totalAssets
    totalAssetsUsd
    totalSupply
    liquidity
    liquidityUsd
    idleAssets
    idleAssetsUsd
    avgNetApyExcludingRewards
    avgNetApy
    performanceFee
    managementFee
    maxRate
    rewards {
      asset {
        address
        symbol
        chain { id }
      }
      supplyApr
    }
    owner { address }
    curators {
      items {
        addresses { address }
      }
    }
    allocators {
      allocator { address }
    }
    sentinels {
      sentinel { address }
    }
    timelocks {
      duration
      selector
      functionName
    }
    adapters(first: 20) {
      items {
        __typename
        address
        assets
        assetsUsd
        type
        ... on MorphoMarketV1Adapter {
          positions(first: 50) {
            items {
              market {
                marketId
                collateralAsset { address symbol }
                loanAsset { address symbol }
              }
              state {
                supplyAssets
                supplyAssetsUsd
              }
            }
          }
        }
        ... on MetaMorphoAdapter {
          metaMorpho {
            address
            name
            asset { symbol }
          }
        }
        ... on MorphoVaultV2Adapter {
          innerVault {
            address
            name
            asset { symbol }
          }
        }
      }
    }
  }
}
`;

function finite(value) {
  const n = Number(value);
  return Number.isFinite(n) ? n : null;
}

export function normalizeMorphoVaultV2(payload, observedAt = new Date().toISOString()) {
  const vault = payload?.data?.vaultV2ByAddress;
  if (!vault) {
    const error = payload?.errors?.[0]?.message;
    throw new Error(`Morpho Vault V2 response missing vault${error ? `: ${error}` : ""}`);
  }

  const marketAllocations = [];
  for (const adapter of vault.adapters?.items ?? []) {
    if (adapter?.__typename !== "MorphoMarketV1Adapter") continue;
    for (const position of adapter.positions?.items ?? []) {
      marketAllocations.push({
        adapterAddress: adapter.address,
        marketId: position.market?.marketId ?? null,
        loanAsset: position.market?.loanAsset ?? null,
        collateralAsset: position.market?.collateralAsset ?? null,
        supplyAssets: finite(position.state?.supplyAssets),
        supplyAssetsUsd: finite(position.state?.supplyAssetsUsd)
      });
    }
  }

  return {
    source: {
      provider: "Morpho API",
      endpoint: MORPHO_GRAPHQL,
      method: "vaultV2ByAddress GraphQL",
      observedAt
    },
    vault: {
      address: vault.address,
      name: vault.name,
      symbol: vault.symbol,
      totalAssets: finite(vault.totalAssets),
      totalAssetsUsd: finite(vault.totalAssetsUsd),
      totalSupply: finite(vault.totalSupply),
      liquidity: finite(vault.liquidity),
      liquidityUsd: finite(vault.liquidityUsd),
      idleAssets: finite(vault.idleAssets),
      idleAssetsUsd: finite(vault.idleAssetsUsd),
      avgNetApyExcludingRewards: finite(vault.avgNetApyExcludingRewards),
      avgNetApy: finite(vault.avgNetApy),
      performanceFee: finite(vault.performanceFee),
      managementFee: finite(vault.managementFee),
      maxRate: finite(vault.maxRate)
    },
    rewards: (vault.rewards ?? []).map((reward) => ({
      asset: reward.asset ?? null,
      supplyApr: finite(reward.supplyApr)
    })),
    roles: {
      owner: vault.owner?.address ?? null,
      curators: (vault.curators?.items ?? []).flatMap((item) =>
        (item.addresses ?? []).map((entry) => entry.address).filter(Boolean)
      ),
      allocators: (vault.allocators ?? []).map((entry) => entry.allocator?.address).filter(Boolean),
      sentinels: (vault.sentinels ?? []).map((entry) => entry.sentinel?.address).filter(Boolean)
    },
    timelocks: (vault.timelocks ?? []).map((entry) => ({
      duration: finite(entry.duration),
      selector: entry.selector ?? null,
      functionName: entry.functionName ?? null
    })),
    adapters: vault.adapters?.items ?? [],
    marketAllocations
  };
}

export async function fetchMorphoVaultV2(options = {}) {
  const address = options.address ?? SENTORA_RLUSD_MAIN_V2.address;
  const chainId = options.chainId ?? SENTORA_RLUSD_MAIN_V2.chainId;
  const fetchImpl = options.fetchImpl ?? fetch;
  const endpoint = options.endpoint ?? MORPHO_GRAPHQL;

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      query: QUERY,
      variables: { address, chainId }
    })
  });

  if (!response.ok) throw new Error(`Morpho API HTTP ${response.status}`);
  const payload = await response.json();
  return normalizeMorphoVaultV2(payload, new Date().toISOString());
}

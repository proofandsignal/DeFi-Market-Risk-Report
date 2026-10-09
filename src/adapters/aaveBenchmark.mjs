import { fetchAaveUsdcMarkets } from "./aaveMcp.mjs";
import { chainName, createBenchmarkRecord } from "../benchmark/schema.mjs";

export function normalizeAaveBenchmarkMarkets(result, limit = 12) {
  const markets = result?.data?.data?.v3?.markets;
  if (!Array.isArray(markets)) throw new Error("Aave benchmark response is missing markets");

  const records = [];
  for (const market of markets) {
    for (const reserve of market.reserves ?? []) {
      if (reserve.symbol !== "USDC") continue;
      const totalSupplyUsd = Number(reserve.totalSuppliedUsd);
      const availableLiquidityUsd = Number(reserve.availableLiquidity?.usd);
      if (!Number.isFinite(totalSupplyUsd) || totalSupplyUsd <= 0) continue;
      if (!Number.isFinite(availableLiquidityUsd)) continue;

      const totalBorrowUsd = Math.max(0, totalSupplyUsd - availableLiquidityUsd);
      const utilizationPct = (totalBorrowUsd / totalSupplyUsd) * 100;

      records.push(createBenchmarkRecord({
        protocol: "Aave",
        chain: chainName(market.chainId),
        chainId: market.chainId,
        marketId: market.market,
        asset: "USDC",
        supplyRatePct: Number(reserve.supplyApyPct),
        borrowRatePct: Number(reserve.borrowApyPct),
        totalSupplyUsd,
        totalBorrowUsd,
        availableLiquidityUsd,
        utilizationPct,
        supplyCapReached: reserve.supplyCapReached === true,
        borrowCapReached: reserve.borrowCapReached === true,
        isFrozen: reserve.isFrozen === true,
        isPaused: reserve.isPaused === true,
        observedAt: result.fetchedAt,
        source: {
          provider: "Aave MCP",
          endpoint: "https://mcp.aave.com",
          method: "get_markets",
          evidenceUrl: "https://aave.com/docs/mcp/tools",
        },
      }));
    }
  }

  return records
    .sort((a, b) => (b.totalSupplyUsd ?? 0) - (a.totalSupplyUsd ?? 0))
    .slice(0, limit);
}

export async function fetchAaveBenchmarkMarkets(options = {}) {
  const result = await fetchAaveUsdcMarkets(options);
  return normalizeAaveBenchmarkMarkets(result, options.limit ?? 12);
}

import { createBenchmarkRecord } from "../benchmark/schema.mjs";
import { decodeWords, encodeUintArg, ethCall } from "./ethRpc.mjs";

export const COMPOUND_MAINNET_USDC_COMET =
  "0xc3d688B66703497DAA19211EEdff47f25384cdc3";

const SELECTOR = Object.freeze({
  totalSupply: "0x18160ddd",
  totalBorrow: "0x8285ef40",
  getUtilization: "0x7eb71131",
  getSupplyRate: "0xd955759d",
  supplyKink: "0xa5b4ff79",
  baseScale: "0x44c1e5eb",
});

const YEAR_SECONDS = 31_536_000;

async function oneWord(rpcUrl, to, data, options) {
  const result = await ethCall(rpcUrl, to, data, options);
  const [word] = decodeWords(result);
  if (word === undefined) throw new Error("Compound RPC returned no word");
  return word;
}

export async function fetchCompoundMainnetUsdcBenchmark(rpcUrl, options = {}) {
  const comet = options.comet ?? COMPOUND_MAINNET_USDC_COMET;

  const [totalSupplyRaw, totalBorrowRaw, utilizationRaw, supplyKinkRaw, baseScaleRaw] =
    await Promise.all([
      oneWord(rpcUrl, comet, SELECTOR.totalSupply, options),
      oneWord(rpcUrl, comet, SELECTOR.totalBorrow, options),
      oneWord(rpcUrl, comet, SELECTOR.getUtilization, options),
      oneWord(rpcUrl, comet, SELECTOR.supplyKink, options),
      oneWord(rpcUrl, comet, SELECTOR.baseScale, options),
    ]);

  const supplyRateData = SELECTOR.getSupplyRate + encodeUintArg(utilizationRaw);
  const supplyRateRaw = await oneWord(rpcUrl, comet, supplyRateData, options);

  const scale = Number(baseScaleRaw);
  const totalSupply = Number(totalSupplyRaw) / scale;
  const totalBorrow = Number(totalBorrowRaw) / scale;
  const utilizationPct = Number(utilizationRaw) / 1e18 * 100;
  const supplyRatePct = Number(supplyRateRaw) * YEAR_SECONDS / 1e18 * 100;
  const optimalUtilizationPct = Number(supplyKinkRaw) / 1e18 * 100;

  return createBenchmarkRecord({
    protocol: "Compound",
    chain: "Ethereum",
    chainId: 1,
    marketId: comet,
    asset: "USDC",
    supplyRatePct,
    totalSupplyUsd: totalSupply,
    totalBorrowUsd: totalBorrow,
    availableLiquidityUsd: Math.max(0, totalSupply - totalBorrow),
    utilizationPct,
    optimalUtilizationPct,
    observedAt: new Date().toISOString(),
    source: {
      provider: "Ethereum JSON-RPC",
      endpoint: "runtime:ETH_RPC_URL",
      method: "Compound Comet eth_call",
      evidenceUrl: "https://github.com/compound-finance/comet/blob/main/deployments/mainnet/usdc/roots.json",
    },
  });
}

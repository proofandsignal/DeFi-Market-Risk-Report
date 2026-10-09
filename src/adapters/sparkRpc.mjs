import { createBenchmarkRecord } from "../benchmark/schema.mjs";
import { decodeWords, encodeAddressArg, ethCall } from "./ethRpc.mjs";

export const SPARK_PROTOCOL_DATA_PROVIDER =
  "0xFc21d6d146E6086B8359705C8b28512a983db0cb";
export const ETHEREUM_USDC =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const SELECTOR = Object.freeze({
  getReserveData: "0x35ea6a75",
  getReserveConfigurationData: "0x3e150141",
  getReserveCaps: "0x46fbe558",
  getPaused: "0xb55d9904",
});

async function callWords(rpcUrl, to, selector, asset, options) {
  const result = await ethCall(
    rpcUrl,
    to,
    selector + encodeAddressArg(asset),
    options,
  );
  return decodeWords(result);
}

export async function fetchSparkMainnetUsdcBenchmark(rpcUrl, options = {}) {
  const provider = options.dataProvider ?? SPARK_PROTOCOL_DATA_PROVIDER;
  const asset = options.asset ?? ETHEREUM_USDC;

  const [reserve, configuration, caps, pausedWords] = await Promise.all([
    callWords(rpcUrl, provider, SELECTOR.getReserveData, asset, options),
    callWords(rpcUrl, provider, SELECTOR.getReserveConfigurationData, asset, options),
    callWords(rpcUrl, provider, SELECTOR.getReserveCaps, asset, options),
    callWords(rpcUrl, provider, SELECTOR.getPaused, asset, options),
  ]);

  if (reserve.length < 12 || configuration.length < 10 || caps.length < 2) {
    throw new Error("Spark data provider returned an unexpected ABI shape");
  }

  const decimals = Number(configuration[0]);
  const scale = 10 ** decimals;
  const totalSupply = Number(reserve[2]) / scale;
  const totalStableDebt = Number(reserve[3]) / scale;
  const totalVariableDebt = Number(reserve[4]) / scale;
  const totalBorrow = totalStableDebt + totalVariableDebt;
  const availableLiquidity = Math.max(0, totalSupply - totalBorrow);
  const liquidityRateRay = Number(reserve[5]);
  const supplyRatePct = liquidityRateRay / 1e27 * 100;
  const utilizationPct = totalSupply > 0 ? totalBorrow / totalSupply * 100 : 0;
  const lltvPct = Number(configuration[1]) / 100;
  const borrowCap = Number(caps[0]);
  const supplyCap = Number(caps[1]);

  return createBenchmarkRecord({
    protocol: "Spark",
    chain: "Ethereum",
    chainId: 1,
    marketId: "0xC13e21B648A5Ee794902342038FF3aDAB66BE987",
    asset: "USDC",
    supplyRatePct,
    totalSupplyUsd: totalSupply,
    totalBorrowUsd: totalBorrow,
    availableLiquidityUsd: availableLiquidity,
    utilizationPct,
    lltvPct,
    supplyCapUsd: supplyCap > 0 ? supplyCap : null,
    borrowCapUsd: borrowCap > 0 ? borrowCap : null,
    supplyCapReached: supplyCap > 0 && totalSupply >= supplyCap,
    borrowCapReached: borrowCap > 0 && totalBorrow >= borrowCap,
    isFrozen: configuration[9] !== 0n,
    isPaused: (pausedWords[0] ?? 0n) !== 0n,
    observedAt: new Date().toISOString(),
    source: {
      provider: "Ethereum JSON-RPC",
      endpoint: "runtime:ETH_RPC_URL",
      method: "Spark ProtocolDataProvider eth_call",
      evidenceUrl: "https://github.com/sparkdotfi/spark-address-registry/blob/master/src/SparkLend.sol",
    },
  });
}

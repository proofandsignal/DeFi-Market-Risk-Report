import { mkdir, writeFile } from "node:fs/promises";
import { fetchVerifiedAaveV3EthereumUsdc } from "../src/adapters/aaveMcp.mjs";

const result = await fetchVerifiedAaveV3EthereumUsdc();
await mkdir("reports/generated", { recursive: true });
await writeFile(
  "reports/generated/aave-v3-ethereum-usdc.normalized.json",
  JSON.stringify(result.normalized, null, 2) + "\n",
);
await writeFile(
  "reports/generated/aave-v3-ethereum-usdc.raw.json",
  JSON.stringify(result.raw.raw, null, 2) + "\n",
);

console.log(JSON.stringify({
  reportAsOf: result.normalized.reportAsOf,
  market: result.normalized.market,
  observations: result.normalized.observations,
  upstream: {
    totalSuppliedUsd: result.normalized.upstream.totalSuppliedUsd,
    canSupply: result.normalized.upstream.canSupply,
    isFrozen: result.normalized.upstream.isFrozen,
    isPaused: result.normalized.upstream.isPaused,
    supplyCapReached: result.normalized.upstream.supplyCapReached,
    snapshotSha256: result.normalized.upstream.snapshotSha256,
  },
}, null, 2));

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import {
  SENTORA_RLUSD_MAIN_V2,
  normalizeMorphoVaultV2
} from "../src/adapters/morphoVaultV2.mjs";

test("Sentora target is pinned to the customer-selected Ethereum vault", () => {
  assert.equal(SENTORA_RLUSD_MAIN_V2.chainId, 1);
  assert.equal(
    SENTORA_RLUSD_MAIN_V2.address,
    "0x6dC58a0FdfC8D694e571DC59B9A52EEEa780E6bf"
  );
});

test("Morpho Vault V2 normalizer extracts yield, roles, timelocks and allocations", async () => {
  const payload = JSON.parse(
    await readFile(new URL("./fixtures/morpho-sentora-rlusd-v2.json", import.meta.url), "utf8")
  );
  const result = normalizeMorphoVaultV2(payload, "2026-10-23T00:00:00Z");

  assert.equal(result.vault.totalAssetsUsd, 480000000);
  assert.equal(result.vault.liquidityUsd, 36000000);
  assert.equal(result.vault.avgNetApy, 0.0588);
  assert.equal(result.vault.avgNetApyExcludingRewards, 0.0278);
  assert.equal(result.rewards[0].supplyApr, 0.031);
  assert.deepEqual(result.roles.curators, ["0xcurator"]);
  assert.deepEqual(result.roles.allocators, ["0xallocator1", "0xallocator2"]);
  assert.equal(result.timelocks[0].duration, 259200);
  assert.equal(result.marketAllocations[0].collateralAsset.symbol, "kBTC");
  assert.equal(result.marketAllocations[0].supplyAssetsUsd, 220000000);
});

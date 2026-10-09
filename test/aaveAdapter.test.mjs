import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

import {
  AAVE_V3_ETHEREUM_CORE_MARKET,
  normalizeAaveV3EthereumUsdc,
} from "../src/adapters/aaveMcp.mjs";

const fixture = JSON.parse(
  await readFile(new URL("./fixtures/aave-get-markets.json", import.meta.url), "utf8"),
);

test("normalizes the pinned Aave V3 Ethereum Core USDC reserve", () => {
  const result = normalizeAaveV3EthereumUsdc(fixture);
  assert.equal(result.market.marketAddress, AAVE_V3_ETHEREUM_CORE_MARKET);
  assert.equal(result.observations.supplyApyPct.value, 4.13);
  assert.equal(result.observations.availableLiquidityUsd.value, 138793546.26463687);
  assert.ok(Math.abs(result.observations.utilizationPct.value - 94.22640120516004) < 1e-9);
  assert.equal(result.upstream.canSupply, true);
  assert.equal(result.upstream.supplyCapReached, false);
  assert.match(result.upstream.snapshotSha256, /^[a-f0-9]{64}$/);
});

test("refuses to silently fall back to another Ethereum Aave market", () => {
  const copy = structuredClone(fixture);
  copy.data.data.v3.markets[0].name = "AaveV3EthereumLido";
  assert.throws(
    () => normalizeAaveV3EthereumUsdc(copy),
    /Aave V3 Ethereum Core market was not found/,
  );
});

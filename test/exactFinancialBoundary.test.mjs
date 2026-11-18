import test from "node:test";
import assert from "node:assert/strict";
import { decimalToMinorUnits, minorUnitsToDecimal, compareUsdCents } from "../src/financialDecimal.mjs";
import { normalizeAaveV3EthereumUsdcReserveDetails } from "../src/adapters/aaveMcp.mjs";

const liquidTokenValue = "103503867.830586";
const liquidUsd = "103477653.40598054748378";
const AAVE_MARKET = "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
const USDC = "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

test("exact USDC 6-decimal atomic amount survives as BigInt", () => {
  const units = decimalToMinorUnits(liquidTokenValue, 6);
  assert.equal(units.toString(), "103503867830586");
  assert.equal(minorUnitsToDecimal(units, 6), liquidTokenValue);
});
test("18 decimal precision is supported without Number coercion", () => {
  const value = "101948492.354926892337270001";
  assert.equal(minorUnitsToDecimal(decimalToMinorUnits(value, 18), 18), value);
});
test("excess token precision, negative and float input fail closed", () => {
  assert.throws(() => decimalToMinorUnits("1.0000001", 6), /PRECISION_LOSS_REJECTED/);
  assert.throws(() => decimalToMinorUnits("-1", 6), /DECIMAL_STRING_REQUIRED/);
  assert.throws(() => decimalToMinorUnits(1.2, 6), /DECIMAL_STRING_REQUIRED/);
});
test("exact USD cents reconcile with JS display normalization", () => {
  assert.equal(compareUsdCents(liquidUsd, Number(liquidUsd)).exactCents, "10347765341");
  assert.throws(() => compareUsdCents(liquidUsd, Number(liquidUsd) + 0.02), /USD_CENT_MISMATCH/);
});
test("live reserve normalization retains exact atomic units and cent-level provenance", () => {
  const reserve = {
    marketName: "AaveV3Ethereum", chainId: 1, market: AAVE_MARKET,
    token: USDC, symbol: "USDC", totalSupplied: {usd:"2690573362.75480882556457"},
    totalBorrowed:{usd:"2587095707.59643022037413"},
    availableLiquidity:{value:liquidTokenValue,usd:liquidUsd},
    supplyCap:{usd:"3499113555"},borrowCap:{usd:"2949252853.5"},
    utilizationRatePct:"96.15", supplyApyPct:"7.25",
    priceUsd:"0.99974673",maxLtvPct:"0",liquidationThresholdPct:"78",
    liquidationBonusPct:"5",reserveFactorPct:"10",optimalUsageRatePct:"90"
  };
  const output = normalizeAaveV3EthereumUsdcReserveDetails({
    data: {data:reserve}, fetchedAt:"2026-11-18T15:15:58.548Z"
  });
  assert.equal(output.riskFacts.availableLiquidityAtomicUnits,"103503867830586");
  assert.equal(output.riskFacts.liquidityCentsReconciliation.exactCents,"10347765341");
  assert.equal(output.riskFacts.liquidityCentsReconciliation.scope,"USD_CENTS_ONLY_NOT_TOKEN_ATOMIC_VERIFICATION");
});

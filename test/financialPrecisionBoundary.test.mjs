import test from "node:test";
import assert from "node:assert/strict";

// This regression fixture is taken from the independently reviewed Aave MCP capture.
// It tests USD presentation precision only, NOT token atomic amounts or on-chain settlement.
const RAW_USD = "101948492.35492689233727";
const NORMALIZED_USD = 101948492.3549269;

function usdCentsFromExactString(value) {
  if (!/^(0|[1-9]\d*)\.\d+$/.test(value)) throw new Error("invalid decimal");
  const [whole, fraction] = value.split(".");
  const padded = fraction.padEnd(3, "0");
  return BigInt(whole) * 100n + BigInt(padded.slice(0, 2)) + (padded[2] >= "5" ? 1n : 0n);
}

test("Aave USD liquidity normalization preserves two-decimal display rounding", () => {
  const expectedCents = usdCentsFromExactString(RAW_USD);
  const actualCents = BigInt(Math.round(NORMALIZED_USD * 100));
  assert.equal(actualCents, expectedCents);
  assert.equal((actualCents / 100n).toString(), "101948492");
});

test("binary float conversion does not claim 18-decimal exact preservation", () => {
  assert.notEqual(NORMALIZED_USD.toString(), RAW_USD);
  assert.equal(NORMALIZED_USD.toFixed(2), "101948492.35");
});

test("invalid decimal fixtures fail closed rather than silently coercing", () => {
  assert.throws(() => usdCentsFromExactString("NaN"), /invalid decimal/);
  assert.throws(() => usdCentsFromExactString("101948492"), /invalid decimal/);
});

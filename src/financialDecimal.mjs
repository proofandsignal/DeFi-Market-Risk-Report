// Lossless decimal handling for financial display/verification boundaries.
// Do not use IEEE-754 Number as a substitute for token atomic units.
export function decimalToMinorUnits(value, decimals, { rounding = "reject" } = {}) {
  if (typeof value !== "string" || !/^(0|[1-9][0-9]*)(?:\.([0-9]+))?$/.test(value)) {
    throw new Error("DECIMAL_STRING_REQUIRED");
  }
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) {
    throw new Error("INVALID_DECIMALS");
  }
  if (!["reject", "half-up"].includes(rounding)) throw new Error("INVALID_ROUNDING");
  const [integer, fraction = ""] = value.split(".");
  const extra = fraction.slice(decimals);
  if (rounding === "reject" && /[1-9]/.test(extra)) throw new Error("PRECISION_LOSS_REJECTED");
  let units = BigInt(integer) * 10n ** BigInt(decimals);
  units += BigInt((fraction.slice(0, decimals).padEnd(decimals, "0")) || "0");
  if (rounding === "half-up" && extra.length > 0 && extra[0] >= "5") units += 1n;
  return units;
}

export function minorUnitsToDecimal(units, decimals) {
  if (typeof units !== "bigint" || units < 0n) throw new Error("NONNEGATIVE_BIGINT_REQUIRED");
  if (!Number.isInteger(decimals) || decimals < 0 || decimals > 36) throw new Error("INVALID_DECIMALS");
  const factor = 10n ** BigInt(decimals);
  const whole = (units / factor).toString();
  if (decimals === 0) return whole;
  return whole + "." + (units % factor).toString().padStart(decimals, "0");
}

export function compareUsdCents(rawValue, normalizedValue) {
  if (typeof normalizedValue !== "number" || !Number.isFinite(normalizedValue) || normalizedValue < 0 || !Number.isSafeInteger(Math.round(normalizedValue * 100))) {
    throw new Error("UNSAFE_NORMALIZED_USD");
  }
  const exactCents = decimalToMinorUnits(rawValue, 2, { rounding: "half-up" });
  const convertedCents = BigInt(Math.round(normalizedValue * 100));
  if (exactCents !== convertedCents) throw new Error("USD_CENT_MISMATCH");
  return { exactCents: exactCents.toString(), normalizedCents: convertedCents.toString(), scope: "USD_CENTS_ONLY_NOT_TOKEN_ATOMIC_VERIFICATION" };
}

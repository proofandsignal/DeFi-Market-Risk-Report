import test from "node:test";
import assert from "node:assert/strict";
import { assessCurrentReportFreshness, extractReportAsOf } from "../scripts/check-current-report.mjs";

const asOf = "2026-10-09T15:43:34.000Z";

test("historical snapshot cannot be represented as current market data", () => {
  const result = assessCurrentReportFreshness(asOf, new Date("2026-11-18T05:44:00Z"));
  assert.equal(result.status, "BLOCK");
  assert.equal(result.reason, "STALE_MARKET_DATA");
});

test("missing, invalid, or future timestamp fails closed", () => {
  assert.equal(assessCurrentReportFreshness(null).status, "BLOCK");
  assert.equal(assessCurrentReportFreshness("not-a-date").status, "BLOCK");
  assert.equal(assessCurrentReportFreshness("2026-11-18T06:00:00Z", new Date("2026-11-18T05:44:00Z")).status, "BLOCK");
});

test("fresh timestamp is only a timestamp check, not source verification", () => {
  const result = assessCurrentReportFreshness("2026-11-18T05:42:00Z", new Date("2026-11-18T05:44:00Z"));
  assert.equal(result.status, "PASS");
  assert.equal(result.reason, "CURRENT_TIMESTAMP_ONLY");
});

test("extracts the published report-as-of metadata", () => {
  assert.equal(extractReportAsOf("# Risk Report\n- **Report as of:** 2026-10-09T15:43:34.000Z\n"), asOf);
  assert.equal(extractReportAsOf("# No timestamp"), null);
});

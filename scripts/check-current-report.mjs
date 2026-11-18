import { readFileSync } from "node:fs";

const MAX_REPORT_AGE_MS = 5 * 60 * 1000;

export function assessCurrentReportFreshness(reportAsOf, now = new Date()) {
  const asOfMs = Date.parse(reportAsOf);
  const nowMs = now instanceof Date ? now.getTime() : Date.parse(now);
  if (!Number.isFinite(asOfMs) || !Number.isFinite(nowMs)) {
    return { status: "BLOCK", reason: "INVALID_TIMESTAMP", ageMs: null };
  }
  const ageMs = nowMs - asOfMs;
  if (ageMs < -60_000) {
    return { status: "BLOCK", reason: "FUTURE_TIMESTAMP", ageMs };
  }
  if (ageMs > MAX_REPORT_AGE_MS) {
    return { status: "BLOCK", reason: "STALE_MARKET_DATA", ageMs };
  }
  return { status: "PASS", reason: "CURRENT_TIMESTAMP_ONLY", ageMs };
}

export function extractReportAsOf(report) {
  const match = report.match(/^- \*\*Report as of:\*\* ([^\r\n]+)$/m);
  return match?.[1] ?? null;
}

if (process.argv[1] && import.meta.url === new URL("file://" + process.argv[1]).href) {
  const reportPath = process.argv[2];
  if (!reportPath) {
    console.error("Usage: node scripts/check-current-report.mjs <report-file>");
    process.exitCode = 2;
  } else {
    const report = readFileSync(reportPath, "utf8");
    const outcome = assessCurrentReportFreshness(extractReportAsOf(report));
    console.log(JSON.stringify({ ...outcome, scope: "TIMESTAMP_ONLY_NOT_LIVE_SOURCE_VERIFICATION", commercialRelease: "HOLD" }));
    if (outcome.status !== "PASS") process.exitCode = 2;
  }
}

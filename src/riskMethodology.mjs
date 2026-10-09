import { REQUIRED_DIMENSIONS, RISK_WEIGHTS, riskBand } from "./constants.mjs";
import { parseIsoTimestamp } from "./dataContract.mjs";

export const METHODOLOGY_VERSION = "0.3.0-beta";

const STATUS_RANK = Object.freeze({ PASS: 0, VERIFY: 1, UNKNOWN: 2 });
const DAY_MS = 24 * 60 * 60 * 1000;
const CLOCK_SKEW_MS = 60 * 1000;

function worstStatus(values) {
  return values.reduce(
    (worst, value) => (STATUS_RANK[value] > STATUS_RANK[worst] ? value : worst),
    "PASS",
  );
}

function clamp(value, min = 0, max = 100) {
  return Math.min(max, Math.max(min, value));
}

export function evaluateEvidenceRecord(record, asOf) {
  if (!record?.id || !record?.sourceUrl || !record?.capturedAt) {
    return { status: "UNKNOWN", confidence: 0, reason: "missing_evidence_metadata" };
  }

  try {
    new URL(record.sourceUrl);
  } catch {
    return { status: "UNKNOWN", confidence: 0, reason: "invalid_evidence_url" };
  }

  const asOfMs = parseIsoTimestamp(asOf);
  const capturedMs = parseIsoTimestamp(record.capturedAt);
  if (asOfMs === null || capturedMs === null) {
    return { status: "UNKNOWN", confidence: 0, reason: "invalid_evidence_timestamp" };
  }
  if (capturedMs > asOfMs + CLOCK_SKEW_MS) {
    return { status: "UNKNOWN", confidence: 0, reason: "evidence_from_future" };
  }

  const maxAgeMs = Number.isFinite(record.maxAgeMinutes)
    ? record.maxAgeMinutes * 60 * 1000
    : Number.isFinite(record.maxAgeDays)
      ? record.maxAgeDays * DAY_MS
      : null;

  if (!maxAgeMs || maxAgeMs <= 0) {
    return { status: "UNKNOWN", confidence: 0, reason: "missing_freshness_policy" };
  }

  const ageMs = Math.max(0, asOfMs - capturedMs);
  const confidence = clamp(Number(record.confidence ?? 0), 0, 1);

  if (ageMs <= maxAgeMs) {
    return { status: "PASS", confidence, ageMs, reason: "fresh" };
  }
  if (ageMs <= maxAgeMs * 2) {
    return {
      status: "VERIFY",
      confidence: confidence * 0.75,
      ageMs,
      reason: "stale",
    };
  }
  return {
    status: "UNKNOWN",
    confidence: 0,
    ageMs,
    reason: "expired",
  };
}

function indexEvidence(records, asOf) {
  const map = new Map();
  for (const record of records ?? []) {
    map.set(record.id, {
      ...record,
      evaluation: evaluateEvidenceRecord(record, asOf),
    });
  }
  return map;
}

function factor({ id, label, weight, score, evidenceIds, evidenceIndex, explanation }) {
  const evidence = evidenceIds.map((evidenceId) => evidenceIndex.get(evidenceId));
  if (evidence.some((item) => !item)) {
    return {
      id,
      label,
      weight,
      score: null,
      status: "UNKNOWN",
      confidence: 0,
      evidenceIds,
      explanation: "Required evidence is missing.",
    };
  }

  const status = worstStatus(evidence.map((item) => item.evaluation.status));
  const confidence = Math.min(...evidence.map((item) => item.evaluation.confidence));

  return {
    id,
    label,
    weight,
    score: status === "UNKNOWN" ? null : Math.round(clamp(score)),
    status,
    confidence,
    evidenceIds,
    explanation,
  };
}

function dimension(id, factors) {
  const status = worstStatus(factors.map((item) => item.status));
  const complete = factors.every((item) => Number.isFinite(item.score));
  const score = complete
    ? Math.round(factors.reduce((sum, item) => sum + item.score * item.weight, 0))
    : null;
  const confidence = factors.reduce(
    (sum, item) => sum + item.confidence * item.weight,
    0,
  );

  return {
    id,
    weight: RISK_WEIGHTS[id],
    score,
    band: score === null ? null : riskBand(score),
    status,
    confidence: Number(confidence.toFixed(3)),
    factors,
  };
}

function collateralLtvScore(ltv) {
  if (ltv <= 65) return 10;
  if (ltv <= 75) return 25;
  if (ltv <= 80) return 40;
  if (ltv <= 85) return 60;
  return 85;
}

function capHeadroomScore(totalUsd, capUsd, reached) {
  if (reached) return { score: 100, headroomPct: 0 };
  if (!Number.isFinite(capUsd) || capUsd <= 0) {
    return { score: 60, headroomPct: null };
  }
  const headroomPct = ((capUsd - totalUsd) / capUsd) * 100;
  if (headroomPct >= 30) return { score: 10, headroomPct };
  if (headroomPct >= 20) return { score: 25, headroomPct };
  if (headroomPct >= 10) return { score: 40, headroomPct };
  if (headroomPct >= 5) return { score: 70, headroomPct };
  return { score: 90, headroomPct };
}

function utilizationScore(utilization, optimal) {
  if (utilization <= 80) return 10;
  if (utilization <= 90) return 25;
  if (utilization <= optimal) return 45;
  if (utilization <= optimal + 2) return 65;
  if (utilization <= 98) return 80;
  return 95;
}

function absoluteLiquidityScore(value) {
  if (value >= 500_000_000) return 10;
  if (value >= 100_000_000) return 20;
  if (value >= 50_000_000) return 35;
  if (value >= 10_000_000) return 55;
  if (value >= 1_000_000) return 75;
  return 90;
}

function liquidityRatioScore(value) {
  if (value >= 30) return 10;
  if (value >= 20) return 20;
  if (value >= 10) return 40;
  if (value >= 5) return 65;
  if (value >= 2) return 80;
  return 95;
}

function oracleSourceScore(source) {
  if (source === "Chainlink") return 10;
  if (source === "CAPO") return 20;
  if (source) return 40;
  return null;
}

function pegDeviationScore(price) {
  const deviationPct = Math.abs(price - 1) * 100;
  if (deviationPct <= 0.1) return { score: 5, deviationPct };
  if (deviationPct <= 0.5) return { score: 20, deviationPct };
  if (deviationPct <= 1) return { score: 50, deviationPct };
  if (deviationPct <= 3) return { score: 80, deviationPct };
  return { score: 100, deviationPct };
}

function reserveCoverageScore(reserves, circulation) {
  const ratioPct = (reserves / circulation) * 100;
  if (ratioPct >= 100) return { score: 5, ratioPct };
  if (ratioPct >= 99.5) return { score: 40, ratioPct };
  return { score: 100, ratioPct };
}

function finalityLatencyScore(minutes) {
  if (minutes <= 1) return 5;
  if (minutes <= 5) return 10;
  if (minutes <= 15) return 25;
  return 50;
}

export function scoreEvidenceBackedRisk({ reserve, evidenceRecords, asOf }) {
  if (!reserve || !asOf) throw new Error("reserve and asOf are required");

  const liveEvidence = {
    id: "aave_live_reserve_details",
    label: "Aave live reserve details",
    capturedAt: reserve.fetchedAt,
    maxAgeMinutes: 5,
    confidence: 1,
    sourceUrl: "https://aave.com/docs/mcp/tools",
    claims: {},
  };

  const allEvidence = [...(evidenceRecords ?? []), liveEvidence];
  const evidenceIndex = indexEvidence(allEvidence, asOf);

  const protocolSecurity = evidenceIndex.get("aave_protocol_security")?.claims ?? {};
  const governance = evidenceIndex.get("aave_governance_risk_controls")?.claims ?? {};
  const stablecoin = evidenceIndex.get("usdc_reserve_transparency")?.claims ?? {};
  const controls = evidenceIndex.get("usdc_control_surface")?.claims ?? {};
  const chainSecurity = evidenceIndex.get("ethereum_consensus_security")?.claims ?? {};
  const chainLatency = evidenceIndex.get("ethereum_finality_latency")?.claims ?? {};

  const supplyCap = capHeadroomScore(
    reserve.totalSuppliedUsd,
    reserve.supplyCapUsd,
    reserve.supplyCapReached,
  );
  const borrowCap = capHeadroomScore(
    reserve.totalBorrowedUsd,
    reserve.borrowCapUsd,
    reserve.borrowCapReached,
  );
  const liquidityRatioPct =
    (reserve.availableLiquidityUsd / reserve.totalSuppliedUsd) * 100;
  const peg = pegDeviationScore(reserve.priceUsd);
  const reserveCoverage = reserveCoverageScore(
    stablecoin.reservesUsd,
    stablecoin.circulationUsd,
  );

  const issuerControlCount = [
    controls.upgradable,
    controls.pausable,
    controls.blacklistable,
  ].filter(Boolean).length;

  const finalityThreshold = chainSecurity.economicFinalitySlashThresholdPct;
  const finalitySecurityScore = finalityThreshold >= 33
    ? 10
    : finalityThreshold >= 20
      ? 25
      : 60;

  const settlementScore = chainSecurity.settlementLayer === "L1"
    ? 5
    : chainSecurity.settlementLayer === "L2"
      ? 30
      : chainSecurity.settlementLayer
        ? 50
        : 70;

  const protocol = dimension("protocol", [
    factor({
      id: "reserve_operational_state",
      label: "Reserve operational state",
      weight: 0.35,
      score: reserve.canSupply && !reserve.isFrozen && !reserve.isPaused ? 0 : 100,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: reserve.canSupply && !reserve.isFrozen && !reserve.isPaused
        ? "Reserve is enterable, not frozen and not paused."
        : "Reserve has an operational restriction.",
    }),
    factor({
      id: "security_controls",
      label: "Published security controls",
      weight: 0.35,
      score: protocolSecurity.externalAudits && protocolSecurity.continuousBugBounty
        ? 10
        : protocolSecurity.externalAudits || protocolSecurity.continuousBugBounty
          ? 40
          : 80,
      evidenceIds: ["aave_protocol_security"],
      evidenceIndex,
      explanation: "Scores published external audits and continuous bug-bounty coverage.",
    }),
    factor({
      id: "governance_risk_controls",
      label: "Governance risk controls",
      weight: 0.30,
      score: governance.dynamicReserveParameters && governance.governanceVotes
        ? 15
        : governance.dynamicReserveParameters || governance.governanceVotes
          ? 50
          : 80,
      evidenceIds: ["aave_governance_risk_controls"],
      evidenceIndex,
      explanation: "Scores documented governance control over dynamic reserve risk parameters.",
    }),
  ]);

  const asset = dimension("asset", [
    factor({
      id: "collateral_ltv",
      label: "Collateral LTV",
      weight: 0.30,
      score: collateralLtvScore(reserve.maxLtvPct),
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: `Max LTV is ${reserve.maxLtvPct.toFixed(2)}%.`,
    }),
    factor({
      id: "supply_cap_headroom",
      label: "Supply-cap headroom",
      weight: 0.35,
      score: supplyCap.score,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: supplyCap.headroomPct === null
        ? "No finite supply cap was observed."
        : `Supply-cap headroom is ${supplyCap.headroomPct.toFixed(2)}%.`,
    }),
    factor({
      id: "borrow_cap_headroom",
      label: "Borrow-cap headroom",
      weight: 0.35,
      score: borrowCap.score,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: borrowCap.headroomPct === null
        ? "No finite borrow cap was observed."
        : `Borrow-cap headroom is ${borrowCap.headroomPct.toFixed(2)}%.`,
    }),
  ]);

  const liquidity = dimension("liquidity", [
    factor({
      id: "utilization_vs_optimal",
      label: "Utilization vs optimal",
      weight: 0.50,
      score: utilizationScore(reserve.utilizationRatePct, reserve.optimalUsageRatePct),
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: `Utilization is ${reserve.utilizationRatePct.toFixed(2)}% versus ${reserve.optimalUsageRatePct.toFixed(2)}% optimal.`,
    }),
    factor({
      id: "absolute_available_liquidity",
      label: "Absolute available liquidity",
      weight: 0.30,
      score: absoluteLiquidityScore(reserve.availableLiquidityUsd),
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: `Available liquidity is $${Math.round(reserve.availableLiquidityUsd).toLocaleString("en-US")}.`,
    }),
    factor({
      id: "available_liquidity_ratio",
      label: "Available-liquidity ratio",
      weight: 0.20,
      score: liquidityRatioScore(liquidityRatioPct),
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: `Available liquidity is ${liquidityRatioPct.toFixed(2)}% of total supplied value.`,
    }),
  ]);

  const oracleSource = oracleSourceScore(reserve.priceSource);
  const oracle = dimension("oracle", [
    factor({
      id: "oracle_source",
      label: "Oracle source",
      weight: 0.50,
      score: oracleSource ?? 100,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: reserve.priceSource
        ? `Aave reports ${reserve.priceSource} as the reserve price source.`
        : "No price source was identified.",
    }),
    factor({
      id: "peg_deviation",
      label: "USD peg deviation",
      weight: 0.30,
      score: peg.score,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: `Observed price is $${reserve.priceUsd.toFixed(6)}, a ${peg.deviationPct.toFixed(4)}% deviation from $1.`,
    }),
    factor({
      id: "oracle_configuration",
      label: "Oracle configuration",
      weight: 0.20,
      score: reserve.oracle ? 10 : 100,
      evidenceIds: ["aave_live_reserve_details"],
      evidenceIndex,
      explanation: reserve.oracle
        ? `Oracle contract is identified as ${reserve.oracle}.`
        : "No oracle contract address was identified.",
    }),
  ]);

  const stablecoinDimension = dimension("stablecoin", [
    factor({
      id: "reserve_coverage",
      label: "Reserve coverage",
      weight: 0.35,
      score: reserveCoverage.score,
      evidenceIds: ["usdc_reserve_transparency"],
      evidenceIndex,
      explanation: `Disclosed reserve coverage is ${reserveCoverage.ratioPct.toFixed(3)}%.`,
    }),
    factor({
      id: "reserve_liquidity",
      label: "Reserve liquidity composition",
      weight: 0.25,
      score: stablecoin.liquidReserveComposition ? 10 : 60,
      evidenceIds: ["usdc_reserve_transparency"],
      evidenceIndex,
      explanation: stablecoin.liquidReserveComposition
        ? "Issuer disclosure describes reserves as highly liquid cash and cash-equivalent assets."
        : "Highly liquid reserve composition was not evidenced.",
    }),
    factor({
      id: "transparency_assurance",
      label: "Transparency and assurance cadence",
      weight: 0.20,
      score: stablecoin.weeklyDisclosure && stablecoin.monthlyThirdPartyAssurance
        ? 10
        : stablecoin.weeklyDisclosure || stablecoin.monthlyThirdPartyAssurance
          ? 35
          : 80,
      evidenceIds: ["usdc_reserve_transparency"],
      evidenceIndex,
      explanation: "Scores weekly reserve disclosure and monthly third-party assurance.",
    }),
    factor({
      id: "issuer_control_surface",
      label: "Issuer administrative control surface",
      weight: 0.20,
      score: issuerControlCount === 3
        ? 60
        : issuerControlCount === 2
          ? 45
          : issuerControlCount === 1
            ? 30
            : 15,
      evidenceIds: ["usdc_control_surface"],
      evidenceIndex,
      explanation: `${issuerControlCount} of 3 modeled controls are present: upgrade, pause, blacklist.`,
    }),
  ]);

  const chain = dimension("chain", [
    factor({
      id: "economic_finality_security",
      label: "Economic finality security",
      weight: 0.60,
      score: finalitySecurityScore,
      evidenceIds: ["ethereum_consensus_security"],
      evidenceIndex,
      explanation: `Documented finalized-state reversal threshold is at least ${finalityThreshold}% of staked ETH at risk.`,
    }),
    factor({
      id: "finality_latency",
      label: "Finality latency",
      weight: 0.20,
      score: finalityLatencyScore(chainLatency.finalityMinutes),
      evidenceIds: ["ethereum_finality_latency"],
      evidenceIndex,
      explanation: `Current documented finality time is about ${chainLatency.finalityMinutes} minutes.`,
    }),
    factor({
      id: "settlement_layer",
      label: "Settlement-layer dependency",
      weight: 0.20,
      score: settlementScore,
      evidenceIds: ["ethereum_consensus_security"],
      evidenceIndex,
      explanation: `Market settles directly on Ethereum ${chainSecurity.settlementLayer ?? "unknown layer"}.`,
    }),
  ]);

  const dimensions = { protocol, asset, liquidity, oracle, stablecoin: stablecoinDimension, chain };
  const dimensionList = REQUIRED_DIMENSIONS.map((id) => dimensions[id]);
  const complete = dimensionList.every((item) => Number.isFinite(item.score));
  const overallScore = complete
    ? Math.round(
        dimensionList.reduce(
          (sum, item) => sum + item.score * RISK_WEIGHTS[item.id],
          0,
        ),
      )
    : null;
  const overallConfidence = dimensionList.reduce(
    (sum, item) => sum + item.confidence * RISK_WEIGHTS[item.id],
    0,
  );
  const methodologyStatus = worstStatus(dimensionList.map((item) => item.status));

  const reasons = [];
  if (methodologyStatus !== "PASS") reasons.push(`methodology_status_${methodologyStatus.toLowerCase()}`);
  if (overallConfidence < 0.85) reasons.push("overall_confidence_below_0.85");
  if (!complete) reasons.push("incomplete_dimension_score");

  const commercialGate = {
    status: reasons.length === 0 ? "PASS_BETA" : "BLOCK",
    reasons,
    requiredDisclosure:
      "Beta comparative heuristic; not a probability of loss, guarantee, credit rating, or personalized recommendation.",
  };

  return {
    methodology: "Proof & Signal Evidence-Backed Risk Methodology",
    version: METHODOLOGY_VERSION,
    methodologyStatus: "BETA",
    assessedAt: asOf,
    overall: {
      score: overallScore,
      band: overallScore === null ? null : riskBand(overallScore),
      confidence: Number(overallConfidence.toFixed(3)),
      status: methodologyStatus,
    },
    dimensions,
    evidence: allEvidence.map((record) => ({
      id: record.id,
      label: record.label,
      url: record.sourceUrl,
      capturedAt: record.capturedAt,
      status: evidenceIndex.get(record.id).evaluation.status,
      confidence: evidenceIndex.get(record.id).evaluation.confidence,
    })),
    commercialGate,
  };
}

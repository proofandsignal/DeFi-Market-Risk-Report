export const EVIDENCE_STATES = Object.freeze(["PASS", "VERIFY", "UNKNOWN"]);

export function validateEvidenceRecord(record) {
  if (!record || typeof record !== "object") return false;
  if (!record.id || !record.source || !record.reference || !record.observedAt) return false;
  if (!EVIDENCE_STATES.includes(record.state)) return false;
  return Number.isFinite(Date.parse(record.observedAt));
}

export function evidenceState(records = []) {
  if (!Array.isArray(records) || records.length === 0) return "UNKNOWN";
  if (records.some((record) => !validateEvidenceRecord(record))) return "UNKNOWN";
  if (records.some((record) => record.state === "UNKNOWN")) return "UNKNOWN";
  if (records.some((record) => record.state === "VERIFY")) return "VERIFY";
  return "PASS";
}

export function gateFromEvidence(groups = []) {
  const states = groups.map((records) => evidenceState(records));
  if (states.includes("UNKNOWN")) return "BLOCK_UNKNOWN";
  if (states.includes("VERIFY")) return "BLOCK_VERIFY";
  return "PASS";
}

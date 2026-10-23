import { evidenceState } from "./evidence.mjs";

export function analyzeAdminGovernance(input) {
  const { productId, snapshotAt, controls = [] } = input ?? {};
  if (!productId || !snapshotAt) throw new Error("productId and snapshotAt are required");

  const normalized = controls.map((control) => {
    if (!control.kind || !control.actor) throw new Error("control kind and actor are required");
    return {
      ...control,
      evidenceState: evidenceState(control.evidence),
      hasTimelock: Number.isFinite(control.timelockSeconds) && control.timelockSeconds > 0,
      multisigThresholdRatio:
        Number.isFinite(control.threshold) && Number.isFinite(control.signerCount) && control.signerCount > 0
          ? control.threshold / control.signerCount
          : null
    };
  });

  const kinds = new Set(normalized.map((control) => String(control.kind).toLowerCase()));
  return {
    module: "admin-governance-control",
    productId,
    snapshotAt,
    upgradeAuthorityPresent: kinds.has("upgrade"),
    pauseAuthorityPresent: kinds.has("pause"),
    emergencyAuthorityPresent: kinds.has("emergency"),
    controls: normalized,
    evidenceGate: normalized.length > 0 && normalized.every((control) => control.evidenceState === "PASS")
      ? "PASS"
      : "BLOCK"
  };
}

import { fetchMorphoVaultV2, SENTORA_RLUSD_MAIN_V2 } from "../src/adapters/morphoVaultV2.mjs";

const snapshot = await fetchMorphoVaultV2();
const output = {
  case: SENTORA_RLUSD_MAIN_V2,
  capturedAt: snapshot.source.observedAt,
  snapshot
};
process.stdout.write(JSON.stringify(output, null, 2) + "\n");

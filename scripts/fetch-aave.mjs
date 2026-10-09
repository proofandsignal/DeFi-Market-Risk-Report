import { fetchAaveUsdcMarkets } from "../src/adapters/aaveMcp.mjs";

const result = await fetchAaveUsdcMarkets();

console.log(JSON.stringify({
  fetchedAt: result.fetchedAt,
  data: result.data,
}, null, 2));

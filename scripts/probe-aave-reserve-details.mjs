import {
  AAVE_V3_ETHEREUM_CORE_MARKET,
  ETHEREUM_USDC,
  callAaveMcp,
} from "../src/adapters/aaveMcp.mjs";

const result = await callAaveMcp("get_reserve_details", {
  version: "v3",
  market: AAVE_V3_ETHEREUM_CORE_MARKET,
  token: ETHEREUM_USDC,
  chainId: 1,
});

console.log(JSON.stringify({
  fetchedAt: result.fetchedAt,
  data: result.data,
}, null, 2));

import { createHash } from "node:crypto";

export const AAVE_MCP_ENDPOINT = "https://mcp.aave.com";
export const AAVE_V3_ETHEREUM_CORE_MARKET =
  "0x87870Bca3F3fD6335C3F4ce8392D69350B4fA4E2";
export const ETHEREUM_USDC =
  "0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48";

const EVIDENCE_URL = "https://aave.com/docs/mcp/tools";

function parseContent(result) {
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const items = Array.isArray(result?.content) ? result.content : [];
  const text = items.find((item) => item?.type === "text" && typeof item.text === "string")?.text;
  if (!text) return result;
  try { return JSON.parse(text); }
  catch { return text; }
}

function decimal(value, field) {
  const parsed = Number(value);
  if (!Number.isFinite(parsed)) throw new Error(`Aave field ${field} is not numeric`);
  return parsed;
}

export async function callAaveMcp(toolName, args = {}, options = {}) {
  const endpoint = options.endpoint ?? AAVE_MCP_ENDPOINT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "proofandsignal-defi-risk-report",
      method: "tools/call",
      params: { name: toolName, arguments: args },
    }),
  });

  if (!response.ok) throw new Error(`Aave MCP HTTP ${response.status}`);
  const envelope = await response.json();
  if (envelope.error) throw new Error(`Aave MCP error: ${JSON.stringify(envelope.error)}`);

  return {
    fetchedAt: new Date().toISOString(),
    data: parseContent(envelope.result),
    raw: envelope,
  };
}

export async function fetchAaveUsdcMarkets(options = {}) {
  return callAaveMcp("get_markets", { version: "v3", symbols: ["USDC"] }, options);
}

export function normalizeAaveV3EthereumUsdc(result) {
  const markets = result?.data?.data?.v3?.markets;
  if (!Array.isArray(markets)) throw new Error("Aave MCP response is missing data.v3.markets");

  const market = markets.find(
    (item) =>
      item.chainId === 1 &&
      item.name === "AaveV3Ethereum" &&
      item.market?.toLowerCase() === AAVE_V3_ETHEREUM_CORE_MARKET.toLowerCase(),
  );
  if (!market) throw new Error("Aave V3 Ethereum Core market was not found");

  const reserve = market.reserves?.find(
    (item) =>
      item.symbol === "USDC" &&
      item.underlyingToken?.toLowerCase() === ETHEREUM_USDC.toLowerCase(),
  );
  if (!reserve) throw new Error("Ethereum USDC reserve was not found in Aave V3 Core");

  const supplyApyPct = decimal(reserve.supplyApyPct, "supplyApyPct");
  const totalSuppliedUsd = decimal(reserve.totalSuppliedUsd, "totalSuppliedUsd");
  const availableLiquidityUsd = decimal(reserve.availableLiquidity?.usd, "availableLiquidity.usd");
  if (totalSuppliedUsd <= 0) throw new Error("Aave totalSuppliedUsd must be positive");

  const utilizationPct =
    ((totalSuppliedUsd - availableLiquidityUsd) / totalSuppliedUsd) * 100;
  const observedAt = result.fetchedAt;
  const commonSource = {
    provider: "Aave MCP",
    endpoint: AAVE_MCP_ENDPOINT,
    method: "get_markets",
    evidenceUrl: EVIDENCE_URL,
  };

  const selectedSnapshot = {
    market: {
      address: market.market,
      chainId: market.chainId,
      name: market.name,
    },
    reserve,
  };
  const snapshotSha256 = createHash("sha256")
    .update(JSON.stringify(selectedSnapshot))
    .digest("hex");

  return {
    reportAsOf: result.fetchedAt,
    market: {
      protocol: "Aave",
      asset: "USDC",
      chain: "Ethereum",
      chainId: 1,
      marketName: market.name,
      marketAddress: market.market,
      reserveAddress: reserve.underlyingToken,
    },
    observations: {
      supplyApyPct: {
        value: supplyApyPct,
        unit: "percent",
        source: commonSource,
        observedAt,
        fetchedAt: result.fetchedAt,
      },
      utilizationPct: {
        value: utilizationPct,
        unit: "percent",
        source: {
          ...commonSource,
          method: "get_markets + derived_utilization",
        },
        observedAt,
        fetchedAt: result.fetchedAt,
        derivation: {
          formula: "(totalSuppliedUsd - availableLiquidityUsd) / totalSuppliedUsd * 100",
          totalSuppliedUsd,
          availableLiquidityUsd,
        },
      },
      availableLiquidityUsd: {
        value: availableLiquidityUsd,
        unit: "USD",
        source: commonSource,
        observedAt,
        fetchedAt: result.fetchedAt,
      },
    },
    upstream: {
      totalSuppliedUsd,
      canSupply: reserve.canSupply === true,
      isFrozen: reserve.isFrozen === true,
      isPaused: reserve.isPaused === true,
      supplyCapReached: reserve.supplyCapReached === true,
      chainsCovered: result.data?.data?.v3?.chainsCovered ?? [],
      selectedSnapshot,
      snapshotSha256,
    },
  };
}

export async function fetchVerifiedAaveV3EthereumUsdc(options = {}) {
  const raw = await fetchAaveUsdcMarkets(options);
  return {
    normalized: normalizeAaveV3EthereumUsdc(raw),
    raw,
  };
}

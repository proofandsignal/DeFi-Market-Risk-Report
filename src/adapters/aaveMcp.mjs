export const AAVE_MCP_ENDPOINT = "https://mcp.aave.com";

function parseContent(result) {
  if (result?.structuredContent !== undefined) return result.structuredContent;
  const items = Array.isArray(result?.content) ? result.content : [];
  const text = items.find((item) => item?.type === "text" && typeof item.text === "string")?.text;
  if (!text) return result;

  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

export async function callAaveMcp(toolName, args = {}, options = {}) {
  const endpoint = options.endpoint ?? AAVE_MCP_ENDPOINT;
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers: {
      "content-type": "application/json",
    },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: "proofandsignal-defi-risk-report",
      method: "tools/call",
      params: {
        name: toolName,
        arguments: args,
      },
    }),
  });

  if (!response.ok) {
    throw new Error(`Aave MCP HTTP ${response.status}`);
  }

  const envelope = await response.json();
  if (envelope.error) {
    throw new Error(`Aave MCP error: ${JSON.stringify(envelope.error)}`);
  }

  return {
    fetchedAt: new Date().toISOString(),
    data: parseContent(envelope.result),
    raw: envelope,
  };
}

export async function fetchAaveUsdcMarkets(options = {}) {
  return callAaveMcp(
    "get_markets",
    {
      version: "v3",
      symbols: ["USDC"],
    },
    options,
  );
}

export function encodeAddressArg(address) {
  const value = String(address).toLowerCase().replace(/^0x/, "");
  if (!/^[0-9a-f]{40}$/.test(value)) throw new Error("invalid EVM address");
  return value.padStart(64, "0");
}

export function encodeUintArg(value) {
  const bigint = BigInt(value);
  if (bigint < 0n) throw new Error("uint cannot be negative");
  return bigint.toString(16).padStart(64, "0");
}

export function decodeWords(hex) {
  const value = String(hex).replace(/^0x/, "");
  if (value.length % 64 !== 0) throw new Error("invalid ABI word payload");
  const words = [];
  for (let index = 0; index < value.length; index += 64) {
    words.push(BigInt(`0x${value.slice(index, index + 64)}`));
  }
  return words;
}

export async function ethCall(rpcUrl, to, data, options = {}) {
  if (!rpcUrl) throw new Error("ETH_RPC_URL is required");
  const fetchImpl = options.fetchImpl ?? fetch;
  const response = await fetchImpl(rpcUrl, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: options.id ?? 1,
      method: "eth_call",
      params: [{ to, data }, "latest"],
    }),
  });
  if (!response.ok) throw new Error(`Ethereum RPC HTTP ${response.status}`);
  const payload = await response.json();
  if (payload.error) throw new Error(`Ethereum RPC error: ${payload.error.message ?? JSON.stringify(payload.error)}`);
  return payload.result;
}

export function bigintToNumber(value, decimals = 0) {
  const base = 10 ** decimals;
  return Number(value) / base;
}

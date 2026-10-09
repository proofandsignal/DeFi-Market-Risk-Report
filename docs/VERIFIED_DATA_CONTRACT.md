# Verified Data Contract v0.2

Every report metric must travel with its provenance.

## Observation contract

```json
{
  "value": 0,
  "unit": "percent",
  "source": {
    "provider": "Aave",
    "endpoint": "https://mcp.aave.com",
    "method": "get_markets",
    "evidenceUrl": "https://aave.com/docs/mcp/tools"
  },
  "observedAt": "ISO-8601",
  "fetchedAt": "ISO-8601"
}
```

## Freshness

Current APY, utilization and available-liquidity observations have a five-minute PASS window.

- **PASS** — fresh and complete provenance.
- **VERIFY** — valid provenance but older than the PASS window and no more than four times the window.
- **UNKNOWN** — missing provenance, invalid timestamps, impossible timestamp ordering, or data older than the VERIFY window.

Risk-score inputs are an analyst/model assessment rather than a live market read. Their evidence is tracked separately:

- PASS up to 24 hours from `assessedAt`;
- VERIFY up to 7 days;
- UNKNOWN beyond 7 days or without evidence.

## Release invariant

A report is releasable only when every core input is PASS.

The quality status is derived by the engine. It is not accepted as an analyst-supplied field.

## Primary Aave source

v0.2 uses the official Aave MCP endpoint for live market discovery:

- endpoint: `https://mcp.aave.com`
- tool: `get_markets`
- initial filter: Aave v3 / USDC

The raw upstream response is preserved by the adapter so normalization can be audited.

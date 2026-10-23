export function analyzeHistoricalStress(input) {
  const { productId, events = [] } = input ?? {};
  if (!productId) throw new Error("productId is required");

  const usable = events.filter((event) => event && event.timestamp && event.type);
  const maxAbsDeviationBps = usable.reduce(
    (max, event) => Number.isFinite(event.deviationBps) ? Math.max(max, Math.abs(event.deviationBps)) : max,
    0
  );
  const maxUtilizationPct = usable.reduce(
    (max, event) => Number.isFinite(event.utilizationPct) ? Math.max(max, event.utilizationPct) : max,
    0
  );
  const maxLiquidityDrawdownPct = usable.reduce(
    (max, event) => Number.isFinite(event.liquidityDrawdownPct) ? Math.max(max, event.liquidityDrawdownPct) : max,
    0
  );

  return {
    module: "historical-stress-replay",
    productId,
    eventsAnalyzed: usable.length,
    eventTypes: [...new Set(usable.map((event) => event.type))],
    maxAbsDeviationBps,
    maxUtilizationPct,
    maxLiquidityDrawdownPct,
    boundary:
      "Descriptive replay of supplied verified events; it is not a forecast of future loss or liquidity."
  };
}

import test from "node:test";
import assert from "node:assert/strict";

import {
  replayStress,
  scoreStressPressure,
} from "../src/benchmark/stressScore.mjs";
import { normalizeMorphoBenchmarkMarkets } from "../src/adapters/morphoBenchmark.mjs";

const base={
  protocol:"Test",
  chain:"Ethereum",
  marketId:"market",
  asset:"USDC",
  totalSupplyUsd:1_000_000_000,
  totalBorrowUsd:700_000_000,
  availableLiquidityUsd:300_000_000,
  utilizationPct:70,
  optimalUtilizationPct:90,
  lltvPct:75,
  supplyCapUsd:2_000_000_000,
  supplyCapReached:false,
};

test("stress pressure increases when liquidity falls and utilization rises",()=>{
  const before=scoreStressPressure(base);
  const stressed=scoreStressPressure(
    replayStress(base,{shock:{liquidityMultiplier:0.25,utilizationAddPct:25}}),
  );
  assert.ok(stressed.score>before.score);
  assert.equal(before.coveragePct,100);
});

test("partial records expose calibration coverage instead of inventing factors",()=>{
  const partial=scoreStressPressure({
    ...base,
    lltvPct:null,
    supplyCapUsd:null,
  });
  assert.equal(partial.coveragePct,85);
  assert.ok(Number.isFinite(partial.score));
});

test("normalizes Morpho GraphQL market metrics",()=>{
  const payload={
    data:{
      markets:{
        items:[{
          marketId:"0xabc",
          lltv:0.86,
          loanAsset:{address:"0x1",symbol:"USDC",decimals:6,chain:{id:8453}},
          collateralAsset:{address:"0x2",symbol:"WETH",decimals:18},
          oracle:{address:"0x3"},
          state:{
            supplyAssetsUsd:100000000,
            borrowAssetsUsd:80000000,
            liquidityAssetsUsd:20000000,
            utilization:0.8,
            supplyApy:0.05,
            borrowApy:0.07,
          },
        }],
      },
    },
  };
  const [record]=normalizeMorphoBenchmarkMarkets(payload,"2026-10-09T00:00:00.000Z");
  assert.equal(record.protocol,"Morpho");
  assert.equal(record.chain,"Base");
  assert.equal(record.asset,"USDC");
  assert.equal(record.collateralAsset,"WETH");
  assert.equal(record.utilizationPct,80);
  assert.equal(record.supplyRatePct,5);
  assert.equal(record.lltvPct,86);
});

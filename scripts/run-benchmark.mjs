import { mkdir, readFile, writeFile } from "node:fs/promises";

import { fetchAaveBenchmarkMarkets } from "../src/adapters/aaveBenchmark.mjs";
import { fetchMorphoBenchmarkMarkets } from "../src/adapters/morphoBenchmark.mjs";
import { fetchCompoundMainnetUsdcBenchmark } from "../src/adapters/compoundRpc.mjs";
import { fetchSparkMainnetUsdcBenchmark } from "../src/adapters/sparkRpc.mjs";
import {
  replayStress,
  scoreStressPressure,
  stressCaseApplies,
} from "../src/benchmark/stressScore.mjs";

const stressCases=JSON.parse(
  await readFile(new URL("../benchmarks/historical-stress-cases.json",import.meta.url),"utf8"),
);

const records=[];
const adapterStatus={};

async function collect(name, fn) {
  try {
    const result=await fn();
    const items=Array.isArray(result)?result:[result];
    records.push(...items);
    adapterStatus[name]={status:"PASS",records:items.length};
  } catch(error) {
    adapterStatus[name]={
      status:"FAIL",
      records:0,
      error:error instanceof Error?error.message:String(error),
    };
  }
}

await Promise.all([
  collect("Aave",()=>fetchAaveBenchmarkMarkets({limit:12})),
  collect("Morpho",()=>fetchMorphoBenchmarkMarkets({limit:15,chainIds:[1,8453]})),
]);

const rpcUrl=process.env.ETH_RPC_URL;
if (rpcUrl) {
  await Promise.all([
    collect("Compound",()=>fetchCompoundMainnetUsdcBenchmark(rpcUrl)),
    collect("Spark",()=>fetchSparkMainnetUsdcBenchmark(rpcUrl)),
  ]);
} else {
  adapterStatus.Compound={status:"SKIP_NO_ETH_RPC_URL",records:0};
  adapterStatus.Spark={status:"SKIP_NO_ETH_RPC_URL",records:0};
}

const baseline=records.map((record)=>({
  ...record,
  stressPressure:scoreStressPressure(record),
})).sort((a,b)=>(b.stressPressure.score??-1)-(a.stressPressure.score??-1));

const stressResults=stressCases.map((stressCase)=>{
  const affected=baseline.filter((record)=>stressCaseApplies(record,stressCase));
  const deltas=affected.map((record)=>{
    const stressed=replayStress(record,stressCase);
    const stressedScore=scoreStressPressure(stressed);
    return {
      protocol:record.protocol,
      marketId:record.marketId,
      asset:record.asset,
      baseline:record.stressPressure.score,
      stressed:stressedScore.score,
      delta:
        Number.isFinite(record.stressPressure.score)&&Number.isFinite(stressedScore.score)
          ?stressedScore.score-record.stressPressure.score
          :null,
    };
  });
  const finite=deltas.filter((item)=>Number.isFinite(item.delta));
  const monotonic=finite.every((item)=>item.delta>=0);
  return {
    id:stressCase.id,
    name:stressCase.name,
    eventDate:stressCase.eventDate,
    affectedMarkets:affected.length,
    monotonic,
    meanDelta:finite.length
      ?Number((finite.reduce((sum,item)=>sum+item.delta,0)/finite.length).toFixed(2))
      :null,
    maxDelta:finite.length?Math.max(...finite.map((item)=>item.delta)):null,
    evidence:stressCase.evidence,
  };
});

const protocols=[...new Set(records.map((record)=>record.protocol))].sort();
const marketCount=records.length;
const coreProtocolsPass=["Aave","Morpho"].every((name)=>adapterStatus[name]?.status==="PASS");
const applicableStress=stressResults.filter((item)=>item.affectedMarkets>0);
const stressMonotonic=applicableStress.every((item)=>item.monotonic);
const minimumCoverage=marketCount>=20;
const fullProtocols=["Aave","Morpho","Compound","Spark"].every(
  (name)=>adapterStatus[name]?.status==="PASS",
);

let benchmarkGate="BLOCK";
if (coreProtocolsPass&&minimumCoverage&&stressMonotonic) {
  benchmarkGate=fullProtocols?"PASS_FULL":"PASS_PARTIAL_RPC";
}

const output={
  generatedAt:new Date().toISOString(),
  benchmarkGate,
  marketCount,
  protocols,
  adapterStatus,
  methodology:{
    name:"Proof & Signal Stress Pressure Benchmark",
    version:"0.4.0-beta",
    purpose:
      "Calibration diagnostic only. It is not the commercial risk score and is not a probability of loss.",
  },
  topPressureMarkets:baseline.slice(0,15),
  stressResults,
  records:baseline,
};

const rows=baseline.slice(0,20).map((record,index)=>
  `| ${index+1} | ${record.protocol} | ${record.chain} | ${record.asset}${record.collateralAsset?` / ${record.collateralAsset}`:""} | ${record.stressPressure.score??"N/A"} | ${record.stressPressure.coveragePct}% | ${Number.isFinite(record.utilizationPct)?record.utilizationPct.toFixed(2):"N/A"}% | ${Number.isFinite(record.availableLiquidityUsd)?Math.round(record.availableLiquidityUsd).toLocaleString("en-US"):"N/A"} |`
).join("\n");

const stressRows=stressResults.map((item)=>
  `| ${item.name} | ${item.affectedMarkets} | ${item.meanDelta??"N/A"} | ${item.maxDelta??"N/A"} | ${item.affectedMarkets===0?"N/A":item.monotonic?"PASS":"FAIL"} |`
).join("\n");

const statusRows=Object.entries(adapterStatus).map(([name,status])=>
  `| ${name} | ${status.status} | ${status.records} | ${status.error??""} |`
).join("\n");

const markdown=`# Calibration & Stress Benchmark v0.4

- **Generated:** ${output.generatedAt}
- **Benchmark gate:** **${benchmarkGate}**
- **Markets observed:** ${marketCount}
- **Protocols with records:** ${protocols.join(", ")}

> This benchmark score is a calibration diagnostic. It is not the commercial DeFi Market Risk Score, a probability of loss, or investment advice.

## Adapter coverage

| Protocol | Status | Records | Note |
| --- | --- | ---: | --- |
${statusRows}

## Highest stress-pressure markets

| Rank | Protocol | Chain | Market | Pressure | Coverage | Utilization | Available liquidity USD |
| ---: | --- | --- | --- | ---: | ---: | ---: | ---: |
${rows}

## Historical stress replays

| Case | Affected markets | Mean score delta | Max delta | Monotonic |
| --- | ---: | ---: | ---: | --- |
${stressRows}

## Gate interpretation

- `PASS_FULL`: >=20 live markets, Aave + Morpho + Compound + Spark adapters passed, applicable historical stress replays did not reduce measured pressure.
- `PASS_PARTIAL_RPC`: >=20 live markets and Aave + Morpho passed; Compound/Spark remain runtime-gated by `ETH_RPC_URL`.
- `BLOCK`: insufficient market coverage, a core adapter failed, or stress monotonicity failed.

The next calibration step is to compare these pressure rankings against observed historical liquidity events and future realized outcomes instead of optimizing thresholds to fit one snapshot.
`;

await mkdir("benchmarks/generated",{recursive:true});
await writeFile("benchmarks/generated/benchmark-v0.4.json",JSON.stringify(output,null,2)+"\n");
await writeFile("benchmarks/generated/benchmark-v0.4.md",markdown);

process.stdout.write(markdown);
if (benchmarkGate==="BLOCK") process.exitCode=2;

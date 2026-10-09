import test from "node:test";
import assert from "node:assert/strict";

import { decodeWords, encodeAddressArg } from "../src/adapters/ethRpc.mjs";
import { fetchCompoundMainnetUsdcBenchmark } from "../src/adapters/compoundRpc.mjs";
import { fetchSparkMainnetUsdcBenchmark } from "../src/adapters/sparkRpc.mjs";

const word=(value)=>BigInt(value).toString(16).padStart(64,"0");
const result=(...values)=>"0x"+values.map(word).join("");

function response(hex) {
  return {
    ok:true,
    async json(){return {jsonrpc:"2.0",id:1,result:hex};},
  };
}

test("ABI word helpers encode address and decode uint words",()=>{
  assert.equal(
    encodeAddressArg("0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48").length,
    64,
  );
  assert.deepEqual(decodeWords(result(1,2,3)),[1n,2n,3n]);
});

test("Compound RPC adapter normalizes Comet state",async()=>{
  const fetchImpl=async(_url,init)=>{
    const {params}=JSON.parse(init.body);
    const data=params[0].data;
    if(data==="0x18160ddd") return response(result(1_000_000_000_000n));
    if(data==="0x8285ef40") return response(result(800_000_000_000n));
    if(data==="0x7eb71131") return response(result(800_000_000_000_000_000n));
    if(data==="0xa5b4ff79") return response(result(900_000_000_000_000_000n));
    if(data==="0x44c1e5eb") return response(result(1_000_000n));
    if(data.startsWith("0xd955759d")) return response(result(1_000_000_000n));
    throw new Error(`unexpected selector ${data}`);
  };

  const record=await fetchCompoundMainnetUsdcBenchmark("https://rpc.invalid",{fetchImpl});
  assert.equal(record.protocol,"Compound");
  assert.equal(record.totalSupplyUsd,1_000_000);
  assert.equal(record.totalBorrowUsd,800_000);
  assert.equal(record.utilizationPct,80);
  assert.equal(record.optimalUtilizationPct,90);
});

test("Spark RPC adapter decodes ProtocolDataProvider static tuples",async()=>{
  const fetchImpl=async(_url,init)=>{
    const {params}=JSON.parse(init.body);
    const data=params[0].data;
    if(data.startsWith("0x35ea6a75")) {
      return response(result(
        0,0,
        1_000_000_000_000n,
        0,
        800_000_000_000n,
        40_000_000_000_000_000_000_000_000n,
        50_000_000_000_000_000_000_000_000n,
        0,0,
        1_000_000_000_000_000_000_000_000_000n,
        1_000_000_000_000_000_000_000_000_000n,
        1_760_000_000
      ));
    }
    if(data.startsWith("0x3e150141")) {
      return response(result(6,7500,7800,10450,1000,1,1,0,1,0));
    }
    if(data.startsWith("0x46fbe558")) return response(result(2_000_000,2_000_000));
    if(data.startsWith("0xb55d9904")) return response(result(0));
    throw new Error(`unexpected selector ${data}`);
  };

  const record=await fetchSparkMainnetUsdcBenchmark("https://rpc.invalid",{fetchImpl});
  assert.equal(record.protocol,"Spark");
  assert.equal(record.totalSupplyUsd,1_000_000);
  assert.equal(record.totalBorrowUsd,800_000);
  assert.equal(record.utilizationPct,80);
  assert.equal(record.lltvPct,75);
  assert.equal(record.isPaused,false);
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

const html = await readFile(new URL("../index.html", import.meta.url), "utf8");

test("DEMO-001 contains required client sections", () => {
  for (const required of [
    "Executive evidence summary",
    "Evidence table",
    "Yield &amp; rewards",
    "Allocation &amp; concentration",
    "Governance &amp; control surface",
    "Liquidity / exit stress"
  ]) assert.ok(html.includes(required), "missing: " + required);
});

test("DEMO-001 exposes evidence states and unresolved timestamp", () => {
  for (const state of ["VERIFIED","VERIFY","UNKNOWN","PENDING"]) {
    assert.ok(html.includes(state), "missing status: " + state);
  }
  assert.ok(html.includes("Exact BitcoinYield post-29 observation timestamp"));
  assert.ok(html.includes("Direct endpoint not independently captured"));
});

test("DEMO-001 keeps liquidity semantics separate", () => {
  for (const term of ["Idle assets","Protocol liquidity","Withdrawable now","Stress exit capacity"]) {
    assert.ok(html.includes(term), "missing liquidity term: " + term);
  }
});

test("DEMO-001 is mobile responsive and interactive", () => {
  assert.ok(html.includes("@media(max-width:620px)"));
  assert.ok(html.includes("data-filter="));
  assert.ok(html.includes("details-btn"));
});

import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

test("public landing page preserves commercial and product boundaries", async () => {
  const html = await readFile(new URL("../index.html", import.meta.url), "utf8");
  for (const required of [
    "Proof &amp; Signal",
    "Founding Beta",
    "€9",
    "Aave V3 · Ethereum · USDC pilot",
    "No custody",
    "No transaction execution",
    "comparative beta heuristic"
  ]) {
    assert.ok(html.includes(required), "missing required landing copy: " + required);
  }
  assert.ok(html.includes("Report #001 is a dated sample from 9 October 2026"));
  assert.ok(html.includes("not presented as current market conditions"));
  assert.doesNotMatch(html, /guaranteed return|risk-free|we recommend you invest/i);
});

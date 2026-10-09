import { readFile } from "node:fs/promises";
import { generateReport } from "./report.mjs";

const inputPath = process.argv[2];

if (!inputPath) {
  console.error("Usage: node src/cli.mjs <input.json>");
  process.exit(1);
}

try {
  const raw = await readFile(inputPath, "utf8");
  const input = JSON.parse(raw);
  const result = generateReport(input);
  process.stdout.write(result.report);

  if (result.gate.status !== "PASS") {
    process.exitCode = 2;
  }
} catch (error) {
  console.error(error instanceof Error ? error.message : String(error));
  process.exit(1);
}

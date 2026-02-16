#!/usr/bin/env node
/**
 * Generates a single code delivery file for Umowa o Dzieło.
 * Output: docs/CODE_DELIVERY.txt (open in Word → Save as DOCX/PDF for page count).
 */

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const OUT = path.join(ROOT, "docs", "CODE_DELIVERY.txt");

const INCLUDE = [
  "shared",
  "server",
  "client/src",
];
const EXCLUDE_DIRS = ["__tests__", "node_modules", "dist", "build", "coverage"];
const EXCLUDE_FILES = ["generate-code-delivery.js"];

function getAllTsFiles(dir, base = ROOT) {
  const results = [];
  const fullDir = path.join(base, dir);
  if (!fs.existsSync(fullDir)) return results;
  const entries = fs.readdirSync(fullDir, { withFileTypes: true });
  for (const e of entries) {
    const rel = path.join(dir, e.name);
    const full = path.join(base, rel);
    if (e.isDirectory()) {
      if (EXCLUDE_DIRS.includes(e.name)) continue;
      results.push(...getAllTsFiles(rel, base));
    } else if (e.isFile() && /\.(ts|tsx)$/.test(e.name) && !EXCLUDE_FILES.includes(e.name)) {
      results.push(rel);
    }
  }
  return results.sort();
}

function main() {
  const files = [];
  for (const dir of INCLUDE) {
    files.push(...getAllTsFiles(dir));
  }
  const seen = new Set();
  const unique = files.filter((f) => {
    if (seen.has(f)) return false;
    seen.add(f);
    return true;
  });

  const lines = [];
  lines.push("COLONY BANK HMDA/CRA ETL AUTOMATION TOOL – CODE DELIVERY");
  lines.push("Umowa o Dzieło – Source code listing for delivery (DOCX/PDF).");
  lines.push("Generated: " + new Date().toISOString().slice(0, 10));
  lines.push("");
  lines.push("================================================================================");

  for (const rel of unique) {
    const full = path.join(ROOT, rel);
    const content = fs.readFileSync(full, "utf8");
    lines.push("");
    lines.push("### FILE: " + rel + " ###");
    lines.push("--------------------------------------------------------------------------------");
    lines.push(content);
    lines.push("");
    lines.push("================================================================================");
  }

  fs.mkdirSync(path.dirname(OUT), { recursive: true });
  fs.writeFileSync(OUT, lines.join("\n"), "utf8");
  console.log("Written:", OUT);
  console.log("Files included:", unique.length);
}

main();

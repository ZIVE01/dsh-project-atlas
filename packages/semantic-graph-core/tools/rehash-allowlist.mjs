#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { canonicalSelfHash } from "./manifest-lib.mjs";
import { sha256 } from "../src/canonical.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifestPath = path.join(root, "export-allowlist.json");

async function main() {
  const manifest = JSON.parse(await readFile(manifestPath, "utf8"));
  for (const entry of manifest.entries) {
    entry.license = "Apache-2.0";
    if (entry.hashMode === "bytes") entry.sha256 = sha256(await readFile(path.join(root, ...entry.path.split("/"))));
  }
  const self = manifest.entries.find((entry) => entry.hashMode === "canonical-self-v1");
  self.sha256 = canonicalSelfHash(manifest);
  await writeFile(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
});

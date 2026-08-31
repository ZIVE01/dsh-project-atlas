#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { verifyCore } from "./manifest-lib.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
verifyCore(root).then((result) => {
  process.stdout.write(`${JSON.stringify(result)}\n`);
}).catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
});

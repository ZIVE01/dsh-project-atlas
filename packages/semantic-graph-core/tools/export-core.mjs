#!/usr/bin/env node
import path from "node:path";
import { fileURLToPath } from "node:url";
import { exportCore } from "./manifest-lib.mjs";

const args = process.argv.slice(2);
const targetIndex = args.indexOf("--target");
if (targetIndex < 0 || !args[targetIndex + 1]) {
  process.stderr.write("--target is required\n");
  process.exitCode = 2;
} else {
  const source = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
  exportCore(source, path.resolve(args[targetIndex + 1])).then((result) => {
    process.stdout.write(`${JSON.stringify(result)}\n`);
  }).catch((error) => {
    process.stderr.write(`${error.message}\n`);
    process.exitCode = 2;
  });
}

#!/usr/bin/env node
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { analyzeProject, canonicalGraphJson, queryGraph, validateGraph } from "../index.mjs";

function parse(argv) {
  const [command, ...rest] = argv;
  const options = {};
  for (let index = 0; index < rest.length; index += 2) {
    if (!rest[index]?.startsWith("--") || rest[index + 1] === undefined) throw new Error(`Invalid option near ${rest[index] ?? "end"}`);
    options[rest[index].slice(2)] = rest[index + 1];
  }
  return { command, options };
}

async function readJson(filePath) {
  return JSON.parse(await readFile(filePath, "utf8"));
}

async function main() {
  const { command, options } = parse(process.argv.slice(2));
  if (command === "analyze") {
    if (!options.manifest) throw new Error("--manifest is required");
    const manifestPath = path.resolve(options.manifest);
    const manifest = await readJson(manifestPath);
    const graph = await analyzeProject({ namespace: manifest.namespace, root: path.dirname(manifestPath), files: manifest.files });
    const output = canonicalGraphJson(graph);
    if (options.output) await writeFile(path.resolve(options.output), output, { encoding: "utf8", flag: "wx" });
    else process.stdout.write(output);
    return;
  }
  if (command === "validate") {
    const result = validateGraph(await readJson(path.resolve(options.graph)), { strict: false });
    process.stdout.write(`${JSON.stringify(result)}\n`);
    process.exitCode = result.valid ? 0 : 2;
    return;
  }
  if (command === "query") {
    const result = queryGraph(await readJson(path.resolve(options.graph)), await readJson(path.resolve(options.query)));
    process.stdout.write(`${JSON.stringify(result)}\n`);
    return;
  }
  throw new Error("command must be analyze, validate, or query");
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 3;
});

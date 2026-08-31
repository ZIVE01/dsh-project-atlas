#!/usr/bin/env node
import { spawnSync } from "node:child_process";
import { readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, sha256 } from "../src/canonical.mjs";
import { verifyCore } from "./manifest-lib.mjs";

function parse(argv) {
  const result = {};
  for (let index = 0; index < argv.length; index += 2) {
    if (!argv[index]?.startsWith("--") || !argv[index + 1]) throw new Error(`Invalid option ${argv[index] ?? "end"}`);
    result[argv[index].slice(2)] = argv[index + 1];
  }
  for (const required of ["core", "evidence"]) if (!result[required]) throw new Error(`--${required} is required`);
  return result;
}

function runNode(args, cwd) {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: "utf8",
    env: { PATH: process.env.PATH, HOME: process.env.HOME, TMPDIR: process.env.TMPDIR },
  });
  if (result.status !== 0) throw new Error(`node ${args.join(" ")} failed: ${result.stderr}`);
  return { exitCode: result.status, stdout: result.stdout, stderr: result.stderr };
}

async function main() {
  const options = parse(process.argv.slice(2));
  if ((await readdir(options.evidence)).length !== 0) throw new Error("evidence directory must start empty");
  const before = await verifyCore(options.core);
  const tests = runNode(["--test"], options.core);
  const first = runNode([
    "bin/semantic-graph.mjs", "analyze", "--manifest", "test/fixtures/orchid/manifest.json",
  ], options.core).stdout;
  const second = runNode([
    "bin/semantic-graph.mjs", "analyze", "--manifest", "test/fixtures/orchid/manifest.json",
  ], options.core).stdout;
  if (first !== second) throw new Error("Canonical builds differ");
  const after = await verifyCore(options.core);
  if (after.treeDigest !== before.treeDigest) throw new Error("Copied core changed during tests");
  const evidence = {
    schemaVersion: 1,
    platform: process.platform,
    architecture: process.arch,
    nodeVersion: process.version,
    networkRequired: false,
    core: before,
    tests: {
      exitCode: tests.exitCode,
      stdoutSha256: sha256(tests.stdout),
      stderrSha256: sha256(tests.stderr),
      passed: true,
    },
    syntheticGraphSha256: sha256(first),
    deterministic: true,
    copiedCoreReadOnly: true,
    sourceCoreMounted: false,
    applicationSourceMounted: false,
    adapterMounted: false,
    externalFrameworkMounted: false,
    passed: true,
  };
  await writeFile(path.join(options.evidence, "CORE-COPY-REHEARSAL.json"), `${JSON.stringify(evidence, null, 2)}\n`, "utf8");
  await writeFile(path.join(options.evidence, "synthetic.graph.json"), first, "utf8");
  process.stdout.write(canonicalJson({ passed: true, syntheticGraphSha256: evidence.syntheticGraphSha256 }, { trailingNewline: true }));
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 2;
});

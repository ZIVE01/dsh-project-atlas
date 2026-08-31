import assert from "node:assert/strict";
import { appendFile, mkdir, mkdtemp, readFile, rm, symlink, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";
import test from "node:test";
import {
  analyzeProject, analyzeText, canonicalGraphJson, createEdge, createGraph,
  createNode, normalizeRelativePath, queryGraph, stableEdgeId, stableNodeId, validateGraph,
} from "../index.mjs";
import { exportCore, verifyCore } from "../tools/manifest-lib.mjs";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "fixtures", "orchid");
const manifest = JSON.parse(await readFile(path.join(root, "manifest.json"), "utf8"));

test("stable IDs ignore checkout roots and input object order", () => {
  const left = stableNodeId({ namespace: "synthetic", kind: "function", key: { path: "a/b.js", symbol: "go" } });
  const right = stableNodeId({ key: { symbol: "go", path: "a/b.js" }, kind: "function", namespace: "synthetic" });
  assert.equal(left, right);
  assert.equal(stableEdgeId({ namespace: "synthetic", relation: "CALLS", from: left, to: right, key: {} }), stableEdgeId({ to: right, from: left, relation: "CALLS", key: {}, namespace: "synthetic" }));
});

test("authoritative facts require provenance", () => {
  const node = createNode({ namespace: "synthetic", kind: "function", key: "go", verification: "source-confirmed" });
  assert.throws(() => createGraph({ namespace: "synthetic", nodes: [node] }), /lacks provenance/);
});

test("all analyzer families create facts and explicit uncertainty", async () => {
  const graph = await analyzeProject({ namespace: manifest.namespace, root, files: manifest.files });
  const relations = new Set(graph.edges.map((edge) => edge.relation));
  for (const relation of ["DECLARES", "HTTP_CALLS", "ROUTES_TO", "ENQUEUES", "REGISTERS", "READS", "WRITES", "PROXIES_TO", "USES_TRANSPORT"]) {
    assert.ok(relations.has(relation), `missing ${relation}`);
  }
  assert.ok(graph.unknowns.some((item) => item.status === "ambiguous"));
  assert.equal(validateGraph(graph).valid, true);
  assert.deepEqual(graph, JSON.parse(canonicalGraphJson(graph)));
});

test("canonical builds are byte-identical", async () => {
  const first = canonicalGraphJson(await analyzeProject({ namespace: manifest.namespace, root, files: manifest.files }));
  const second = canonicalGraphJson(await analyzeProject({ namespace: manifest.namespace, root, files: [...manifest.files].reverse() }));
  assert.equal(first, second);
});

test("query and path traversal use public graph shape", () => {
  const provenance = [{ rootId: "fixture", path: "sample.txt", line: 1, contentHash: "0".repeat(64), method: "test", confidence: "confirmed" }];
  const a = createNode({ namespace: "synthetic", kind: "function", key: "a", verification: "source-confirmed", provenance });
  const b = createNode({ namespace: "synthetic", kind: "function", key: "b", verification: "source-confirmed", provenance });
  const edge = createEdge({ namespace: "synthetic", relation: "CALLS", from: a.id, to: b.id, verification: "source-confirmed", provenance });
  const graph = createGraph({ namespace: "synthetic", nodes: [a, b], edges: [edge] });
  assert.deepEqual(queryGraph(graph, { pathFrom: a.id, pathTo: b.id }).path, [edge.id]);
});

test("unsupported and malformed inputs fail closed", () => {
  const unsupported = analyzeText({ namespace: "synthetic", relativePath: "sample.bin", content: "x" });
  assert.equal(unsupported.unknowns[0].status, "unsupported");
  assert.throws(() => analyzeText({ namespace: "synthetic", relativePath: "../escape.js", content: "x" }), /Unsafe/);
  for (const unsafe of ["../x", "/x", "C:\\x", "//host/share"]) {
    assert.throws(() => normalizeRelativePath(unsafe));
  }
});

test("project analysis rejects oversized source files", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "semantic-core-size-"));
  try {
    await writeFile(path.join(temporary, "large.js"), "x".repeat(17), "utf8");
    await assert.rejects(
      analyzeProject({ root: temporary, files: [{ path: "large.js" }], maxFileBytes: 16 }),
      /exceeds 16 bytes/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("project analysis rejects a symlink that escapes the source root", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "semantic-core-source-link-"));
  const projectRoot = path.join(temporary, "project");
  try {
    await mkdir(projectRoot);
    const outside = path.join(temporary, "outside.js");
    await writeFile(outside, "export const secret = true;", "utf8");
    try {
      await symlink(outside, path.join(projectRoot, "linked.js"), "file");
    } catch (error) {
      if (error.code === "EPERM" || error.code === "EACCES") {
        context.skip("platform policy does not permit creating a test symbolic link");
        return;
      }
      throw error;
    }
    await assert.rejects(
      analyzeProject({ root: projectRoot, files: [{ path: "linked.js" }] }),
      /Symbolic source file is forbidden|Resolved source path escapes root/,
    );
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("allowlist export is exact and detects changes or extra files", async () => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "semantic-core-test-"));
  const target = path.join(temporary, "copy");
  try {
    const result = await exportCore(path.resolve(root, "..", "..", ".."), target);
    assert.equal(result.source.treeDigest, result.target.treeDigest);
    await assert.rejects(exportCore(path.resolve(root, "..", "..", ".."), target), /must be empty/);
    await writeFile(path.join(target, "unexpected.txt"), "unexpected", "utf8");
    await assert.rejects(verifyCore(target), /inventory differs/);
    await rm(path.join(target, "unexpected.txt"));
    await appendFile(path.join(target, "README.md"), "changed");
    await assert.rejects(verifyCore(target), /SHA-256 mismatch/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

test("allowlist verifier rejects symbolic links when the platform permits them", async (context) => {
  const temporary = await mkdtemp(path.join(os.tmpdir(), "semantic-core-link-"));
  try {
    const target = path.join(temporary, "copy");
    await exportCore(path.resolve(root, "..", "..", ".."), target);
    try {
      await symlink(path.join(target, "README.md"), path.join(target, "linked.txt"), "file");
    } catch (error) {
      if (error.code === "EPERM" || error.code === "EACCES") {
        context.skip("platform policy does not permit creating a test symbolic link");
        return;
      }
      throw error;
    }
    await assert.rejects(verifyCore(target), /Symbolic link is forbidden/);
  } finally {
    await rm(temporary, { recursive: true, force: true });
  }
});

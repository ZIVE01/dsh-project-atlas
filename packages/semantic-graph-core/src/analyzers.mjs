import { lstat, readFile, realpath } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, normalizeRelativePath, sha256 } from "./canonical.mjs";
import { createEdge, createGraph, createNode } from "./graph.mjs";

const LANGUAGE_BY_EXTENSION = Object.freeze({
  ".js": "javascript", ".jsx": "javascript", ".ts": "javascript", ".tsx": "javascript",
  ".py": "python", ".cs": "csharp", ".sql": "sql", ".txt": "sql",
  ".json": "config", ".yaml": "config", ".yml": "config", ".conf": "config", ".ini": "config",
});

function lineOf(content, index) {
  return content.slice(0, index).split("\n").length;
}

function provenance(relativePath, content, match, analyzer, rule) {
  return [{
    rootId: "source",
    path: relativePath,
    line: lineOf(content, match.index),
    contentHash: sha256(content),
    method: `${analyzer}:${rule}`,
    confidence: "confirmed",
  }];
}

function makeContext({ namespace, relativePath, content, language }) {
  const nodes = new Map();
  const edges = [];
  const unknowns = [];
  const addNode = (kind, key, match, properties = {}) => {
    const identity = { namespace, kind, key };
    const node = createNode({
      ...identity,
      label: key,
      properties: { language, relativePath, ...properties },
      confidence: "confirmed",
      verification: "source-confirmed",
      provenance: provenance(relativePath, content, match, language, kind),
    });
    nodes.set(node.id, node);
    return node;
  };
  const addEdge = (relation, from, to, match, key = {}) => edges.push(createEdge({
    namespace, relation, from: from.id, to: to.id, key,
    confidence: "confirmed", verification: "source-confirmed",
    provenance: provenance(relativePath, content, match, language, relation),
  }));
  return { namespace, relativePath, content, language, nodes, edges, unknowns, addNode, addEdge };
}

function scan(pattern, content, callback) {
  for (const match of content.matchAll(pattern)) callback(match);
}

function analyzeJavaScript(context) {
  const { content, relativePath, addNode, addEdge, unknowns } = context;
  const file = addNode("source-file", relativePath, { index: 0 });
  scan(/(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)/g, content, (match) => {
    const fn = addNode("function", `${relativePath}::${match[1]}`, match);
    addEdge("DECLARES", file, fn, match);
  });
  scan(/(?:import\s+[^;]*?from\s*|import\s*)["']([^"']+)["']/g, content, (match) => {
    const target = addNode("module", match[1], match);
    addEdge("IMPORTS", file, target, match);
  });
  scan(/<Route\b[^>]*\bpath=["']([^"']+)["'][^>]*\belement=\{?<([A-Za-z_$][\w$]*)/g, content, (match) => {
    const route = addNode("ui-route", `${relativePath}::route(${match[1]})`, match);
    const component = addNode("component", `${relativePath}::${match[2]}`, match);
    addEdge("ROUTES_TO", route, component, match);
  });
  scan(/\b(fetch|axios\.(?:get|post|put|patch|delete))\s*\(\s*["'`]([^"'`$]+)["'`]/g, content, (match) => {
    const call = addNode("http-call", `${relativePath}::${match[1]}(${match[2]})`, match);
    const endpoint = addNode("endpoint", `${match[1] === "fetch" ? "*" : match[1].split(".")[1].toUpperCase()} ${match[2]}`, match);
    addEdge("HTTP_CALLS", call, endpoint, match);
  });
  scan(/new\s+WebSocket\s*\(\s*["'`]([^"'`$]+)["'`]/g, content, (match) => {
    const call = addNode("websocket-call", `${relativePath}::WebSocket(${match[1]})`, match);
    const endpoint = addNode("endpoint", `WS ${match[1]}`, match);
    addEdge("WEBSOCKET_CALLS", call, endpoint, match);
  });
  if (/\b(?:fetch|axios\.[a-z]+|WebSocket)\s*\(\s*[^"'`\s]/.test(content)) {
    unknowns.push({ family: "javascript", path: relativePath, status: "ambiguous", reason: "dynamic request target" });
  }
}

function analyzePython(context) {
  const { content, relativePath, addNode, addEdge, unknowns } = context;
  const file = addNode("source-file", relativePath, { index: 0 });
  scan(/^(?:async\s+)?def\s+([A-Za-z_]\w*)\s*\(/gm, content, (match) => {
    const fn = addNode("function", `${relativePath}::${match[1]}`, match);
    addEdge("DECLARES", file, fn, match);
  });
  scan(/^class\s+([A-Za-z_]\w*)\b/gm, content, (match) => {
    const type = addNode("class", `${relativePath}::${match[1]}`, match);
    addEdge("DECLARES", file, type, match);
  });
  scan(/@\w+\.(get|post|put|patch|delete|websocket)\s*\(\s*["']([^"']+)["']/g, content, (match) => {
    const endpoint = addNode("endpoint", `${match[1].toUpperCase()} ${match[2]}`, match);
    addEdge("DECLARES", file, endpoint, match);
  });
  scan(/\.delay\s*\(|\.apply_async\s*\(/g, content, (match) => {
    const queue = addNode("transport", "task-queue", match);
    addEdge("ENQUEUES", file, queue, match);
  });
  if (/^\s*@\w+\.(?:get|post|put|patch|delete)\s*\([^"']/.test(content)) {
    unknowns.push({ family: "python", path: relativePath, status: "ambiguous", reason: "dynamic route" });
  }
}

function analyzeCSharp(context) {
  const { content, relativePath, addNode, addEdge, unknowns } = context;
  const file = addNode("source-file", relativePath, { index: 0 });
  scan(/\b(?:class|interface|record)\s+([A-Za-z_]\w*)/g, content, (match) => {
    const type = addNode("type", `${relativePath}::${match[1]}`, match);
    addEdge("DECLARES", file, type, match);
  });
  scan(/\.Map(Get|Post|Put|Patch|Delete)\s*\(\s*"([^"]+)"/g, content, (match) => {
    const endpoint = addNode("endpoint", `${match[1].toUpperCase()} ${match[2]}`, match);
    addEdge("DECLARES", file, endpoint, match);
  });
  scan(/Add(?:Singleton|Scoped|Transient|HostedService)(?:<([^>]+)>)?/g, content, (match) => {
    const service = addNode("service", match[1] ?? "dynamic-service-registration", match);
    addEdge("REGISTERS", file, service, match);
  });
  if (/\.Map(?:Get|Post|Put|Patch|Delete)\s*\(\s*[^"\s]/.test(content)) {
    unknowns.push({ family: "csharp", path: relativePath, status: "ambiguous", reason: "dynamic route" });
  }
}

function analyzeSql(context) {
  const { content, relativePath, addNode, addEdge, unknowns } = context;
  const file = addNode("source-file", relativePath, { index: 0 });
  const table = (name, match) => addNode("table", name.replaceAll('"', ""), match);
  scan(/\bCREATE\s+(?:TABLE|VIEW)\s+(?:IF\s+NOT\s+EXISTS\s+)?([A-Za-z_][\w$."-]*)/gi, content, (match) => addEdge("DECLARES", file, table(match[1], match), match));
  scan(/\b(?:FROM|JOIN)\s+([A-Za-z_][\w$."-]*)/gi, content, (match) => addEdge("READS", file, table(match[1], match), match));
  scan(/\b(?:INSERT\s+INTO|UPDATE|DELETE\s+FROM)\s+([A-Za-z_][\w$."-]*)/gi, content, (match) => addEdge("WRITES", file, table(match[1], match), match));
  if (/\b(?:FROM|JOIN|UPDATE|INTO)\s+[$:]/i.test(content)) unknowns.push({ family: "sql", path: relativePath, status: "ambiguous", reason: "dynamic relation" });
}

function analyzeConfig(context) {
  const { content, relativePath, addNode, addEdge, unknowns } = context;
  const file = addNode("config-file", relativePath, { index: 0 });
  scan(/^\s{0,8}([A-Za-z][\w-]+):\s*$/gm, content, (match) => {
    const service = addNode("service", match[1], match);
    addEdge("DECLARES", file, service, match);
  });
  scan(/\bproxy_pass\s+(https?:\/\/[^;\s]+)/g, content, (match) => {
    const target = addNode("endpoint", match[1], match);
    addEdge("PROXIES_TO", file, target, match);
  });
  scan(/\b(?:broker|transport|queue)[_a-z-]*:\s*([A-Za-z][\w+.-]*)/gi, content, (match) => {
    const transport = addNode("transport", match[1], match);
    addEdge("USES_TRANSPORT", file, transport, match);
  });
  if (/\$\{[^}]+\}/.test(content)) unknowns.push({ family: "config", path: relativePath, status: "parse-partial", reason: "environment substitution" });
}

export function createDefaultAnalyzers() {
  return Object.freeze({ javascript: analyzeJavaScript, python: analyzePython, csharp: analyzeCSharp, sql: analyzeSql, config: analyzeConfig });
}

export function analyzeText({ namespace = "default", relativePath, content, language, analyzers = createDefaultAnalyzers() }) {
  const safePath = normalizeRelativePath(relativePath);
  const selected = language ?? LANGUAGE_BY_EXTENSION[path.extname(safePath).toLowerCase()];
  const analyzer = analyzers[selected];
  if (!analyzer) return { nodes: [], edges: [], unknowns: [{ family: selected ?? "unknown", path: safePath, status: "unsupported" }] };
  const context = makeContext({ namespace, relativePath: safePath, content, language: selected });
  try {
    analyzer(context);
  } catch (error) {
    context.unknowns.push({ family: selected, path: safePath, status: "parse-partial", reason: error.message });
  }
  return { nodes: [...context.nodes.values()], edges: context.edges, unknowns: context.unknowns };
}

export async function analyzeProject({
  namespace = "default",
  root,
  files,
  analyzers = createDefaultAnalyzers(),
  maxFileBytes = 1_048_576,
}) {
  if (!Array.isArray(files) || files.length === 0) throw new TypeError("files must be a non-empty explicit array");
  if (!Number.isSafeInteger(maxFileBytes) || maxFileBytes < 1) throw new TypeError("maxFileBytes must be a positive safe integer");
  const resolvedRoot = await realpath(root);
  const nodes = new Map();
  const edges = new Map();
  const unknowns = [];
  const manifest = [];
  for (const entry of [...files].sort((left, right) => left.path.localeCompare(right.path))) {
    const relativePath = normalizeRelativePath(entry.path);
    const absolute = path.resolve(resolvedRoot, ...relativePath.split("/"));
    const relative = path.relative(resolvedRoot, absolute);
    if (relative.startsWith("..") || path.isAbsolute(relative)) throw new TypeError(`Path escapes root: ${relativePath}`);
    const fileInfo = await lstat(absolute);
    if (fileInfo.isSymbolicLink()) throw new TypeError(`Symbolic source file is forbidden: ${relativePath}`);
    if (!fileInfo.isFile()) throw new TypeError(`Source path is not a regular file: ${relativePath}`);
    if (fileInfo.size > maxFileBytes) throw new RangeError(`Source file exceeds ${maxFileBytes} bytes: ${relativePath}`);
    const resolvedFile = await realpath(absolute);
    const resolvedRelative = path.relative(resolvedRoot, resolvedFile);
    if (resolvedRelative.startsWith("..") || path.isAbsolute(resolvedRelative)) {
      throw new TypeError(`Resolved source path escapes root: ${relativePath}`);
    }
    const content = await readFile(resolvedFile, "utf8");
    if (Buffer.byteLength(content, "utf8") > maxFileBytes) {
      throw new RangeError(`Source file exceeds ${maxFileBytes} bytes after read: ${relativePath}`);
    }
    const hash = sha256(content);
    if (entry.sha256 && entry.sha256 !== hash) throw new Error(`Source hash mismatch: ${relativePath}`);
    manifest.push({ path: relativePath, sha256: hash, language: entry.language ?? null });
    const fragment = analyzeText({ namespace, relativePath, content, language: entry.language, analyzers });
    for (const node of fragment.nodes) nodes.set(node.id, node);
    for (const edge of fragment.edges) edges.set(edge.id, edge);
    unknowns.push(...fragment.unknowns);
  }
  return createGraph({
    namespace,
    build: { inputDigest: sha256(canonicalJson(manifest)), analyzerSet: Object.keys(analyzers).sort() },
    nodes: [...nodes.values()], edges: [...edges.values()], unknowns,
  });
}

import { canonicalJson, canonicalValue, compareCanonical, sha256 } from "./canonical.mjs";

export const CORE_API_VERSION = "1.0.0";
export const GRAPH_SCHEMA_VERSION = "1.0.0";

export const RELATION_TYPES = Object.freeze([
  "BELONGS_TO", "CALLS", "DECLARES", "DEPLOYS", "ENFORCES", "ENQUEUES",
  "HTTP_CALLS", "IMPORTS", "OWNS", "PROTECTS", "PROXIES_TO", "READS",
  "REGISTERS", "REQUIRES_PERMISSION", "ROUTES_TO", "RUNS_IN", "SCHEDULES",
  "STREAMS", "USES_TRANSPORT", "WEBSOCKET_CALLS", "WRITES",
]);

const AUTHORITATIVE = new Set([
  "verified", "source-confirmed", "manual-confirmed", "runtime-confirmed",
]);

function urnPart(value) {
  return String(value).toLowerCase().replace(/[^a-z0-9_-]+/g, "-").replace(/^-|-$/g, "") || "fact";
}

function requireIdentity(input, fields, label) {
  if (!input || typeof input !== "object") throw new TypeError(`${label} identity is required`);
  for (const field of fields) {
    if (input[field] === undefined || input[field] === "") throw new TypeError(`${label}.${field} is required`);
  }
}

export function stableNodeId(identity) {
  requireIdentity(identity, ["namespace", "kind", "key"], "node");
  const projection = canonicalJson({
    namespace: identity.namespace,
    kind: identity.kind,
    key: identity.key,
  });
  return `urn:semantic-graph:v1:node:${urnPart(identity.kind)}:${sha256(projection)}`;
}

export function stableEdgeId(identity) {
  requireIdentity(identity, ["namespace", "relation", "from", "to"], "edge");
  const projection = canonicalJson({
    namespace: identity.namespace,
    relation: identity.relation,
    from: identity.from,
    to: identity.to,
    key: identity.key ?? {},
  });
  return `urn:semantic-graph:v1:edge:${urnPart(identity.relation)}:${sha256(projection)}`;
}

function normalizedProvenance(provenance = []) {
  if (!Array.isArray(provenance)) throw new TypeError("provenance must be an array");
  return provenance.map(canonicalValue).sort(compareCanonical);
}

export function createNode(input) {
  requireIdentity(input, ["namespace", "kind", "key"], "node");
  const id = input.id ?? stableNodeId(input);
  return canonicalValue({
    id,
    namespace: input.namespace,
    kind: input.kind,
    key: input.key,
    label: input.label ?? String(input.key),
    properties: input.properties ?? {},
    confidence: input.confidence ?? "unknown",
    verification: input.verification ?? "unknown",
    provenance: normalizedProvenance(input.provenance),
  });
}

export function createEdge(input) {
  requireIdentity(input, ["namespace", "relation", "from", "to"], "edge");
  const id = input.id ?? stableEdgeId(input);
  return canonicalValue({
    id,
    namespace: input.namespace,
    relation: input.relation,
    from: input.from,
    to: input.to,
    key: input.key ?? {},
    properties: input.properties ?? {},
    confidence: input.confidence ?? "unknown",
    verification: input.verification ?? "unknown",
    provenance: normalizedProvenance(input.provenance),
  });
}

export function createGraph({ namespace, build = {}, nodes = [], edges = [], unknowns = [], diagnostics = [] }) {
  const graph = canonicalValue({
    schemaVersion: GRAPH_SCHEMA_VERSION,
    namespace,
    build,
    nodes: [...nodes].sort((left, right) => left.id.localeCompare(right.id)),
    edges: [...edges].sort((left, right) => left.id.localeCompare(right.id)),
    unknowns: [...unknowns].sort(compareCanonical),
    diagnostics: [...diagnostics].sort(compareCanonical),
  });
  validateGraph(graph, { strict: true });
  return graph;
}

export function validateGraph(graph, { strict = true } = {}) {
  const errors = [];
  if (!graph || graph.schemaVersion !== GRAPH_SCHEMA_VERSION) errors.push("graph schemaVersion mismatch");
  if (!graph?.namespace) errors.push("graph namespace is required");
  if (!Array.isArray(graph?.nodes) || !Array.isArray(graph?.edges)) errors.push("nodes and edges must be arrays");
  const nodes = new Map();
  for (const node of graph?.nodes ?? []) {
    if (!node.id || nodes.has(node.id)) errors.push(`duplicate or missing node id: ${node.id ?? "<missing>"}`);
    nodes.set(node.id, node);
    const expected = stableNodeId({ namespace: node.namespace, kind: node.kind, key: node.key });
    if (node.id !== expected) errors.push(`unstable node id: ${node.id}`);
    if (AUTHORITATIVE.has(node.verification) && !(node.provenance?.length > 0)) {
      errors.push(`authoritative node lacks provenance: ${node.id}`);
    }
  }
  const edges = new Set();
  for (const edge of graph?.edges ?? []) {
    if (!edge.id || edges.has(edge.id)) errors.push(`duplicate or missing edge id: ${edge.id ?? "<missing>"}`);
    edges.add(edge.id);
    if (!RELATION_TYPES.includes(edge.relation)) errors.push(`unsupported relation: ${edge.relation}`);
    if (!nodes.has(edge.from) || !nodes.has(edge.to)) errors.push(`dangling edge: ${edge.id}`);
    const expected = stableEdgeId({
      namespace: edge.namespace,
      relation: edge.relation,
      from: edge.from,
      to: edge.to,
      key: edge.key ?? {},
    });
    if (edge.id !== expected) errors.push(`unstable edge id: ${edge.id}`);
    if (AUTHORITATIVE.has(edge.verification) && !(edge.provenance?.length > 0)) {
      errors.push(`authoritative edge lacks provenance: ${edge.id}`);
    }
  }
  const result = { valid: errors.length === 0, errors: errors.sort() };
  if (strict && errors.length > 0) throw new Error(`Graph validation failed:\n${errors.join("\n")}`);
  return result;
}

export function canonicalGraphJson(graph) {
  validateGraph(graph, { strict: true });
  return canonicalJson(graph, { trailingNewline: true });
}

function matches(value, expected) {
  if (expected === undefined) return true;
  if (typeof expected === "string") return String(value).includes(expected);
  return canonicalJson(value) === canonicalJson(expected);
}

export function queryGraph(graph, query = {}) {
  validateGraph(graph, { strict: true });
  const nodes = graph.nodes.filter((node) =>
    matches(node.id, query.nodeId) && matches(node.kind, query.kind) &&
    matches(node.key, query.key) && matches(node.label, query.label));
  const nodeIds = new Set(nodes.map((node) => node.id));
  const edges = graph.edges.filter((edge) =>
    matches(edge.relation, query.relation) && matches(edge.from, query.from) &&
    matches(edge.to, query.to) && (!query.incidentToMatches || nodeIds.has(edge.from) || nodeIds.has(edge.to)));
  if (query.pathFrom && query.pathTo) {
    const queue = [[query.pathFrom, []]];
    const seen = new Set([query.pathFrom]);
    while (queue.length > 0) {
      const [current, path] = queue.shift();
      if (current === query.pathTo) return { nodes, edges, path };
      for (const edge of graph.edges.filter((item) => item.from === current)) {
        if (!seen.has(edge.to)) {
          seen.add(edge.to);
          queue.push([edge.to, [...path, edge.id]]);
        }
      }
    }
    return { nodes, edges, path: null };
  }
  return { nodes, edges };
}

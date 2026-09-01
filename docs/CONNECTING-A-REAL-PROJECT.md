# Connecting a real project

The public Atlas page is pinned to the synthetic Orchid Commerce dataset. The
portable semantic graph core can already analyze an explicit set of files from
a real project, but the challenge UI does not automatically crawl a repository
or upload private source code.

## 1. Create an isolated project namespace

Choose a stable namespace that belongs only to this project, for example
`project:inventory-dev`. Do not reuse a namespace between unrelated projects.

## 2. Create an explicit source manifest

Place a manifest inside the project root and list only the files that the graph
builder is allowed to read:

```json
{
  "namespace": "project:inventory-dev",
  "files": [
    { "path": "frontend/src/App.jsx", "language": "javascript" },
    { "path": "backend/app.py", "language": "python" },
    { "path": "worker/Program.cs", "language": "csharp" },
    { "path": "database/schema.sql", "language": "sql" },
    { "path": "compose.yaml", "language": "config" }
  ]
}
```

Supported analyzer names are `javascript`, `python`, `csharp`, `sql`, and
`config`. Paths are relative to the manifest. Optional SHA-256 pins can be
added to individual entries when exact file identity must be enforced.

## 3. Generate and validate the structural graph

Run the dependency-free CLI from a trusted local checkout of Project Atlas:

```powershell
node packages/semantic-graph-core/bin/semantic-graph.mjs analyze `
  --manifest "../inventory/atlas.manifest.json" `
  --output "../inventory/atlas.graph.json"

node packages/semantic-graph-core/bin/semantic-graph.mjs validate `
  --graph "../inventory/atlas.graph.json"
```

The output contains deterministic nodes and relations, provenance, diagnostics,
and explicit unknowns. The analyzer does not contact a database, deployment
target, production service, or neighboring project.

## 4. Add project semantics through an adapter

Structural analysis cannot infer every business rule safely. A project-owned
adapter should add evidence-backed facts for:

- routes and API operations;
- capability IDs and server-side enforcement;
- module and data ownership;
- audit and event contracts;
- expected architecture; and
- separately collected, minimized runtime evidence.

The adapter must preserve provenance and uncertainty. It must not turn a
candidate relation into a verified fact without evidence.

## 5. Load an isolated Atlas projection

Convert the generated graph and adapter facts into the Atlas presentation
schema, then register the five read-only WebMCP tools against the exact IDs in
that project namespace. Every project receives its own graph artifact, policy
metadata, and WebMCP allowlist.

The current challenge UI has the Orchid projection compiled into the page. A
real-project deployment therefore still needs a graph loader and a
project-specific presentation adapter; pointing the public URL at a local
folder is intentionally impossible.

## 6. Verify before use

Before treating the graph as an architectural control surface, verify:

1. the manifest contains only approved paths;
2. file hashes and provenance match the intended source snapshot;
3. unknown, dynamic, and unsupported relations remain fail-closed;
4. project namespaces and artifacts cannot cross;
5. WebMCP exposes read-only investigation tools only; and
6. observed runtime evidence is not silently promoted into expected design.

This workflow makes the public demonstration portable to real projects while
keeping private source, credentials, databases, and production controls outside
the public Atlas deployment.

# Demo script — under three minutes

## 0:00–0:25 — The problem

“A codebase is easy to search and hard to understand. Routes, policies,
handlers, storage, and runtime evidence drift apart. People and agents need the
same map, with uncertainty kept visible.”

Show the full Project Atlas workspace and the **READ ONLY** boundary.

## 0:25–0:55 — Shared structured context

Ask the agent: “Inspect the current project overview.”

Explain that WebMCP returns stable IDs and a typed project summary instead of
forcing the agent to scrape pixels. Point out that all data is synthetic.

## 0:55–1:30 — One exact entity

Ask: “Focus `handler:lookup` and explain why it needs proof.”

Show the graph selection and inspector changing together. Emphasize that an
unknown is preserved instead of being promoted into a trusted relationship.

## 1:30–2:05 — Trace, do not guess

Ask: “Trace the path from `screen:project-search` to `store:catalog`.”

Show the bounded source-backed path and provenance. Mention that fuzzy or
unsupported identifiers fail closed.

## 2:05–2:35 — Find deviations

Ask: “List high-severity findings and compare the security layers.”

Show the shared switch to Deviations and the exact finding attached to the
handler.

## 2:35–2:55 — Safety and portability

Show the tool list and footer: no database, shell, deployment, or mutation
controls. Close on the portable Apache-2.0 semantic graph core and the idea that
each project gets an isolated graph namespace.

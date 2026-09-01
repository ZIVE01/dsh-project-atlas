# Narrated demo script — under three minutes

Record the exact public build with sound. Keep the browser URL, **WebMCP
connected**, and **READ ONLY** status visible at the beginning. Target duration:
approximately 2 minutes 50 seconds.

## 0:00–0:20 — The problem and the map

“A codebase is easy to search and hard to understand. Interfaces, routes,
capabilities, handlers, owned data, audit, and runtime evidence drift apart.
Project Atlas gives people and agents the same evidence-aware map.”

Show the complete Map view. Point out the seven domains, 19 visible nodes, 20
relations, and synthetic-data label.

## 0:20–0:45 — Structured project overview

Ask the agent: “Inspect the current project overview.”

Explain that WebMCP returns a typed summary with stable IDs and integrity state
instead of forcing the agent to scrape pixels. The visible Agent Console should
show the same read-only result.

## 0:45–1:10 — Capabilities and consumers

Ask: “Focus `capability:catalog-write` and show its consumers.”

Show how capability control connects the admin interface to the approved API,
handler, and owned catalog data. Then point out the red **BYPASS** relation: the
legacy direct UI-to-handler path is visible, not normalized away.

## 1:10–1:35 — Evidence is not a verdict

Ask: “Focus `handler:lookup` and explain why it needs proof.”

Show the selected node and inspector changing together. Explain that the
capability is declared but exact server-side enforcement evidence is missing,
so Atlas keeps the relation in needs-proof state.

## 1:35–2:00 — Map to bounded Path

Ask: “Trace the path from `screen:project-search` to `store:catalog`.”

Show the switch from the full Map to Path view and walk across the exact route,
API, capability, handler, and store. Mention that the tool does not invent a
missing edge.

## 2:00–2:25 — Findings and architectural comparison

Ask: “List high-severity findings and compare the security layers while
preserving every unknown.”

Show the BYPASS finding and the expected-versus-observed comparison. Point out
the explicit **UNKNOWN**, **BLIND SPOT**, and **REVIEW** states.

## 2:25–2:40 — Fail closed

Ask the agent to focus the nonexistent `handler:payment`.

Show that the request is rejected and the previous selection remains
unchanged. Explain that an unsupported identifier cannot become a graph fact.

## 2:40–2:55 — Safety and portability

Return to the full Map. Show the five-tool list and close with:

“Project Atlas lets people and agents investigate the same architecture, but it
has no database, shell, deployment, production, or mutation controls. The core
is Apache-2.0 and each project can keep an isolated graph namespace.”

## Recording checklist

- Use the final public URL, not a local preview.
- Capture narration and system audio clearly.
- Keep the video below three minutes.
- Do not display accounts, private browser tabs, notifications, local paths, or
  credentials.
- Upload publicly to YouTube and add the URL to
  [`CHALLENGE-SUBMISSION.md`](CHALLENGE-SUBMISSION.md).

# Narrated WebMCP demo script — 2:45 target

Record the exact public build with sound. The contest limit is **under three
minutes**, so the target recording is 2:45–2:50 and must never reach 3:00.

The page button runs a deterministic **guided rehearsal** with the same 2:45
timing. It calls the page's read-only handlers directly so that narration can be
practised. The submitted video must show real WebMCP calls from the agent chat;
do not describe the guided rehearsal as an external tool invocation.

## 0:00–0:12 — Project and safety boundary

Show the public URL, complete Map, `SYNTHETIC`, `WebMCP connected`, `READ ONLY`
and `5 LIVE` indicators.

Call `inspect_project_overview` and show the pinned namespace, integrity result,
24-node portable-core fixture, 19-node readable overlay and preserved unknown.

Narration: “Project Atlas gives people and agents one evidence-aware map of a
software project. This public demonstration uses synthetic data and exposes
only five read-only WebMCP tools.”

## 0:12–0:22 — Shared exact entity

Call `focus_graph_entity` with `screen:project-search`.

Explain that the graph, inspector and agent result all refer to the same stable
entity ID rather than a pixel location or guessed label.

## 0:22–0:41 — Bounded path

Call `trace_architecture_path` from `screen:project-search` to `store:catalog`.

Walk across the exact screen, route, API, `catalog.read` capability, owner
handler and store. The tool must not invent the unresolved enforcement edge;
the result remains bounded and `mutation: false`.

## 0:41–0:54 — Capability and consumers

Call `focus_graph_entity` with `capability:catalog-write`.

Show the approved mutation chain through route, API, policy, handler, owned data
and audit. Explain that one stable capability can govern every known consumer.

## 0:54–1:08 — Visible bypass

Call `list_security_findings` with `severity=high`.

Show the red direct `screen:catalog-admin → handler:catalog-update` relation.
It skips the approved route, API and `catalog.write` capability, so Atlas keeps
it visible as a bypass instead of normalizing it away.

## 1:08–1:21 — Missing server proof

Call `focus_graph_entity` with `handler:lookup`.

Explain that the capability is declared, but the exact backend enforcement
evidence is absent. Atlas therefore shows `Needs proof` rather than claiming
the chain is safe.

## 1:21–1:39 — Expected versus observed

Call `compare_architecture_layers` with `scope=all`.

Show `EXPECTED ≠ OBSERVED` and the preserved `UNKNOWN`, `BLIND SPOT` and
`REVIEW` states. Nothing uncertain is silently promoted to verified.

## 1:39–2:01 — Blind spot and review evidence

Call `focus_graph_entity` with `telemetry:window`, then call
`list_security_findings` with `severity=info`.

Explain that observed coverage is 72%; the missing 28% remains a blind spot.
Candidate evidence without a trustworthy source remains review-only.

## 2:01–2:17 — Fail closed

Ask for the nonexistent `handler:payment`. A conforming WebMCP client can reject
it at the closed input schema before execution. Show that the page selection is
unchanged. If the page's guided rehearsal is used, label its denial explicitly
as a local safety rehearsal.

## 2:17–2:29 — Read-only agent boundary

Call `focus_graph_entity` with `agent:webmcp-review`.

Show the five registered tools and explain that there is no database, shell,
deployment, production or mutation control.

## 2:29–2:45 — Jury summary

Return to `handler:lookup` and close with:

“Project Atlas lets people and agents investigate the same exact architecture.
It exposes bypasses, preserves uncertainty and rejects unsupported requests.
The reusable core is Apache-2.0, while every project keeps an isolated graph
namespace.”

## Recording checklist

- Use the final public URL, not a local preview.
- Invoke every one of the five WebMCP tools at least once.
- Keep the URL, connection and read-only state visible at the beginning.
- Capture narration clearly and keep the final video below three minutes.
- Do not show accounts, private tabs, notifications, local paths or credentials.
- Upload publicly to YouTube and add the URL to
  [`CHALLENGE-SUBMISSION.md`](CHALLENGE-SUBMISSION.md).

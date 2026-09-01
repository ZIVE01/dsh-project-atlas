# WebMCP Challenge submission copy

## Project

**DSH Project Atlas — Projects made legible to people and agents**

## One-line description

A shared, read-only semantic graph where people and AI agents investigate
project architecture through exact WebMCP tools instead of screen scraping.

## Why WebMCP is ideal for this use case

Architecture reasoning depends on exact identities and relationships. A route,
capability, handler, datastore, audit contract, and observed runtime signal may
look similar on screen while having very different trust levels. Pixel or DOM
scraping makes an agent guess those meanings.

WebMCP gives Project Atlas a typed browser boundary. The agent receives stable
entity IDs, closed input schemas, bounded results, provenance, and explicit
unknown states. The human simultaneously sees the same selected node, path,
finding, or comparison. This makes the browser a shared architecture workspace
instead of a screenshot that the agent interprets separately.

## How it improves the user experience

The default Map view shows 19 nodes and 20 relations across experience,
delivery, capability control, execution, owned data, audit, and observed
evidence. Capability nodes reveal who may use a function and where it is
enforced. A red BYPASS relation keeps a direct legacy UI-to-handler path
visible. Needs-proof, unknown, blind-spot, and review states are never disguised
as verified facts.

The Path view then reduces that map to one bounded, source-backed flow. A user
can move from a system-wide overview to an exact explanation without manually
searching files or losing the surrounding security context.

## What people and agents can do together

A person can explore the graph, select a capability, inspect provenance, and
run a guided replay. An agent can use five read-only WebMCP tools to inspect the
project, focus an exact entity, trace a bounded path, list findings, and compare
expected with observed architecture. Agent actions are reflected in the same
visible workspace, so a person can verify the result immediately.

Previously this required separate code searches, architecture diagrams, audit
notes, and chat explanations that could drift apart. Project Atlas gives both
participants one evidence-aware view while preserving uncertainty and rejecting
unknown or fuzzy entity requests without changing the current selection.

## How WebMCP was implemented

The client registers exactly five tools through a literal
`document.modelContext.registerTool()` boundary:

- `inspect_project_overview`;
- `focus_graph_entity`;
- `trace_architecture_path`;
- `list_security_findings`; and
- `compare_architecture_layers`.

Inputs use closed JSON schemas and exact entity enumerations. Results are typed,
bounded, minimized, and read-only. Tools may update only shared UI focus,
Map/Path presentation, or review view. They cannot call a database, shell,
filesystem, deployment target, credential store, or production service.

The application uses a fully synthetic Orchid Commerce overlay. The portable
semantic graph core is dependency-free and generates a separate hash-verified
multi-language fixture. The core predates the challenge; the multi-domain
Atlas interface, five WebMCP tools, shared state, safety contracts, and public
demo were built as the challenge extension.

## Public links

- Live demo: <https://dsh-project-atlas.dr-satim.chatgpt.site>
- Public source repository: <https://github.com/ZIVE01/dsh-project-atlas>
- Apache-2.0 license: <https://github.com/ZIVE01/dsh-project-atlas/blob/main/LICENSE>
- Public YouTube demo under three minutes: **USER FINAL STEP — add URL after upload**
- Challenge submission page or confirmation: **USER FINAL STEP — add URL or confirmation after submission**

## Final submission checklist

- [ ] Confirm entrant and regional eligibility against the official rules.
- [ ] Confirm the public repository is reachable and GitHub recognizes the
      root Apache-2.0 license.
- [ ] Test all five tools against the final public build in the ChatGPT
      built-in browser.
- [ ] Optionally test Chrome 149+ with
      `chrome://flags/#enable-webmcp-testing` enabled.
- [ ] Record the narrated demo from the exact final public build using
      [`DEMO-SCRIPT.md`](DEMO-SCRIPT.md).
- [ ] Upload the video publicly to YouTube and replace the user-step marker.
- [ ] Submit the live URL, repository URL, description, and video before the
      organizer's deadline.
- [ ] Record the final submission confirmation.

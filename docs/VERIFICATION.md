# Verification record

Candidate verification date: 2026-09-01.

## Multi-domain public application

The challenge candidate is expected to expose exactly this synthetic surface:

- Map view: 19 visible nodes and 20 explicit relations;
- Path view: one bounded source-backed route at a time;
- seven separated domains;
- one explicit red BYPASS relation;
- verified, needs-proof, unknown, blind-spot, and review states;
- exactly five read-only WebMCP tools; and
- a literal `document.modelContext.registerTool` registration boundary.

The five tools are:

1. `inspect_project_overview`;
2. `focus_graph_entity`;
3. `trace_architecture_path`;
4. `list_security_findings`; and
5. `compare_architecture_layers`.

All tool inputs use closed schemas. Unknown and fuzzy entity IDs fail closed.
The tool surface contains no database, shell, filesystem, credential,
deployment, production, or data-mutation operation.

## Reproducible local gate

Run from a clean checkout with Node.js 24 or newer:

```bash
npm ci
npm run verify
```

The gate covers ESLint, fixture integrity, the exact WebMCP tool set, the
read-only boundary, Map/Path and BYPASS contracts, fail-closed behavior, the
portable-core gate, public-boundary validation, and the Vinext/Vite production
build.

Vinext may report the root route as statically “Unknown”. This is an
informational framework limitation in its route classifier; the build must
still exit successfully and the deployed route must be checked separately.

## Public boundary

- Public dataset: synthetic Orchid Commerce only.
- Public overlay: 19 nodes and 20 relations.
- No private project names, source snapshots, routes, tables, hosts, user data,
  credentials, telemetry, or production facts are allowed.
- Root license: Apache-2.0.
- Public-boundary validator: mandatory PASS before publication.

## Portable semantic graph core

- Allowlisted files: 28/28.
- Allowlist tree digest:
  `0f04569737e1c5fc6cc4c8b681e9c707cdca4e4a89429cc985ff891e810f2485`.
- Synthetic engine graph: 24 nodes, 20 edges, 1 explicit unknown.
- Synthetic engine graph SHA-256:
  `3595d0fa21d714d4bc7273ee09bd52fe2ce86d5690857a788b64b6736b775878`.
- Windows baseline: 8 PASS, 2 symlink tests skipped when local policy prevents
  test symlink creation.
- Network-disabled Linux baseline: 10/10 PASS, including both symlink tests.

The Linux baseline uses an already-present Node 24 Alpine image with network
disabled, a read-only source mount, a read-only container filesystem, and an
isolated temporary filesystem.

## Required post-deployment browser verification

Recorded on 2026-09-01 against Sites version 7, source commit
`8a3954497e84de0b9c98b9846c87c17a5e888894`, at
<https://dsh-project-atlas.dr-satim.chatgpt.site>:

The public GitHub mirror normalizes the author and committer email to the
account's GitHub `noreply` address before first publication. Commit identifiers
therefore differ from the private Sites source history, while file identity is
preserved: Sites commit `8a395449...` and public commit `f9260ccf...` both point
to tree `8fc6ab385faa1c82642cc01f8b75f841f495e2ad`. No application source,
dependency, build output or verification result changed during normalization.

- [x] Public deployment succeeded and the live route loaded normally.
- [x] ChatGPT built-in browser reported **WebMCP connected**.
- [x] Exactly five expected tools were discovered.
- [x] Every real WebMCP state changed the prominent `WHAT THIS PROVES` card;
      exact focus, bounded path, BYPASS, comparison, blind spot, read-only
      boundary, missing proof and denial states were checked.
- [x] The public UI exposed the deterministic 2:45 guided rehearsal with 12
      timed stages, progress, automatic event following, and a jury summary.
- [x] The exact deployed commit completed the full 2:45 rehearsal locally at
      real speed: 12/12 stages, 5/5 tool handlers, one exposed bypass, three
      preserved uncertainty states, zero mutations, and a fail-closed denial.
- [x] Project overview returned the pinned synthetic identity.
- [x] Exact focus changed the visible node and inspector together.
- [x] Trace switched to Path and returned the six-node bounded
      search-to-catalog route.
- [x] Two high-severity findings included the explicit BYPASS.
- [x] Layer comparison preserved UNKNOWN, BLIND SPOT, and REVIEW.
- [x] Unknown `handler:payment` returned `deny` with `mutation: false` without
      changing the selected `Lookup handler` node; the visible card explained
      `Unknown means deny`.
- [x] Map restored all 19 nodes and 20 relations with zero dimmed nodes.
- [x] The public build matched its 1816 × 1135 browser viewport exactly;
      effective 1366 × 768 and 1440 × 900 local checks also had no
      document-level scroll.
- [x] At effective 1366 × 768 and 1440 × 900 the explanation card remained
      above the fold and the inspector required no internal scroll.
- [x] Browser warning/error console was empty after the tool sequence.

Chrome 149+ can be checked separately with
`chrome://flags/#enable-webmcp-testing` enabled. Because browser support is
experimental, the final record must state the exact browser surface and date
used rather than assuming compatibility.

## Public challenge links

- Live demo: <https://dsh-project-atlas.dr-satim.chatgpt.site>
- Source repository: <https://github.com/ZIVE01/dsh-project-atlas>
- YouTube demo: **USER FINAL STEP — add after upload**
- Submission confirmation: **USER FINAL STEP — add after submission**

# Design QA — DSH Project Atlas capability map

## Comparison target

- Shell source visual truth: user-supplied `codex-clipboard-16e2bb25-19c1-4a02-9ffb-df30476d5cf1.png` from the previous public Atlas build (conversation attachment; not committed).
- BYPASS correction source: user-supplied `codex-clipboard-2b49a2b0-ca73-4f37-8554-83459ead178f.png` (629 × 219; conversation attachment, not committed), where the direct red relation visually passed through `Compare layers`.
- Rendered implementation: [`docs/atlas-map-final.png`](docs/atlas-map-final.png).
- Focused implementation evidence: [`docs/atlas-bypass-route.png`](docs/atlas-bypass-route.png).
- Route and mode: root page, light theme, Architecture / Map.
- Source pixels: 1870 × 939.
- Implementation pixels: 1483 × 744 for the full capture and 913 × 413 for the focused capture.
- Implementation CSS viewport: 1870 × 938 at the browser's normalized capture density.
- Density normalization: the in-app browser captures at approximately 0.793 output pixels per CSS pixel. Geometry and overflow were therefore checked in CSS pixels, while visual comparisons used each image at its original saved resolution.
- State note: the source selected `screen:project-search`; the implementation intentionally selects `handler:lookup` so the default demo immediately exposes a needs-proof boundary. Layout, theme, shell, and Architecture mode are otherwise directly comparable.

## Full-view comparison evidence

The implementation preserves the source's editorial white/green visual language, dark tab treatment, left control rail, right inspector, monospaced provenance, status colors, rounded cards, and low-elevation surfaces. The intentional structural change is limited to the requested central experience: the linear eight-node chain is replaced by a 19-node, 20-relation map grouped into seven named domains. The dark Agent Console now occupies the lower in-shell region while the document remains exactly one viewport high.

At effective 1366 × 768 and 1440 × 900 browser checks, document `scrollWidth/scrollHeight` matched the viewport and all 19 node rectangles remained within the graph canvas. The final 1870 × 938 capture also has no document-level overflow.

## Focused-region comparison evidence

- Typography: full-resolution inspection covered the hero title, rail labels, graph cards, domain labels, inspector facts, provenance, and console copy. The implementation keeps the same Inter/system and monospace fallbacks and hierarchy. Small graph metadata was raised from 6–7 px to 7–10 px where needed for the denser map.
- Spacing and layout: the rail, inspector, top navigation, graph toolbar, legend, and console retain the source rhythm. Domain islands introduce deliberate grouping without changing the shell proportions.
- Colors and tokens: the original ink, paper, green, violet, amber, and red semantics are preserved. The new red BYPASS is additionally distinguished by line weight and a text label.
- Image and asset quality: this interface has no photographic or illustrative target assets. The existing DSH mark and CSS-native data visualization remain sharp at both tested desktop sizes; no source imagery was replaced.
- Copy and content: labels consistently describe synthetic capabilities, consumers, owners, data, audit, and evidence. `READ ONLY`, uncertainty, and synthetic-data boundaries remain explicit.
- BYPASS routing: the semantic edge remains `screen:catalog-admin → handler:catalog-update`, but the stroke now uses a dedicated upper review lane. It does not visually or geometrically enter `Compare layers`, the approved route/API/capability cards, or any other unrelated node.

## Interaction and accessibility evidence

- Exactly five page-registered WebMCP tools were discovered and called in the browser.
- Overview, exact focus, bounded path, findings, and layer comparison returned structured read-only results.
- Path showed six exact nodes; Map restored all 19 nodes and cleared neighborhood dimming.
- Unknown `handler:payment` failed closed and preserved the previously selected node.
- Zoom, Fit, Map, Path, node focus, and the guided demo controls are semantic buttons with visible focus treatment.
- Unknown, blind-spot, needs-proof, verified, and bypass states use both color and line/card treatment.
- Browser warning/error console: empty.

## Comparison history

### Iteration 1 — blocked

- [P2] The observed runtime node extended about two pixels beyond the graph canvas at effective 1366 × 768.
- [P2] Map could retain focus dimming after returning from Path, so the complete map was not always visually complete.
- [P2] Several domain and node metadata labels were only 6–7 px and too fragile at laptop density.

Fixes made:

- moved `telemetry:window` from 94% to 90% vertical position;
- made Map clear transient highlights and restore the overview console state;
- increased graph metadata sizes while keeping the compact card geometry;
- added TypeScript checking to the reproducible verification command.

### Iteration 2 — post-fix evidence

- Effective 1366 × 768: 19/19 nodes inside canvas; 20 relations; no document-level scroll.
- Effective 1440 × 900: 19/19 nodes inside canvas; 20 relations; no document-level scroll.
- Path → Map: six nodes → nineteen nodes; dimmed nodes after Map: zero.
- Final same-size visual capture: [`docs/atlas-map-final.png`](docs/atlas-map-final.png).
- No actionable P0, P1, or P2 issue remains.

### Iteration 3 — BYPASS correction blocked

- [P2] Replacing the original curve with a lower lane at `y=79` removed the semantic ambiguity in geometry, but full-view inspection still made the stroke appear to touch the top edge of `Compare layers`.
- [P2] Raising that lane to `y=74` cleared `Compare layers`, but made the stroke tangent to `PATCH /catalog`.
- [P2] The intermediate `y=76.5` corridor cleared both cards at 1870 × 938, but the available gap was too narrow at effective 1366 × 768 and intersected `PATCH /catalog`.

Fix made:

- replaced the narrow lower corridor with an explicit upper review lane that exits the source before the approved route, crosses empty space between the read and mutation rows, and approaches only the exact target handler.

### Iteration 4 — final BYPASS evidence

- The full and focused captures were opened together with the user-provided problem screenshot.
- Effective 1870 × 938: zero unrelated node intersections, zero label intersections, and no document scroll.
- Effective 1440 × 900: zero unrelated node intersections, zero label intersections, and no document scroll.
- Effective 1366 × 768: zero unrelated node intersections, zero label intersections, and no document scroll.
- `Compare layers` retains only its approved `WebMCP reviewer → Compare layers → audit.read` chain.
- Fonts, spacing, colors, images/assets, copy, shell proportions, and all non-BYPASS relations are unchanged.
- No actionable P0, P1, or P2 issue remains.

## Follow-up polish

- [P3] A future mobile-specific map presentation could replace the current intentionally desktop-first wide canvas. It is not required for the challenge's desktop WebMCP demonstration.

## Final result

final result: passed

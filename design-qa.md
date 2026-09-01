# Design QA — DSH Project Atlas capability map

## Comparison target

- Source visual truth: user-supplied `codex-clipboard-16e2bb25-19c1-4a02-9ffb-df30476d5cf1.png` from the previous public Atlas build (conversation attachment; not committed).
- Rendered implementation: [`docs/atlas-map-final.png`](docs/atlas-map-final.png).
- Route and mode: root page, light theme, Architecture / Map.
- Source pixels: 1870 × 939.
- Implementation pixels: 1870 × 938.
- Implementation CSS viewport: 1870 × 938 at the browser's normalized capture density.
- Density normalization: source and implementation were opened together at original resolution; the one-pixel height difference does not affect the application region.
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

## Follow-up polish

- [P3] A future mobile-specific map presentation could replace the current intentionally desktop-first wide canvas. It is not required for the challenge's desktop WebMCP demonstration.

## Final result

final result: passed

import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
const styles = await readFile(new URL('../app/globals.css', import.meta.url), 'utf8');
const expectedTools = [
  'inspect_project_overview',
  'focus_graph_entity',
  'trace_architecture_path',
  'list_security_findings',
  'compare_architecture_layers',
];

test('registers the exact public WebMCP tool set', () => {
  assert.match(source, /interface Document\s*\{\s*modelContext: ModelContext;/s);
  assert.match(source, /document\.modelContext\.registerTool/);
  for (const tool of expectedTools) assert.match(source, new RegExp(`name: '${tool}'`));
  assert.equal((source.match(/name: '[a-z_]+',/g) ?? []).length, expectedTools.length);
});

test('tools use closed schemas and preserve a read-only boundary', () => {
  assert.equal((source.match(/additionalProperties: false/g) ?? []).length, expectedTools.length);
  assert.match(source, /mutation: false/);
  assert.match(source, /No edit, deploy, SQL or production controls exist\./);
  assert.doesNotMatch(source, /\bfetch\s*\(/);
  assert.doesNotMatch(source, /XMLHttpRequest|localStorage|sessionStorage|document\.cookie|indexedDB/);
});

test('exact entity IDs and uncertainty remain explicit', () => {
  assert.match(source, /enum: exactNodeIds/);
  assert.match(source, /unknown-exact-entity-id/);
  assert.match(source, /unknownsPreserved: true/);
  assert.match(source, /'unknown' \| 'blind-spot'/);
  assert.match(source, /findGraphPath\(from, to\)/);
  assert.doesNotMatch(source, /nodes\.slice\(fromIndex/);
});

test('guided demo exposes path, evidence comparison and fail-closed feedback', () => {
  assert.match(source, /RUN \$\{DEMO_DURATION_LABEL\} GUIDED DEMO/);
  assert.match(source, /className="result-deny" role="alert"/);
  assert.match(source, /SELECTION UNCHANGED · mutation: false/);
  assert.match(source, /UNKNOWN, BLIND SPOT and REVIEW preserved/);
  assert.match(source, /highlightedEdgeIds\.includes\(graphEdgeKey\(edge\)\)/);
  assert.match(source, /LOCAL SAFETY REHEARSAL/);
  assert.match(source, /kind: 'summary'/);
  assert.match(source, /5 \/ 5<\/b> read-only tools exercised/);
  assert.match(source, /focusExactEntity\('capability:catalog-write'\)/);
  assert.match(source, /focusExactEntity\('agent:webmcp-review'\)/);
  assert.match(source, /listSecurityFindings\('info'\)/);
  assert.match(source, /consoleTimelineRef\.current/);
});

test('guided rehearsal is timed to 2:45 with an under-three-minute safety margin', () => {
  const stageBlock = source.match(/const DEMO_STAGES = \[(.*?)\] as const;/s)?.[1] ?? '';
  const durations = [...stageBlock.matchAll(/durationMs: ([\d_]+)/g)]
    .map((match) => Number(match[1].replaceAll('_', '')));
  assert.equal(durations.length, 12);
  assert.equal(durations.reduce((total, duration) => total + duration, 0), 165_000);
  assert.match(source, /const DEMO_DURATION_LABEL = '2:45';/);
  assert.match(source, /DEMO COMPLETE · \$\{DEMO_DURATION_LABEL\} · READ ONLY/);
});

test('capability map keeps domains, paths and bypasses explicit', () => {
  assert.match(source, /type GraphPresentation = 'map' \| 'path'/);
  assert.match(source, /const domainClusters = \[/);
  assert.match(source, /id: 'capability:catalog-read'/);
  assert.match(source, /id: 'capability:catalog-write'/);
  assert.match(source, /id: 'screen:catalog-board'/);
  assert.match(
    source,
    /from: 'screen:catalog-admin',\s+to: 'handler:catalog-update',\s+label: 'BYPASS',\s+state: 'bypass',\s+route: 'upper-review-lane'/,
  );
  assert.match(source, /edge\.route === 'upper-review-lane'/);
  assert.match(source, /candidate\.state !== 'bypass'/);
  assert.match(source, />\s*MAP\s*</);
  assert.match(source, />\s*PATH\s*</);
  assert.match(source, /MIN_GRAPH_SCALE = 0\.75/);
  assert.match(source, /MAX_GRAPH_SCALE = 1\.4/);
  assert.match(source, /Drag empty space to pan · wheel to zoom/);
});

test('desktop application shell fits the viewport without page scrolling', () => {
  assert.match(styles, /\.app-shell\s*\{[^}]*height:\s*100dvh;/s);
  assert.match(styles, /\.app-shell\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.workspace\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*0;/s);
  assert.match(styles, /\.graph-panel\s*\{[^}]*grid-template-rows:\s*48px minmax\(0, 1fr\) 144px 30px;/s);
  assert.match(styles, /\.graph-world\s*\{[^}]*transform-origin:\s*50% 50%;/s);
  assert.doesNotMatch(styles, /\.workspace\s*\{[^}]*height:\s*690px;/s);
});

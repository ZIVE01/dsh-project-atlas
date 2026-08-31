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
  assert.match(source, /document as Document & \{ modelContext\?: ModelContext \}/);
  assert.match(source, /modelContext\.registerTool/);
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
  assert.match(source, /RUN FULL DEMO/);
  assert.match(source, /className="result-deny" role="alert"/);
  assert.match(source, /SELECTION UNCHANGED · mutation: false/);
  assert.match(source, /UNKNOWN, BLIND SPOT and REVIEW preserved/);
  assert.match(source, /highlightedEdgeIds\.includes\(graphEdgeKey\(edge\)\)/);
  assert.match(source, /LOCAL SAFETY REHEARSAL/);
});

test('desktop application shell fits the viewport without page scrolling', () => {
  assert.match(styles, /\.app-shell\s*\{[^}]*height:\s*100dvh;/s);
  assert.match(styles, /\.app-shell\s*\{[^}]*overflow:\s*hidden;/s);
  assert.match(styles, /\.workspace\s*\{[^}]*height:\s*auto;[^}]*min-height:\s*0;/s);
  assert.match(styles, /\.graph-panel\s*\{[^}]*grid-template-rows:\s*52px minmax\(0, 1fr\) 166px 34px;/s);
  assert.doesNotMatch(styles, /\.workspace\s*\{[^}]*height:\s*690px;/s);
});

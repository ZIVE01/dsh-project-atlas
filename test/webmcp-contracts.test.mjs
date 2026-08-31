import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

const source = await readFile(new URL('../app/page.tsx', import.meta.url), 'utf8');
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

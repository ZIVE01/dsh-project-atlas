import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import test from 'node:test';
import {
  analyzeProject,
  canonicalGraphJson,
  sha256,
} from '../packages/semantic-graph-core/index.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(projectRoot, 'packages', 'semantic-graph-core', 'test', 'fixtures', 'orchid');
const manifest = JSON.parse(await readFile(path.join(fixtureRoot, 'manifest.json'), 'utf8'));
const artifact = JSON.parse(await readFile(path.join(projectRoot, 'data', 'orchid-graph.v1.json'), 'utf8'));

test('published fixture is the exact canonical graph produced by the public core', async () => {
  const generated = await analyzeProject({ namespace: manifest.namespace, root: fixtureRoot, files: manifest.files });
  const canonical = canonicalGraphJson(generated);
  assert.equal(artifact.graphSha256, sha256(canonical));
  assert.deepEqual(artifact.graph, JSON.parse(canonical));
  assert.equal(artifact.graph.nodes.length, 24);
  assert.equal(artifact.graph.edges.length, 20);
  assert.equal(artifact.graph.unknowns.length, 1);
});

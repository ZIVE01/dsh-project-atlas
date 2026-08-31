import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  analyzeProject,
  canonicalGraphJson,
  sha256,
} from '../packages/semantic-graph-core/index.mjs';

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const fixtureRoot = path.join(projectRoot, 'packages', 'semantic-graph-core', 'test', 'fixtures', 'orchid');
const manifestPath = path.join(fixtureRoot, 'manifest.json');
const manifest = JSON.parse(await readFile(manifestPath, 'utf8'));
const graph = await analyzeProject({
  namespace: manifest.namespace,
  root: fixtureRoot,
  files: manifest.files,
});
const canonicalGraph = canonicalGraphJson(graph);
const artifact = {
  artifactVersion: '1.0.0',
  source: 'packages/semantic-graph-core/test/fixtures/orchid/manifest.json',
  graphSha256: sha256(canonicalGraph),
  graph: JSON.parse(canonicalGraph),
};
const target = path.join(projectRoot, 'data', 'orchid-graph.v1.json');

await mkdir(path.dirname(target), { recursive: true });
await writeFile(target, `${JSON.stringify(artifact, null, 2)}\n`, 'utf8');
console.log(JSON.stringify({
  target: path.relative(projectRoot, target).replaceAll('\\', '/'),
  graphSha256: artifact.graphSha256,
  nodes: graph.nodes.length,
  edges: graph.edges.length,
  unknowns: graph.unknowns.length,
}));

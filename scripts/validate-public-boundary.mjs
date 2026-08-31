import { lstat, readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const root = path.resolve(import.meta.dirname, '..');
const ignoredDirectories = new Set([
  '.git',
  '.next',
  '.vinext',
  '.wrangler',
  'dist',
  'node_modules',
  'outputs',
  'work',
]);
const ignoredFiles = new Set([
  'public/og.png',
  'scripts/validate-public-boundary.mjs',
]);
const textExtensions = new Set([
  '', '.css', '.cs', '.html', '.js', '.jsx', '.json', '.md', '.mjs', '.sql',
  '.svg', '.ts', '.tsx', '.txt', '.yaml', '.yml',
]);

const prohibitedText = [
  ['UN', 'LICENSED'].join(''),
  ['P', 'ROCS'].join(''),
  ['Search', ' AI'].join(''),
  ['ai', '_portal'].join(''),
  ['192', '.168.'].join(''),
];
const prohibitedPatterns = [
  /[A-Za-z]:\\(?:Users|AI|Projects|source|workspace)\\/,
  /(?:api[_-]?key|password|private[_-]?key|client[_-]?secret)\s*[:=]\s*["'][^"']+/i,
  /postgres(?:ql)?:\/\/[^\s"']+:[^\s"']+@/i,
];

const findings = [];
let checkedFiles = 0;

async function visit(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && ignoredDirectories.has(entry.name)) continue;
    const absolute = path.join(directory, entry.name);
    const relative = path.relative(root, absolute).replaceAll('\\', '/');
    if (ignoredFiles.has(relative)) continue;

    const info = await lstat(absolute);
    if (info.isSymbolicLink()) {
      findings.push(`${relative}: symbolic links are not allowed in the public package`);
      continue;
    }
    if (info.isDirectory()) {
      await visit(absolute);
      continue;
    }
    if (!textExtensions.has(path.extname(entry.name).toLowerCase())) continue;

    checkedFiles += 1;
    const content = await readFile(absolute, 'utf8');
    for (const marker of prohibitedText) {
      if (content.includes(marker)) findings.push(`${relative}: contains prohibited marker`);
    }
    for (const pattern of prohibitedPatterns) {
      if (pattern.test(content)) findings.push(`${relative}: matches prohibited private/secret pattern`);
    }
  }
}
await visit(root);

for (const required of ['LICENSE', 'NOTICE', 'README.md', 'SECURITY.md']) {
  try {
    await lstat(path.join(root, required));
  } catch {
    findings.push(`${required}: required public file is missing`);
  }
}

if (findings.length > 0) {
  console.error(JSON.stringify({ valid: false, checkedFiles, findings }, null, 2));
  process.exitCode = 1;
} else {
  console.log(JSON.stringify({ valid: true, checkedFiles, boundary: 'synthetic-public-only' }));
}

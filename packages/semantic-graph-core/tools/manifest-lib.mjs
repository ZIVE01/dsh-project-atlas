import { createHash } from "node:crypto";
import { copyFile, lstat, mkdir, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import { canonicalJson, normalizeRelativePath, sha256 } from "../src/canonical.mjs";

export const ALLOWLIST_NAME = "export-allowlist.json";
const ZERO_HASH = "0".repeat(64);
const RESERVED = /^(?:con|prn|aux|nul|com[1-9]|lpt[1-9])(?:\.|$)/i;

async function listFiles(root, relative = "") {
  const directory = path.join(root, ...relative.split("/").filter(Boolean));
  const entries = await readdir(directory, { withFileTypes: true });
  const files = [];
  for (const entry of entries.sort((left, right) => left.name.localeCompare(right.name))) {
    const child = relative ? `${relative}/${entry.name}` : entry.name;
    const absolute = path.join(root, ...child.split("/"));
    const info = await lstat(absolute);
    if (info.isSymbolicLink()) throw new Error(`Symbolic link is forbidden: ${child}`);
    if (info.isDirectory()) files.push(...await listFiles(root, child));
    else if (info.isFile()) files.push(child);
    else throw new Error(`Non-regular entry is forbidden: ${child}`);
  }
  return files;
}

function assertManifestPath(value) {
  const normalized = normalizeRelativePath(value);
  for (const segment of normalized.split("/")) {
    if (segment.endsWith(".") || segment.endsWith(" ") || RESERVED.test(segment)) {
      throw new Error(`Non-portable manifest path: ${value}`);
    }
  }
  return normalized;
}

export function canonicalSelfHash(manifest) {
  const projected = structuredClone(manifest);
  const self = projected.entries.find((entry) => entry.path === ALLOWLIST_NAME);
  if (!self || self.hashMode !== "canonical-self-v1") throw new Error("Manifest self entry is missing or invalid");
  self.sha256 = ZERO_HASH;
  return sha256(canonicalJson(projected));
}

export async function loadManifest(root) {
  const manifest = JSON.parse(await readFile(path.join(root, ALLOWLIST_NAME), "utf8"));
  if (manifest.schemaVersion !== "1.0.0" || manifest.hashAlgorithm !== "SHA-256" || manifest.defaultPolicy !== "deny") {
    throw new Error("Unsupported export allowlist contract");
  }
  if (!Array.isArray(manifest.entries) || manifest.entries.length === 0) throw new Error("Allowlist entries are required");
  const exact = new Set();
  const folded = new Set();
  for (const entry of manifest.entries) {
    entry.path = assertManifestPath(entry.path);
    if (exact.has(entry.path) || folded.has(entry.path.toLowerCase())) throw new Error(`Duplicate or case-colliding path: ${entry.path}`);
    exact.add(entry.path);
    folded.add(entry.path.toLowerCase());
    if (!/^[0-9a-f]{64}$/.test(entry.sha256)) throw new Error(`Invalid SHA-256 for ${entry.path}`);
    if (!entry.role || !entry.license) throw new Error(`Role and license are required for ${entry.path}`);
    if (!new Set(["bytes", "canonical-self-v1"]).has(entry.hashMode)) throw new Error(`Invalid hash mode for ${entry.path}`);
  }
  if (manifest.entries.filter((entry) => entry.hashMode === "canonical-self-v1").length !== 1) throw new Error("Exactly one self-hash entry is required");
  return manifest;
}

export async function verifyCore(root) {
  const manifest = await loadManifest(root);
  const files = (await listFiles(root)).sort();
  const expected = manifest.entries.map((entry) => entry.path).sort();
  if (canonicalJson(files) !== canonicalJson(expected)) {
    throw new Error(`Core inventory differs from allowlist\nactual=${canonicalJson(files)}\nexpected=${canonicalJson(expected)}`);
  }
  const inventory = [];
  for (const entry of [...manifest.entries].sort((left, right) => left.path.localeCompare(right.path))) {
    const absolute = path.join(root, ...entry.path.split("/"));
    const info = await lstat(absolute);
    if (!info.isFile() || info.isSymbolicLink()) throw new Error(`Allowlisted entry is not a regular file: ${entry.path}`);
    const actual = entry.hashMode === "canonical-self-v1" ? canonicalSelfHash(manifest) : sha256(await readFile(absolute));
    if (actual !== entry.sha256) throw new Error(`SHA-256 mismatch: ${entry.path}`);
    inventory.push({ path: entry.path, sha256: actual, bytes: info.size, role: entry.role, license: entry.license });
  }
  const treeDigest = sha256(inventory.map((entry) => `${entry.path}\0${entry.bytes}\0${entry.sha256}\n`).join(""));
  return { valid: true, fileCount: inventory.length, treeDigest, inventory, manifestRawSha256: sha256(await readFile(path.join(root, ALLOWLIST_NAME))) };
}

export async function exportCore(sourceRoot, targetRoot) {
  const source = await verifyCore(sourceRoot);
  try {
    const targetInfo = await stat(targetRoot);
    if (!targetInfo.isDirectory()) throw new Error("Export target exists and is not a directory");
    if ((await readdir(targetRoot)).length !== 0) throw new Error("Export target must be empty");
  } catch (error) {
    if (error.code === "ENOENT") await mkdir(targetRoot, { recursive: false });
    else throw error;
  }
  const manifest = await loadManifest(sourceRoot);
  for (const entry of manifest.entries.sort((left, right) => left.path.localeCompare(right.path))) {
    const sourceFile = path.join(sourceRoot, ...entry.path.split("/"));
    const targetFile = path.join(targetRoot, ...entry.path.split("/"));
    await mkdir(path.dirname(targetFile), { recursive: true });
    await copyFile(sourceFile, targetFile, 1);
  }
  const target = await verifyCore(targetRoot);
  if (source.treeDigest !== target.treeDigest || source.manifestRawSha256 !== target.manifestRawSha256) {
    throw new Error("Export verification mismatch");
  }
  return { source, target, copiedOnlyAllowlistedEntries: true };
}

export async function rawFileHash(filePath) {
  const hash = createHash("sha256");
  hash.update(await readFile(filePath));
  return hash.digest("hex");
}

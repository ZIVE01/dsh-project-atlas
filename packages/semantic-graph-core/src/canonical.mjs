import { createHash } from "node:crypto";

function compareText(left, right) {
  return left < right ? -1 : left > right ? 1 : 0;
}

export function canonicalValue(value) {
  if (value === undefined) return null;
  if (value === null || typeof value === "boolean" || typeof value === "string") {
    return typeof value === "string" ? value.normalize("NFC") : value;
  }
  if (typeof value === "number") {
    if (!Number.isSafeInteger(value)) throw new TypeError("Only safe integers are canonical");
    return value;
  }
  if (Array.isArray(value)) return value.map(canonicalValue);
  if (typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, nested]) => nested !== undefined)
        .sort(([left], [right]) => compareText(left, right))
        .map(([key, nested]) => [key.normalize("NFC"), canonicalValue(nested)]),
    );
  }
  throw new TypeError(`Unsupported canonical value type: ${typeof value}`);
}

export function canonicalJson(value, { trailingNewline = false } = {}) {
  return `${JSON.stringify(canonicalValue(value))}${trailingNewline ? "\n" : ""}`;
}

export function sha256(value) {
  return createHash("sha256").update(value).digest("hex");
}

export function normalizeRelativePath(value) {
  if (typeof value !== "string" || value.length === 0 || value.includes("\0")) {
    throw new TypeError("Path must be a non-empty string without NUL");
  }
  const normalized = value.replaceAll("\\", "/").normalize("NFC");
  if (/^[A-Za-z]:/.test(normalized) || normalized.startsWith("/") || normalized.startsWith("//")) {
    throw new TypeError(`Absolute path is forbidden: ${value}`);
  }
  const parts = normalized.split("/");
  if (parts.some((part) => part === "" || part === "." || part === "..")) {
    throw new TypeError(`Unsafe relative path: ${value}`);
  }
  return parts.join("/");
}

export function compareCanonical(left, right) {
  return compareText(canonicalJson(left), canonicalJson(right));
}

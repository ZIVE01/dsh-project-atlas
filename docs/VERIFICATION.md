# Verification record

Verification date: 2026-08-31.

## Public application

- `npm audit --json`: 0 known vulnerabilities.
- ESLint: PASS with 0 warnings and 0 errors.
- WebMCP and fixture-integrity tests: 4/4 PASS.
- Public-boundary scan: PASS across 51 text files.
- Vinext/Vite production build: PASS.
- Local preview: HTTP 200.

Vinext currently reports the root route as statically “Unknown”. This is an
informational framework limitation in its route classifier; the build exits
successfully and the deployed route is validated separately.

## Portable semantic graph core

- Allowlisted files: 28/28.
- Allowlist tree digest:
  `0f04569737e1c5fc6cc4c8b681e9c707cdca4e4a89429cc985ff891e810f2485`.
- Synthetic graph: 24 nodes, 20 edges, 1 explicit unknown.
- Synthetic graph SHA-256:
  `3595d0fa21d714d4bc7273ee09bd52fe2ce86d5690857a788b64b6736b775878`.
- Windows: 8 PASS, 2 symlink tests skipped because local policy prevents test
  symlink creation.
- Network-disabled Linux container: 10/10 PASS, including both symlink tests.

The Linux verification used an already-present Node 24 Alpine image with
network disabled, a read-only source mount, a read-only container filesystem,
and an isolated temporary filesystem.

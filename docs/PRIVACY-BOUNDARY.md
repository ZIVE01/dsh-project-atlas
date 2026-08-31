# Public and privacy boundary

## Allowed

- Project-neutral semantic graph algorithms.
- Stable identifier, provenance, confidence, and uncertainty contracts.
- Synthetic Orchid Commerce fixtures.
- Read-only WebMCP tool schemas and UI state changes.
- Public build, test, and deployment configuration.

## Excluded

- Private project names, routes, tables, hosts, addresses, or identifiers.
- Real source snapshots, graph evidence, runtime telemetry, or audit records.
- User identities, role assignments, tokens, cookies, passwords, or keys.
- Database credentials, connection strings, deployment controls, or SQL tools.
- Adapters that encode a private project's architecture.

## Enforcement

The repository has three independent checks:

1. The semantic-core allowlist pins every exported file and rejects extras.
2. The public-boundary validator rejects common private and credential markers.
3. The WebMCP contract tests require the exact read-only tool set and reject
   browser network or storage primitives in the tool surface.

These checks reduce accidental disclosure; they do not replace human review
before publication.

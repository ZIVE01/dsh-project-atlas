# Portable semantic graph core

This dependency-free ESM package creates deterministic code-intelligence
graphs. It provides stable identifiers, confidence and provenance contracts,
validation, querying, a CLI, and conservative analyzers for JavaScript/React,
Python, C#, SQL, and common service configuration.

The package is project-neutral. An application-specific adapter supplies an
opaque namespace and evidence-linked facts through the public API. The core
does not discover neighboring packages, environment-specific roots, or private
configuration.

## Public API

Only `index.mjs` is exported. It exposes graph construction, validation,
canonical serialization, querying, text/project analysis, and the default
analyzers. Internal subpaths are not package exports.

## Local checks

No install command is required because the lock contains no dependencies.

```text
node --check index.mjs
node --test
node tools/core-gate.mjs
node bin/semantic-graph.mjs analyze --manifest test/fixtures/orchid/manifest.json
```

This public challenge edition is distributed under the Apache License 2.0. It
contains only the project-neutral core and synthetic Orchid fixture; private
project adapters, production facts and credentials are deliberately excluded.

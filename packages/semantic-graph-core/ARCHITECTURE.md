# Architecture

The public boundary is the root package export. Stable identifiers are SHA-256
URNs calculated from canonical, logical identities; line numbers, timestamps,
checkout roots, confidence, and evidence do not participate in identity.

Graph output is canonical JSON with recursively sorted object keys and arrays
sorted by stable identifiers. Every authoritative fact requires relative-path
provenance. Dynamic or malformed source constructs produce explicit unknowns
instead of guessed authoritative relations.

Analyzers accept explicit files and do not crawl unspecified directories.
Application facts and policy enrichments flow into the core as data. There is
no reverse import or runtime discovery mechanism.

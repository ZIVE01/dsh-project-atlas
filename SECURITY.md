# Security policy

## Supported code

Security fixes apply to the latest commit on the default branch.

## Reporting a vulnerability

Please use the repository host's private vulnerability-reporting feature. Do
not include credentials, private source code, production data, or exploit
traffic against systems you do not own.

## Security boundary

Project Atlas is a public, synthetic, read-only demonstration. Its WebMCP tools
may change UI focus or view mode, but they do not expose shell, SQL, filesystem,
deployment, credential, or business-data operations. Unknown identifiers and
unsupported requests fail closed.

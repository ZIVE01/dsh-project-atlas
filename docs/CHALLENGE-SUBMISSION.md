# WebMCP Challenge submission draft

## Project

**DSH Project Atlas — Projects made legible to people and agents**

## One-line description

A shared, read-only semantic graph where people and AI agents investigate
project architecture through exact WebMCP tools instead of screen scraping.

## What it does

Project Atlas turns a synthetic multi-language project into an evidence-aware
architecture workspace. The human can explore the graph directly. An agent can
use five structured WebMCP tools to inspect the project, focus exact entities,
trace bounded paths, list findings, and compare expected with observed layers.

The same UI reflects both human and agent actions. Unknown and blind-spot states
remain visible, and unsupported requests fail closed.

## How WebMCP is used

The browser registers five tools with literal
`document.modelContext.registerTool()` calls. Inputs use closed JSON schemas and
stable entity enumerations. Tool results are structured, minimized, and
read-only. Three tools may update only shared UI focus or view mode; none can
call a database, shell, filesystem, deployment target, or production service.

## What was newly built for the challenge

- The Project Atlas responsive interface.
- Five WebMCP browser tools and shared human/agent state.
- Read-only and fail-closed contract checks.
- Public documentation, privacy boundary, social image, and deployment package.
- Integration of the existing portable semantic graph core into a public demo.

The portable semantic graph core predates the challenge and is identified as
such in the README and Git history.

## Links to complete before submission

- Live demo: `TBD`
- Public source repository: `TBD`
- Video under three minutes: `TBD`
- Challenge submission page: `TBD`

## Final submission checklist

- Verify entrant and regional eligibility directly against the official rules.
- Confirm the public repository uses Apache-2.0 and contains no private data.
- Record the video from the exact public build.
- Test all five tools in a WebMCP-capable environment.
- Replace every `TBD` with a public URL.
- Submit before the official deadline shown by the organizer.

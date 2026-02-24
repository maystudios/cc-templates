# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The fastest way to extend Claude Code with reusable, community-contributed components — one command, files in the right place.
**Current focus:** Phase 2 — Core Installer

## Current Position

Phase: 2 of 4 (Core Installer)
Plan: 1 of 4 in current phase (Plan 02-01 complete)
Status: Plan 02-01 complete — foundation modules ready; Wave 2 installer plans (02-02, 02-03, 02-04) can now run in parallel
Last activity: 2026-02-24 — Plan 02-01 executed; src/fetch.js, src/output.js, src/catalog.js created; write-file-atomic installed

Progress: [████░░░░░░] 37%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: 2 min
- Total execution time: 4 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-scaffold | 1 | 2 min | 2 min |
| 02-core-installer | 1 | 2 min | 2 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 02-01 (2 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Pre-phase]: Register `cc-templates` npm name before any public announcement — name squatting is non-recoverable
- [Pre-phase]: Use CommonJS (no build step); pin chalk@4.1.2 and ora@7.x to avoid ESM/CJS friction
- [Pre-phase]: Ship pre-generated `components.json` inside npm package for instant offline listing
- [01-01]: cc-templates npm name confirmed available (npm view returned 404) — safe to register/publish
- [01-01]: ESM-only package (type:module) with js-yaml CJS-from-ESM dynamic import and createRequire fallback
- [01-01]: components/ directory excluded from npm files — stays on GitHub for runtime fetch; components.json included for offline listing
- [01-01]: build-catalog.js uses getMainFile() helper to support both directory skills and future flat-file hooks/commands
- [02-01]: anthropics-community/cc-templates used as DEFAULT_REPO in src/fetch.js (matches plan spec; no git remote configured)
- [02-01]: catalog.js reads components.json synchronously at module load — always present in npm package, sync is correct
- [02-01]: getAvailable() returns [] for missing catalog keys (agents not yet in components.json) via nullish coalescing
- [02-01]: validateName() for empty-catalog types throws with "(none yet)" rather than crashing

### Pending Todos

None.

### Blockers/Concerns

- [Research]: `settings.json` hooks schema is MEDIUM confidence — verify against official Anthropic docs before writing hooks merge logic in Phase 2
- [RESOLVED 01-01]: `cc-templates` npm name confirmed available

## Session Continuity

Last session: 2026-02-24T13:24:38Z
Stopped at: Completed 02-01-PLAN.md — foundation modules (fetch.js, output.js, catalog.js) created; write-file-atomic installed
Resume file: None

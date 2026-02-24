# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-24)

**Core value:** The fastest way to extend Claude Code with reusable, community-contributed components — one command, files in the right place.
**Current focus:** Phase 2 — Core Installer

## Current Position

Phase: 2 of 4 (Core Installer)
Plan: 4 of 4 in current phase (Plan 02-04 complete)
Status: Plan 02-04 complete — hook JSON installer ready; Phase 2 fully complete
Last activity: 2026-02-24 — Plan 02-04 executed; src/installers/hook.js created

Progress: [████████░░] 75%

## Performance Metrics

**Velocity:**
- Total plans completed: 5
- Average duration: 2 min
- Total execution time: 10 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-scaffold | 1 | 2 min | 2 min |
| 02-core-installer | 4 | 8 min | 2 min |

**Recent Trend:**
- Last 5 plans: 02-01 (2 min), 02-02 (3 min), 02-03 (2 min), 02-04 (1 min)
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
- [02-01]: validateName() for empty-catalog types throws with "()" rather than crashing
- [02-02]: writeFileSync used over write-file-atomic for single .md file installs — no partial-write risk; write-file-atomic reserved for hooks merger
- [02-02]: No HTTP retry or timeout added in Phase 2 — plan explicitly prohibits these; minimal implementation kept
- [Phase 02-03]: GitHub Contents API (not raw URLs) required for skill directories — raw URLs only work for individual files
- [Phase 02-03]: Live GitHub test returned 404 (repo not yet published) — installer correctly handles data-integrity case; all offline behaviors verified passing
- [Phase 02-04]: write-file-atomic uses createRequire ESM/CJS interop pattern matching existing js-yaml import in build-catalog.js
- [Phase 02-04]: Hook array-append merge uses spread pattern [...existing, ...new] to prevent clobbering user hooks

### Pending Todos

None.

### Blockers/Concerns

- [Research]: `settings.json` hooks schema is MEDIUM confidence — verify against official Anthropic docs before writing hooks merge logic in Phase 2
- [RESOLVED 01-01]: `cc-templates` npm name confirmed available

## Session Continuity

Last session: 2026-02-24T13:36:51Z
Stopped at: Completed 02-04-PLAN.md — hook installer (src/installers/hook.js) created; Phase 2 complete
Resume file: None

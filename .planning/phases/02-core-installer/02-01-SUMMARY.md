---
phase: 02-core-installer
plan: "01"
subsystem: cli
tags: [nodejs, esm, chalk, github-api, catalog, write-file-atomic]

# Dependency graph
requires:
  - phase: 01-scaffold
    provides: ESM package scaffold, chalk@5.4.1, components.json catalog with 3 seed skills
provides:
  - src/fetch.js — GitHub URL builder (buildRawUrl, buildContentsApiUrl) with CC_TEMPLATES_REPO env override
  - src/output.js — chalk-based output helpers (success, warn, error, hint, verbose, info) with TTY auto-detection
  - src/catalog.js — bundled components.json reader (getAvailable, validateName) with inline error listing
  - write-file-atomic@^7 dependency in package.json
affects: [02-02, 02-03, 02-04, 03-components, 04-polish]

# Tech tracking
tech-stack:
  added: [write-file-atomic@^7.0.0]
  patterns:
    - URL single source of truth: all GitHub URLs go through src/fetch.js — no hardcoded URLs in installers
    - CC_TEMPLATES_REPO env var overrides default repo for development/forking workflows
    - Chalk 5 TTY auto-detection: no manual isTTY check — chalk handles terminal vs CI/pipe contexts
    - Module-load catalog: components.json read synchronously at import time (file always present in npm package)
    - Defensive catalog access: missing keys return [] via nullish coalescing (agents not yet in catalog)

key-files:
  created:
    - src/fetch.js
    - src/output.js
    - src/catalog.js
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "anthropics-community/cc-templates used as DEFAULT_REPO (matches plan spec; no remote set yet)"
  - "catalog.js reads components.json with readFileSync at module load — synchronous, always present in npm package"
  - "getAvailable() returns [] via nullish coalescing for missing catalog keys (agents not in catalog yet)"
  - "validateName() for missing-key types throws with '(none yet)' rather than crashing"

patterns-established:
  - "URL builder pattern: all installer modules import buildRawUrl/buildContentsApiUrl from src/fetch.js — no URL hardcoding"
  - "Output helper pattern: all installer modules import output from src/output.js for consistent UX"
  - "Catalog validation pattern: validateName() before any network request — fail fast with friendly error listing available names"

requirements-completed: [INST-07, SAFE-01, INST-05]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 2 Plan 1: Core Installer Foundation Modules Summary

**Three shared ESM foundation modules — GitHub URL builder with env override, chalk TTY-aware output helpers, and synchronous catalog validator with inline error listing — plus write-file-atomic installed for the hook installer**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T13:22:58Z
- **Completed:** 2026-02-24T13:24:38Z
- **Tasks:** 3
- **Files modified:** 3 created, 2 modified (package.json, package-lock.json)

## Accomplishments

- Created `src/fetch.js` with `buildRawUrl()` and `buildContentsApiUrl()` — CC_TEMPLATES_REPO env override verified working
- Created `src/output.js` with 6 output methods — chalk 5 auto-detects TTY, colored in terminal, plain in CI
- Created `src/catalog.js` — reads components.json at module load, validates names with inline available-names list
- Installed `write-file-atomic@^7.0.0` needed by the hook installer (Wave 2 plan)
- All three modules load cleanly together in a single ESM import test

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/fetch.js — GitHub URL builder with CC_TEMPLATES_REPO override** - `22146c3` (feat)
2. **Task 2: Create src/output.js — chalk-based output helpers with TTY auto-detection** - `cfcb9e7` (feat)
3. **Task 3: Create src/catalog.js and install write-file-atomic** - `e3e5dc2` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/fetch.js` - GitHub URL builder; buildRawUrl() for raw.githubusercontent.com, buildContentsApiUrl() for Contents API; CC_TEMPLATES_REPO env override
- `src/output.js` - Output helpers object with success/warn/error/hint/verbose/info; chalk 5 TTY auto-detection
- `src/catalog.js` - components.json reader; getAvailable(type) returns array; validateName(type, name) throws with available list
- `package.json` - Added write-file-atomic@^7.0.0 to dependencies
- `package-lock.json` - Updated with write-file-atomic and its transitive deps (imurmurhash, signal-exit)

## Decisions Made

- Used `anthropics-community/cc-templates` as DEFAULT_REPO per plan spec (no git remote configured to override)
- `catalog.js` uses synchronous `readFileSync` at module load time — components.json is always present in npm package (COMP-05), so sync is correct and fast
- `getAvailable()` uses nullish coalescing (`?? []`) — gracefully handles missing catalog keys (e.g. `agents` key not yet in components.json)
- `validateName()` for types with empty arrays throws `"(none yet)"` rather than crashing — matches plan note about INST-02

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. `write-file-atomic@^7` installed and imports successfully as ESM default import. No createRequire fallback needed on Node 25.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- All three foundation modules ready — Wave 2 installer plans (02-02, 02-03, 02-04) can run in parallel
- `src/fetch.js`, `src/output.js`, and `src/catalog.js` are importable and verified working
- `write-file-atomic` installed and available for the hook installer
- `validateName('skill', 'video-download')` resolves; `validateName('skill', 'nonexistent')` throws with "Available skills: video-download, video-fetch-and-summarize, video-summarizer"

---
*Phase: 02-core-installer*
*Completed: 2026-02-24*

## Self-Check: PASSED

All files verified present:
- src/fetch.js, src/output.js, src/catalog.js
- .planning/phases/02-core-installer/02-01-SUMMARY.md
- node_modules/write-file-atomic

All commits verified:
- 22146c3 (Task 1: create src/fetch.js — GitHub URL builder with CC_TEMPLATES_REPO override)
- cfcb9e7 (Task 2: create src/output.js — chalk-based output helpers with TTY auto-detection)
- e3e5dc2 (Task 3: create src/catalog.js and install write-file-atomic)

write-file-atomic@^7.0.0 present in package.json dependencies.

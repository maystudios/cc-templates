---
phase: 02-core-installer
plan: "02"
subsystem: cli
tags: [nodejs, esm, github-raw, catalog-validation, conflict-detection, agent-installer, command-installer]

# Dependency graph
requires:
  - phase: 02-core-installer
    plan: "01"
    provides: src/fetch.js (buildRawUrl), src/output.js (output helpers), src/catalog.js (validateName)
provides:
  - src/installers/agent.js — installAgent() single .md file download to .claude/agents/<name>.md
  - src/installers/command.js — installCommand() single .md file download to .claude/commands/<name>.md
affects: [02-03, 02-04, 03-components, 04-polish]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - Single-file installer pattern: validate → conflict-check → fetch → mkdir → write → report; no retry/timeout in Phase 2
    - SAFE-01 before network: validateName() throws with inline available-names list before any fetch() call
    - SAFE-02 conflict gate: existsSync check before write; --force path warns with full targetPath before overwriting
    - INST-05 base dir resolution: opts.global ? homedir() : process.cwd() — identical in both installers
    - Display path shortening: ~/.claude/... vs .claude/... depending on --global for user-facing messages

key-files:
  created:
    - src/installers/agent.js
    - src/installers/command.js
  modified: []

key-decisions:
  - "No HTTP retry or timeout added — plan explicitly forbids these in Phase 2; kept minimal"
  - "mkdirSync with recursive:true used over write-file-atomic — atomic write not needed for single .md files (no partial-write risk); write-file-atomic is reserved for hooks merger"
  - "dirname(targetPath) used for mkdirSync — correct parent dir creation for both local and --global paths"

patterns-established:
  - "Installer module pattern: all single-file installers import {buildRawUrl, output, validateName} and follow validate→check→fetch→write→report sequence"
  - "Display path convention: always show ~/.claude/... for --global installs, .claude/... for local — consistent across agent and command installers"

requirements-completed: [INST-02, INST-03, SAFE-01, SAFE-02, INST-05, INST-06]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 2 Plan 2: Agent and Command Installers Summary

**Single-file .md installer pattern implemented for agents and commands — validate-first, conflict-safe, --force with warning, --global support, consistent success/hint output format**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-24T13:27:31Z
- **Completed:** 2026-02-24T13:30:00Z
- **Tasks:** 2
- **Files modified:** 2 created

## Accomplishments

- Created `src/installers/agent.js` — installAgent() downloads agent .md from raw.githubusercontent.com to .claude/agents/<name>.md; SAFE-01 + SAFE-02 + INST-06 + INST-05 all implemented
- Created `src/installers/command.js` — installCommand() follows identical pattern targeting .claude/commands/<name>.md
- Both modules verified: import cleanly, export correct function types, SAFE-01 fires with inline "Available agents/commands:" list before any network call

## Task Commits

Each task was committed atomically:

1. **Task 1: Create src/installers/agent.js — single .md file installer for agents** - `a8b4133` (feat)
2. **Task 2: Create src/installers/command.js — single .md file installer for commands** - `4c534bf` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `src/installers/agent.js` - installAgent(name, opts); validates catalog, checks conflicts, fetches from raw.githubusercontent.com, writes to .claude/agents/<name>.md or ~/.claude/agents/<name>.md (--global)
- `src/installers/command.js` - installCommand(name, opts); same pattern, targets .claude/commands/<name>.md or ~/.claude/commands/<name>.md (--global)

## Decisions Made

- Did not add HTTP retry or timeout handling — plan explicitly forbids these for Phase 2; minimal implementation kept
- Used plain `writeFileSync` instead of `write-file-atomic` — single .md file writes have no partial-write risk; write-file-atomic is reserved for hooks JSON merger (plan 02-04)
- Used `dirname(targetPath)` for `mkdirSync` call — correctly creates parent directory for both local and --global target paths

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. Both modules loaded cleanly on Node v25.2.1. ESM imports from '../fetch.js', '../output.js', '../catalog.js' all resolved without issues.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Agent and command single-file installer pattern is established and verified
- src/installers/ directory created; ready for skill.js (02-03) and hook.js (02-04) to follow same pattern
- Wave 2 plans 02-03 and 02-04 can proceed in parallel using the same validate→check→fetch→write→report sequence
- installAgent and installCommand ready to be wired into the CLI router (Plan 05)

---
*Phase: 02-core-installer*
*Completed: 2026-02-24*

## Self-Check: PASSED

All files verified present:
- src/installers/agent.js
- src/installers/command.js
- .planning/phases/02-core-installer/02-02-SUMMARY.md

All commits verified:
- a8b4133 (Task 1: create src/installers/agent.js — single .md file agent installer)
- 4c534bf (Task 2: create src/installers/command.js — single .md file command installer)

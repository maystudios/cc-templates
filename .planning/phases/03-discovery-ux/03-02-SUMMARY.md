---
phase: 03-discovery-ux
plan: "02"
subsystem: list-output
tags: [catalog, output, chalk, tty, discovery]
dependency_graph:
  requires: [src/catalog.ts, src/types.ts, chalk]
  provides: [src/list.ts, printList()]
  affects: [cli.ts (wired in plan 04)]
tech_stack:
  added: []
  patterns: [TTY-aware chalk formatting, grouped catalog listing, empty-section skip]
key_files:
  created: [src/list.ts]
  modified: []
decisions:
  - isTTY explicit check used for structural decisions (blank lines, headers always print); chalk auto-suppresses ANSI independently
  - TYPES array omits mcp — no mcp entries exist in v0.1 catalog
  - Summary format locked: "N components available across M types"
metrics:
  duration: "40s"
  completed: "2026-02-24"
  tasks_completed: 1
  files_created: 1
  files_modified: 0
requirements_satisfied: [DISC-02]
---

# Phase 03 Plan 02: Grouped Catalog Listing Summary

**One-liner:** TTY-aware grouped catalog listing with chalk styling, empty-section skipping, and summary count via `printList()`.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Create src/list.ts grouped catalog listing | 9452432 | src/list.ts (created, 72 lines) |

## What Was Built

`src/list.ts` exports `printList()`, which:

1. Iterates over `TYPES = ['skill', 'agent', 'command', 'hook']` (mcp excluded — no v0.1 entries)
2. Calls `getAvailable(type)` from `src/catalog.ts` for each type
3. Skips empty sections entirely via `if (entries.length === 0) continue`
4. Prints section headers (`## Skills`, `## Agents`, etc.)
5. For each entry: name (cyan in TTY), description (dim indent), author attribution (dim " by <name>")
6. Prints summary line: `"N components available across M types"` (dim in TTY)

## isTTY Gating Implementation

Two independent TTY mechanisms work together:

- **chalk auto-suppresses ANSI** when stdout is not a TTY — chalk handles color stripping automatically
- **Explicit `isTTY` guard** (`const isTTY = Boolean(process.stdout.isTTY)`) is used for *structural* formatting decisions that should always be consistent (e.g., the template literal structure, conditional block routing). The guard does NOT gate blank lines or headers — those print unconditionally in both branches.

This means: piped output is clean plain text (no ANSI escape sequences), and TTY output has full chalk styling. The explicit check ensures the correct code path runs regardless of chalk's own detection.

## TypeScript Issues Encountered

None. The file compiled cleanly on first attempt with zero TypeScript errors.

The only noteworthy type detail: `TYPE_LABELS` is typed as `Record<ComponentType, string>` which requires all 5 `ComponentType` values (`skill | agent | command | hook | mcp`). The `mcp: 'MCP'` entry is present in the record for type correctness, even though `mcp` is omitted from the `TYPES` iteration array.

## Verification Results

| Check | Result |
|-------|--------|
| `npm run build` passes zero TS errors | PASS |
| `typeof printList` is `'function'` | PASS |
| TYPES array = ['skill','agent','command','hook'] | PASS |
| `isTTY` guard present | PASS |
| Empty section skip (`continue`) present | PASS |
| Summary format string present | PASS |

## Deviations from Plan

None - plan executed exactly as written.

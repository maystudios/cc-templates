---
phase: 02-core-installer
plan: "04"
subsystem: installer
tags: [hooks, settings.json, atomic-write, deep-merge, windows-compat]
dependency_graph:
  requires: [02-01]
  provides: [installHook]
  affects: [settings.json, src/installers/hook.js]
tech_stack:
  added: [write-file-atomic]
  patterns: [array-append-merge, atomic-write, CJS-from-ESM-createRequire]
key_files:
  created: [src/installers/hook.js]
  modified: []
decisions:
  - write-file-atomic imported via createRequire ESM/CJS interop pattern (matching js-yaml pattern in build-catalog.js) for reliable Node 20+ compatibility
  - python3 replacement uses \bpython3\b word boundary regex on win32 platform (safer than bare string replace)
  - Array-append merge uses spread syntax: [...existing, ...new] — never assignment — to prevent clobbering user hooks
  - Malformed settings.json aborts with clear "fix manually" message; file untouched (SAFE-06 locked decision)
metrics:
  duration: 1 min
  completed: 2026-02-24
  tasks_completed: 2
  files_created: 1
  files_modified: 0
---

# Phase 2 Plan 04: Hook Installer Summary

**One-liner:** Hook JSON installer with array-append deep-merge into settings.json and atomic write via write-file-atomic.

## What Was Built

`src/installers/hook.js` — the hook install path. This is the highest-risk installer in Phase 2 because it modifies the user's `settings.json`, which controls Claude Code's hook behavior. A failed or partial write would break Claude Code for the user.

**Safety guarantees implemented:**
- **SAFE-01**: `validateName('hook', name)` fires before any network call — unknown names fail fast with inline list
- **SAFE-06 (malformed abort)**: If `settings.json` exists but contains invalid JSON, installation aborts immediately with a clear message; the file is never touched
- **SAFE-06 (array-append)**: New hook matchers are appended to existing event arrays using `[...existing, ...new]` — existing user hooks are never replaced or deleted
- **SAFE-06 (atomic write)**: `writeFileAtomic` writes to a temp file first, then renames atomically — a process crash mid-write cannot corrupt `settings.json`
- **SAFE-07**: On `win32` platform, `python3` is replaced with `python` in all hook command strings before merge (using `\bpython3\b` word-boundary regex)
- **INST-05**: `opts.global=true` uses `homedir()` as base directory for `settings.json` path

## Tasks

### Task 1: Create src/installers/hook.js
- Commit: `80394df`
- All safety guarantees implemented per plan spec
- write-file-atomic imported via try/catch with createRequire fallback (matching js-yaml pattern)
- Verification: `typeof installHook === 'function'`; SAFE-01 fires for unknown hook names

### Task 2: Unit-test hook merge logic
- In-process test (no persisted file) — verified merge logic directly
- Test 1 PASS: creates settings.json from scratch when file does not exist
- Test 2 PASS: existing hooks in different event preserved after adding new event
- Test 3 PASS: same event array has both old and new matcher entries (append, not replace)
- All three tests passed; "All hook merge tests PASSED" confirmed

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Pattern] Used createRequire pattern instead of direct default import for write-file-atomic**
- **Found during:** Task 1
- **Issue:** The plan suggested `import writeFileAtomic from 'write-file-atomic'` but noted a possible `ERR_PACKAGE_IMPORT_NOT_DEFINED` fallback. Since write-file-atomic v7.0.0 is CJS without an `exports` field in package.json, using the same try/catch + createRequire pattern already established in `scripts/build-catalog.js` for js-yaml is more reliable and consistent.
- **Fix:** Wrapped import in try/catch with createRequire fallback (identical to existing project pattern)
- **Files modified:** `src/installers/hook.js`
- **Commit:** `80394df`

## Key Decisions

1. **write-file-atomic CJS interop**: Used createRequire fallback pattern matching the project's existing js-yaml import strategy in `build-catalog.js`. Direct ESM default import worked in testing (Node 20+) but the fallback ensures compatibility.

2. **python3 word-boundary replacement**: `\bpython3\b` prevents accidental replacement inside longer strings (e.g., a path like `/usr/bin/python3.11` would not match `\bpython3\b` if followed by `.`).

3. **Array-append merge is non-negotiable**: The spread pattern `[...merged.hooks[event], ...matchers]` is the single most important correctness property — silently deleting user hooks would be a critical regression.

## Self-Check: PASSED

- `src/installers/hook.js`: FOUND
- `02-04-SUMMARY.md`: FOUND
- commit `80394df`: FOUND

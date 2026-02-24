---
phase: 05-npm-publish
plan: "01"
subsystem: infra
tags: [npm, semantic-release, license, package-metadata, oidc, provenance]

# Dependency graph
requires:
  - phase: 03-discovery-ux
    provides: Working CLI with installer, build system, and TypeScript compilation
provides:
  - Complete npm package.json metadata (repository, bugs, homepage, publishConfig.provenance)
  - MIT LICENSE file for open-source publishing
  - semantic-release + 4 plugins installed as devDependencies
affects:
  - 05-02 (CI/CD workflow — references semantic-release packages)
  - 05-03 (npm publish — relies on complete metadata and LICENSE)

# Tech tracking
tech-stack:
  added:
    - semantic-release@24.2.9
    - "@semantic-release/commit-analyzer@13.0.1"
    - "@semantic-release/release-notes-generator@14.1.0"
    - "@semantic-release/npm@13.1.4"
    - "@semantic-release/github@11.0.6"
  patterns:
    - publishConfig.provenance=true enables OIDC trusted publishing via GitHub Actions
    - files array explicitly lists LICENSE to ensure it is included in npm package

key-files:
  created:
    - LICENSE
  modified:
    - package.json
    - package-lock.json

key-decisions:
  - "MIT license with 2026 copyright year and 'cc-templates contributors' as holder"
  - "publishConfig.provenance=true for OIDC trusted publishing (no npm token needed in CI)"
  - "@semantic-release/npm pinned to 13.1.4 — minimum version supporting OIDC trusted publishing"
  - "keywords exactly: claude-code, anthropic, agents, hooks, skills, cli (per PUB-01)"
  - "@semantic-release/git omitted for simplicity — version in package.json may lag published"

patterns-established:
  - "Pattern: npm provenance via OIDC — no long-lived npm tokens stored in GitHub secrets"

requirements-completed:
  - PUB-01
  - PUB-04

# Metrics
duration: 6min
completed: 2026-02-24
---

# Phase 5 Plan 01: NPM Metadata and License Setup Summary

**package.json enriched with full npm metadata (repository, bugs, homepage, provenance), MIT LICENSE added, and semantic-release ecosystem (5 packages) installed for CI/CD automated releases**

## Performance

- **Duration:** 6 min
- **Started:** 2026-02-24T20:05:17Z
- **Completed:** 2026-02-24T20:11:05Z
- **Tasks:** 2
- **Files modified:** 3 (package.json, package-lock.json, LICENSE)

## Accomplishments
- package.json now has complete npm metadata: repository, bugs, homepage, publishConfig.provenance=true
- Keywords updated to exactly: claude-code, anthropic, agents, hooks, skills, cli (per PUB-01 decision)
- LICENSE array includes "LICENSE" so it ships in the published npm tarball
- MIT LICENSE file created with 2026 copyright
- semantic-release and all four required plugins installed as devDependencies
- npm pack --dry-run confirms LICENSE ships in the published tarball (41 files total, 11.9kB)

## Task Commits

Each task was committed atomically:

1. **Task 1: Update package.json metadata** - `d53e23f` (chore)
2. **Task 1b: Update package-lock.json** - `b1114e2` (chore — lock file regenerated to include semantic-release)
3. **Task 2: Create MIT LICENSE file** - `c730da1` (feat)

**Plan metadata:** (final docs commit — see below)

## Files Created/Modified
- `package.json` - Added repository, bugs, homepage, publishConfig, updated keywords and files array
- `package-lock.json` - Regenerated with semantic-release dependency tree (8586 insertions)
- `LICENSE` - Standard MIT license text, copyright 2026 cc-templates contributors

## Decisions Made
- MIT license with copyright "2026 cc-templates contributors" — standard open-source attribution pattern
- publishConfig.provenance=true — enables GitHub Actions OIDC trusted publishing without long-lived npm tokens
- @semantic-release/npm pinned to exactly 13.1.4 — minimum version for OIDC trusted publishing support
- @semantic-release/git omitted — version in package.json may lag published version, acceptable for this project
- Keywords exactly match PUB-01 locked decision: claude-code, anthropic, agents, hooks, skills, cli

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Lock file not updated after first npm install invocation**
- **Found during:** Task 1 (install semantic-release devDependencies)
- **Issue:** Background npm install completed but package-lock.json was not regenerated — grep confirmed 0 occurrences of "semantic-release" in lock file
- **Fix:** Ran `npm install` again to sync package-lock.json with updated package.json devDependencies
- **Files modified:** package-lock.json
- **Verification:** `grep -c "semantic-release" package-lock.json` returned 249
- **Committed in:** b1114e2 (separate lock file commit)

---

**Total deviations:** 1 auto-fixed (blocking — lock file sync)
**Impact on plan:** Necessary for reproducible installs in CI. No scope creep.

## Issues Encountered
- npm install ran as background task and the lock file was not synced on first run — required a second `npm install` invocation to regenerate package-lock.json correctly.

## User Setup Required
None - no external service configuration required for this plan. (GitHub repository creation and npm account setup will be addressed in later plans.)

## Next Phase Readiness
- package.json has full metadata ready for npm publish
- LICENSE file exists and will ship in the tarball
- semantic-release and all four plugins installed and ready for workflow configuration in 05-02
- Blockers: anthropics-community/cc-templates GitHub repository not yet created (carries over from Phase 3)

---
*Phase: 05-npm-publish*
*Completed: 2026-02-24*

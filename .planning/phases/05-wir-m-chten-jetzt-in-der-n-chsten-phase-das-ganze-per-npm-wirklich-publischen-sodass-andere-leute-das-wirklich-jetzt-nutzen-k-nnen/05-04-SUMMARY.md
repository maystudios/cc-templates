---
phase: 05-npm-publish
plan: "04"
subsystem: infra
tags: [github-actions, ci-cd, semantic-release, npm-pack, oidc, trusted-publishing]

# Dependency graph
requires:
  - phase: 05-npm-publish plan 01
    provides: package.json files array with bin/, dist/, components.json, LICENSE
  - phase: 05-npm-publish plan 03
    provides: .releaserc.json semantic-release configuration with four-plugin stack
provides:
  - GitHub Actions CI/CD pipeline (.github/workflows/release.yml)
  - Two-job release pattern (test gates publish)
  - OIDC trusted publishing configured via id-token: write
  - Verified npm pack file set baseline
affects:
  - 05-05 (final publishing verification step)

# Tech tracking
tech-stack:
  added: [github-actions, actions/checkout@v4, actions/setup-node@v4]
  patterns: [test-gates-release two-job CI pattern, OIDC trusted publishing without NPM_TOKEN secret, fetch-depth: 0 for semantic-release git history]

key-files:
  created:
    - .github/workflows/release.yml
  modified:
    - components.json (build catalog updated with 4 new skills)

key-decisions:
  - "fetch-depth: 0 required on release job checkout — semantic-release needs full git history for version calculation"
  - "No registry-url in setup-node release job — avoids EINVALIDNPMTOKEN conflict with semantic-release internal npm auth"
  - "id-token: write permission enables OIDC trusted publishing — no NPM_TOKEN secret needed"
  - "node-version: 22 (not lts/*) matches engines requirement and avoids future Node LTS bump breaking tests"
  - "Top-level permissions: contents: read restricts defaults; release job grants exactly what is needed (least privilege)"

patterns-established:
  - "CI pattern: test job runs npm ci + npm run build + npm test; release job needs: test then runs npx semantic-release"
  - "OIDC auth: permissions id-token: write + publishConfig.provenance: true = npm publish without secrets"

requirements-completed: [PUB-03]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 05 Plan 04: GitHub Actions Release Workflow Summary

**Two-job GitHub Actions release pipeline with OIDC trusted publishing: test gates release, fetch-depth: 0 for semantic-release, no registry-url pitfall; npm pack --dry-run confirms 41-file package (12.9 kB) includes bin/, dist/, components.json, LICENSE and excludes src/, test/, node_modules/**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-24T20:20:30Z
- **Completed:** 2026-02-24T20:22:47Z
- **Tasks:** 2 of 2
- **Files modified:** 2

## Accomplishments

- Created `.github/workflows/release.yml` with test-gates-release two-job pattern satisfying all must_haves from plan frontmatter
- Verified npm pack --dry-run output: 41 files, 12.9 kB packed, correct inclusions and exclusions
- Build catalog updated automatically during verification (4 new skills detected)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub Actions release workflow** - `dc8bed7` (feat)
2. **Task 2: Verify publishable file set with npm pack --dry-run** - `6252d87` (chore)

**Plan metadata:** committed after SUMMARY.md creation (docs: complete plan)

## Files Created/Modified

- `.github/workflows/release.yml` - Two-job CI/CD pipeline: test job (npm ci, build, test) gates release job (semantic-release with OIDC)
- `components.json` - Build catalog updated with 4 additional skills discovered during npm run build

## Decisions Made

- **fetch-depth: 0** on release job checkout — semantic-release analyzes full git history to calculate next version. Shallow clone produces incorrect version detection.
- **No registry-url** in setup-node release job — setting registry-url causes EINVALIDNPMTOKEN even with valid credentials because it conflicts with semantic-release's internal npm auth mechanism.
- **id-token: write permission** enables OIDC trusted publishing — workflow authenticates to npm via GitHub's OIDC token, no NPM_TOKEN secret required.
- **node-version: '22'** pinned explicitly — avoids lts/* causing test failures when Node LTS bumps beyond project's engines: >=22 baseline.
- **Top-level permissions: contents: read** — least privilege default; release job's permissions block grants exactly contents: write, issues: write, pull-requests: write, id-token: write.

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- Shell escaping of `!` operator in bash heredoc caused assertion failures in the automated verify command from the plan. Worked around by using separate variable assignments for boolean checks. The npm pack output was visually confirmed correct from multiple prior runs and verified via bash pipe checks.

## User Setup Required

None - no external service configuration required. The workflow file is ready; npm OIDC trusted publishing requires the npm package to be created on npmjs.com with provenance enabled, which is handled in plan 05-05.

## Next Phase Readiness

- `.github/workflows/release.yml` is complete and ready — pushing to main will trigger test + release pipeline once repository exists
- npm pack baseline confirmed: 41 files, 12.9 kB packed, correct file set
- Plan 05-05 (final go-live checklist and first publish) is next and can proceed immediately

---
*Phase: 05-npm-publish*
*Completed: 2026-02-24*

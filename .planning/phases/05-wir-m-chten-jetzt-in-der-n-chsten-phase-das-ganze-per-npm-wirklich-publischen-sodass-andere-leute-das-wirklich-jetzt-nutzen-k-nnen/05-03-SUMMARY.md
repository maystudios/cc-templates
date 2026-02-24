---
phase: 05-npm-publish
plan: "03"
subsystem: infra
tags: [github, issue-templates, semantic-release, yaml, ci-cd]

# Dependency graph
requires:
  - phase: 05-npm-publish
    provides: Plan 04 (CI workflow) reads .releaserc.json to configure semantic-release plugins
provides:
  - GitHub YAML issue templates enforcing structured bug reports and template requests
  - .releaserc.json configuring semantic-release with four standard plugins on main branch
affects: [05-npm-publish-04]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "YAML issue forms (not markdown) — GitHub standard for enforcing required fields"
    - "semantic-release with four-plugin stack: analyze, notes, npm, github"
    - "@semantic-release/git intentionally omitted to avoid chore commits on main"

key-files:
  created:
    - .github/ISSUE_TEMPLATE/bug-report.yml
    - .github/ISSUE_TEMPLATE/template-request.yml
    - .github/ISSUE_TEMPLATE/config.yml
    - .releaserc.json
  modified: []

key-decisions:
  - "@semantic-release/git omitted — semantic-release computes correct next version from git tags regardless of package.json version on main"
  - "@semantic-release/changelog omitted — changelog embedded in GitHub Releases avoids the chore:release commits @semantic-release/git requires"
  - "blank_issues_enabled: false in config.yml forces all users through structured YAML forms"
  - "branches: [main] in .releaserc.json — only pushes to main trigger npm releases"

patterns-established:
  - "YAML issue forms pattern: all GitHub issue templates use YAML forms with required validations"
  - ".releaserc.json pattern: semantic-release config lives in root with explicit plugin order"

requirements-completed: [PUB-03, PUB-05]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 5 Plan 03: GitHub Issue Templates and semantic-release Config Summary

**YAML issue forms (bug-report, template-request, config) and .releaserc.json with four-plugin semantic-release stack targeting main branch**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-24T20:17:10Z
- **Completed:** 2026-02-24T20:20:00Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- Three GitHub YAML issue forms created: bug-report with 5 required fields, template-request with component type dropdown, config.yml disabling blank issues
- .releaserc.json created with branches=["main"] and four plugins in correct order (commit-analyzer, release-notes-generator, npm, github)
- @semantic-release/git and @semantic-release/changelog intentionally omitted to keep the release pipeline simple (no chore commits, changelog in GitHub Releases)

## Task Commits

Each task was committed atomically:

1. **Task 1: Create GitHub YAML issue templates** - `87bb17c` (feat)
2. **Task 2: Create .releaserc.json for semantic-release** - `a594657` (feat)

**Plan metadata:** (docs commit — see below)

## Files Created/Modified

- `.github/ISSUE_TEMPLATE/bug-report.yml` - Structured bug report form with required description, reproduction, version, OS, and Node.js version fields
- `.github/ISSUE_TEMPLATE/template-request.yml` - Template contribution request with component type dropdown (Skill/Agent/Hook/Command), name, use case, and contribution interest fields
- `.github/ISSUE_TEMPLATE/config.yml` - Disables blank issues (blank_issues_enabled: false) and adds Discussions link
- `.releaserc.json` - semantic-release config: branches=["main"], four plugins in order, no @semantic-release/git or @semantic-release/changelog

## Decisions Made

- `@semantic-release/git` omitted: semantic-release computes the correct next version from git tags regardless of what version is in package.json on main — no need for chore commits
- `@semantic-release/changelog` omitted: changelog lives in GitHub Releases, not as a committed file — simpler setup
- `blank_issues_enabled: false`: forces all reporters through structured forms, prevents incomplete/blank bug reports
- `branches: ["main"]`: only pushes to main trigger npm releases — feature branches never publish

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- `.releaserc.json` is ready for Plan 04 (CI workflow) which will reference it via the semantic-release GitHub Action
- Issue templates are live-ready once the GitHub repository is created at `anthropics-community/cc-templates`
- Blocker noted in STATE.md: `anthropics-community/cc-templates` GitHub repo not yet created — templates not visible to users until repo exists

## Self-Check: PASSED

All created files verified present on disk:
- FOUND: .github/ISSUE_TEMPLATE/bug-report.yml
- FOUND: .github/ISSUE_TEMPLATE/template-request.yml
- FOUND: .github/ISSUE_TEMPLATE/config.yml
- FOUND: .releaserc.json

All task commits verified in git log:
- FOUND: 87bb17c (feat(05-03): create GitHub YAML issue templates)
- FOUND: a594657 (feat(05-03): create .releaserc.json for semantic-release)

---
*Phase: 05-npm-publish*
*Completed: 2026-02-24*

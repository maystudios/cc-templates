---
phase: 05-npm-publish
plan: "05"
subsystem: infra
tags: [npm, publish, oidc, github, semantic-release, ci]

# Dependency graph
requires:
  - phase: 05-npm-publish
    provides: "GitHub Actions release.yml, .releaserc.json, package.json metadata, README, LICENSE, CONTRIBUTING, issue templates — all built in plans 01-04"
provides:
  - "cc-templates@0.1.0 published to npm (manual first publish)"
  - "OIDC trusted publishing configured on npmjs.com pointing at release.yml"
  - "GitHub repository anthropics-community/cc-templates live and public"
  - "CI green on main branch"
affects: [all future phases — package is now publicly installable]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Manual first publish with granular npm access token; OIDC takes over all subsequent releases"
    - "OIDC trusted publishing: npmjs.com trusted publisher → GitHub org/repo/workflow filename triple"

key-files:
  created: []
  modified: []

key-decisions:
  - "First publish must be manual (granular access token) because OIDC cannot publish a package that does not yet exist on npm"
  - "OIDC configured after first publish using npmjs.com trusted publisher settings pointing to release.yml workflow"
  - "GitHub repo must exist and code pushed before OIDC can be configured"

patterns-established:
  - "Launch sequence: manual publish → OIDC configure → all future releases automated"

requirements-completed: [PUB-07]

# Metrics
duration: 3min
completed: 2026-02-24
---

# Phase 5 Plan 05: First npm Publish and OIDC Configuration Summary

**Pre-publish build verified green (build + 5/5 tests + npm pack --dry-run = 41 files, 12.9 kB); plan stopped at checkpoint awaiting manual GitHub repo creation, first npm publish, and OIDC trusted publishing setup.**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-24T20:25:14Z
- **Completed:** 2026-02-24 (partial — checkpoint reached)
- **Tasks:** 1/3 complete (stopped at Task 2: checkpoint:human-action)
- **Files modified:** 0 (verification-only task)

## Accomplishments

- Confirmed `npm run build` exits 0 — TypeScript compiles, catalog builds (7 components across 4 types)
- Confirmed `npm test` exits 0 — all 5 smoke tests pass (cli.js, dist/, components.json, --help, --version)
- Confirmed `npm pack --dry-run` shows exactly the right 41-file set (bin/, dist/, components.json, README.md, LICENSE, package.json — no src/, no node_modules/)
- Confirmed `package.json` version is exactly `0.1.0` — ready for first publish

## Task Commits

1. **Task 1: Final pre-publish build verification** — verification only, no file changes (build/test/pack all green)
2. **Task 2: Manual first publish + GitHub setup + OIDC** — BLOCKED at checkpoint:human-action (user must act)
3. **Task 3: Verify the public package is installable** — not started

## Files Created/Modified

None — Task 1 was a verification-only task. All artifacts were created in plans 01-04.

## Decisions Made

- First npm publish must use a granular access token because OIDC trusted publishing requires the package to already exist on npm
- OIDC configuration happens AFTER the first publish, pointing npmjs.com at the `release.yml` workflow filename

## Deviations from Plan

None - plan executed exactly as written. Task 1 was verification-only and passed all checks on first attempt.

## User Setup Required

**External services require manual configuration before this plan can complete.**

### Step 1: Create GitHub Repository

- Go to: https://github.com/organizations/anthropics-community/repositories/new (or https://github.com/new)
- Repository name: `cc-templates`
- Visibility: Public
- Do NOT initialize with README
- Click "Create repository"

### Step 2: Push Code to GitHub

```bash
git remote add origin https://github.com/anthropics-community/cc-templates.git
git branch -M main
git add -A
git commit -m "feat: initial npm publish setup — package metadata, README, CI/CD pipeline"
git push -u origin main
```

### Step 3: Create a Granular npm Access Token

- Log into npmjs.com → avatar → "Access Tokens" → "Generate New Token" → "Granular Access Token"
- Name: `cc-templates-first-publish`
- Expiration: 7 days (only needed once)
- Packages: "Only select packages and scopes" → `cc-templates` → Read and Write
- Copy the token (shown only once)

### Step 4: Publish 0.1.0 Manually

```bash
NPM_TOKEN=<your-token-here> npm publish --access public
```

Verify: `npm view cc-templates version` should output `0.1.0`

### Step 5: Configure OIDC Trusted Publishing

- Go to: https://www.npmjs.com/package/cc-templates/settings
- "Trusted Publishers" → "Add a Publisher" → "GitHub Actions"
- GitHub org/user: `anthropics-community`
- Repository: `cc-templates`
- Workflow filename: `release.yml`
- Environment: leave blank
- Click "Set up connection"

### Step 6: Verify CI is Passing

- Go to: https://github.com/anthropics-community/cc-templates/actions
- Confirm "Test" job shows green checkmark

### Step 7: (Optional) Test Automated Release

```bash
git commit --allow-empty -m "chore: verify CI release pipeline"
git push
```

Watch Actions — Release job should run via OIDC (no NPM_TOKEN secret needed).

Type "published" to resume when 0.1.0 is live on npm and OIDC is configured.

## Next Phase Readiness

- Pre-publish build is fully verified and green
- Waiting on human action: GitHub repo creation, code push, manual first publish, OIDC configuration
- Once user types "published", continuation agent will verify `npm view cc-templates version` and `npx cc-templates@latest --version`

---
*Phase: 05-npm-publish*
*Completed: 2026-02-24 (partial — checkpoint:human-action)*

## Self-Check: PARTIAL

This SUMMARY reflects the checkpoint state. Task 1 completed successfully (verification-only, no commits). Tasks 2 and 3 are pending user action.

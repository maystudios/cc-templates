# Phase 5: NPM Publish - Research

**Researched:** 2026-02-24
**Domain:** npm publishing, GitHub Actions CI/CD, open-source community scaffolding
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Package name: `cc-templates` (keep as-is)
- npm description: "Install Claude Code components with one command"
- Keywords: `claude-code`, `anthropic`, `agents`, `hooks`, `skills`
- Add full package.json metadata: `repository`, `bugs`, and `homepage` fields pointing to GitHub repo
- Primary README audience: developers already using Claude Code (no "what is Claude Code" onboarding)
- Required README sections: Quick start (install command + example), full component catalog, what each component type does (agents vs hooks vs skills vs commands), how to contribute a template
- Show both command syntax and terminal output examples in README
- Contributing guide goes in a separate `CONTRIBUTING.md` file, linked from README
- Initial publish version: `0.1.0`
- CI trigger: GitHub Actions runs on every push to main
- Version bumping: conventional commits (`feat:`, `fix:`, etc.) drive automatic semver increments
- Safety: tests must pass before publish step runs (no publish on red)
- Bug reporting and feature requests via GitHub Issues
- GitHub issue templates: bug report template + template request template
- License: MIT
- `CONTRIBUTING.md`: full guide covering fork setup, how to add a new template to the catalog, and PR process

### Claude's Discretion
- Exact GitHub Actions workflow structure and which action packages to use
- Conventional commits tooling (e.g., semantic-release vs release-please vs custom)
- README visual formatting, badge choices, header style
- CONTRIBUTING.md dev environment setup section details

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| PUB-01 | Package identity polish — package.json metadata complete | npm package.json best practices; `repository`, `bugs`, `homepage` fields documented |
| PUB-02 | Public-facing README with quick start, component catalog, component type explanations, contribution guide link | README structure patterns for developer tools; shields.io badges |
| PUB-03 | Automated CI/CD release pipeline — tests gate publish, conventional commits drive semver | semantic-release with GitHub Actions; `needs:` job dependency pattern |
| PUB-04 | MIT LICENSE file | Standard SPDX MIT license text |
| PUB-05 | GitHub issue templates — bug report + template request | GitHub YAML issue form syntax; `.github/ISSUE_TEMPLATE/` directory structure |
| PUB-06 | CONTRIBUTING.md — fork setup, adding templates, PR process | Open-source contributing guide patterns |
| PUB-07 | Initial `npm publish` succeeds and package is installable from npm | OIDC trusted publishing; first-publish-manual limitation; `npm pack` verification |
</phase_requirements>

---

## Summary

Phase 5 transforms `cc-templates` from a working local package into a publicly discoverable, trustworthy npm package with a professional open-source presence. The work splits into four distinct areas: (1) package.json metadata polish, (2) a developer-facing README and community files, (3) a GitHub Actions pipeline that auto-publishes on every main push using semantic-release, and (4) the first actual `npm publish` to make `0.1.0` available.

The most important technical finding is that **npm classic tokens were deprecated and invalidated as of December 9, 2025**. OIDC trusted publishing is now the required approach for GitHub Actions. However, a hard limitation exists: the very first publish of a new package cannot use OIDC — it requires a manual `npm publish` with a granular access token. This means the release pipeline has two distinct stages: a one-time manual first publish, then automated OIDC-based publishes for all subsequent releases.

**Primary recommendation:** Use `semantic-release` with OIDC trusted publishing. Publish `0.1.0` manually first to create the package on npm, then configure the trusted publisher relationship, then enable the fully-automated CI pipeline.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `semantic-release` | ^24.x | Automated versioning + changelog + GitHub Release creation | Industry standard for fully-automated npm publishing from CI; default plugins handle everything |
| `@semantic-release/commit-analyzer` | ^13.x | Parses conventional commits to determine next semver | Default plugin; understands `feat:` → minor, `fix:` → patch, `BREAKING CHANGE` → major |
| `@semantic-release/release-notes-generator` | ^14.x | Generates CHANGELOG content from commits | Default plugin; produces well-formatted release notes |
| `@semantic-release/npm` | ^13.1.4 | Publishes to npm, updates package.json version | Default plugin; supports OIDC trusted publishing since v13+ |
| `@semantic-release/github` | ^11.x | Creates GitHub Releases, links PRs/issues | Default plugin; uses GITHUB_TOKEN automatically |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@semantic-release/git` | ^10.x | Commits updated `package.json`/`CHANGELOG.md` back to repo | Add if you want version bumps committed back; optional for this project |
| `commitlint` + `husky` | ^19.x / ^9.x | Enforces conventional commit format locally | Optional — semantic-release works without it, but helps contributors write correct commit messages |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| semantic-release | release-please | release-please uses a PR-based flow (creates a "release PR" to merge); better for teams wanting human review before publish; more overhead for a solo/small project wanting full automation |
| semantic-release | manual `npm version` + `npm publish` | No automation, no changelog generation; fine for infrequent releases but doesn't meet the "CI auto-publishes on every main push" requirement |

**Installation (devDependencies):**
```bash
npm install --save-dev semantic-release @semantic-release/commit-analyzer @semantic-release/release-notes-generator @semantic-release/npm @semantic-release/github
```

---

## Architecture Patterns

### Recommended File Structure

```
.github/
├── workflows/
│   └── release.yml           # CI: test + publish on main push
├── ISSUE_TEMPLATE/
│   ├── bug-report.yml        # YAML issue form for bug reports
│   ├── template-request.yml  # YAML issue form for new template requests
│   └── config.yml            # Template chooser config (disable blank issues)
LICENSE                       # MIT license text
CONTRIBUTING.md               # Fork setup, adding templates, PR process
README.md                     # Public-facing developer docs (replace current stub)
.releaserc.json               # semantic-release configuration
```

### Pattern 1: Two-Job Release Workflow (test gates publish)

**What:** Split CI into a `test` job and a `release` job. The `release` job declares `needs: test`, so it never runs if tests fail.

**When to use:** Always — this is the "no publish on red" requirement.

```yaml
# Source: https://semantic-release.gitbook.io/semantic-release/recipes/ci-configurations/github-actions
name: Release
on:
  push:
    branches:
      - main

permissions:
  contents: read

jobs:
  test:
    name: Test
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
      - run: npm ci
      - run: npm run build
      - run: npm test

  release:
    name: Release
    runs-on: ubuntu-latest
    needs: test           # <-- blocks publish if test job fails
    permissions:
      contents: write
      issues: write
      pull-requests: write
      id-token: write     # <-- required for OIDC trusted publishing
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0  # full history required for semantic-release
      - uses: actions/setup-node@v4
        with:
          node-version: '22'
          # CRITICAL: do NOT set registry-url here — conflicts with semantic-release auth
      - run: npm ci
      - run: npm run build
      - name: Release
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # NPM_TOKEN not needed after OIDC trusted publishing is configured
        run: npx semantic-release
```

### Pattern 2: semantic-release Configuration (.releaserc.json)

**What:** Declare which plugins to run and which branch triggers releases.

```json
{
  "branches": ["main"],
  "plugins": [
    "@semantic-release/commit-analyzer",
    "@semantic-release/release-notes-generator",
    "@semantic-release/npm",
    "@semantic-release/github"
  ]
}
```

### Pattern 3: OIDC Trusted Publishing Setup (one-time)

**What:** Configure a trust relationship between the GitHub repo and npm so no long-lived secret is needed.

**Steps (performed once after `0.1.0` exists on npm):**
1. Log into npmjs.com → package settings → "Trusted Publisher"
2. Select "GitHub Actions" as provider
3. Fill in: organization/user, repository name, workflow filename (`release.yml`)
4. Click "Set up connection"

After this, the workflow's `id-token: write` permission is all that's needed. No `NPM_TOKEN` secret required.

### Pattern 4: YAML Issue Forms

**What:** Structured issue templates using GitHub's YAML form schema (current standard — markdown templates are deprecated in practice).

```yaml
# .github/ISSUE_TEMPLATE/bug-report.yml
name: Bug Report
description: Something is broken
labels: ["bug", "triage"]
body:
  - type: textarea
    id: description
    attributes:
      label: What happened?
      description: Clear description of the bug
    validations:
      required: true
  - type: textarea
    id: reproduction
    attributes:
      label: Steps to reproduce
      placeholder: "1. Run `npx cc-templates --skill video-download`\n2. See error..."
    validations:
      required: true
  - type: input
    id: version
    attributes:
      label: cc-templates version
      placeholder: "e.g. 0.1.0"
  - type: dropdown
    id: os
    attributes:
      label: Operating System
      options:
        - macOS
        - Windows
        - Linux
```

### Anti-Patterns to Avoid

- **Setting `registry-url` in `setup-node` when using semantic-release:** Creates an `.npmrc` that conflicts with semantic-release's own npm auth mechanism, causing `EINVALIDNPMTOKEN` errors.
- **Publishing first release via OIDC:** The npm registry requires a package to exist before a trusted publisher can be configured. First publish must be manual.
- **Using npm classic tokens (long-lived):** Deprecated and invalidated as of December 9, 2025. Any workflow using `NPM_TOKEN` with a classic token will fail.
- **`fetch-depth: 0` omission:** semantic-release reads the full git history to calculate the next version. Without `fetch-depth: 0`, it only gets a shallow clone and cannot determine the correct version bump.
- **Committing `node_modules` or `dist/` to npm package incorrectly:** The existing `files` field in `package.json` already handles this correctly — verify `npm pack` output before first publish.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Semver version calculation from git history | Custom script parsing git log | `semantic-release` + `@semantic-release/commit-analyzer` | Edge cases: merge commits, squash merges, initial release detection, pre-release branches |
| Changelog generation | Concatenating commit messages | `@semantic-release/release-notes-generator` | Handles categorization (Features/Bug Fixes), links PRs and commits, markdown formatting |
| GitHub Release creation | `gh release create` in workflow | `@semantic-release/github` | Links issues/PRs in release notes, handles pre-release tagging |
| npm publish from CI | `npm publish` directly in workflow | `@semantic-release/npm` | Handles OIDC token exchange, provenance attestation, `publishConfig` respect |
| Issue template validation | None (free-form markdown) | YAML issue forms | Structured data, required fields, prevents blank/incomplete issues |

**Key insight:** The conventional commits → semver → changelog → GitHub Release → npm publish pipeline has dozens of edge cases (BREAKING CHANGE footers, multiple commits in one push, maintenance branches). semantic-release handles all of them correctly after 8+ years of production use.

---

## Common Pitfalls

### Pitfall 1: First Publish Cannot Use OIDC

**What goes wrong:** The OIDC trusted publisher configuration on npmjs.com requires the package to already exist. Running semantic-release (which uses OIDC) before `cc-templates` exists on npm will fail with an authentication error.

**Why it happens:** npm's design — trusted publishers can only be configured for existing packages.

**How to avoid:** Publish `0.1.0` manually with a granular access token first:
```bash
npm publish --access public
```
Then configure OIDC trusted publishing on npmjs.com, then enable the automated workflow.

**Warning signs:** `E403 Forbidden` or `ENEEDAUTH` on first CI run.

### Pitfall 2: Shallow Git Clone Breaks Version Detection

**What goes wrong:** semantic-release cannot find previous tags and either errors out or creates an incorrect version bump.

**Why it happens:** GitHub Actions defaults to `fetch-depth: 1` (shallow clone). semantic-release needs the full tag history.

**How to avoid:** Always set `fetch-depth: 0` in the checkout step:
```yaml
- uses: actions/checkout@v4
  with:
    fetch-depth: 0
```

### Pitfall 3: `registry-url` Conflict with semantic-release

**What goes wrong:** `EINVALIDNPMTOKEN` error even with a valid token.

**Why it happens:** `actions/setup-node` with `registry-url` creates an `.npmrc` that semantic-release's own npm plugin then conflicts with.

**How to avoid:** Do not set `registry-url` in the `setup-node` step when using semantic-release.

### Pitfall 4: Commits Without Conventional Format Don't Trigger Releases

**What goes wrong:** Pushing to main with commits like "fix typo" or "update docs" — semantic-release sees no releasable commits and makes no release.

**Why it happens:** semantic-release only recognizes `feat:`, `fix:`, `perf:`, and `BREAKING CHANGE`. Commits without these prefixes are treated as non-releasable.

**How to avoid:** Use commitlint locally or document in CONTRIBUTING.md that all PRs must use conventional commit format. The first release (`0.1.0`) is published manually anyway, so this only affects subsequent releases.

**Warning signs:** CI runs but no new version is published, no GitHub Release created.

### Pitfall 5: keywords Array in package.json Missing Locked Values

**What goes wrong:** npm search for "claude-code" or "anthropic agents" doesn't surface the package.

**Why it happens:** Current `package.json` keywords are `["claude", "claude-code", "components", "cli"]` — missing the locked `anthropic`, `agents`, `hooks`, `skills` keywords from CONTEXT.md decisions.

**How to avoid:** Update the `keywords` array to: `["claude-code", "anthropic", "agents", "hooks", "skills", "cli"]`

---

## Code Examples

Verified patterns from official sources:

### package.json metadata fields (complete)

```json
{
  "name": "cc-templates",
  "version": "0.1.0",
  "description": "Install Claude Code components with one command",
  "keywords": ["claude-code", "anthropic", "agents", "hooks", "skills", "cli"],
  "repository": {
    "type": "git",
    "url": "https://github.com/anthropics-community/cc-templates.git"
  },
  "bugs": {
    "url": "https://github.com/anthropics-community/cc-templates/issues"
  },
  "homepage": "https://github.com/anthropics-community/cc-templates#readme",
  "publishConfig": {
    "provenance": true
  }
}
```

### npm pack dry-run (pre-publish verification)

```bash
# Verify exactly what files will be published before first publish
npm pack --dry-run
```

Expected output includes: `bin/`, `dist/`, `components.json`, `README.md`, `LICENSE`, `package.json` — and nothing else (no `src/`, `test/`, `node_modules/`).

### shields.io badges for README

```markdown
[![npm version](https://img.shields.io/npm/v/cc-templates.svg)](https://www.npmjs.com/package/cc-templates)
[![License: MIT](https://img.shields.io/npm/l/cc-templates.svg)](https://github.com/anthropics-community/cc-templates/blob/main/LICENSE)
[![Node.js >=22](https://img.shields.io/node/v/cc-templates.svg)](https://nodejs.org)
```

### ISSUE_TEMPLATE config.yml (disables blank issues)

```yaml
# .github/ISSUE_TEMPLATE/config.yml
blank_issues_enabled: false
contact_links:
  - name: Discussions
    url: https://github.com/anthropics-community/cc-templates/discussions
    about: Questions and general discussion
```

### Conventional commit message examples (for CONTRIBUTING.md)

```
feat: add --dry-run flag to preview installs
fix: resolve path separator issue on Windows
docs: update README with agent examples
chore: update dependencies
feat!: rename --skill to --component (BREAKING CHANGE)
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `NPM_TOKEN` secret in GitHub Actions | OIDC trusted publishing (no secret) | GA: July 31, 2025; Classic tokens invalidated: December 9, 2025 | Any workflow using classic tokens now fails; OIDC is mandatory |
| Markdown issue templates (`.md`) | YAML issue forms (`.yml`) | GitHub introduced forms ~2021; now standard | Structured data, required fields enforcement |
| `npm version` + `npm publish` manually | semantic-release automated pipeline | Established pattern, maturing since 2015 | Full automation; no manual version bumping |
| `--provenance` flag in `npm publish` | Automatic provenance with OIDC trusted publishing | 2025 | No explicit flag needed when using trusted publishing |

**Deprecated/outdated:**
- npm Classic Tokens: permanently invalidated December 9, 2025. Replace with OIDC trusted publishing or granular access tokens.
- Markdown issue templates (`.github/ISSUE_TEMPLATE/*.md`): still work but YAML forms provide better structure and required-field enforcement.

---

## Open Questions

1. **GitHub repo not yet created**
   - What we know: STATE.md notes `anthropics-community/cc-templates` is not yet created (404 from GitHub)
   - What's unclear: The GitHub repo must exist before OIDC trusted publishing can be configured, and before `repository`, `bugs`, `homepage` URLs in package.json are live
   - Recommendation: Creating the GitHub repo is a Wave 0 prerequisite task. The planner should include it as the first task in the plan.

2. **`@semantic-release/git` plugin — include or not?**
   - What we know: This plugin commits the version-bumped `package.json` back to the repo after each release, so the repo always reflects the published version
   - What's unclear: This adds complexity (the plugin needs write access and creates "chore: release" commits) and may be unnecessary if the team is fine with `package.json` version being stale between releases (semantic-release always calculates the correct next version from git tags regardless)
   - Recommendation: **Omit `@semantic-release/git`** for simplicity. The version in `package.json` on `main` may lag behind the published version, but this is acceptable for a CLI tool where users interact via `npx`, not by reading source.

3. **Node.js version for CI runner**
   - What we know: `package.json` declares `"engines": { "node": ">=22" }`. Actions must use Node 22+.
   - What's unclear: Whether `node-version: "lts/*"` would satisfy this (LTS is currently 22.x, but will be 24.x when Node 22 reaches end of maintenance in 2027)
   - Recommendation: Pin explicitly to `node-version: '22'` in the workflow to match the project's engine requirement and avoid surprises when LTS bumps.

---

## Sources

### Primary (HIGH confidence)
- [semantic-release GitHub Actions recipe](https://semantic-release.gitbook.io/semantic-release/recipes/ci-configurations/github-actions) — workflow YAML, permissions, `fetch-depth: 0` requirement, `registry-url` warning
- [semantic-release configuration docs](https://semantic-release.gitbook.io/semantic-release/usage/configuration) — `.releaserc.json` structure, branches config, default plugins
- [@semantic-release/npm GitHub repo](https://github.com/semantic-release/npm) — v13.1.4, OIDC support status, plugin options
- [npm Trusted Publishers docs](https://docs.npmjs.com/trusted-publishers/) — setup steps on npmjs.com
- [npm package.json docs](https://docs.npmjs.com/cli/v11/configuring-npm/package-json/) — `repository`, `bugs`, `homepage` field format
- [GitHub Issue Forms syntax](https://docs.github.com/en/communities/using-templates-to-encourage-useful-issues-and-pull-requests/syntax-for-issue-forms) — YAML form fields and validation

### Secondary (MEDIUM confidence)
- [npm trusted publishing GA announcement](https://github.blog/changelog/2025-07-31-npm-trusted-publishing-with-oidc-is-generally-available/) — GA date July 31, 2025
- [npm trusted publishing setup walkthrough](https://remarkablemark.org/blog/2025/12/19/npm-trusted-publishing/) — npmjs.com configuration steps, `id-token: write` requirement, NPM_TOKEN no longer needed; npm >=11.5.1 or Node.js >=24 version requirement for OIDC
- [npm classic tokens deprecation (DEV Community)](https://dev.to/zhangjintao/from-deprecated-npm-classic-tokens-to-oidc-trusted-publishing-a-cicd-troubleshooting-journey-4h8b) — December 9, 2025 invalidation date
- [npm/cli issue #8544](https://github.com/npm/cli/issues/8544) — OIDC cannot publish initial package version; first publish must be manual

### Tertiary (LOW confidence)
- Various blog posts about semantic-release workflow examples — patterns cross-verified against official docs

---

## Metadata

**Confidence breakdown:**
- Standard stack (semantic-release + plugins): HIGH — official docs, current version confirmed
- CI/CD workflow pattern: HIGH — official semantic-release docs + GitHub Actions docs
- OIDC trusted publishing: HIGH — npm official docs + GA announcement + version requirements verified
- First-publish-manual limitation: HIGH — confirmed by npm/cli issue tracker
- Issue template syntax: HIGH — official GitHub docs
- Pitfalls (registry-url conflict, fetch-depth): HIGH — documented in official semantic-release docs

**Research date:** 2026-02-24
**Valid until:** 2026-03-31 (stable ecosystem; OIDC is now GA and settled)

---

## Critical Pre-Publish Checklist (for planner)

This list captures the exact sequencing constraint for the phase:

1. Create GitHub repo `anthropics-community/cc-templates` (prerequisite — URLs in package.json and OIDC config both require it)
2. Update `package.json`: add `repository`, `bugs`, `homepage`, update `keywords`, add `publishConfig.provenance`
3. Add `LICENSE` (MIT), `CONTRIBUTING.md`, GitHub issue templates, `.releaserc.json`
4. Write the new `README.md`
5. Run `npm pack --dry-run` to verify published file list
6. **Manual first publish**: `npm publish --access public` using a granular access token (not classic token)
7. Configure OIDC trusted publishing on npmjs.com (requires package to exist — step 6 first)
8. Add the `.github/workflows/release.yml` workflow
9. Push to main — verify CI runs, tests pass, no new version published (no `feat:` or `fix:` commits yet)
10. Make a `feat:` commit to trigger first automated release

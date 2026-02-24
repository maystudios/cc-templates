# Phase 5: NPM Publish - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Make cc-templates publicly available and discoverable on npm — from a working local package to one that strangers can find, install, and trust. This includes package identity polish, public-facing README and docs, an automated CI/CD release pipeline, and the community scaffolding (license, issue templates, contributing guide) needed for an open-source launch.

</domain>

<decisions>
## Implementation Decisions

### Package identity
- Package name: `cc-templates` (keep as-is)
- npm description: "Install Claude Code components with one command"
- Keywords: `claude-code`, `anthropic`, `agents`, `hooks`, `skills`
- Add full package.json metadata: `repository`, `bugs`, and `homepage` fields pointing to GitHub repo

### README & docs
- Primary audience: developers already using Claude Code (no explanation of what Claude Code is)
- Required sections: Quick start (install command + example), full component catalog, what each component type does (agents vs hooks vs skills vs commands), how to contribute a template
- Show both command syntax and terminal output examples
- Contributing guide goes in a separate `CONTRIBUTING.md` file, linked from README

### Release process
- Initial publish version: `0.1.0`
- CI trigger: GitHub Actions runs on every push to main
- Version bumping: conventional commits (`feat:`, `fix:`, etc.) drive automatic semver increments
- Safety: tests must pass before publish step runs (no publish on red)

### Community setup
- Bug reporting and feature requests via GitHub Issues
- GitHub issue templates: bug report template + template request template
- License: MIT
- `CONTRIBUTING.md`: full guide covering fork setup, how to add a new template to the catalog, and PR process

### Claude's Discretion
- Exact GitHub Actions workflow structure and which action packages to use
- Conventional commits tooling (e.g., semantic-release vs release-please vs custom)
- README visual formatting, badge choices, header style
- CONTRIBUTING.md dev environment setup section details

</decisions>

<specifics>
## Specific Ideas

- The README is for people who already know Claude Code — skip the "what is Claude Code" onboarding, go straight to value
- CI auto-publishes on every main push with conventional commits driving the version bump
- Show real terminal output in the README (what the user actually sees), not just command syntax alone

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 05-wir-m-chten-jetzt-in-der-n-chsten-phase-das-ganze-per-npm-wirklich-publischen-sodass-andere-leute-das-wirklich-jetzt-nutzen-k-nnen*
*Context gathered: 2026-02-24*

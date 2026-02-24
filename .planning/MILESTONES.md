# Milestones: cc-templates

## v0.1 — Core Installer

**Shipped:** 2026-02-24
**Phases:** 1–2
**Plans:** 6 (1 + 5)
**Tasks:** 14
**LOC:** 932 JS
**Timeline:** 2026-02-24 (4 hours)
**Git range:** 1a9c6d9 → 31f7dc9

### Delivered

Full install pipeline for all four Claude Code component types — skills, agents, commands, and hooks — with safety guarantees and no data loss. The npm name `cc-templates` is confirmed available and the package is structurally ready to publish.

### Key Accomplishments

1. ESM CLI scaffold: `npx cc-templates --help` works; `cc-templates` npm name confirmed available (404 from registry)
2. Three seed video skills (video-download, video-fetch-and-summarize, video-summarizer) with YAML frontmatter; `components.json` pre-generated and ships inside the npm package for instant offline listing
3. Foundation modules: GitHub URL builder with `CC_TEMPLATES_REPO` override, chalk TTY-aware output helpers, catalog validator with inline available-names error listing
4. Complete installer pipeline for all 4 component types with safety guards: SAFE-01 validate-first, SAFE-02 conflict detection, SAFE-04 CI mode (`--yes`), SAFE-06 atomic hook merge, SAFE-07 Windows python3→python fix
5. Hook installer with array-append deep-merge and write-file-atomic — `settings.json` can never be corrupted or have user hooks clobbered
6. `runInstall()` orchestrator: validates ALL component names before executing any installs; fail-fast dispatch to per-type installers

### Known Gaps

Requirements deferred to Phase 3+4 (not blocking install pipeline):

- SAFE-03: `--dry-run` flag (Phase 4)
- SAFE-05: Stale npx-version warning (Phase 4)
- DISC-01: Interactive two-level component picker (Phase 3)
- DISC-02: `--list` flag with descriptions and authors (Phase 3)
- DISC-03: Author display on successful install (Phase 3)

### Archive

- Roadmap: `.planning/milestones/v0.1-ROADMAP.md`
- Requirements: `.planning/milestones/v0.1-REQUIREMENTS.md`

---

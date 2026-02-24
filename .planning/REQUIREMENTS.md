# Requirements: cc-templates

**Defined:** 2026-02-24
**Core Value:** The fastest way to extend Claude Code with reusable, community-contributed components — one command, files in the right place.

## v1 Requirements

### Installation — Core Flags

- [x] **INST-01**: User can install a skill via `npx cc-templates --skill <name>` — downloads directory to `.claude/skills/<name>/`
- [x] **INST-02**: User can install an agent via `npx cc-templates --agent <name>` — downloads `.md` file to `.claude/agents/<name>.md`
- [x] **INST-03**: User can install a command via `npx cc-templates --command <name>` — downloads `.md` file to `.claude/commands/<name>.md`
- [x] **INST-04**: User can install a hook via `npx cc-templates --hook <name>` — fetches hook JSON and deep-merges into target `settings.json`
- [x] **INST-05**: User can install to user-global `~/.claude/` instead of project-local `.claude/` via `--global` flag
- [x] **INST-06**: User can force reinstall of an already-installed component via `--overwrite` / `--force` flag
- [x] **INST-07**: User can point the CLI at a forked GitHub repo via `CC_TEMPLATES_REPO` environment variable

### Installation — Component Library

- [x] **COMP-01**: `video-download` skill is available to install (downloads videos from YouTube, Instagram, TikTok, etc. via yt-dlp)
- [x] **COMP-02**: `video-fetch-and-summarize` skill is available to install (downloads videos + generates Gemini summaries)
- [x] **COMP-03**: `video-summarizer` skill is available to install (summarizes existing MP4 files via Gemini)
- [x] **COMP-04**: All component files include YAML frontmatter with `name`, `description`, and optional `author` fields
- [x] **COMP-05**: Pre-generated `components.json` catalog is shipped inside the npm package for offline/instant listing

### Safety & UX

- [x] **SAFE-01**: User sees a clear error message when a requested component does not exist, with a list of available components of that type shown inline
- [x] **SAFE-02**: User is warned (and install is aborted) when target file/directory already exists, unless `--force` is passed
- [ ] **SAFE-03**: User can preview what would be installed without any files being written via `--dry-run` flag
- [ ] **SAFE-04**: User can run the CLI non-interactively in CI pipelines via `--yes` flag (skips all confirmation prompts)
- [ ] **SAFE-05**: User sees a non-blocking warning at startup when running a stale npx-cached version (checked against npm registry)
- [x] **SAFE-06**: Hooks installer deep-merges new hook entries into existing `settings.json` without overwriting or removing any existing keys (atomic write via temp file + rename)
- [x] **SAFE-07**: Hook command strings containing `python3` are automatically replaced with `python` on Windows

### Discovery

- [ ] **DISC-01**: User sees an interactive two-level component picker (select type → select component) when running `npx cc-templates` with no flags
- [ ] **DISC-02**: User can list all available components with descriptions and authors via `--list` flag
- [ ] **DISC-03**: User sees the component `author` field displayed on successful install and in catalog listing

## v2 Requirements

### Extended Installation

- **INST-v2-01**: User can install multiple components in a single invocation (comma-separated values or multiple flags)
- **INST-v2-02**: User can update installed components to latest version via `--update` flag

### Discovery

- **DISC-v2-01**: Fuzzy search in interactive menu (useful when component count exceeds ~50)
- **DISC-v2-02**: Component categories/tags for filtering in `--list` output

### Extended Library

- **COMP-v2-01**: Agent components in the library
- **COMP-v2-02**: Hook components in the library
- **COMP-v2-03**: Command components in the library

## Out of Scope

| Feature | Reason |
|---------|--------|
| Web dashboard / analytics UI | Undermines zero-backend value proposition; adds Express server dependency |
| Telemetry / download tracking | Adds Supabase/Vercel backend; privacy concern; not needed v1 |
| MCP installation | Different integration model; out of scope v1 |
| Project template scaffolding (`--init`) | Different feature category; may conflict with `claude init` |
| Plugin / bundle system | Add later if demand emerges |
| Real-time docs monitoring | Backend infrastructure required; not needed v1 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INST-01 | Phase 2 | Complete |
| INST-02 | Phase 2 | Complete |
| INST-03 | Phase 2 | Complete |
| INST-04 | Phase 2 | Complete |
| INST-05 | Phase 2 | Complete |
| INST-06 | Phase 2 | Complete |
| INST-07 | Phase 2 | Complete |
| COMP-01 | Phase 2 | Complete |
| COMP-02 | Phase 2 | Complete |
| COMP-03 | Phase 2 | Complete |
| COMP-04 | Phase 1 | Complete |
| COMP-05 | Phase 1 | Complete |
| SAFE-01 | Phase 2 | Complete |
| SAFE-02 | Phase 2 | Complete |
| SAFE-03 | Phase 4 | Pending |
| SAFE-04 | Phase 2 | Pending |
| SAFE-05 | Phase 4 | Pending |
| SAFE-06 | Phase 2 | Complete |
| SAFE-07 | Phase 2 | Complete |
| DISC-01 | Phase 3 | Pending |
| DISC-02 | Phase 3 | Pending |
| DISC-03 | Phase 3 | Pending |

**Coverage:**
- v1 requirements: 22 total
- Mapped to phases: 22
- Unmapped: 0 ✓

---
*Requirements defined: 2026-02-24*
*Last updated: 2026-02-24 after 02-01 execution (INST-05, INST-07, SAFE-01 complete)*

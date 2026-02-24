# Roadmap: cc-templates

## Overview

cc-templates ships as a minimal npm CLI that installs Claude Code components from a GitHub repository into the user's `.claude/` directory. The build order is dictated by hard dependencies: the package scaffold must be correct before any install logic is written, all four installer modules must exist before the interactive menu can call them, and the power-user flags are thin wrappers on the install pipeline that ship with the first public release. Four phases deliver the full v1 feature set with zero retrofitting of safety mechanisms.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [ ] **Phase 1: Scaffold** - Register npm name, establish correct package structure, generate static component catalog
- [ ] **Phase 2: Core Installer** - All four component types install end-to-end with full safety guarantees
- [ ] **Phase 3: Discovery UX** - Interactive menu and catalog listing bring components to the surface
- [ ] **Phase 4: Polish + Publish** - Dry-run flag, stale-version check, Windows CI, first public npm publish

## Phase Details

### Phase 1: Scaffold
**Goal**: The npm package name is secured and the CLI is invocable with a correct package shape before any install logic is written
**Depends on**: Nothing (first phase)
**Requirements**: COMP-04, COMP-05
**Success Criteria** (what must be TRUE):
  1. `npx cc-templates --help` prints a usage message without errors on macOS, Linux, and Windows
  2. `npm pack --dry-run` lists only the files that should ship (bin/, src/, components.json, package.json, README)
  3. `components.json` exists at the repo root and lists all available components with name, description, and author fields
  4. All component source files contain valid YAML frontmatter with at minimum `name` and `description` fields
**Plans**: 1 plan

Plans:
- [ ] 01-01-PLAN.md — Package scaffold, CLI entry point, component library seed, and catalog generation

### Phase 2: Core Installer
**Goal**: Users can install any of the four component types via CLI flags with safety guarantees — no data loss, no silent overwrites, no Windows failures
**Depends on**: Phase 1
**Requirements**: INST-01, INST-02, INST-03, INST-04, INST-05, INST-06, INST-07, SAFE-01, SAFE-02, SAFE-04, SAFE-06, SAFE-07, COMP-01, COMP-02, COMP-03
**Success Criteria** (what must be TRUE):
  1. User runs `npx cc-templates --skill video-download` and the skill directory appears at `.claude/skills/video-download/` with all files intact
  2. User runs `npx cc-templates --hook <name>` and the hook is deep-merged into `settings.json` without removing any existing keys
  3. User requests a component that does not exist and sees a clear error message listing available components of that type
  4. User runs the installer against an already-installed component and sees a warning with the install aborted unless `--force` is passed
  5. User runs the installer in a CI pipeline with `--yes` flag and no interactive prompts appear
**Plans**: TBD

### Phase 3: Discovery UX
**Goal**: Users can discover and browse available components without knowing component names in advance
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. User runs `npx cc-templates` with no flags and sees an arrow-key menu that lets them pick a component type then a specific component and triggers install
  2. User runs `npx cc-templates --list` and sees all available components with descriptions and author attribution
  3. After a successful install, the terminal output includes the component author's name
**Plans**: TBD

### Phase 4: Polish + Publish
**Goal**: The CLI is safe to publish publicly — dry-run flag lets cautious users preview installs, stale-cache warning prevents confusion, and Windows CI confirms cross-platform correctness
**Depends on**: Phase 3
**Requirements**: SAFE-03, SAFE-05
**Success Criteria** (what must be TRUE):
  1. User runs any install command with `--dry-run` and sees the files that would be written with no files actually created or modified
  2. User running a stale npx-cached version sees a non-blocking warning at startup that a newer version is available
  3. `npm publish` succeeds and `npx cc-templates@latest --help` works on a clean machine
**Plans**: TBD

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Scaffold | 0/1 | Not started | - |
| 2. Core Installer | 0/TBD | Not started | - |
| 3. Discovery UX | 0/TBD | Not started | - |
| 4. Polish + Publish | 0/TBD | Not started | - |

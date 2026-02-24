# Roadmap: cc-templates

## Milestones

- ✅ **v0.1 Core Installer** — Phases 1–2 (shipped 2026-02-24)
- 📋 **v1.0 MVP** — Phases 3–4 (planned)

## Phases

<details>
<summary>✅ v0.1 Core Installer (Phases 1–2) — SHIPPED 2026-02-24</summary>

- [x] Phase 1: Scaffold (1/1 plans) — completed 2026-02-24
- [x] Phase 2: Core Installer (5/5 plans) — completed 2026-02-24

See archive: `.planning/milestones/v0.1-ROADMAP.md`

</details>

### 📋 v1.0 MVP (Planned)

- [ ] **Phase 3: Discovery UX** - Interactive menu and catalog listing bring components to the surface
- [ ] **Phase 4: Polish + Publish** - Dry-run flag, stale-version check, Windows CI, first public npm publish

## Phase Details

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

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold | v0.1 | 1/1 | Complete | 2026-02-24 |
| 2. Core Installer | v0.1 | 5/5 | Complete | 2026-02-24 |
| 3. Discovery UX | v1.0 | 0/TBD | Not started | - |
| 4. Polish + Publish | v1.0 | 0/TBD | Not started | - |

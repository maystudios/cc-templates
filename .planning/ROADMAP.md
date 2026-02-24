# Roadmap: cc-templates

## Milestones

- ✅ **v0.1 Core Installer** — Phases 1–2 (shipped 2026-02-24)
- 🚧 **v1.0 MVP** — Phases 2.1, 3–4 (Phase 2.1 complete — Phase 3 next)

## Phases

<details>
<summary>✅ v0.1 Core Installer (Phases 1–2) — SHIPPED 2026-02-24</summary>

- [x] Phase 1: Scaffold (1/1 plans) — completed 2026-02-24
- [x] Phase 2: Core Installer (5/5 plans) — completed 2026-02-24

See archive: `.planning/milestones/v0.1-ROADMAP.md`

</details>

### 🚧 v1.0 MVP (In Progress)

- [x] **Phase 2.1: TypeScript Migration** (INSERTED) - Convert codebase to TypeScript with build pipeline and ESLint (completed 2026-02-24)
- [ ] **Phase 3: Discovery UX** - Interactive menu and catalog listing bring components to the surface
- [ ] **Phase 4: Polish + Publish** - Dry-run flag, stale-version check, Windows CI, first public npm publish

## Phase Details

### Phase 2.1: TypeScript Migration (INSERTED)
**Goal**: Convert the entire codebase from plain JavaScript to TypeScript with a proper build pipeline (tsc or esbuild), ESLint with TypeScript rules, and strict type checking — delivering better type safety, IDE completions, and code quality enforcement before Discovery UX work begins
**Depends on**: Phase 2
**Requirements**: None (architectural improvement — enables better quality on all future phases)
**Success Criteria** (what must be TRUE):
  1. All source files (`src/**`) are `.ts` files; `npm run build` emits working `.js` to `dist/`
  2. `bin/index.js` invokes the compiled output; `npx cc-templates --help` still works
  3. ESLint with TypeScript rules passes with zero errors on all source files
  4. `npm test` (or equivalent) passes — all existing behaviors verified unchanged
  5. `npm pack --dry-run` lists only the correct files (dist/, components.json, package.json, README)
**Plans**: 5 plans

Plans:
- [x] 02.1-01-PLAN.md — Install devDependencies + tsconfig.json + eslint.config.js + package.json updates
- [x] 02.1-02-PLAN.md — Create src/types.ts + migrate catalog.ts, output.ts, fetch.ts
- [x] 02.1-03-PLAN.md — Migrate src/installers/*.ts (agent, command, hook, skill)
- [x] 02.1-04-PLAN.md — Migrate src/install.ts
- [x] 02.1-05-PLAN.md — Migrate src/cli.ts + update bin/index.js + smoke tests + full build verification

### Phase 3: Discovery UX
**Goal**: Users can discover and browse available components without knowing component names in advance
**Depends on**: Phase 2
**Requirements**: DISC-01, DISC-02, DISC-03
**Success Criteria** (what must be TRUE):
  1. User runs `npx cc-templates` with no flags and sees an arrow-key menu that lets them pick a component type then a specific component and triggers install
  2. User runs `npx cc-templates --list` and sees all available components with descriptions and author attribution
  3. After a successful install, the terminal output includes the component author's name
**Plans**: 4 plans

Plans:
- [ ] 03-01-PLAN.md — Install @inquirer/prompts + create src/menu.ts (two-level interactive menu)
- [x] 03-02-PLAN.md — Create src/list.ts (TTY-aware grouped catalog listing)
- [ ] 03-03-PLAN.md — Update four installers for author attribution + remove hint() calls
- [ ] 03-04-PLAN.md — Wire src/cli.ts + full build verification + human checkpoint

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
Phases execute in numeric order: 1 → 2 → 2.1 → 3 → 4

| Phase | Milestone | Plans Complete | Status | Completed |
|-------|-----------|----------------|--------|-----------|
| 1. Scaffold | v0.1 | 1/1 | Complete | 2026-02-24 |
| 2. Core Installer | v0.1 | 5/5 | Complete | 2026-02-24 |
| 2.1. TypeScript Migration (INSERTED) | v1.0 | Complete    | 2026-02-24 | 2026-02-24 |
| 3. Discovery UX | 3/4 | In Progress|  | - |
| 4. Polish + Publish | v1.0 | 0/TBD | Not started | - |
| 5. NPM Publish | 2/5 | In Progress|  | - |

### Phase 5: NPM Publish
**Goal**: Make cc-templates publicly available and discoverable on npm — from a working local package to one that strangers can find, install, and trust. Includes package identity polish, public-facing README and docs, automated CI/CD release pipeline, and community scaffolding (license, issue templates, contributing guide) needed for an open-source launch.
**Depends on**: Phase 4
**Requirements**: PUB-01, PUB-02, PUB-03, PUB-04, PUB-05, PUB-06, PUB-07
**Plans**: 5 plans

Plans:
- [x] 05-01-PLAN.md — package.json metadata polish + MIT LICENSE + semantic-release devDependencies
- [ ] 05-02-PLAN.md — Rewrite README.md + create CONTRIBUTING.md
- [ ] 05-03-PLAN.md — GitHub YAML issue templates + .releaserc.json
- [ ] 05-04-PLAN.md — GitHub Actions release workflow + npm pack verification
- [ ] 05-05-PLAN.md — First manual npm publish + OIDC trusted publishing setup + CI verification

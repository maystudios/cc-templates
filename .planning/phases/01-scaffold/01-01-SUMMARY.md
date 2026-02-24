---
phase: 01-scaffold
plan: 01
subsystem: cli
tags: [nodejs, npm, commander, js-yaml, chalk, esm, cli]

# Dependency graph
requires: []
provides:
  - ESM npm package scaffold with working CLI entry point (bin/index.js -> src/cli.js)
  - component library skeleton with 3 seed skills (video-download, video-fetch-and-summarize, video-summarizer)
  - pre-generated components.json catalog (skills/hooks/commands/mcp schema)
  - build-catalog.js script for regenerating components.json from skill.md frontmatter
  - confirmed availability and shape of cc-templates npm name
affects: [02-installer, 03-components, 04-polish]

# Tech tracking
tech-stack:
  added: [chalk@5.4.1, commander@14.0.0, js-yaml@4.1.1]
  patterns:
    - ESM-only package (type:module) with CJS-from-ESM yaml import fallback
    - bin shebang shim delegates to src/cli.js run() export
    - YAML frontmatter in skill.md as single source of truth for catalog
    - components.json pre-generated and committed so npm package works offline

key-files:
  created:
    - package.json
    - bin/index.js
    - src/cli.js
    - scripts/build-catalog.js
    - components.json
    - components/skills/video-download/skill.md
    - components/skills/video-fetch-and-summarize/skill.md
    - components/skills/video-summarizer/skill.md
    - components/hooks/.gitkeep
    - components/commands/.gitkeep
    - components/mcp/.gitkeep
    - README.md
    - .gitignore
  modified: []

key-decisions:
  - "cc-templates npm name confirmed available (npm view returned 404) — safe to proceed"
  - "js-yaml 4.x CJS-from-ESM: dynamic import with mod.default, createRequire fallback for edge cases"
  - "components/ directory NOT in npm files field — stays on GitHub, fetched at runtime by installer"
  - "components.json IS in npm files field — ships with package for instant offline listing"
  - "build-catalog.js uses getMainFile() to handle both directory skills and future flat-file hooks/commands"

patterns-established:
  - "ESM shim pattern: bin/index.js contains only shebang + import + run() — no logic"
  - "Version single source of truth: readFileSync package.json in src/cli.js, never hardcode"
  - "Frontmatter validation: REQUIRED_FIELDS array checked at build time, exits 1 on missing fields"
  - "Catalog types: COMPONENT_TYPES array drives all iteration — add new types in one place"

requirements-completed: [COMP-04, COMP-05]

# Metrics
duration: 2min
completed: 2026-02-24
---

# Phase 1 Plan 1: Scaffold Summary

**ESM CLI scaffold with commander 14 and js-yaml, three seed skill components with YAML frontmatter, and pre-generated components.json shipped inside the npm package**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-24T11:56:11Z
- **Completed:** 2026-02-24T11:58:10Z
- **Tasks:** 2
- **Files modified:** 13 created

## Accomplishments

- Confirmed `cc-templates` npm name available (npm registry returned 404)
- Created working ESM CLI: `node bin/index.js --help` prints branded header, all 5 flags, examples section
- Seeded component library with 3 video skill.md files, each with valid YAML frontmatter (name, description, author, version, tags, requires)
- Wrote build-catalog.js that walks components/, extracts frontmatter, validates required fields, writes components.json
- Generated components.json: `{ skills: [3 entries], hooks: [], commands: [], mcp: [] }`
- Verified `npm pack --dry-run` lists only 5 files — no components/ or scripts/ paths in tarball

## Task Commits

Each task was committed atomically:

1. **Task 1: npm package scaffold and working CLI entry point** - `dafbd2c` (feat)
2. **Task 2: Seed component library and generate components.json** - `2622730` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `package.json` - ESM package with bin, files, engines, chalk/commander/js-yaml deps
- `bin/index.js` - Shebang shim, delegates to src/cli.js run()
- `src/cli.js` - Commander program: branded header, 5 flags (--skill --hook --command --mcp --list), examples, stub handlers
- `scripts/build-catalog.js` - Catalog builder: walks components/, extracts YAML frontmatter, validates, writes components.json
- `components.json` - Pre-generated catalog with 3 skills — ships inside npm package
- `components/skills/video-download/skill.md` - yt-dlp video downloader skill
- `components/skills/video-fetch-and-summarize/skill.md` - yt-dlp + Gemini summarizer skill
- `components/skills/video-summarizer/skill.md` - Gemini MP4 file summarizer skill
- `components/hooks/.gitkeep` - Placeholder for future hook components
- `components/commands/.gitkeep` - Placeholder for future command components
- `components/mcp/.gitkeep` - Placeholder for future MCP components
- `README.md` - Minimal usage documentation
- `.gitignore` - node_modules, *.tgz, .DS_Store

## Decisions Made

- `cc-templates` npm name confirmed available — `npm view cc-templates` returned 404
- Used `mod.default` for js-yaml dynamic import with `createRequire` fallback for ESM/CJS interop edge cases
- `components/` directory excluded from npm `files` field — source stays on GitHub, fetched at runtime
- `components.json` included in npm `files` field — enables offline component listing without GitHub call
- `scripts/` directory excluded from npm `files` field — build tooling not needed by consumers

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None. js-yaml dynamic import with `mod.default` worked without needing the createRequire fallback (Node 25.2.1 on this machine handles CJS-from-ESM correctly).

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Package scaffold complete — Phase 2 (Core Installer) can begin immediately
- `bin/` and `src/` structure established; Phase 2 will expand src/cli.js with real install logic
- `components.json` catalog ready — Phase 2 installer will read it for validation before install
- npm name `cc-templates` confirmed available — can be published after Phase 2

---
*Phase: 01-scaffold*
*Completed: 2026-02-24*

## Self-Check: PASSED

All files verified present:
- package.json, bin/index.js, src/cli.js, scripts/build-catalog.js, components.json
- components/skills/video-download/skill.md, video-fetch-and-summarize/skill.md, video-summarizer/skill.md
- .planning/phases/01-scaffold/01-01-SUMMARY.md

All commits verified:
- dafbd2c (Task 1: npm package scaffold and working CLI entry point)
- 2622730 (Task 2: seed component library and generate components.json)

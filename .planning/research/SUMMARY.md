# Project Research Summary

**Project:** cc-templates — Claude Code component installer CLI
**Domain:** Minimal npm CLI tool, GitHub file fetcher
**Researched:** 2026-02-24
**Confidence:** HIGH

## Executive Summary

cc-templates is a zero-backend npm CLI that installs Claude Code components (skills, agents, commands, hooks) from a GitHub repository to the user's local `.claude/` directory. The established pattern for this type of tool — validated by both the shadcn/ui CLI and the reference implementation davila7/claude-code-templates — is flag-based invocation for scripted use (`--skill <name>`) plus an interactive arrow-key menu for discovery when no flags are given. The differentiating strategy here is radical simplicity: GitHub is the backend, the component catalog is a pre-generated static JSON file shipped inside the npm package, and the dependency count is kept to a minimum of five production packages.

The recommended stack is plain CommonJS Node.js (no build step, no TypeScript for v1), with `commander` for flag parsing, `@inquirer/prompts` for interactive menus, `chalk@4.x` and `ora@7.x` pinned to their last CJS-compatible versions, and `fs-extra` for safe directory operations. The architecture is a thin dispatcher (`src/index.js`) that routes to four independent installer modules (`skills`, `agents`, `commands`, `hooks`), backed by shared GitHub, filesystem, and platform utility layers. Skills require a two-step Git Trees API fetch to download a directory; all other component types are direct single-file raw.githubusercontent.com fetches.

The five highest-risk pitfalls that must be addressed in Phase 1 — not retrofitted later — are: GitHub API rate limiting (handle 403/429 from day one, support `GITHUB_TOKEN`), the hooks installer corrupting `settings.json` (deep-merge with atomic write, never replace), file conflicts silently overwriting user customizations (check before write, prompt or `--force`), Windows path separator failures (use `path.join()` everywhere, add Windows CI before publish), and npx serving stale cached versions (document `@latest`, add startup version check). There is also a Phase 0 action that must happen before any public announcement: register the `cc-templates` package name on npm immediately to prevent name squatting.

---

## Key Findings

### Recommended Stack

The stack research is high-confidence with all package versions verified against the npm registry on 2026-02-24. The only non-obvious decision is pinning `chalk` at `4.1.2` and `ora` at `7.x` rather than their latest versions: `chalk@5+` and `ora@9+` are pure ESM and incompatible with CJS `require()` without async dynamic imports. Pinning to the last CJS versions eliminates the ESM/CJS friction entirely for a single-maintainer v1 project. See STACK.md for the full alternatives analysis.

**Core technologies:**
- `Node.js >=18.17.0`: runtime — native fetch available; oldest LTS with security patches; enforced via `engines` field
- `commander@14.0.3`: flag parsing — 137M weekly downloads, clean API, auto-generates `--help`, no ceremony
- `@inquirer/prompts@8.3.0`: interactive menus — dual CJS/ESM, supports `select`/`checkbox`/`input`, works from CJS `require()`
- `chalk@4.1.2`: terminal color — pinned at last CJS version to avoid ESM/CJS friction; still security-patched
- `ora@7.x`: spinner — pinned at last CJS version for same reason as chalk
- `fs-extra@11.3.3`: filesystem helpers — provides `ensureDir`, `copy`, `outputFile`; native `fs` lacks recursive directory copy
- Native `fetch` (built-in): HTTP — covers all GitHub API calls; do not add `got`, `axios`, or `node-fetch`

**Critical version constraint:** Do NOT use `chalk@5+` or `ora@9+` in a CJS package without async dynamic imports. Pin both to their last CJS-compatible versions for v1.

### Expected Features

The feature research is high-confidence, grounded in the PROJECT.md requirements, competitor analysis (davila7/claude-code-templates, shadcn/ui CLI), and clig.dev UX standards. The MVP feature set is narrower than the competitor's but more reliable; the anti-features list is a scope defense document to prevent feature creep that would undermine the zero-backend value proposition.

**Must have (table stakes) — v1 launch:**
- Flag-based install (`--skill`, `--agent`, `--hook`, `--command`) — users expect one-liner installs for scripting
- Interactive menu (no-flag invocation) — users expect `npx cc-templates` to "just work"
- Component catalog listing (`--list` and inline in interactive menu) — users need to know what exists
- Correct file placement — skills to `.claude/skills/<name>/`, agents/commands to `.claude/{type}/<name>.md`, hooks merged into `settings.json`
- Hooks deep-merge (NOT overwrite) — additive behavior is expected; destructive behavior is a critical bug
- Clear error on 404 with available-component list — absence is a support burden
- `--yes` flag — CI/CD pipelines require non-interactive mode
- Success feedback with file paths — users need confirmation install worked
- Windows compatibility — `python3` to `python` substitution in hook commands

**Should have (differentiators) — v1.x after validation:**
- `--dry-run` flag — unique among comparable tools; addresses the "scared to run this" concern
- `--global` flag — installs to `~/.claude/` instead of project-local `.claude/`
- `--overwrite` flag — explicit control for update workflows
- `CC_TEMPLATES_REPO` env var — lets fork users point at their own repo
- Community attribution display — show `author:` from frontmatter on install and listing

**Defer (v2+):**
- `--update` flag — most users re-run install; wait for demand
- Multi-component single invocation — wait for users to hit the limitation
- Fuzzy search in interactive menu — needed only when component count exceeds ~50
- Project template scaffolding (`--init`) — different feature category; conflicts with potential `claude init`
- Web dashboard, analytics, MCP installation — anti-features; these undermine the zero-backend value proposition

### Architecture Approach

The architecture is a layered, modular CLI with a clear dependency graph that dictates a bottom-up build order. The central insight is that the four component types have fundamentally different install flows (multi-file directory download for skills vs. single raw file fetch for agents/commands vs. JSON merge for hooks), which mandates separate installer modules rather than a monolithic dispatcher. The architecture maps directly to the build order: utilities first (platform, github, fs), then catalog, then installers, then menu, then the dispatcher last. See ARCHITECTURE.md for the full component diagram and data flow traces.

**Major components:**
1. `bin/cc-templates.js` — shebang entry point only; no logic; Commander.js flag definition
2. `src/index.js` — dispatcher; reads parsed flags, routes to correct installer module, hosts interactive menu trigger
3. `src/catalog.js` — loads pre-generated `components.json` synchronously; filters by type; enables instant offline listing
4. `src/github.js` — sole GitHub abstraction; Git Trees API for skill directories, raw.githubusercontent.com for single files; rate limit error handling lives here
5. `src/installers/skills.js` — two-step fetch: enumerate tree with Git Trees API, then parallel raw downloads
6. `src/installers/agents.js` / `commands.js` — single raw file fetch + write
7. `src/installers/hooks.js` — fetch hook JSON, apply platform transforms, deep-merge into `settings.json` with atomic write
8. `src/fs.js` — all filesystem I/O centralized; `ensureDir`, `writeFile`, `readJsonOrEmpty`, `writeJson`
9. `src/platform.js` — Windows `python3`-to-`python` substitution and OS detection; isolated from other installers
10. `src/menu.js` — Inquirer.js interactive prompts; two-level picker (type then component)
11. `components.json` — pre-generated static catalog at root; shipped in npm package; built by `scripts/generate-catalog.js`

### Critical Pitfalls

All five critical pitfalls require Phase 1 prevention; none are safely deferrable. The moderate and minor pitfalls are well-documented with clear prevention strategies.

1. **GitHub API rate limiting** — Use Git Trees API (1 call per skill) instead of per-file Contents API calls; support `GITHUB_TOKEN` env var from day one; catch 403/429 and surface a human-readable message with the token workaround
2. **Hooks merge corrupts settings.json** — Deep-merge preserving all non-hooks keys; deduplicate by `matcher + command`; atomic write via temp file + rename; validate JSON after write; test with pre-populated edge-case settings files
3. **File conflict silent overwrite or EEXIST crash** — Check target path existence before every write; prompt for overwrite (`--force` to skip); use `fs.mkdir({ recursive: true })` always
4. **Windows path separator failures** — Use `path.join()` for all filesystem paths (never string concatenation); use explicit `/` for URL construction; set `.gitattributes` to enforce LF on bin files; add `windows-latest` to CI matrix before first publish
5. **npx stale cache** — Document `npx cc-templates@latest` in all user-facing output and README; add non-blocking startup version check against npm registry

**Phase 0 pre-announcement action:** Register the `cc-templates` npm package name immediately, before any public announcement, to prevent name squatting.

---

## Implications for Roadmap

Based on combined research, the architecture's build-order dependency graph, and the pitfall phase mapping, a four-phase structure is recommended.

### Phase 0: Project Scaffold and npm Name Registration

**Rationale:** The npm name squatting pitfall (PITFALLS.md Pitfall 9) must be resolved before any other work. The CLI scaffold (shebang, package.json shape, `.gitattributes` LF enforcement) must be correct from the first commit because retrofitting it causes subtle cross-platform breakage. This phase has no external dependencies and takes less than a day.

**Delivers:** Working `npx cc-templates` invocation that prints help text; npm package name registered; correct `package.json` shape with `engines`, `files`, `bin` fields; LF-enforced bin entry point; `components.json` generation script; initial component library directories

**Addresses:** Pitfall 9 (name squatting), Pitfall 12 (shebang/CRLF), Pitfall 7 (npm publish wrong files)

**Avoids:** Registering the package name after public announcement

### Phase 1: Core Installer — All Four Component Types

**Rationale:** The architecture's build order (utilities first, installers second, dispatcher last) and the pitfall phase mapping both converge on building all four component type installers together in one phase. This is the highest-complexity and highest-risk phase. All five critical pitfalls must be addressed here. Shipping a working end-to-end install for all four types in a single phase validates the architecture before adding UX features.

**Delivers:** `--skill`, `--agent`, `--command`, `--hook` flags working end-to-end; hooks deep-merge with atomic write; file conflict detection with `--force` flag; GITHUB_TOKEN support; 403/429 error handling; Windows path and python3-to-python handling; `--yes` flag; success feedback with file paths; clear 404 error with available-component list; non-TTY detection

**Addresses (from FEATURES.md):** All P1 table-stakes features

**Avoids (from PITFALLS.md):** Pitfall 1 (rate limiting), Pitfall 3 (file conflicts), Pitfall 4 (settings.json corruption), Pitfall 5 (Windows paths), Pitfall 6 (Git Trees API vs Contents API), Pitfall 10 (download URL expiration), Pitfall 11 (non-TTY hang)

**Uses (from STACK.md):** `commander`, `fs-extra`, native `fetch`, `path.join()`, `chalk@4.1.2`, `ora@7.x`

**Build order within phase:** platform.js → github.js → fs.js → catalog.js → agents.js/commands.js → skills.js → hooks.js → index.js (flag dispatch only)

### Phase 2: Interactive Menu and Catalog UX

**Rationale:** The interactive menu depends on the catalog and all installer modules being complete (ARCHITECTURE.md build order step 11 and 12). It cannot be built before Phase 1. This phase adds the discovery layer — the mode most new users will encounter first — without changing any install logic.

**Delivers:** `npx cc-templates` (no flags) launches two-level interactive picker (type then component); `--list` flag prints catalog with descriptions and authors; community attribution display on install and listing

**Addresses (from FEATURES.md):** Interactive menu (P1), component catalog listing (P1), community attribution (P2)

**Avoids:** Pitfall 11 (non-TTY hang — TTY check already in Phase 1 entry point; menu respects it)

**Uses (from STACK.md):** `@inquirer/prompts@8.3.0`, `chalk@4.1.2`

### Phase 3: Power User Flags and npm Publish

**Rationale:** These are low-complexity additive flags that enhance the install pipeline without changing its core logic. Bundling them with the npm publish step ensures the first public release includes the full v1 feature set. The publish pitfall (wrong files, stale cache documentation) is addressed here.

**Delivers:** `--dry-run` flag; `--global` flag; `--overwrite` flag; `CC_TEMPLATES_REPO` env var override; startup version staleness check; `npm pack --dry-run` validation; Windows CI matrix (`windows-latest`); first public npm publish

**Addresses (from FEATURES.md):** All P2 should-have features; zero-backend differentiator fully realized

**Avoids (from PITFALLS.md):** Pitfall 2 (npx stale cache — version check added here), Pitfall 7 (npm publish wrong files — `npm pack --dry-run` in release checklist)

### Phase Ordering Rationale

- Phase 0 before Phase 1 because npm name squatting is a non-recoverable risk if discovered late, and the scaffold decisions (LF endings, package.json shape) are hard to change once code is built on top of them.
- Phase 1 before Phase 2 because the interactive menu has a hard dependency on all installer modules being complete (ARCHITECTURE.md build order).
- Phase 2 before Phase 3 because power-user flags (`--dry-run`, `--global`) are more valuable once users can discover components via the interactive menu. Publishing before the UX is complete would deliver a degraded first impression.
- The four critical pitfalls (rate limiting, settings.json corruption, file conflicts, Windows paths) are all addressed in Phase 1 because retrofitting safety mechanisms after initial publish is significantly more costly and exposes real users to data loss.

### Research Flags

Phases needing no additional research (standard patterns, well-documented):
- **Phase 0:** Standard npm CLI scaffold — `package.json` shape, shebang, `.gitattributes` are fully documented
- **Phase 2:** Interactive menu with Inquirer.js — straightforward, official docs are comprehensive
- **Phase 3:** Power-user flags are simple boolean modifiers on existing logic; npm publish process is standard

Phases that may need targeted research during planning:
- **Phase 1 — Hooks installer:** The deep-merge + atomic write + deduplication logic for `settings.json` is the single most complex operation in the tool. Before implementation, validate the exact structure of Claude Code's `settings.json` across versions (hook types, nesting levels, key names). Community docs are MEDIUM confidence; official Anthropic docs should be checked at implementation time.
- **Phase 1 — Git Trees API recursive behavior:** Verify exact response shape for nested skill directories. The API behavior for trees with mixed blob/tree entries at multiple levels is well-documented but worth a targeted read of the official docs before implementing `skills.js`.

---

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | All package versions verified against npm registry 2026-02-24; ESM/CJS compatibility verified against official Node.js and package docs |
| Features | HIGH | Grounded in PROJECT.md requirements (verified), competitor code analysis (verified via WebFetch), and clig.dev canonical UX standards |
| Architecture | HIGH | Component boundaries derived from official GitHub API docs and reference implementation analysis; build order derived from explicit dependency graph |
| Pitfalls | HIGH | Most pitfalls verified against official docs and real open GitHub issues in the reference implementation; npm stale cache verified against multiple npm/cli issue reports |

**Overall confidence:** HIGH

### Gaps to Address

- **settings.json schema:** The exact structure of Claude Code's `settings.json` hooks section (hook types, matcher format, command array shape) is sourced from MEDIUM-confidence community docs. Validate against official Anthropic documentation or the Claude Code source at implementation time before writing the hooks merge logic.
- **`cc-templates` npm name availability:** Must be verified and registered immediately. The research assumes the name is available; this has not been confirmed.
- **Component library scope:** The research assumes the component library (skills/, agents/, commands/, hooks/) ships in the same GitHub repo as the CLI code. If the project intends a separate content repo, the catalog generation and raw URL construction patterns need adjustment.
- **chalk@4 / ora@7 security patch status:** Pinning to last CJS versions is recommended, but their security patch maintenance status should be re-verified at implementation time. If either package has unpatched CVEs, the dynamic `import()` approach for the ESM versions is the fallback.

---

## Sources

### Primary (HIGH confidence)
- npm registry (`npm view` commands, 2026-02-24) — all package versions
- GitHub REST API official docs — Contents API, Git Trees API, rate limits
- GitHub Changelog 2025-05-08 — updated unauthenticated rate limits including raw.githubusercontent.com
- PROJECT.md (this repo) — requirements baseline
- shadcn/ui CLI official docs — feature comparison baseline
- Inquirer.js official repo — prompt types and CJS compatibility
- Node.js CLI best practices (lirantal/nodejs-cli-apps-best-practices) — module structure, bin/ pattern

### Secondary (MEDIUM confidence)
- davila7/claude-code-templates GitHub repo + DeepWiki analysis — reference implementation behavior, open issue patterns
- npmtrends.com — commander vs yargs download volume comparison
- Claude Code directory structure (community docs: eesel.ai, claudefa.st) — file placement targets
- TypeScript/ESM/CJS compatibility blog post (lirantal.com, 2025) — ESM/CJS friction context

### Tertiary (LOW confidence / needs validation at implementation)
- Claude Code `settings.json` schema details — community-documented, not yet verified against official Anthropic source
- raw.githubusercontent.com CDN rate limit behavior — extrapolated from community issue reports and GitHub changelog

---
*Research completed: 2026-02-24*
*Ready for roadmap: yes*

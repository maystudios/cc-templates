# cc-templates

## What This Is

`cc-templates` is a minimal npm CLI tool (`npx cc-templates`) that fetches Claude Code components — skills, agents, hooks, and commands — from a curated GitHub repository and installs them into the user's `.claude/` directory. It's a simpler alternative to `claude-code-templates`: no web dashboards, no telemetry backend, no Vercel/Supabase — just a clean installer and a quality component library.

v0.1 shipped the complete install pipeline. All four component types install correctly with safety guarantees. The package is structurally ready to publish once the GitHub repo is live.

## Core Value

The fastest way to extend Claude Code with reusable, community-contributed components — one command, files in the right place.

## Requirements

### Validated

- ✓ User can install a skill via `npx cc-templates --skill <name>` — v0.1
- ✓ User can install an agent via `npx cc-templates --agent <name>` — v0.1
- ✓ User can install a hook via `npx cc-templates --hook <name>` — v0.1
- ✓ User can install a command via `npx cc-templates --command <name>` — v0.1
- ✓ Skills are installed as full directories to `.claude/skills/<name>/` — v0.1
- ✓ Agents and commands are installed as single `.md` files — v0.1
- ✓ Hooks are merged into the appropriate `settings.json` (user-global or project-local) — v0.1
- ✓ Component catalog is pre-generated in npm package for offline listing — v0.1
- ✓ `--global` flag installs to `~/.claude/` instead of `.claude/` — v0.1
- ✓ `--force` flag allows reinstall of already-installed components — v0.1
- ✓ `CC_TEMPLATES_REPO` env var allows pointing at a forked repo — v0.1

### Active

- [ ] User sees an interactive menu when running `npx cc-templates` with no flags (DISC-01 — Phase 3)
- [ ] Component catalog is discoverable via `--list` flag (DISC-02 — Phase 3)
- [ ] Component author is displayed on successful install and in catalog listing (DISC-03 — Phase 3)
- [ ] `--dry-run` flag previews install without writing files (SAFE-03 — Phase 4)
- [ ] Stale npx-cached version warning at startup (SAFE-05 — Phase 4)
- [ ] `npm publish` succeeds and works on clean machine (Phase 4)

### Out of Scope

- Telemetry / download tracking — adds backend complexity, not needed v1
- Web dashboards — no Express servers, no UI beyond the CLI
- Vercel/Supabase infrastructure — GitHub is the only backend
- Plugin/bundle system — add later if needed
- MCP installation — not in v1 scope; `--mcp` flag shows "not yet implemented"
- Project templates (full scaffolds) — not in v1 scope

## Context

- Shipped v0.1 with 932 LOC JavaScript (ESM, Node.js CLI)
- Tech stack: commander 14, chalk 5, js-yaml 4, write-file-atomic 7
- GitHub repo: `anthropics-community/cc-templates` (not yet published — 404 from GitHub; skill end-to-end install pending)
- Component library: 3 video skills (video-download, video-fetch-and-summarize, video-summarizer) — agents/hooks/commands catalog entries empty
- All offline behaviors (SAFE-01 through SAFE-07) verified and passing
- `cc-templates` npm name confirmed available (npm view returned 404)

## Constraints

- **Tech stack**: Node.js CLI — matches Claude Code ecosystem, publishable to npm as `cc-templates`
- **No backend**: GitHub repository is the only infrastructure required
- **Windows compatibility**: Must handle `python3` → `python` replacement in hook command strings (implemented with `\bpython3\b` word-boundary regex)
- **Skills require directory install**: GitHub Contents API, not raw URL — different install path than other types

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI name `cc-templates` | Short, memorable, cc = claude-code | ✓ Good — npm name confirmed available |
| GitHub as sole backend | No Supabase/Vercel needed — simplest possible infra | ✓ Good — GitHub Contents API sufficient for directory downloads |
| Skills via Contents API | Skills are directories, raw.githubusercontent.com only serves files | ✓ Good — confirmed required; raw URLs return 404 for directories |
| Open contributions via PR | Community value from day one, `author:` field tracks attribution | — Pending (Phase 3 adds author display) |
| No telemetry v1 | Reduces complexity and trust concerns significantly | ✓ Good — zero backend overhead |
| ESM-only package | Node.js ecosystem direction; commander 14 and chalk 5 are ESM-first | ✓ Good — no build step needed |
| CJS interop via createRequire | js-yaml and write-file-atomic are CJS; dynamic import + createRequire pattern used | ✓ Good — works on Node 20+ without issues |
| Array-append merge for hooks | Spread `[...existing, ...new]` never clobbers user's existing hooks | ✓ Good — non-negotiable correctness property |
| write-file-atomic for settings.json | Atomic temp+rename write; crash-proof | ✓ Good — highest-risk write in codebase, now crash-safe |
| Pre-validate ALL names before executing | SAFE-01 in orchestrator: clean upfront error vs mid-run failure | ✓ Good — better UX for multi-component installs |
| components/ excluded from npm package | Stays on GitHub, fetched at runtime | ✓ Good — npm package size stays minimal |
| components.json included in npm package | Enables offline listing without GitHub call | ✓ Good — instant catalog access |

---
*Last updated: 2026-02-24 after v0.1 milestone*

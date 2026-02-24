# cc-templates

## What This Is

`cc-templates` is a minimal npm CLI tool (`npx cc-templates`) that fetches Claude Code components — skills, agents, hooks, and commands — from a curated GitHub repository and installs them into the user's `.claude/` directory. It's a simpler alternative to `claude-code-templates`: no web dashboards, no telemetry backend, no Vercel/Supabase — just a clean installer and a quality component library.

## Core Value

The fastest way to extend Claude Code with reusable, community-contributed components — one command, files in the right place.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] User can install a skill via `npx cc-templates --skill <name>`
- [ ] User can install an agent via `npx cc-templates --agent <name>`
- [ ] User can install a hook via `npx cc-templates --hook <name>`
- [ ] User can install a command via `npx cc-templates --command <name>`
- [ ] User sees an interactive menu when running `npx cc-templates` with no flags
- [ ] Skills are installed as full directories to `.claude/skills/<name>/`
- [ ] Agents and commands are installed as single `.md` files to `.claude/agents/` and `.claude/commands/`
- [ ] Hooks are merged into the appropriate `settings.json` (user-global or project-local)
- [ ] Component catalog is discoverable (list available components)
- [ ] Community can contribute components via GitHub PR with `author:` field in frontmatter

### Out of Scope

- Telemetry / download tracking — adds backend complexity, not needed v1
- Web dashboards — no Express servers, no UI beyond the CLI
- Vercel/Supabase infrastructure — GitHub is the only backend
- Plugin/bundle system — add later if needed
- MCP installation — not in v1 scope
- Project templates (full scaffolds) — not in v1 scope

## Context

- Reference implementation studied: `davila7/claude-code-templates` v1.28.16
- GitHub repo: `maystudios/cc-templates` (source of truth for all components)
- First content ready to publish: 3 video skills in `~/.claude/skills/` (video-download, video-fetch-and-summarize, video-summarizer)
- Skills are the only multi-file component type — require GitHub Contents API recursive download; all others use `raw.githubusercontent.com` direct fetch
- Claude Code natively reads `.claude/agents/`, `.claude/commands/`, `.claude/skills/`, `.claude/settings.json` — the CLI is purely a file placement tool

## Constraints

- **Tech stack**: Node.js CLI — matches Claude Code ecosystem, publishable to npm as `cc-templates`
- **No backend**: GitHub repository is the only infrastructure required
- **Windows compatibility**: Must handle `python3` → `python` replacement in hook command strings (like the reference implementation)
- **Skills require directory install**: GitHub Contents API, not raw URL — different install path than other types

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| CLI name `cc-templates` | Short, memorable, cc = claude-code | — Pending |
| GitHub as sole backend | No Supabase/Vercel needed — simplest possible infra | — Pending |
| Skills via Contents API | Skills are directories, raw.githubusercontent.com only serves files | — Pending |
| Open contributions via PR | Community value from day one, `author:` field tracks attribution | — Pending |
| No telemetry v1 | Reduces complexity and trust concerns significantly | — Pending |

---
*Last updated: 2026-02-24 after initialization*

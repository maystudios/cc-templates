# Feature Research

**Domain:** npm CLI tool — Claude Code component installer
**Researched:** 2026-02-24
**Confidence:** HIGH (project requirements verified from PROJECT.md; competitor behavior verified from davila7/claude-code-templates and shadcn/ui CLI; UX standards verified from clig.dev)

---

## Feature Landscape

### Table Stakes (Users Expect These)

Features users assume exist. Missing these = product feels incomplete or broken. These are the minimum bar set by tools like shadcn/ui CLI and davila7/claude-code-templates that developers already use.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| Flag-based install (`--skill`, `--agent`, `--hook`, `--command`) | Every comparable tool (shadcn `add`, cct `--agent`) offers this; devs expect one-liner installs for scripting and docs | LOW | Four flags map to four component types. Skills require GitHub Contents API (directory download); others use raw.githubusercontent.com direct fetch. This is the only technically divergent path. |
| Interactive menu (no-flag invocation) | shadcn and cct both launch interactive mode when no flags given; devs expect `npx cc-templates` to "just work" and show options | MEDIUM | Inquirer.js or @clack/prompts for arrow-key navigation. Menu must list component types, then list available components in that type. Two-level drill-down. |
| Component catalog listing | Users need to know what exists before they can install it. `shadcn list` and cct's web dashboard both serve this need. | LOW | Fetch `components.json` (or equivalent index) from GitHub repo. Display categorized list. Can be inline in interactive menu or `--list` flag. |
| Clear error when component not found | When `--skill nonexistent` is run, the tool must explain what went wrong AND show what's available. cct does this with `showAvailableAgents()` on 404. Absence is a support burden. | LOW | On 404 from GitHub API: print "Component 'X' not found", then list available components of that type. Exit code 1. |
| `--yes` / `-y` flag (skip confirmation) | CI/CD pipelines and scripted installs need non-interactive mode. shadcn `-y`, cct `--yes` both offer this. Without it, automation breaks. | LOW | Bypass all prompts, use safe defaults. Do not overwrite unless `--overwrite` is also set. |
| Correct file placement | Users trust the tool to put files exactly where Claude Code expects them. Wrong paths = silent failure (Claude Code ignores the file). | LOW | Skills → `.claude/skills/<name>/`, Agents → `.claude/agents/<name>.md`, Commands → `.claude/commands/<name>.md`, Hooks → merge into `.claude/settings.json` or `~/.claude/settings.json`. |
| Hooks merge (not overwrite) | Hooks live in `settings.json` alongside other config. Overwriting the file destroys existing hooks. cct uses deep merge. Users expect additive behavior. | MEDIUM | Parse existing `settings.json`, deep-merge hook entries, write back. Handle both project-local (`.claude/settings.json`) and user-global (`~/.claude/settings.json`). |
| Success feedback | After install, tell the user what was installed and where. Absence leaves users uncertain whether the tool worked. | LOW | Print "Installed skill 'video-download' to .claude/skills/video-download/" on completion. |
| Windows compatibility | Windows users in the Claude Code ecosystem are real. The reference implementation has a `python3` → `python` replacement for hook command strings. | LOW | String replacement pass on hook command values before writing. Not complex — one targeted transform. |

### Differentiators (Competitive Advantage)

Features that set cc-templates apart from davila7/claude-code-templates specifically. The competitor has 600+ agents, an analytics dashboard, web UI, Cloudflare tunnels, MCP support, and real-time monitoring — all of which add complexity. Our differentiation is radical simplicity.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Zero-backend architecture | No Supabase, no Vercel, no `aitmpl.com`. GitHub IS the backend. Users can fork the component repo and point at their own copy. Full transparency, no dependency on external services that can go down or change pricing. | LOW | All fetches target `raw.githubusercontent.com` or the GitHub Contents API. One env var override (`CC_TEMPLATES_REPO`) is enough to support forks. |
| Minimal dependency footprint | Fast `npx` cold-start. cct loads a 2MB `components.json`, launches Express servers, integrates Cloudflare tunnels. cc-templates does none of this. Cold install is seconds, not tens of seconds. | LOW | Target <5 production npm dependencies (commander/yargs, inquirer/@clack, node-fetch or native fetch, fs-extra). Measure startup time in CI. |
| Community attribution in frontmatter | `author:` field in component frontmatter is displayed on install and listing. Makes contributors visible, encourages quality contributions. cct tracks downloads server-side; we do attribution statically via metadata. | LOW | Read YAML frontmatter from component `.md` file. Display `author:` in install output. Zero backend required. |
| Dry-run mode (`--dry-run`) | Shows exactly what would be installed and where WITHOUT writing any files. Standard in package managers (rsync, Ansible, apt). Absent from cct. Gives users confidence before committing, especially for hooks that mutate `settings.json`. | LOW | Print "Would install to: .claude/skills/video-download/" and list files, then exit 0. No GitHub API calls needed beyond fetching the manifest. |
| Scoped install target (`--global` / project-local default) | Agents and commands can live at `~/.claude/` (user-global) or `.claude/` (project-local). Default to project-local. `--global` flag installs to user's home directory. Respects Claude Code's own scoping model. | LOW | Prepend `os.homedir() + '/.claude/'` vs `process.cwd() + '/.claude/'` based on flag. |
| Readable, human-first output | No walls of JSON, no progress spinners that obscure errors. clig.dev standard: use color intentionally, put critical info last, rewrite caught errors for humans. Competitor output is verbose and dashboard-oriented. | LOW | chalk for color, clear section headers, error messages that say what to do next. |

### Anti-Features (Commonly Requested, Often Problematic)

Features that seem like natural additions but would undermine the "simpler than cct" value proposition. Treat this list as a scope defense document.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Web dashboard / browser UI | Competitor has one; users assume it's needed for discoverability | Requires Express server, port management, process lifecycle; breaks the "pure CLI" model; adds startup latency | Interactive terminal menu (inquirer) serves discovery; GitHub repo is browsable directly |
| Download telemetry / analytics | Useful for knowing which components are popular | Requires a backend (Supabase, Vercel, or similar); adds trust concerns (what data is sent?); contradicts zero-backend goal | GitHub traffic insights on the template repo are sufficient for v1 maintainer visibility |
| MCP installation | Natural extension of component types | MCP config is JSON-in-`claude_desktop_config.json`, different from Claude Code's `.claude/` files; different install target, different merge semantics; separate concern | Out of scope v1 per PROJECT.md; document as known extension point |
| Plugin / bundle system | Install a curated "stack" of components at once | Bundles create hidden coupling; when one component in a bundle conflicts, the whole install fails; harder to audit what was installed | Users can run multiple `npx cc-templates` commands; scripts trivially handle batching |
| Real-time update notifications | "Is there a newer version of this skill?" | Requires polling GitHub API on every run; adds latency; rate limit risk; network failure degrades all installs | Pin component version in frontmatter; user re-runs install to update; explicit `--update` flag is sufficient |
| Rollback / uninstall | "I want to undo what I installed" | State tracking requires a lockfile or registry; complex edge cases (hooks merged into settings.json are hard to reverse); maintenance burden | Document manual removal in README; hooks section in settings.json is easy to find and edit |
| Project templates (full scaffold) | "Generate a whole `.claude/` setup" | Different feature category; competes with `claude init`; requires opinionated decisions about full project structure | Defer to v2; a separate `--init` command could call multiple installs in sequence |
| Version pinning per component | Install skill at version X, not latest | Requires git tag strategy across the component repo; complex resolver; most component consumers want latest | Default to latest from main branch; power users can fork and use `CC_TEMPLATES_REPO` to pin |

---

## Feature Dependencies

```
[Flag-based install]
    └──requires──> [Correct file placement logic]
                       └──requires──> [GitHub fetch layer]
                                          └──requires──> [Skills: Contents API path]
                                          └──requires──> [Others: raw.githubusercontent.com path]

[Interactive menu]
    └──requires──> [Component catalog listing]
                       └──requires──> [GitHub fetch layer]
    └──enhances──> [Component catalog listing]

[Dry-run mode]
    └──requires──> [GitHub fetch layer] (manifest fetch only, no write)
    └──enhances──> [Flag-based install] (add --dry-run to any install command)

[Hooks merge]
    └──requires──> [Correct file placement logic]
    └──requires──> [JSON parse/merge utility]

[--global flag]
    └──enhances──> [Flag-based install]
    └──enhances──> [Interactive menu]

[--yes flag]
    └──enhances──> [Flag-based install]
    └──conflicts──> [Interactive menu] (--yes implies non-interactive; skip prompts entirely)

[Windows compatibility]
    └──requires──> [Correct file placement logic] (path sep handling)
    └──requires──> [Hooks merge] (python3→python transform applied at merge time)

[Community attribution in frontmatter]
    └──requires──> [GitHub fetch layer] (must read frontmatter from component file)
    └──enhances──> [Component catalog listing] (show author in list view)
    └──enhances──> [Flag-based install] (print author on install success)
```

### Dependency Notes

- **Flag-based install requires Correct file placement:** The install logic is the core; flags are just routing to it.
- **Interactive menu requires Component catalog listing:** You cannot present a picker without first knowing what components exist. Catalog fetch must precede menu render.
- **Dry-run enhances Flag-based install:** `--dry-run` is an output mode toggle on the same install pipeline, not a separate code path. The fetch happens; the write does not.
- **Hooks merge requires JSON parse/merge:** This is the single most complex file-write operation in the tool. Deep merge with conflict detection is non-trivial.
- **`--yes` conflicts with Interactive menu:** When `--yes` is set, the interactive menu should not launch. If no component name is provided AND `--yes` is set, exit with an error — "Component name required when using --yes."

---

## MVP Definition

### Launch With (v1)

Minimum viable product — validates that the install mechanism works end-to-end across all four component types.

- [ ] `--skill <name>` — installs skill directory via GitHub Contents API to `.claude/skills/<name>/`
- [ ] `--agent <name>` — installs `.md` file to `.claude/agents/<name>.md`
- [ ] `--command <name>` — installs `.md` file to `.claude/commands/<name>.md`
- [ ] `--hook <name>` — fetches hook definition, deep-merges into `.claude/settings.json`
- [ ] Interactive menu — no-flag invocation shows type picker, then component picker within chosen type
- [ ] Component catalog listing — displayed within interactive menu and on `--list` flag
- [ ] Clear error on 404 — "Component 'X' not found. Available: ..." with exit code 1
- [ ] `--yes` flag — skip all confirmation prompts for CI use
- [ ] Success feedback — print install path on completion
- [ ] Windows compatibility — python3→python transform in hook commands

### Add After Validation (v1.x)

Features to add once core install mechanism is confirmed working.

- [ ] `--dry-run` flag — show what would be installed without writing; add after first user feedback about "I'm scared to run this on my project"
- [ ] `--global` flag — install to `~/.claude/` instead of `.claude/`; add when users request cross-project component sharing
- [ ] `--overwrite` flag — force overwrite without prompt; add when users hit "file already exists" errors
- [ ] Community attribution display — show `author:` in install output and `--list`; add once component repo has multiple contributors
- [ ] `CC_TEMPLATES_REPO` env var override — lets fork users point at their own repo; add when first fork request comes in

### Future Consideration (v2+)

Features to defer until product-market fit is established.

- [ ] `--update` flag — re-fetch and reinstall a component; defer until users ask for it (most will just re-run install)
- [ ] Multi-component install in one command — `--skill a --skill b`; defer until users try and fail with current single-install design
- [ ] Search / filter in interactive menu — fuzzy search within component list; defer until component count exceeds ~50 and scrolling becomes painful
- [ ] Project template scaffolding — `--init` to install a curated starter set; defer to v2, different feature category

---

## Feature Prioritization Matrix

| Feature | User Value | Implementation Cost | Priority |
|---------|------------|---------------------|----------|
| Flag-based install (4 types) | HIGH | MEDIUM (skills path is different) | P1 |
| Correct file placement | HIGH | LOW | P1 |
| Hooks merge (deep merge) | HIGH | MEDIUM | P1 |
| Clear error on 404 + available list | HIGH | LOW | P1 |
| Interactive menu | HIGH | MEDIUM | P1 |
| Component catalog listing | HIGH | LOW | P1 |
| `--yes` flag | HIGH | LOW | P1 |
| Success feedback | HIGH | LOW | P1 |
| Windows compatibility | MEDIUM | LOW | P1 |
| `--dry-run` flag | MEDIUM | LOW | P2 |
| `--global` flag | MEDIUM | LOW | P2 |
| Community attribution display | LOW | LOW | P2 |
| `CC_TEMPLATES_REPO` override | MEDIUM | LOW | P2 |
| `--overwrite` flag | MEDIUM | LOW | P2 |
| Fuzzy search in interactive menu | LOW | MEDIUM | P3 |
| Multi-component single invocation | LOW | LOW | P3 |
| `--update` flag | LOW | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch
- P2: Should have, add when possible
- P3: Nice to have, future consideration

---

## Competitor Feature Analysis

| Feature | davila7/claude-code-templates | shadcn/ui CLI | cc-templates (our approach) |
|---------|-------------------------------|---------------|-----------------------------|
| Flag-based install | Yes (`--agent`, `--command`, etc.) | Yes (`add <component>`) | Yes, same pattern |
| Interactive menu | Yes (inquirer, 5 options) | Yes (checkbox picker) | Yes (two-level: type then component) |
| Component listing | Web dashboard + `--list-agents` | `list` command | `--list` flag + inline in interactive menu |
| Error on not-found | Yes (`showAvailableAgents()` on 404) | Error message only | Error + available list (same as cct) |
| `--yes` flag | Yes | Yes (`-y`) | Yes |
| Dry-run | No | No | Yes (differentiator) |
| Overwrite control | Implicit (deep merge for settings) | `--overwrite` flag | Prompt by default, `--overwrite` flag |
| Backend required | Yes (Supabase, Vercel, aitmpl.com) | No (copies to project) | No (GitHub only) |
| Hooks install | Yes (settings merge) | N/A | Yes (deep merge) |
| Windows support | Yes (python3→python) | N/A (React UI library) | Yes (same transform) |
| Analytics / monitoring | Yes (major feature) | No | No (anti-feature) |
| MCP installation | Yes | No | No (v1 out of scope) |
| Attribution/author | No (server-side tracking) | No | Yes (frontmatter, static) |

---

## Sources

- davila7/claude-code-templates GitHub: https://github.com/davila7/claude-code-templates (MEDIUM confidence — official repo, verified via DeepWiki overview)
- shadcn/ui CLI docs: https://ui.shadcn.com/docs/cli (HIGH confidence — official docs)
- clig.dev CLI UX standards: https://clig.dev/ (HIGH confidence — canonical reference for CLI UX patterns)
- Claude Code directory structure: https://www.eesel.ai/blog/settings-json-claude-code and https://claudefa.st/blog/guide/settings-reference (MEDIUM confidence — community docs, consistent with PROJECT.md constraints)
- Inquirer.js: https://github.com/SBoudrias/Inquirer.js (HIGH confidence — official repo)
- Node.js CLI best practices: https://github.com/lirantal/nodejs-cli-apps-best-practices (MEDIUM confidence — widely referenced community standard)
- PROJECT.md requirements (this repo): verified, HIGH confidence baseline

---
*Feature research for: cc-templates — Claude Code component installer CLI*
*Researched: 2026-02-24*

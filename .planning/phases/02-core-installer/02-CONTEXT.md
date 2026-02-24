# Phase 2: Core Installer - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Install any of the four component types (skills, hooks, commands, MCPs) via CLI flags with full safety guarantees — no data loss, no silent overwrites, no Windows failures. Discovery UX (interactive menu, --list) is Phase 3. Dry-run and stale-version checks are Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Conflict behavior
- Default: abort with a one-liner warning when component already exists ("video-download already installed. Use --force to overwrite.")
- `--force` overwrites but prints a warning listing which files will be replaced before replacing them
- When a component name is not found in the catalog, error message lists all available components of that type inline

### Output & feedback
- Successful install prints one-line summary: "Installed video-download skill to .claude/skills/video-download/"
- `--verbose` flag shows each file copied and any merge decisions made
- Colors with auto-detection — colored output when terminal supports it, plain text in CI/piped contexts
- After successful install, include a brief one-line usage hint (e.g. "Use this skill in Claude Code with /video-download")

### Hook merge strategy
- Hooks are appended to the array in settings.json — new hooks for the same event run alongside existing ones (no replacement)
- If settings.json does not exist, create it with only the installed hook (no extra structure)
- If settings.json exists but is malformed JSON, abort with a clear error message — do not touch the file
- After merge, confirm what keys were added (e.g. "Added PreToolUse hook to settings.json"); verbose mode shows exact keys written

### Multi-install support
- Multiple flags in a single invocation are supported: `npx cc-templates --skill video-download --hook pre-commit`
- Mixed component types in one command are allowed — installer handles each type appropriately
- Fail fast on first error — stop the entire invocation at first failure, report which component failed and why

### Claude's Discretion
- Exact progress indication during file copy
- Specific colors used for each output state (success, warning, error)
- Exact format of the --verbose file-by-file output
- Temp file handling during install

</decisions>

<specifics>
## Specific Ideas

- CI compatibility is a first-class concern: `--yes` suppresses all interactive prompts, plain text output when piped
- The conflict warning should be scannable in one glance — no multi-line blocks for the common case

</specifics>

<deferred>
## Deferred Ideas

- Config file install (`cc-templates.json` or `--from-file` flag) — new capability, belongs in a future phase or backlog

</deferred>

---

*Phase: 02-core-installer*
*Context gathered: 2026-02-24*

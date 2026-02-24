# Phase 3: Discovery UX - Context

**Gathered:** 2026-02-24
**Status:** Ready for planning

<domain>
## Phase Boundary

Interactive component discovery via two paths: an arrow-key menu (`npx cc-templates` with no flags) and a catalog listing (`--list` flag). Users can find and install components without knowing names in advance. Creating posts and interactions are out of scope.

</domain>

<decisions>
## Implementation Decisions

### Interactive menu navigation
- Two-level navigation: first pick a component type (skills, hooks, agents, commands), then browse components within that type
- Immediate install on Enter — no confirmation step
- Ctrl+C or Escape exits cleanly with no install and no error message
- Component list (second level) shows name + short description per item
- Back navigation via Escape or a "← Back" item to return to type selection from the component list

### Menu search & filtering
- Type-to-filter enabled on the component list level only (not on type selection — too few items there)
- Filter matches on both component name and description
- Real-time narrowing as user types

### --list output format
- Grouped by type with section headers (e.g., `## Skills`, `## Hooks`)
- Each entry shows: name + description + author attribution
- Colors when output is a TTY, plain text when piped
- Summary count at the bottom: e.g., "14 components available across 4 types"

### Post-install output
- Author attribution inline in the success line: `✓ gsd-executor installed  by maxsim`
- List created/modified files below the success line
- No next-step hints or usage suggestions
- Menu exits after install — single install per session, run again if you want more

### Claude's Discretion
- Exact color palette and styling choices
- Library selection for interactive menu (e.g., Inquirer.js, @inquirer/prompts, clack)
- Column alignment and spacing in --list output
- Exact "Back" item label and positioning within the component list

</decisions>

<specifics>
## Specific Ideas

- No specific references — open to standard CLI UX conventions
- The two-level menu structure mirrors how components.json already groups components by type

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-discovery-ux*
*Context gathered: 2026-02-24*

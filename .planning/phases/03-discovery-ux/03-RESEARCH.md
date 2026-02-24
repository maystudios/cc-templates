# Phase 3: Discovery UX - Research

**Researched:** 2026-02-24
**Domain:** Node.js CLI interactive prompts, TTY-aware output formatting, commander no-args routing
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:**
Interactive component discovery via two paths: an arrow-key menu (`npx cc-templates` with no flags) and a catalog listing (`--list` flag). Users can find and install components without knowing names in advance. Creating posts and interactions are out of scope.

**Interactive menu navigation:**
- Two-level navigation: first pick a component type (skills, hooks, agents, commands), then browse components within that type
- Immediate install on Enter — no confirmation step
- Ctrl+C or Escape exits cleanly with no install and no error message
- Component list (second level) shows name + short description per item
- Back navigation via Escape or a "← Back" item to return to type selection from the component list

**Menu search & filtering:**
- Type-to-filter enabled on the component list level only (not on type selection — too few items there)
- Filter matches on both component name and description
- Real-time narrowing as user types

**--list output format:**
- Grouped by type with section headers (e.g., `## Skills`, `## Hooks`)
- Each entry shows: name + description + author attribution
- Colors when output is a TTY, plain text when piped
- Summary count at the bottom: e.g., "14 components available across 4 types"

**Post-install output:**
- Author attribution inline in the success line: `✓ gsd-executor installed  by maxsim`
- List created/modified files below the success line
- No next-step hints or usage suggestions
- Menu exits after install — single install per session, run again if you want more

### Claude's Discretion

- Exact color palette and styling choices
- Library selection for interactive menu (e.g., Inquirer.js, @inquirer/prompts, clack)
- Column alignment and spacing in --list output
- Exact "Back" item label and positioning within the component list

### Deferred Ideas (OUT OF SCOPE)

- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| DISC-01 | User sees an interactive two-level component picker when running `npx cc-templates` with no flags | `@inquirer/select` (level 1 type picker) + `@inquirer/search` (level 2 filter-enabled component list); commander no-flags branch in `src/cli.ts` routes to `runMenu()` |
| DISC-02 | User can list all available components with descriptions and authors via `--list` flag | `catalog.ts` `getAvailable()` already returns `CatalogEntry[]` with name/description/author; `--list` stub in `src/cli.ts` is replaced with grouped, TTY-aware output using chalk 5 |
| DISC-03 | User sees the component `author` field displayed on successful install | `validateName()` already returns the `CatalogEntry` (including `author`); installers receive the entry and append `by <author>` to the success line |
</phase_requirements>

---

## Summary

Phase 3 adds two UX surfaces to the existing TypeScript CLI. The codebase entering this phase is clean: all source is TypeScript (`src/*.ts`, `src/installers/*.ts`), compiled to `dist/` via `tsc`, with chalk 5, commander 14, and write-file-atomic already installed. The `catalog.ts` module already exposes `CatalogEntry` (name, description, author, version, tags) via `validateName()`, and `getAvailable()`. Both surfaces need only thin new code on top of what already exists.

For the interactive menu (DISC-01), the recommended approach is `@inquirer/select` for the first level (type selection) and `@inquirer/search` for the second level (component selection with live filtering). Both are ESM-native, work on Node 22, and are part of the same `@inquirer/prompts` v8.3.0 bundle. The two-level loop is implemented in a new `src/menu.ts` module: run `select` to get a type, then run `search` for that type's components, with a special "← Back" item in the search list that re-runs the outer loop. Ctrl+C and Escape are handled by catching the `ExitPromptError` that `@inquirer/prompts` throws on forced exit.

For the `--list` output (DISC-02), no new libraries are needed — chalk 5 (already installed) provides section-header styling, and `process.stdout.isTTY` provides the TTY gate. For author attribution on install (DISC-03), `validateName()` already returns the `CatalogEntry`; the installers need to accept and use this entry to replace `output.hint(...)` with an inline `by <author>` suffix on the `output.success(...)` line.

**Primary recommendation:** Add `@inquirer/prompts` as a production dependency, implement `src/menu.ts` for the two-level loop, update `src/cli.ts` to route no-args to `runMenu()`, update `--list` handling in `src/cli.ts`, and update all four installers to accept + display the `CatalogEntry.author` field.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@inquirer/prompts` | ^8.3.0 | Provides `select` (arrow-key list) and `search` (type-to-filter list) prompts | ESM-native, Node 22 compatible, single bundle for both prompt types needed; 4400+ dependents; actively maintained by the same author as `inquirer` |
| `chalk` | ^5.4.1 (already installed) | Section headers and colored output in `--list`; TTY auto-detection | Already in `package.json`; chalk 5 suppresses colors automatically in non-TTY contexts via `supports-color` |
| `commander` | ^14.0.0 (already installed) | No-args routing: check `opts` post-parse, launch `runMenu()` | Pattern: `if (!hasAnyFlag) { await runMenu(); }` in `src/cli.ts` |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:tty` (built-in) | Node 22 | `process.stdout.isTTY` for plain-text mode in `--list` | Use to gate chalk styling; already handled by chalk 5 automatically, but explicit check needed for structural decisions (e.g., whether to emit section headers at all) |
| `node:process` (built-in) | Node 22 | `process.exitCode = 0` on clean Ctrl+C exit | Ensures no non-zero exit on user cancel from menu |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@inquirer/prompts` | `@clack/prompts` v1.0.1 | clack is ESM-only (.mjs only), smaller, prettier defaults — but `select` has no built-in search/filter; implementing type-to-filter requires custom code. Inquirer's `@inquirer/search` is the exact primitive needed for DISC-01's type-to-filter requirement. Use clack only if custom filter logic is acceptable. |
| `@inquirer/prompts` | `enquirer` | enquirer is older, not as actively maintained, has CJS-first module resolution issues in Node 22 ESM context. |
| `@inquirer/search` for level 2 | `@inquirer/select` with manual key handler | `@inquirer/search` is the correct primitive: source function filters on every keystroke, results update live. Manual key handling would require `@inquirer/core` directly — unnecessary complexity. |

**Installation:**
```bash
npm install @inquirer/prompts
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── cli.ts            # existing — add no-args → runMenu() branch; update --list handler
├── menu.ts           # NEW — two-level interactive menu loop (DISC-01)
├── list.ts           # NEW — --list formatted output (DISC-02)
├── catalog.ts        # existing — getAvailable() already works; no changes needed
├── output.ts         # existing — success() signature extended to accept optional author
├── install.ts        # existing — minor: pass CatalogEntry to installers
├── types.ts          # existing — no changes needed (CatalogEntry already has author field)
└── installers/
    ├── skill.ts      # update: accept entry, show author in success line (DISC-03)
    ├── agent.ts      # update: same
    ├── command.ts    # update: same
    └── hook.ts       # update: same
```

### Pattern 1: Two-Level Menu Loop (DISC-01)

**What:** Run `select` to pick a component type, then `search` to pick a component within that type. A special "← Back" choice in the search prompt re-runs the outer loop. Install on Enter with no confirmation.
**When to use:** When no flags are passed to the CLI (`npx cc-templates` with no arguments).

```typescript
// src/menu.ts
import { select, search, Separator } from '@inquirer/prompts';
import { getAvailable } from './catalog.js';
import { runInstall } from './install.js';
import type { ComponentType } from './types.js';

const COMPONENT_TYPES: Array<{ label: string; type: ComponentType }> = [
  { label: 'Skills',   type: 'skill' },
  { label: 'Agents',   type: 'agent' },
  { label: 'Commands', type: 'command' },
  { label: 'Hooks',    type: 'hook' },
];

export async function runMenu(): Promise<void> {
  // Outer loop: type selection
  while (true) {
    const chosenType = await select<ComponentType | '_back'>({
      message: 'What type of component do you want to install?',
      choices: COMPONENT_TYPES.map(({ label, type }) => ({ name: label, value: type })),
    });

    // Inner level: component selection with search/filter
    const entries = getAvailable(chosenType as ComponentType);
    const BACK_VALUE = '__back__' as const;

    const chosenName = await search<string | typeof BACK_VALUE>({
      message: `Pick a ${chosenType} to install`,
      source: (input) => {
        const term = (input ?? '').toLowerCase();
        const filtered = entries.filter(e =>
          !term ||
          (e.name ?? '').toLowerCase().includes(term) ||
          (e.description ?? '').toLowerCase().includes(term)
        );
        const choices = filtered.map(e => ({
          name: e.name ?? '',
          value: e.name ?? '',
          description: e.description ?? '',
        }));
        return Promise.resolve([
          { name: '← Back', value: BACK_VALUE },
          new Separator(),
          ...choices,
        ]);
      },
    });

    if (chosenName === BACK_VALUE) {
      continue; // re-run outer type picker
    }

    // Immediate install — no confirmation (locked decision)
    await runInstall({ [chosenType as ComponentType]: chosenName });
    break; // single install per session
  }
}
```

**Key detail:** `@inquirer/prompts` exports `Separator` for visual dividers between the Back item and the component list.

### Pattern 2: Escape / Ctrl+C Clean Exit

**What:** Catch the `ExitPromptError` thrown by `@inquirer/prompts` on Ctrl+C or Escape, exit 0 silently.
**When to use:** Wrap the entire `runMenu()` call in `src/cli.ts`.

```typescript
// src/cli.ts — no-args branch
import { ExitPromptError } from '@inquirer/prompts';

// ...inside run():
if (!hasAnyFlag) {
  try {
    await runMenu();
  } catch (err) {
    if (err instanceof ExitPromptError) {
      process.exitCode = 0; // clean exit, no message (locked decision)
      return;
    }
    throw err; // unexpected error — let it surface
  }
  return;
}
```

**Critical:** `ExitPromptError` is the named export from `@inquirer/prompts` that fires on Ctrl+C or forced close. Do NOT call `process.exit()` from within `runMenu()` — let the error propagate to `cli.ts` where it is handled once.

### Pattern 3: --list Grouped Output (DISC-02)

**What:** Loop over all component types, print a section header per type, then each component's name + description + author. Color when TTY, plain text when piped.
**When to use:** Replace the stub in `src/cli.ts` when `opts.list` is true.

```typescript
// src/list.ts
import chalk from 'chalk';
import { getAvailable } from './catalog.js';
import type { ComponentType, CatalogEntry } from './types.js';

const TYPES: ComponentType[] = ['skill', 'agent', 'command', 'hook'];
const TYPE_LABELS: Record<ComponentType, string> = {
  skill: 'Skills', agent: 'Agents', command: 'Commands', hook: 'Hooks', mcp: 'MCP',
};

export function printList(): void {
  const isTTY = Boolean(process.stdout.isTTY);
  let total = 0;
  let typeCount = 0;

  for (const type of TYPES) {
    const entries = getAvailable(type);
    if (entries.length === 0) continue;

    typeCount++;
    total += entries.length;

    // Section header
    const header = `## ${TYPE_LABELS[type]}`;
    console.log(isTTY ? chalk.bold(header) : header);
    console.log();

    for (const entry of entries) {
      const name = entry.name ?? '(unknown)';
      const desc = entry.description ?? '';
      const author = entry.author ? `  by ${entry.author}` : '';

      if (isTTY) {
        console.log(`  ${chalk.cyan(name)}${chalk.dim(author)}`);
        if (desc) console.log(`    ${chalk.dim(desc)}`);
      } else {
        console.log(`  ${name}${author}`);
        if (desc) console.log(`    ${desc}`);
      }
    }
    console.log();
  }

  // Summary count (locked decision)
  const summary = `${total} component${total !== 1 ? 's' : ''} available across ${typeCount} type${typeCount !== 1 ? 's' : ''}`;
  console.log(isTTY ? chalk.dim(summary) : summary);
}
```

### Pattern 4: Author Attribution on Install (DISC-03)

**What:** `validateName()` already returns `CatalogEntry` (which includes `author`). Pass the entry into the installer; print `✓ <name> installed  by <author>` on the success line.
**When to use:** All four installers (`skill.ts`, `agent.ts`, `command.ts`, `hook.ts`).

```typescript
// src/installers/agent.ts — updated success output
const entry = validateName('agent', name); // already returns CatalogEntry
// ... (existing install logic unchanged) ...

const authorSuffix = entry.author ? `  by ${entry.author}` : '';
output.success(`${name} installed to ${displayPath}${authorSuffix}`);
// No output.hint() — locked decision: no next-step hints after menu install
```

**Notes:**
- `validateName()` is already called at the top of each installer (SAFE-01). It now also returns the entry — use the return value rather than calling it twice.
- The `output.success()` signature does not need to change; the `by` suffix is just part of the message string.
- The Phase 2 `output.hint(...)` calls ("Use this skill in Claude Code with /name") must be **removed** per the locked decision: "No next-step hints or usage suggestions."
- The Phase 2 `install.ts` also calls `validateName()` for pre-flight checks (SAFE-01 batch validation). Align the two call sites: either validate in `install.ts` and pass the entry to the installer, or keep validation inside each installer (current pattern) and accept the slight redundancy. Simpler: keep current per-installer validation pattern — it already works.

### Pattern 5: Commander No-Args Routing

**What:** After `program.parse()`, check whether any component/list flag was set. If none: launch interactive menu.
**When to use:** In `src/cli.ts`.

```typescript
// src/cli.ts — replace the current no-args program.help() call
const opts = program.opts<InstallOptions>();

if (opts.list) {
  printList();
  return;
}

const hasInstallFlag = opts.skill || opts.agent || opts.command || opts.hook || opts.mcp;

if (hasInstallFlag) {
  if (opts.mcp) { /* existing MCP stub */ }
  await runInstall(opts);
  return;
}

// No flags at all — launch interactive menu (DISC-01)
// (replaces: program.help())
try {
  await runMenu();
} catch (err) {
  if (err instanceof ExitPromptError) {
    process.exitCode = 0;
    return;
  }
  throw err;
}
```

### Anti-Patterns to Avoid

- **Calling `process.exit(0)` inside the menu on Ctrl+C:** `@inquirer/prompts` throws `ExitPromptError` on forced exit. Catching it at the `cli.ts` level and returning (not calling `process.exit`) is the correct pattern — allows `process.exitCode = 0` to take effect naturally.
- **Showing `--help` when no flags are given:** The current `program.help()` call at the end of `cli.ts` must be replaced with `runMenu()`. `program.help()` throws internally to exit — it is incompatible with the async menu flow.
- **Calling `validateName()` twice per install:** `install.ts` does a batch pre-flight validation loop, and each installer also calls `validateName()`. This is an acceptable minor redundancy, but do NOT add a third call. Do use the `CatalogEntry` returned by the installer's own `validateName()` call for author attribution.
- **Using plain `console.log` with ANSI codes in `--list`:** Always gate chalk styles behind `isTTY`. chalk 5 auto-suppresses colors when stdout is not a TTY, so `chalk.bold(x)` returns `x` undecorated when piped. This means you can use chalk in the `--list` output directly — but structural elements (empty lines, headers) should still output in piped context for readability.
- **Using `@inquirer/search` for the type-selection level:** Type selection has only 4 items (skills, hooks, agents, commands). Use `@inquirer/select` there — no filtering needed or wanted (locked decision).
- **Not handling empty catalog sections in `--list`:** `getAvailable()` returns `[]` for types with no catalog entries (hooks, commands, mcp are empty in v0.1). Skip empty sections rather than printing an empty header.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Arrow-key selection menu | Custom readline/keypress handler | `@inquirer/select` | readline raw mode + key parsing is 200+ lines of error-prone code; select handles Windows/Unix terminal differences, page scrolling, disabled items |
| Type-to-filter list | Custom keypress + array filter + re-render loop | `@inquirer/search` | Live re-render on every keystroke, AbortSignal for cancel, async source function — all handled internally |
| Ctrl+C / Escape clean exit | `process.on('SIGINT', ...)` | `ExitPromptError` catch in `cli.ts` | `@inquirer/prompts` already normalizes SIGINT and escape into one error class; double-handling with `process.on('SIGINT')` causes race conditions |
| TTY color detection | `process.stdout.isTTY` check + manual ANSI stripping | chalk 5 auto-detection | chalk uses `supports-color` which honors `NO_COLOR`, `FORCE_COLOR`, `CI`, `TERM=dumb` env vars that a manual `isTTY` check misses |

**Key insight:** The interactive menu primitives (`select`, `search`) are exactly what `@inquirer/prompts` was designed for. Any custom terminal prompt implementation at this scale (even a simple two-level picker) risks subtle behavior differences on Windows vs Unix, particularly around raw mode, keypress buffering, and cursor positioning.

---

## Common Pitfalls

### Pitfall 1: `@inquirer/prompts` Requires a TTY — Throws When stdin Is Not Interactive

**What goes wrong:** Running `echo "" | npx cc-templates` (piped stdin, no TTY) makes `@inquirer/prompts` throw an error that looks like a crash rather than a clean "not interactive" message.
**Why it happens:** `@inquirer/prompts` checks `process.stdin.isTTY` at prompt invocation time. When stdin is piped, the prompt has no TTY to bind to.
**How to avoid:** Guard `runMenu()` behind a TTY check in `src/cli.ts`:
```typescript
if (!process.stdin.isTTY) {
  console.error('Interactive menu requires a terminal. Use --help for available flags.');
  process.exit(1);
}
await runMenu();
```
**Warning signs:** Error message like "The process.stdin stream is not a TTY" or "ReadStream.setRawMode is not a function" in non-interactive contexts.

### Pitfall 2: `ExitPromptError` Is Not a Named Export in Older `@inquirer` Versions

**What goes wrong:** `import { ExitPromptError } from '@inquirer/prompts'` fails with "does not provide a named export" if using a version older than ~7.x.
**Why it happens:** `ExitPromptError` was added as a named export in a recent major version of the Inquirer rewrite.
**How to avoid:** Use `@inquirer/prompts` v8.3.0 (current latest). Verify after `npm install` that `ExitPromptError` resolves. Alternative fallback: `catch (err) { if ((err as Error).name === 'ExitPromptError') ... }`.
**Warning signs:** TypeScript compile error "Module '@inquirer/prompts' has no exported member 'ExitPromptError'".

### Pitfall 3: `@inquirer/search` `source` Function Called With `undefined` Initially

**What goes wrong:** On first render (before the user types), `source` is called with `undefined` (or `void`). If the function does `input.toLowerCase()` without a null guard, it throws `TypeError: Cannot read properties of undefined`.
**Why it happens:** `source` signature is `(term: string | void, ...) => Promise<Choice[]>`. The initial call passes `undefined`.
**How to avoid:** Always guard: `const term = (input ?? '').toLowerCase();`. The code example in Pattern 1 above includes this guard.
**Warning signs:** `TypeError: Cannot read properties of undefined (reading 'toLowerCase')` immediately on menu render.

### Pitfall 4: Windows Arrow-Key Issues With Older Inquirer (Not `@inquirer/` Packages)

**What goes wrong:** If the legacy `inquirer` package (not `@inquirer/prompts`) is installed, arrow keys may not work on Windows PowerShell due to a known historical issue.
**Why it happens:** The legacy `inquirer` package has reported issues with arrow key detection on Windows. The new `@inquirer/prompts` v8 rewrote the input handling.
**How to avoid:** Use `@inquirer/prompts` v8.3.0, NOT the legacy `inquirer` package. The new packages use `@inquirer/core` which has resolved the Windows arrow key behavior.
**Warning signs:** Arrow keys print `^[[A` / `^[[B` escape codes to terminal instead of navigating.

### Pitfall 5: `program.help()` Throws — Incompatible With Async Flow

**What goes wrong:** The current `src/cli.ts` ends with `program.help()` as the no-args fallback. `program.help()` calls `process.exit(0)` internally, which is incompatible with `await runMenu()`.
**Why it happens:** Commander's `program.help()` is designed as a terminal call — it prints help and exits. It does not return.
**How to avoid:** Replace `program.help()` with `await runMenu()` (with the TTY guard and ExitPromptError catch). If you want to show help in specific error cases, use `program.outputHelp()` (which returns without exiting) followed by `process.exit(1)`.
**Warning signs:** Menu never shows; process exits immediately with code 0 when no flags are given.

### Pitfall 6: `output.hint()` Still Fires After Menu Install

**What goes wrong:** The existing installers call `output.hint('Use this skill in Claude Code with /name')` after every install. After Phase 3, the locked decision says: "No next-step hints or usage suggestions."
**Why it happens:** The `output.hint()` lines were added as a Phase 2 decision. Phase 3 changes the post-install UX.
**How to avoid:** Remove all `output.hint()` calls from all four installers during Phase 3. Replace with the `by <author>` suffix on the `output.success()` line.
**Warning signs:** Tests pass but user sees the "Use this skill..." hint they shouldn't see. Verify by running an install and checking the output format against the locked decision.

---

## Code Examples

Verified patterns from official sources and the existing codebase:

### Two-Level Menu: select + search (DISC-01)

```typescript
// Source: @inquirer/prompts v8.3.0 README; verified API signatures
import { select, search, Separator, ExitPromptError } from '@inquirer/prompts';

// Level 1: plain select (no filter — 4 types is too few to need it)
const type = await select<ComponentType>({
  message: 'What type of component?',
  choices: [
    { name: 'Skills',   value: 'skill' as ComponentType },
    { name: 'Agents',   value: 'agent' as ComponentType },
    { name: 'Commands', value: 'command' as ComponentType },
    { name: 'Hooks',    value: 'hook' as ComponentType },
  ],
});

// Level 2: search prompt with live filter
const name = await search<string>({
  message: `Pick a ${type}`,
  source: async (input) => {
    const term = (input ?? '').toLowerCase();
    return entries
      .filter(e => !term
        || (e.name ?? '').toLowerCase().includes(term)
        || (e.description ?? '').toLowerCase().includes(term)
      )
      .map(e => ({
        name: `${e.name}`,
        value: e.name ?? '',
        description: e.description ?? undefined,
      }));
  },
});
```

### TTY-Aware --list Output (DISC-02)

```typescript
// Source: Node.js docs process.stdout.isTTY + chalk 5 auto-detection
const isTTY = Boolean(process.stdout.isTTY);

// chalk 5 suppresses ANSI when stdout is not a TTY automatically;
// the explicit isTTY check is only needed for structural decisions
const header = `## Skills`;
console.log(isTTY ? chalk.bold.underline(header) : header);

// chalk.cyan('name') → 'name' (plain) when piped
console.log(`  ${chalk.cyan(name)}${chalk.dim(`  by ${author}`)}`);
```

### Author Attribution (DISC-03)

```typescript
// Source: existing src/catalog.ts — validateName() already returns CatalogEntry
// CatalogEntry.author: string | null (from src/types.ts)

const entry = validateName('skill', name); // returns CatalogEntry
// ...install logic...
const authorSuffix = entry.author ? `  by ${entry.author}` : '';
output.success(`${name} installed to ${displayPath}${authorSuffix}`);
// Remove: output.hint(...) — locked decision says no hints
```

### Clean Exit on Ctrl+C (DISC-01)

```typescript
// Source: @inquirer/prompts ExitPromptError named export
import { ExitPromptError } from '@inquirer/prompts';

try {
  await runMenu();
} catch (err) {
  if (err instanceof ExitPromptError) {
    // User pressed Ctrl+C or Escape — clean exit, no message (locked decision)
    process.exitCode = 0;
    return;
  }
  throw err;
}
```

### TTY Guard Before Launching Menu

```typescript
// Source: Node.js docs process.stdin.isTTY
// Prevents crash when stdin is piped (e.g., in CI or script context)
if (!process.stdin.isTTY) {
  console.error('Interactive menu requires a terminal. Run with --help for usage.');
  process.exit(1);
}
await runMenu();
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `inquirer` (legacy monolith) | `@inquirer/prompts` (modular rewrite) | ~2023; current v8.3.0 | ESM-native, smaller, `select` and `search` as separate composable modules |
| `process.on('SIGINT', handler)` for Ctrl+C | Catch `ExitPromptError` from `@inquirer/prompts` | New `@inquirer` rewrite | Single catch point per prompt flow; no global signal handler race condition |
| Manual ASCII column formatting | chalk 5 auto-detection for `--list` | chalk 5 (2022); TTY detection unchanged | chalk suppresses ANSI automatically; `isTTY` check still needed for structural layout |
| `program.help()` as no-args fallback | `runMenu()` call in no-args branch | Phase 3 change | `program.help()` exits immediately; must be replaced, not augmented |

**Deprecated/outdated in this context:**
- `inquirer` (legacy, not `@inquirer/prompts`): Do not install this. The `@inquirer/prompts` v8.x namespace rewrite is the current standard.
- `clack`: Valid choice for simpler CLIs without search requirements, but does not provide a built-in filter/search select primitive. Not the right fit for DISC-01's type-to-filter requirement.
- `readline.createInterface` + manual keypress: Correct primitive in Node.js, but too low-level for this use case. 100+ lines to re-implement what `@inquirer/select` provides in 2 lines.

---

## Open Questions

1. **`@inquirer/search`: Does the "← Back" choice work cleanly alongside a `Separator`?**
   - What we know: `search()` accepts `Promise<Array<Choice | Separator>>` from the source function; `Separator` is a named export from `@inquirer/prompts`. The "← Back" item can be placed before a Separator.
   - What's unclear: Whether clicking "← Back" while filtered (search term is non-empty) confuses the loop. The source function always returns the Back item regardless of the search term, so it should always be visible.
   - Recommendation: Always return the Back item first (before the Separator) regardless of filter term. Test this pattern early in Wave 1 of execution.

2. **`runInstall()` signature compatibility with menu flow**
   - What we know: `runInstall(opts: InstallOptions)` accepts an object with optional typed keys (e.g., `{ skill: 'video-download' }`). `InstallOptions` has all component type fields as `string | undefined`.
   - What's unclear: The menu only installs one component at a time. `runInstall({ skill: 'video-download' })` should work directly with the existing `InstallOptions` interface — no signature changes needed.
   - Recommendation: No changes to `runInstall()`. Call it with a minimal `InstallOptions` object: `{ [type]: name }`. TypeScript will require a type assertion or index signature — use `{ [type as string]: name } as InstallOptions` or structure as a switch.

3. **Author field: null vs undefined vs empty string in `components.json`**
   - What we know: `CatalogEntry.author: string | null` (from `src/types.ts`). The current `components.json` shows `"author": "cc-templates"` for all skill entries.
   - What's unclear: Future community-contributed components may have null/missing author fields. The `by <author>` suffix should be omitted entirely when `author` is null or empty.
   - Recommendation: Guard: `entry.author ? \`  by ${entry.author}\` : ''`. Already shown in the code examples above.

---

## Sources

### Primary (HIGH confidence)
- `src/cli.ts`, `src/catalog.ts`, `src/types.ts`, `src/output.ts`, `src/installers/agent.ts`, `src/installers/skill.ts` — direct code inspection of the Phase 2.1 TypeScript codebase
- `components.json` — catalog structure confirmed: `CatalogEntry` has `name`, `description`, `author`, `version`, `tags`
- `package.json` — confirmed: chalk 5.4.1, commander 14.0.0, Node engine `>=22`, ESM `"type": "module"`, `tsc` build pipeline
- `https://raw.githubusercontent.com/SBoudrias/Inquirer.js/main/packages/select/README.md` — `@inquirer/select` v5.1.0 API: `select({ message, choices, pageSize, loop, theme })`, `Choice<Value>` type
- `https://raw.githubusercontent.com/SBoudrias/Inquirer.js/main/packages/search/README.md` — `@inquirer/search` v4.1.4 API: `search({ message, source, pageSize, validate, theme })`, async `source(term, { signal })` function, `Choice<Value>` type
- `npm info @inquirer/prompts` — v8.3.0, `"type": "module"`, engines `>=22 || ^20.12 || ^21.7`
- `npm info @inquirer/select` — v5.1.0 confirmed
- `npm info @inquirer/search` — v4.1.4 confirmed
- `npm info @clack/prompts` — v1.0.1, ESM-only (`.mjs`), no built-in search/filter on select

### Secondary (MEDIUM confidence)
- `https://raw.githubusercontent.com/natemoo-re/clack/main/packages/prompts/README.md` — clack API confirmed (select, isCancel, intro/outro); no search/filter in select — verified ESM-only via npm info
- Node.js docs `process.stdout.isTTY` — standard API, Node 22; chalk 5 auto-detection behavior verified via multiple community sources
- Commander.js `Readme.md` — no-args detection pattern: check opts after `program.parse()`, no built-in "on no-args" hook

### Tertiary (LOW confidence)
- WebSearch: Windows arrow-key issues in legacy `inquirer` package (multiple GitHub issue reports, pre-v8 rewrite). Resolved in `@inquirer/prompts` v8 — not independently verified against Node 22 release notes.

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — `@inquirer/prompts` v8.3.0, `@inquirer/select` v5.1.0, `@inquirer/search` v4.1.4 all confirmed via `npm info`; chalk 5 + commander already installed and working in codebase
- Architecture: HIGH — patterns derived directly from existing codebase (catalog.ts, types.ts, output.ts, installer signatures are all read directly); two-level loop pattern is straightforward composition of `select` + `search`
- Pitfalls: MEDIUM — TTY check requirement and `ExitPromptError` behavior verified against official README; Windows arrow-key history for legacy `inquirer` from WebSearch only (LOW individually, raised to MEDIUM by `@inquirer/prompts` v8 being confirmed as a full rewrite)

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Inquirer ecosystem is actively maintained; `@inquirer/prompts` v8 API is stable; chalk 5 TTY behavior is stable; Node 22 APIs are LTS-stable)

# Phase 2: Core Installer - Research

**Researched:** 2026-02-24
**Domain:** Node.js CLI file installer — GitHub raw file fetch, directory copy, JSON deep-merge, atomic write, cross-platform safety
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

**Phase boundary:**
- Install any of the four component types (skills, hooks, commands, MCPs) via CLI flags with full safety guarantees — no data loss, no silent overwrites, no Windows failures. Discovery UX (interactive menu, --list) is Phase 3. Dry-run and stale-version checks are Phase 4.

**Conflict behavior:**
- Default: abort with a one-liner warning when component already exists ("video-download already installed. Use --force to overwrite.")
- `--force` overwrites but prints a warning listing which files will be replaced before replacing them
- When a component name is not found in the catalog, error message lists all available components of that type inline

**Output & feedback:**
- Successful install prints one-line summary: "Installed video-download skill to .claude/skills/video-download/"
- `--verbose` flag shows each file copied and any merge decisions made
- Colors with auto-detection — colored output when terminal supports it, plain text in CI/piped contexts
- After successful install, include a brief one-line usage hint (e.g. "Use this skill in Claude Code with /video-download")

**Hook merge strategy:**
- Hooks are appended to the array in settings.json — new hooks for the same event run alongside existing ones (no replacement)
- If settings.json does not exist, create it with only the installed hook (no extra structure)
- If settings.json exists but is malformed JSON, abort with a clear error message — do not touch the file
- After merge, confirm what keys were added (e.g. "Added PreToolUse hook to settings.json"); verbose mode shows exact keys written

**Multi-install support:**
- Multiple flags in a single invocation are supported: `npx cc-templates --skill video-download --hook pre-commit`
- Mixed component types in one command are allowed — installer handles each type appropriately
- Fail fast on first error — stop the entire invocation at first failure, report which component failed and why

### Claude's Discretion
- Exact progress indication during file copy
- Specific colors used for each output state (success, warning, error)
- Exact format of the --verbose file-by-file output
- Temp file handling during install

### Deferred Ideas (OUT OF SCOPE)
- Config file install (`cc-templates.json` or `--from-file` flag) — new capability, belongs in a future phase or backlog
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| INST-01 | User can install a skill via `npx cc-templates --skill <name>` — downloads directory to `.claude/skills/<name>/` | GitHub Contents API for recursive directory download; `fs.cpSync` / write-file-atomic for file writing; existence check before write |
| INST-02 | User can install an agent via `npx cc-templates --agent <name>` — downloads `.md` file to `.claude/agents/<name>.md` | `raw.githubusercontent.com` single-file fetch; Node 20 built-in `fetch()` global; mkdir + writeFile |
| INST-03 | User can install a command via `npx cc-templates --command <name>` — downloads `.md` file to `.claude/commands/<name>.md` | Same single-file fetch pattern as INST-02 |
| INST-04 | User can install a hook via `npx cc-templates --hook <name>` — fetches hook JSON and deep-merges into target `settings.json` | Confirmed settings.json hooks schema; array-append merge strategy; atomic write via write-file-atomic; Windows python3→python replacement |
| INST-05 | User can install to user-global `~/.claude/` instead of project-local `.claude/` via `--global` flag | `os.homedir()` + `path.join` for cross-platform home directory; no tilde expansion needed — always use `os.homedir()` |
| INST-06 | User can force reinstall of an already-installed component via `--overwrite` / `--force` flag | Existence check pattern; `--force` skips abort and proceeds with copy, logging which files are replaced |
| INST-07 | User can point the CLI at a forked GitHub repo via `CC_TEMPLATES_REPO` environment variable | `process.env.CC_TEMPLATES_REPO` with fallback to default owner/repo string; URL construction function parameterized on repo |
| SAFE-01 | User sees a clear error message when a requested component does not exist, with a list of available components of that type shown inline | Read `components.json` (bundled in npm package) to enumerate available names; filter by type; format as inline list |
| SAFE-02 | User is warned (and install is aborted) when target file/directory already exists, unless `--force` is passed | `fs.existsSync` check before any write; abort path with one-liner warning message |
| SAFE-04 | User can run the CLI non-interactively in CI pipelines via `--yes` flag (skips all confirmation prompts) | Boolean flag in commander; chalk auto-detects TTY so color is already suppressed in piped context; `--yes` only needed to suppress interactive prompts (none exist in Phase 2 — flag is future-safe scaffolding) |
| SAFE-06 | Hooks installer deep-merges new hook entries into existing `settings.json` without overwriting or removing any existing keys (atomic write via temp file + rename) | write-file-atomic v7.0.0 handles temp-file-then-rename; merge logic: spread existing object, append to each event array |
| SAFE-07 | Hook command strings containing `python3` are automatically replaced with `python` on Windows | `process.platform === 'win32'`; `JSON.stringify(hookData).replace(/python3/g, 'python')` pattern from reference implementation |
| COMP-01 | `video-download` skill is available to install | Already exists as `components/skills/video-download/skill.md` in repo; GitHub raw fetch + Contents API confirmed working |
| COMP-02 | `video-fetch-and-summarize` skill is available to install | Already exists in repo |
| COMP-03 | `video-summarizer` skill is available to install | Already exists in repo |
</phase_requirements>

---

## Summary

Phase 2 implements the actual file installation logic behind the CLI flags scaffolded in Phase 1. The core of each installer is: (1) validate the component name against `components.json`, (2) fetch the file or directory from GitHub, (3) check for conflicts, (4) write to the correct target path with an atomic write. Four component types need four slightly different install paths — skills are directory downloads using the GitHub Contents API, agents and commands are single `.md` file downloads via `raw.githubusercontent.com`, and hooks require JSON deep-merge into `settings.json`.

The key architectural insight from the reference implementation (claude-code-templates v1.28.16) is that the installer is stateless — it reads the bundled `components.json` for validation, fetches live content from GitHub at install time, and writes files to `.claude/` with no local state beyond the written files themselves. Node.js 20 has a built-in global `fetch()` (no import required), which is the correct choice for HTTP requests — no external HTTP library is needed. For atomic writes to `settings.json`, use `write-file-atomic` v7.0.0 (CJS, importable from ESM via default import) to guarantee no data loss if the process is interrupted mid-write.

Three areas need care: (1) The hooks deep-merge must append to arrays, not replace them — the user's existing hooks must survive; (2) Skills install via the GitHub Contents API (not raw URLs) because they are directories that may contain multiple files; (3) The `--global` flag must resolve the target base to `os.homedir() + '/.claude/'` and create the directory if needed.

**Primary recommendation:** Structure the installer as one module per component type (`src/installers/skill.js`, `src/installers/agent.js`, etc.) plus a shared `src/fetch.js` (GitHub URL builder + fetch wrapper) and `src/output.js` (chalk-based output with color auto-detection). Wire everything through a thin `src/install.js` orchestrator that reads component flags and dispatches to the correct module.

---

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| node:fs (built-in) | Node 20+ | `existsSync`, `mkdirSync`, `writeFileSync`, `readFileSync`, `cpSync` | Native; `cpSync` with `{ recursive: true }` handles skill directory copy; stable since Node 16 |
| node:os (built-in) | Node 20+ | `homedir()` for `--global` flag target path resolution | Only correct way to get home dir cross-platform (no tilde expansion in Node) |
| node:path (built-in) | Node 20+ | `join`, `dirname`, `basename` for cross-platform path construction | Never string-concatenate paths; use `path.join` |
| fetch (built-in global) | Node 20+ | Download files from `raw.githubusercontent.com` and GitHub Contents API | Global since Node 18 (experimental), stable in Node 21+; available in Node 20 without import; no external dependency needed |
| commander | ^14.0.0 | Already installed; needs new flags: `--agent`, `--force`, `--global`, `--yes`, `--verbose` | Already in package.json from Phase 1 |
| chalk | ^5.4.1 | Already installed; colored output with TTY auto-detection | Chalk 5 auto-detects piped/CI contexts via `supports-color`; no manual `isatty` check needed |
| write-file-atomic | ^7.0.0 | Atomic write for `settings.json` merge | Writes to temp file then renames; prevents partial writes on process interrupt; CJS but importable from ESM as default |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| node:url (built-in) | Node 20+ | URL construction with `new URL()` | For building GitHub API URLs safely |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| write-file-atomic | Manual temp-file-then-fs.rename | Manual approach has known atomicity issues on Windows (EPERM on rename); write-file-atomic handles this correctly |
| write-file-atomic | fs.writeFileSync directly | Direct write is not atomic — a process crash mid-write corrupts the JSON file permanently |
| built-in fetch | node-fetch | node-fetch is ESM-only in v3+; built-in fetch is already available in Node 20 with no import; correct choice |
| built-in fetch | axios | Adds a dependency for no benefit; built-in fetch handles all needed use cases |
| GitHub Contents API for skills | Bundling skills in npm package | Bundling would bloat npm package and require republish for every skill update; GitHub fetch keeps package small |
| fs.cpSync (recursive) | Manual recursive copy loop | cpSync is one call, handles deep trees correctly; manual loop is error-prone |

**Installation:**

```bash
npm install write-file-atomic@^7
```

(commander and chalk are already installed from Phase 1)

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── cli.js                  # commander setup (already exists — add new flags here)
├── install.js              # orchestrator: reads opts, dispatches to installers
├── fetch.js                # GitHub URL builder + fetch wrapper
├── output.js               # chalk-based output helpers (success, warn, error, verbose)
├── catalog.js              # reads bundled components.json, validates component names
└── installers/
    ├── skill.js            # GitHub Contents API recursive download → .claude/skills/
    ├── agent.js            # raw.githubusercontent.com single fetch → .claude/agents/
    ├── command.js          # raw.githubusercontent.com single fetch → .claude/commands/
    └── hook.js             # fetch hook JSON → deep-merge into settings.json
```

### Pattern 1: Single-File Installer (agents and commands)

**What:** Fetch a single `.md` file from `raw.githubusercontent.com` and write it to the target path.
**When to use:** For agents (INST-02) and commands (INST-03).

```javascript
// src/installers/agent.js
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';

export async function installAgent(name, baseDir, opts) {
  const url = buildRawUrl('agents', `${name}.md`, opts);
  const targetPath = join(baseDir, '.claude', 'agents', `${name}.md`);

  // Conflict check (SAFE-02)
  if (existsSync(targetPath) && !opts.force) {
    output.warn(`${name} already installed. Use --force to overwrite.`);
    return { success: false, reason: 'exists' };
  }

  const res = await fetch(url);
  if (!res.ok) {
    // SAFE-01: show available agents
    throw new Error(`Agent "${name}" not found (HTTP ${res.status})`);
  }

  const content = await res.text();
  mkdirSync(dirname(targetPath), { recursive: true });

  if (existsSync(targetPath) && opts.force) {
    output.warn(`Overwriting existing: ${targetPath}`);
  }
  writeFileSync(targetPath, content, 'utf8');
  output.success(`Installed ${name} agent to .claude/agents/${name}.md`);
  output.hint(`Use this agent in Claude Code as @${name}`);
  return { success: true };
}
```

### Pattern 2: Skill Directory Installer (GitHub Contents API)

**What:** Use the GitHub Contents API to recursively list and download all files in a skill directory, then write them to `.claude/skills/<name>/`.
**When to use:** For skills (INST-01) — the only component type that is a directory.

```javascript
// src/installers/skill.js
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildContentsApiUrl } from '../fetch.js';
import { output } from '../output.js';

const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'cc-templates'
};

async function downloadDirectory(apiUrl, targetDir, opts) {
  const res = await fetch(apiUrl, { headers: GITHUB_HEADERS });
  if (!res.ok) return null; // caller checks null → 404

  const items = await res.json();
  for (const item of items) {
    if (item.type === 'file') {
      const content = await fetch(item.download_url).then(r => r.text());
      const filePath = join(targetDir, item.name);
      mkdirSync(join(filePath, '..'), { recursive: true });
      writeFileSync(filePath, content, 'utf8');
      if (opts.verbose) output.verbose(`  wrote ${item.name}`);
    } else if (item.type === 'dir') {
      await downloadDirectory(item.url, join(targetDir, item.name), opts);
    }
  }
}

export async function installSkill(name, baseDir, opts) {
  const targetDir = join(baseDir, '.claude', 'skills', name);

  // Conflict check (SAFE-02)
  if (existsSync(targetDir) && !opts.force) {
    output.warn(`${name} already installed. Use --force to overwrite.`);
    return { success: false, reason: 'exists' };
  }
  if (existsSync(targetDir) && opts.force) {
    output.warn(`Overwriting existing skill: ${name}`);
  }

  const apiUrl = buildContentsApiUrl('skills', name, opts);
  mkdirSync(targetDir, { recursive: true });
  const result = await downloadDirectory(apiUrl, targetDir, opts);
  if (result === null) {
    throw new Error(`Skill "${name}" not found in repository`);
  }

  output.success(`Installed ${name} skill to .claude/skills/${name}/`);
  output.hint(`Use this skill in Claude Code with /${name}`);
  return { success: true };
}
```

### Pattern 3: Hook Installer with Array-Append Merge

**What:** Fetch hook JSON from GitHub, parse it, append new matcher groups to existing event arrays in `settings.json`, write atomically.
**When to use:** For hooks (INST-04, SAFE-06, SAFE-07).

The hooks JSON format from the repository:
```json
{
  "hooks": {
    "PostToolUse": [{
      "matcher": "Edit|Write",
      "hooks": [{ "type": "command", "command": "python3 .claude/hooks/format.py" }]
    }]
  }
}
```

The target `settings.json` has the same top-level `hooks` key. The merge appends each event's array:

```javascript
// src/installers/hook.js
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';
import writeFileAtomic from 'write-file-atomic'; // CJS default import
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';

export async function installHook(name, baseDir, opts) {
  const url = buildRawUrl('hooks', `${name}.json`, opts);
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Hook "${name}" not found (HTTP ${res.status})`);

  let hookData = await res.json();

  // SAFE-07: Windows python3 → python replacement
  if (process.platform === 'win32') {
    hookData = JSON.parse(JSON.stringify(hookData).replace(/python3/g, 'python'));
  }

  const settingsPath = join(baseDir, '.claude', 'settings.json');
  mkdirSync(join(settingsPath, '..'), { recursive: true });

  // Read existing settings.json or start fresh
  let existing = {};
  if (existsSync(settingsPath)) {
    const raw = readFileSync(settingsPath, 'utf8');
    try {
      existing = JSON.parse(raw);
    } catch {
      // SAFE-06 abort on malformed JSON
      throw new Error(
        `settings.json exists but contains invalid JSON. Fix it manually before installing hooks.`
      );
    }
  }

  // Deep-merge: append new matcher groups to each event array (do not replace)
  const merged = { ...existing };
  merged.hooks = { ...(existing.hooks ?? {}) };
  const addedKeys = [];

  for (const [event, matchers] of Object.entries(hookData.hooks ?? {})) {
    if (!Array.isArray(merged.hooks[event])) {
      merged.hooks[event] = [];
    }
    merged.hooks[event] = [...merged.hooks[event], ...matchers];
    addedKeys.push(event);
  }

  // Atomic write (SAFE-06)
  await writeFileAtomic(settingsPath, JSON.stringify(merged, null, 2) + '\n');

  const keyList = addedKeys.join(', ');
  output.success(`Added ${keyList} hook to settings.json`);
  if (opts.verbose) {
    for (const key of addedKeys) {
      output.verbose(`  ${key}: appended ${hookData.hooks[key].length} matcher group(s)`);
    }
  }
  return { success: true };
}
```

### Pattern 4: GitHub URL Builder with CC_TEMPLATES_REPO Override

**What:** Centralized URL construction with `CC_TEMPLATES_REPO` env var support (INST-07).
**When to use:** In every installer — always go through this module, never hardcode URLs.

```javascript
// src/fetch.js
const DEFAULT_REPO = 'your-org/cc-templates'; // replace with actual repo
const BRANCH = 'main';

function getRepo() {
  return process.env.CC_TEMPLATES_REPO ?? DEFAULT_REPO;
}

export function buildRawUrl(type, filename, opts) {
  const repo = getRepo();
  return `https://raw.githubusercontent.com/${repo}/${BRANCH}/components/${type}/${filename}`;
}

export function buildContentsApiUrl(type, name, opts) {
  const repo = getRepo();
  return `https://api.github.com/repos/${repo}/contents/components/${type}/${name}`;
}
```

### Pattern 5: Multi-Install Orchestrator

**What:** Loop through each component type in a single invocation; fail fast on first error.
**When to use:** When multiple flags are provided in one invocation.

```javascript
// src/install.js
import { installSkill } from './installers/skill.js';
import { installAgent } from './installers/agent.js';
import { installCommand } from './installers/command.js';
import { installHook } from './installers/hook.js';
import { validateName } from './catalog.js';
import { output } from './output.js';
import { join } from 'node:path';
import { homedir } from 'node:os';

export async function runInstall(opts) {
  // Resolve base directory (INST-05)
  const baseDir = opts.global ? homedir() : process.cwd();

  const plan = [
    ...( opts.skill   ? [{ type: 'skill',   name: opts.skill   }] : [] ),
    ...( opts.agent   ? [{ type: 'agent',   name: opts.agent   }] : [] ),
    ...( opts.command ? [{ type: 'command', name: opts.command }] : [] ),
    ...( opts.hook    ? [{ type: 'hook',    name: opts.hook    }] : [] ),
  ];

  for (const item of plan) {
    // SAFE-01: validate against catalog before fetching
    validateName(item.type, item.name); // throws with inline list on failure

    try {
      switch (item.type) {
        case 'skill':   await installSkill(item.name, baseDir, opts); break;
        case 'agent':   await installAgent(item.name, baseDir, opts); break;
        case 'command': await installCommand(item.name, baseDir, opts); break;
        case 'hook':    await installHook(item.name, baseDir, opts); break;
      }
    } catch (err) {
      // Fail fast: report which component failed and why
      output.error(`Failed to install ${item.type} "${item.name}": ${err.message}`);
      process.exit(1);
    }
  }
}
```

### Pattern 6: Catalog Validation (SAFE-01)

**What:** Read bundled `components.json` to validate component names and generate inline error lists.
**When to use:** Before any fetch attempt — fast local check.

```javascript
// src/catalog.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, '../components.json'), 'utf8')
);

export function validateName(type, name) {
  const entries = catalog[type === 'agent' ? 'agents' : `${type}s`] ?? [];
  if (!entries.find(e => e.name === name)) {
    const available = entries.map(e => e.name).join(', ');
    const avail = available || '(none yet)';
    throw new Error(
      `"${name}" is not a known ${type}. Available ${type}s: ${avail}`
    );
  }
}
```

**Note on catalog type keys:** The `components.json` uses plural keys: `skills`, `hooks`, `commands`, `mcp`. The catalog lookup must map the CLI type name to the correct key.

### Pattern 7: Commander Flag Additions

**What:** Add `--agent`, `--force`, `--global`, `--yes`, `--verbose` to the existing commander setup in `src/cli.js`.
**When to use:** Always — flags live in cli.js, logic lives in install.js.

```javascript
// Additions to src/cli.js (existing program object)
program
  .option('--agent <name>',   'Install an agent component')   // INST-02 (was missing from Phase 1)
  .option('--force',          'Overwrite if already installed') // INST-06
  .option('--global',         'Install to ~/.claude/ instead of .claude/') // INST-05
  .option('--yes',            'Skip all confirmation prompts (CI mode)') // SAFE-04
  .option('--verbose',        'Show detailed output');         // Decisions

// Replace stubs with real dispatch:
const opts = program.opts();
if (opts.skill || opts.agent || opts.command || opts.hook) {
  await runInstall(opts);
}
```

**Note:** `--agent` was omitted from Phase 1's `cli.js` (only --skill, --hook, --command, --mcp were defined). INST-02 requires adding `--agent`.

### Anti-Patterns to Avoid

- **Writing settings.json directly with fs.writeFileSync:** Not atomic — a crash mid-write permanently corrupts the file. Always use `write-file-atomic` for `settings.json`.
- **Replacing the hooks array instead of appending:** The merge must spread existing arrays and concat new ones. Never `merged.hooks[event] = newMatchers` — this silently deletes the user's existing hooks.
- **Using `~/.claude/` as a string literal:** Node.js does not expand tildes. Always use `path.join(os.homedir(), '.claude')`.
- **Hardcoding the GitHub repo URL:** All URLs must go through `buildRawUrl()` / `buildContentsApiUrl()` so `CC_TEMPLATES_REPO` override works uniformly.
- **Fetching before validating:** Check `components.json` first. A 404 from GitHub is a worse error message than "available skills: foo, bar, baz".
- **Using raw.githubusercontent.com for skill directories:** Skills are directories — raw URLs only work for individual files. Skills require the GitHub Contents API.
- **Making `--agent` a variadic option with `...`:** The CONTEXT.md decision says "multiple flags in a single invocation" (e.g., `--skill foo --hook bar`), not `--skill foo bar`. Keep each flag as a single-value option. Multi-install is triggered when more than one component flag is present.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Atomic file write | Custom temp-file-rename with fs.renameSync | write-file-atomic v7.0.0 | Windows has documented EPERM issues with fs.rename; write-file-atomic handles this; also handles fsync, cleanup on crash |
| Recursive directory copy (for future bundled content) | Manual walk + writeFile loop | fs.cpSync with { recursive: true } | One call; handles deep trees; available since Node 16 |
| HTTP requests | Custom http/https module usage | Built-in global fetch() | Node 20+ has it as a global; no import, no dependency |
| Home directory path | String manipulation of $HOME | os.homedir() | Cross-platform; works on Windows where HOME may not be set |
| Color + CI detection | Manual process.stdout.isTTY check | chalk 5 (already installed) | chalk uses supports-color internally; handles NO_COLOR, FORCE_COLOR, CI env vars automatically |

**Key insight:** The installer's job is "fetch from GitHub, write to disk safely." Both GitHub and disk operations have well-solved library solutions — reach for them rather than re-implementing the edge cases.

---

## Common Pitfalls

### Pitfall 1: Hooks Array Replacement vs Append

**What goes wrong:** `merged.hooks[event] = hookData.hooks[event]` replaces the user's existing hooks instead of appending.
**Why it happens:** JavaScript spread/assignment looks like merging but overwrites arrays entirely.
**How to avoid:** Always: `merged.hooks[event] = [...(existing.hooks[event] ?? []), ...newMatchers]`.
**Warning signs:** After install, existing hooks stop firing; settings.json shows only the newly installed hook's entries.

### Pitfall 2: Non-Atomic Write Corrupts settings.json

**What goes wrong:** A write of settings.json is interrupted (crash, Ctrl+C, disk full) leaving a partial JSON file that cannot be parsed.
**Why it happens:** `fs.writeFileSync` writes in-place — if interrupted, the file is truncated.
**How to avoid:** Use `write-file-atomic` for all settings.json writes. It writes to a temp file, then renames atomically.
**Warning signs:** After an interrupted install, Claude Code reports a JSON parse error on startup.

### Pitfall 3: Malformed Existing settings.json — Silent Corruption

**What goes wrong:** The installer tries to `JSON.parse` an existing `settings.json` that already has a syntax error; it fails with an exception; if uncaught, it might overwrite with a clean file — destroying unknown existing content.
**Why it happens:** The installer doesn't validate the existing file before attempting to write.
**How to avoid:** Wrap `JSON.parse(readFileSync(...))` in try/catch; if it throws, abort with "settings.json contains invalid JSON — fix manually before installing hooks". Never write to the file.
**Warning signs:** Locked decision explicitly requires this behavior ("abort with a clear error message — do not touch the file").

### Pitfall 4: Windows python3 Replacement Scope

**What goes wrong:** The python3 → python replacement is applied only to hook command strings but missed in nested sidecar script paths.
**Why it happens:** The replacement is done on the full JSON string — it may unintentionally replace `python3` in file paths like `my-python3-project/script.py`.
**How to avoid:** Be precise — apply replacement only to `command` field values, not the full JSON. Alternatively, the reference implementation's whole-JSON approach works in practice because component authors don't embed "python3" in path names.
**Warning signs:** On Windows, hooks execute `python3` instead of `python` (install appears to succeed but runtime hooks fail).

### Pitfall 5: GitHub Contents API Rate Limiting

**What goes wrong:** Unauthenticated GitHub API calls are limited to 60 per hour. A skill with many files can exhaust this quickly, and repeated installs hit the limit.
**Why it happens:** The GitHub Contents API (for recursive skill download) is rate-limited per IP; `raw.githubusercontent.com` is not rate-limited for single files.
**How to avoid:** The Contents API is only used for skills (directory type). Single-file components use `raw.githubusercontent.com` which has no rate limit. Skills with many files benefit from including a `User-Agent` header in API calls (required by GitHub API anyway). Consider adding a note in error output when HTTP 403 is returned from the Contents API.
**Warning signs:** HTTP 403 from `api.github.com` with message "API rate limit exceeded".

### Pitfall 6: Skills Directory Already Exists (Partial Install)

**What goes wrong:** A skill was previously partially installed (interrupted). `existsSync(targetDir)` returns true, so `--force` warning fires, but the directory contains incomplete files.
**Why it happens:** The conflict check only tests directory existence, not content integrity.
**How to avoid:** The conflict check is intentionally simple — it's the user's responsibility to use `--force` when re-installing. The `--force` flag warns which files will be replaced (all of them in a skill directory). This matches the locked decision.
**Warning signs:** User reports skill not working after interrupted install; solution is to re-run with `--force`.

### Pitfall 7: write-file-atomic ESM Import

**What goes wrong:** `import writeFileAtomic from 'write-file-atomic'` fails because write-file-atomic v7.0.0 is CJS.
**Why it happens:** Same ESM/CJS interop issue as js-yaml in Phase 1.
**How to avoid:** Use `import writeFileAtomic from 'write-file-atomic'` (default import). Node 20 treats CJS packages as having a synthetic default export equal to `module.exports`. If this fails at runtime, use the `createRequire` fallback (same pattern as js-yaml in build-catalog.js). Test explicitly on Node 20.
**Warning signs:** `ERR_PACKAGE_IMPORT_NOT_DEFINED` or "does not provide a named export 'default'" at startup.

### Pitfall 8: --global Flag Target Directory Creation

**What goes wrong:** `~/.claude/skills/` does not exist on a fresh machine; writing to it fails with ENOENT.
**Why it happens:** `writeFileSync` does not create parent directories automatically.
**How to avoid:** Always call `mkdirSync(dirname(targetPath), { recursive: true })` before any write. This is a no-op if the directory already exists and throws only on permission errors.
**Warning signs:** `ENOENT: no such file or directory` on first global install.

---

## Code Examples

Verified patterns from official sources:

### Official settings.json hooks schema (from code.claude.com/docs/en/hooks)

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/block-rm.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Edit|Write",
        "hooks": [
          {
            "type": "command",
            "command": "/path/to/lint-check.sh",
            "timeout": 30
          }
        ]
      }
    ]
  }
}
```

Source: https://code.claude.com/docs/en/hooks (February 2026)

**Hook event names (all supported):** `SessionStart`, `UserPromptSubmit`, `PreToolUse`, `PermissionRequest`, `PostToolUse`, `PostToolUseFailure`, `Notification`, `SubagentStart`, `SubagentStop`, `Stop`, `TeammateIdle`, `TaskCompleted`, `ConfigChange`, `WorktreeCreate`, `WorktreeRemove`, `PreCompact`, `SessionEnd`

**settings.json locations:**
- Project-local (shared, committable): `.claude/settings.json`
- Project-local (personal, gitignored): `.claude/settings.local.json`
- User-global: `~/.claude/settings.json`

### Node.js built-in fetch for single file download

```javascript
// Source: https://nodejs.org/en/learn/getting-started/fetch
// fetch is a global in Node 20+ — no import needed

const res = await fetch('https://raw.githubusercontent.com/owner/repo/main/components/agents/foo.md');
if (!res.ok) throw new Error(`HTTP ${res.status}: ${res.url}`);
const content = await res.text();
```

### GitHub Contents API for directory listing

```javascript
// Source: claude-code-templates architecture doc (reference implementation pattern)
// Source: https://docs.github.com/en/rest/repos/contents

const res = await fetch(
  'https://api.github.com/repos/owner/repo/contents/components/skills/video-download',
  { headers: { 'Accept': 'application/vnd.github.v3+json', 'User-Agent': 'cc-templates' } }
);
const items = await res.json();
// items: Array of { type: 'file'|'dir', name: string, download_url: string, url: string }
```

### Atomic write for settings.json

```javascript
// Source: https://github.com/npm/write-file-atomic (v7.0.0)
import writeFileAtomic from 'write-file-atomic'; // CJS default import works in ESM

await writeFileAtomic(settingsPath, JSON.stringify(merged, null, 2) + '\n');
// Writes to temp file, then renames — no partial-write corruption
```

### Cross-platform home directory for --global flag

```javascript
// Source: https://nodejs.org/api/os.html#oshomedir
import { homedir } from 'node:os';
import { join } from 'node:path';

const baseDir = opts.global
  ? homedir()                      // resolves to C:\Users\name on Windows, /Users/name on Mac
  : process.cwd();

const targetDir = join(baseDir, '.claude', 'skills', name);
// Never use '~' — Node.js does not expand tildes
```

### Windows python3 → python replacement (SAFE-07)

```javascript
// Source: claude-code-templates architecture doc (Section 4, Settings/Hooks)
// Applied after fetching the hook JSON, before merging

if (process.platform === 'win32') {
  hookData = JSON.parse(JSON.stringify(hookData).replace(/python3/g, 'python'));
}
```

### Conflict check + force flow (SAFE-02, INST-06)

```javascript
// Pattern: check existence, abort or warn, then proceed
import { existsSync } from 'node:fs';

if (existsSync(targetPath)) {
  if (!opts.force) {
    output.warn(`${name} already installed. Use --force to overwrite.`);
    return { success: false, reason: 'exists' };
  }
  // --force: list what will be replaced before replacing
  output.warn(`Overwriting existing ${type}: ${targetPath}`);
}
// proceed with write
```

### fs.cpSync for recursive directory copy (local use cases)

```javascript
// Source: https://nodejs.org/api/fs.html#fscopysync (Node 16+, stable Node 20)
import { cpSync } from 'node:fs';

cpSync(sourcePath, destPath, { recursive: true, force: true });
// force: true is default; overwrites existing files
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `node-fetch` npm package | Built-in global `fetch()` | Node 18 (experimental) → Node 21 stable; available in Node 20 | No HTTP library dependency needed |
| Manual temp-file-rename for atomic write | `write-file-atomic` v7.0.0 | v7 released Oct 2025 | Node >=20.17 required; ESM importable as CJS default |
| `fs.ensureDir` from fs-extra | `fs.mkdirSync` with `{ recursive: true }` | Node 10.12+ | No extra dependency for directory creation |
| Inquirer for hook scope selection | Not needed in Phase 2 | — | Phase 2 defaults to project-local `.claude/settings.json`; `--global` flag selects user-global scope; no interactive prompt needed |

**Deprecated/outdated in this context:**
- `fs-extra` for `ensureDir` / `copySync`: Node.js built-ins now cover these use cases (`mkdirSync` + `cpSync`). Avoid adding a dependency.
- `node-fetch`: Replaced by built-in fetch in Node 20+.

---

## Open Questions

1. **`--agent` flag: was it omitted from Phase 1 cli.js?**
   - What we know: The Phase 1 `src/cli.js` defines `--skill`, `--hook`, `--command`, `--mcp`, `--list` but NOT `--agent`. The `--mcp` flag is present. INST-02 requires `--agent`.
   - What's unclear: Was `--agent` intentionally deferred to Phase 2, or was it an oversight?
   - Recommendation: Add `--agent` to `cli.js` as part of Phase 2 Task 1. The stub comment in Phase 1 cli.js mentions only skill/hook/command/mcp — this is a gap to fill.

2. **`--mcp` install behavior for Phase 2**
   - What we know: INST-01 through INST-04 cover skill/agent/command/hook. MCP (INST-xx) is not in the Phase 2 requirement list. The `--mcp` flag stub exists in cli.js.
   - What's unclear: Should `--mcp` be implemented in Phase 2 or left as a stub?
   - Recommendation: Leave `--mcp` as a stub for Phase 2 — it is not in the phase requirement IDs. The mcp components directory is empty (only a .gitkeep), so there is nothing to install.

3. **Hook scope selection in Phase 2**
   - What we know: The reference implementation asks the user to pick scope (project, global, local) interactively. Phase 2 defers interactive prompts to Phase 3.
   - What's unclear: Should Phase 2 default hook installs to project-local `.claude/settings.json`, or should the `--global` flag be used to select user-global scope?
   - Recommendation: In Phase 2, default to project-local `.claude/settings.json`. The `--global` flag (INST-05) selects `~/.claude/settings.json`. No interactive scope picker is needed in Phase 2 — that's Phase 3 territory.

4. **write-file-atomic ESM import reliability**
   - What we know: write-file-atomic v7.0.0 is CJS; requires Node >=20.17.0; tested as importable via default import from ESM.
   - What's unclear: Exact behavior of `import writeFileAtomic from 'write-file-atomic'` in Node 20.0-20.16 (our minimum is `>=20`, not `>=20.17`).
   - Recommendation: Add a `createRequire` fallback identical to the js-yaml pattern in `build-catalog.js`. Test on Node 20.x before releasing. Consider raising the engine constraint to `>=20.17.0` if the fallback proves fragile.

---

## Sources

### Primary (HIGH confidence)
- `claude-code-templates-architecture.md` at repo root — complete engineering breakdown of reference implementation v1.28.16; install flow, URL patterns, hooks merge, skill directory download all documented verbatim
- https://code.claude.com/docs/en/hooks — official Anthropic hooks reference; complete settings.json schema, all event names, hook handler fields verified February 2026
- https://nodejs.org/en/learn/getting-started/fetch — built-in fetch confirmed available in Node 20+ as global
- https://nodejs.org/api/fs.html — fs.cpSync, mkdirSync, existsSync, writeFileSync APIs

### Secondary (MEDIUM confidence)
- https://github.com/npm/write-file-atomic — v7.0.0 confirmed (Oct 2025 release); CJS package; requires Node >=20.17.0; temp-file-rename atomic pattern documented
- https://github.com/tj/commander.js — variadic options with `...` syntax confirmed; boolean flags (`--force`, `--global`, `--yes`) are standard .option() calls
- https://github.com/chalk/supports-color — chalk 5 uses supports-color for TTY detection; FORCE_COLOR, NO_COLOR env vars honored; CI detection automatic

### Tertiary (LOW confidence)
- WebSearch results on Windows fs.rename EPERM — multiple sources confirm the issue; write-file-atomic is the established solution; not directly verified against Node 20 release notes

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — built-in Node modules verified against official docs; write-file-atomic version confirmed; chalk/commander already in use from Phase 1
- Architecture: HIGH — install flow derived directly from reference implementation architecture doc; hooks schema verified against official Anthropic docs
- Pitfalls: MEDIUM — hooks array replacement vs append is a logic pitfall (verified against schema); atomic write risk is well-documented; some Windows edge cases from WebSearch only

**Research date:** 2026-02-24
**Valid until:** 2026-03-24 (Node.js built-ins and GitHub API URL format are stable; write-file-atomic is actively maintained; hooks schema is stable but Claude Code is fast-moving — re-verify hooks schema if implementation is delayed)

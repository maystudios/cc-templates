# Architecture Research

**Domain:** Minimal npm CLI installer for Claude Code components
**Researched:** 2026-02-24
**Confidence:** HIGH

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────────┐
│                        User Invocation Layer                         │
│         npx cc-templates [--skill|--agent|--hook|--command] <name>   │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                bin/cc-templates.js  (entry point)             │   │
│  │   #!/usr/bin/env node  +  Commander.js flag parsing           │   │
│  └──────────────────────────┬───────────────────────────────────┘   │
├─────────────────────────────┼───────────────────────────────────────┤
│                   Dispatch & Orchestration Layer                     │
│  ┌──────────────────────────┴───────────────────────────────────┐   │
│  │                   src/index.js  (dispatcher)                  │   │
│  │   Reads parsed flags → routes to correct installer module     │   │
│  └──────┬──────────┬──────────┬──────────┬───────────────────── ┘   │
├─────────┼──────────┼──────────┼──────────┼─────────────────────────┤
│         │          │          │          │   Installer Layer         │
│  ┌──────┴───┐ ┌────┴───┐ ┌───┴────┐ ┌───┴──────┐                   │
│  │ skills   │ │ agents │ │ hooks  │ │ commands │                   │
│  │installer │ │install │ │install │ │ install  │                   │
│  └──────┬───┘ └────┬───┘ └───┬────┘ └───┬──────┘                   │
├─────────┼──────────┼─────────┼──────────┼─────────────────────────┤
│         │          │         │          │   Shared Utilities Layer  │
│  ┌──────┴──────────┴─────────┴──────────┴──────┐                   │
│  │  src/github.js  |  src/fs.js  |  src/platform.js               │
│  │  Contents API   |  file write |  python3→python                 │
│  └──────────────────────────────────────────────┘                   │
├─────────────────────────────────────────────────────────────────────┤
│                        Data Layer                                    │
│  ┌────────────────────────┐   ┌──────────────────────────────────┐  │
│  │  GitHub repo (remote)  │   │  User filesystem (local)         │  │
│  │  maystudios/cc-templates│  │  ~/.claude/ or ./.claude/        │  │
│  │  - skills/ (dirs)      │   │  - skills/<name>/                │  │
│  │  - agents/ (.md)       │   │  - agents/<name>.md              │  │
│  │  - commands/ (.md)     │   │  - commands/<name>.md            │  │
│  │  - hooks/ (.json)      │   │  - settings.json (merged)        │  │
│  └────────────────────────┘   └──────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Communicates With |
|-----------|----------------|-------------------|
| `bin/cc-templates.js` | Entry point, shebang, Commander.js flag definition | `src/index.js` |
| `src/index.js` | Flag dispatch, interactive menu, orchestration | All installer modules, `src/catalog.js` |
| `src/catalog.js` | Load and query `components.json`; list available components | `src/index.js` |
| `src/installers/skills.js` | Recursive GitHub Contents API download, multi-file directory write | `src/github.js`, `src/fs.js` |
| `src/installers/agents.js` | Fetch single .md from raw.githubusercontent.com, write to `.claude/agents/` | `src/github.js`, `src/fs.js` |
| `src/installers/commands.js` | Fetch single .md from raw.githubusercontent.com, write to `.claude/commands/` | `src/github.js`, `src/fs.js` |
| `src/installers/hooks.js` | Fetch hook definition, merge into `settings.json`, scope selection | `src/github.js`, `src/fs.js`, `src/platform.js` |
| `src/github.js` | GitHub Contents API calls, raw.githubusercontent.com fetches | External: GitHub API |
| `src/fs.js` | Directory creation, file writes, settings.json read/merge/write | Node.js `fs`, `os` |
| `src/platform.js` | `python3` → `python` substitution on Windows, OS detection | Node.js `process` |
| `src/menu.js` | Interactive prompts (Inquirer.js), component type selection, item selection | `src/catalog.js`, all installer modules |
| `components.json` | Static catalog shipped in repo, lists all available components with metadata | `src/catalog.js` |

## Recommended Repository Layout

```
cc-templates/                      # Root = GitHub repo AND npm package
├── bin/
│   └── cc-templates.js            # #!/usr/bin/env node — entry point only
├── src/
│   ├── index.js                   # Dispatcher: reads flags, routes to installers
│   ├── catalog.js                 # Loads components.json, filters/lists components
│   ├── menu.js                    # Inquirer.js interactive prompts
│   ├── github.js                  # GitHub API abstraction (Contents API + raw fetch)
│   ├── fs.js                      # Filesystem helpers (mkdir, write, merge JSON)
│   ├── platform.js                # Cross-platform fixes (python3→python on win32)
│   └── installers/
│       ├── skills.js              # Multi-file recursive installer
│       ├── agents.js              # Single .md file installer
│       ├── commands.js            # Single .md file installer
│       └── hooks.js               # Hook fetch + settings.json merge
├── skills/                        # Component library: directories
│   ├── video-download/
│   │   ├── SKILL.md
│   │   └── scripts/
│   ├── video-fetch-and-summarize/
│   └── video-summarizer/
├── agents/                        # Component library: .md files
├── commands/                      # Component library: .md files
├── hooks/                         # Component library: .json files
├── components.json                # Pre-generated catalog (script builds this)
├── scripts/
│   └── generate-catalog.js        # Build script: scans component dirs → components.json
├── package.json                   # bin: { "cc-templates": "bin/cc-templates.js" }
└── README.md
```

### Structure Rationale

- **`bin/` vs `src/`:** Bin holds only the shebang entry point — no logic. All logic lives in `src/`. This is the established Node.js CLI convention and allows `src/` modules to be unit-tested without invoking the CLI.
- **`src/installers/` as separate files:** Each installer has a fundamentally different fetch strategy (Contents API recursive vs raw URL single file vs JSON merge). Keeping them separate makes them independently testable and prevents the 1,000-line monolith problem observed in the reference implementation.
- **`components.json` at root:** Committed to the repo and shipped in the npm package. Generated by `scripts/generate-catalog.js`. Loaded by `src/catalog.js` at runtime for fast, offline-capable listing. No network call needed just to see what's available.
- **Component library directories at root:** Skills, agents, commands, hooks all live at the root of the same GitHub repo that is the npm package. This means no separate "content repo" — the CLI and the components ship together and are versioned together.
- **`src/github.js` as single GitHub abstraction:** Both the Contents API (skills) and raw.githubusercontent.com (all others) are accessed through one module. Rate limit handling, auth token injection, and error formatting live here and only here.

## Architectural Patterns

### Pattern 1: Dual-Path GitHub Fetch

**What:** Skills use `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` (Git Trees API) to enumerate all files in a skill directory in one request, then fetch each file's content. All other component types construct a `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` URL and fetch directly.

**When to use:** Use Git Trees API whenever you need to download an entire directory and its children. Use raw URL when you know the exact file path.

**Trade-offs:** Git Trees API requires two steps (get tree, then fetch each blob) but handles arbitrary nesting. Raw URL is a single HTTP GET but only works for known file paths.

**Example:**
```javascript
// Skills: enumerate then fetch each blob
async function installSkill(name) {
  const tree = await fetchTree(`skills/${name}`, { recursive: true });
  for (const item of tree.filter(i => i.type === 'blob')) {
    const content = await fetchRaw(item.path);
    await writeFile(localPath(item.path), content);
  }
}

// Agents: direct raw fetch
async function installAgent(name) {
  const content = await fetchRaw(`agents/${name}.md`);
  await writeFile(`.claude/agents/${name}.md`, content);
}
```

### Pattern 2: Additive JSON Merge for Hooks

**What:** Hooks define entries that go into `settings.json` under the `hooks` key. The installer reads the existing `settings.json` (or starts with `{}`), merges the new hook entries into the existing arrays, and writes back. Existing hook entries are never deleted.

**When to use:** Any time component installation needs to modify a shared config file rather than write an isolated file.

**Trade-offs:** Safe (non-destructive), but requires reading before writing. Must handle the case where `settings.json` does not exist yet.

**Example:**
```javascript
async function mergeHook(hookDef, settingsPath) {
  const existing = readJsonOrEmpty(settingsPath);
  existing.hooks = existing.hooks || {};
  for (const [hookType, entries] of Object.entries(hookDef.hooks)) {
    existing.hooks[hookType] = [
      ...(existing.hooks[hookType] || []),
      ...entries,
    ];
  }
  writeJson(settingsPath, existing);
}
```

### Pattern 3: Scope-Resolved Settings Path

**What:** Before writing `settings.json`, ask the user: user-global (`~/.claude/settings.json`) or project-local (`./.claude/settings.json`)? Resolve the path before calling the merge. This decision flows from the dispatcher into the hook installer, not the other way around.

**When to use:** Hooks and any future component types that modify shared config.

**Trade-offs:** Adds an interactive prompt step, but avoids silently writing to the wrong scope. Skip the prompt if `--global` or `--local` flags are provided.

**Example:**
```javascript
async function resolveSettingsPath(flags) {
  if (flags.global) return path.join(os.homedir(), '.claude', 'settings.json');
  if (flags.local)  return path.join(process.cwd(), '.claude', 'settings.json');
  const { scope } = await inquirer.prompt([{
    type: 'list',
    name: 'scope',
    message: 'Install hook to:',
    choices: ['User global (~/.claude/)', 'Project local (./.claude/)'],
  }]);
  return scope.includes('global')
    ? path.join(os.homedir(), '.claude', 'settings.json')
    : path.join(process.cwd(), '.claude', 'settings.json');
}
```

### Pattern 4: Static Pre-Generated Catalog

**What:** `components.json` is generated at authoring time by `scripts/generate-catalog.js`, committed to the repo, and shipped inside the npm package. `src/catalog.js` reads it synchronously at CLI startup. No network request is needed to list available components.

**When to use:** Any CLI tool whose component library lives in the same repo as the CLI code.

**Trade-offs:** Components list is only as current as the installed npm package version. This is a feature for stability: `npx cc-templates@1.2.0` always lists exactly the components that shipped with 1.2.0. Run `npx cc-templates@latest` for newest components.

**Example catalog entry:**
```json
{
  "type": "skill",
  "name": "video-download",
  "path": "skills/video-download",
  "description": "Download video files using yt-dlp",
  "author": "maystudios"
}
```

## Data Flow

### Install Flow: Single-File Component (agent/command)

```
User: npx cc-templates --agent video-summarizer
    |
    v
bin/cc-templates.js
    | Commander parses --agent "video-summarizer"
    v
src/index.js
    | options.agent is set → call installAgent("video-summarizer")
    v
src/installers/agents.js
    | construct URL: raw.githubusercontent.com/maystudios/cc-templates/main/agents/video-summarizer.md
    v
src/github.js: fetchRaw(url)
    | GET request → response text
    v
src/fs.js: ensureDir(".claude/agents/") + writeFile(".claude/agents/video-summarizer.md", content)
    |
    v
Console: "Installed agent: video-summarizer"
```

### Install Flow: Multi-File Component (skill)

```
User: npx cc-templates --skill video-download
    |
    v
bin/cc-templates.js → src/index.js
    | options.skill is set → call installSkill("video-download")
    v
src/installers/skills.js
    | Need tree of skills/video-download — get default branch SHA first
    v
src/github.js: GET /repos/maystudios/cc-templates/git/trees/main?recursive=1
    | Filter tree items where path starts with "skills/video-download/"
    v
src/installers/skills.js
    | For each blob in tree:
    |   construct raw URL → fetchRaw(url) → writeFile(localPath)
    |   mark .py/.sh files executable (chmod on non-Windows)
    v
Console: "Installed skill: video-download (N files)"
```

### Install Flow: Hook

```
User: npx cc-templates --hook pre-commit-lint
    |
    v
bin/cc-templates.js → src/index.js → src/installers/hooks.js
    |
    v
src/github.js: fetchRaw("hooks/pre-commit-lint.json") → hookDef object
    |
    v
src/platform.js: replacePythonCommands(hookDef)
    | on win32: replace "python3 " → "python " in all command strings
    v
src/installers/hooks.js: resolveSettingsPath(flags)
    | prompt user: global or local scope?
    v
src/fs.js: readJsonOrEmpty(settingsPath) → merge → writeJson(settingsPath, merged)
    |
    v
Console: "Installed hook: pre-commit-lint → ~/.claude/settings.json"
```

### Interactive Menu Flow (no flags)

```
User: npx cc-templates
    |
    v
src/index.js
    | no flags detected → call showMenu()
    v
src/menu.js
    | Inquirer prompt: "What would you like to install?"
    |   > Skills | Agents | Commands | Hooks | List all
    v
src/catalog.js: getComponents(type)
    | read components.json, filter by type, return list
    v
src/menu.js
    | Inquirer prompt: "Choose a skill:" [list from catalog]
    v
src/index.js
    | user selection → call appropriate installer
    v
[same flow as flag-based install above]
```

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| GitHub Contents API | `GET /repos/{owner}/{repo}/contents/{path}` via `node-fetch` or native `fetch` | Returns array for dir, object for file; use for skill tree enumeration |
| GitHub Git Trees API | `GET /repos/{owner}/{repo}/git/trees/{sha}?recursive=1` | Preferred for full skill directory; handles nested dirs in one call |
| raw.githubusercontent.com | Direct HTTP GET to `https://raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` | For agents, commands, hook JSON; no auth needed for public repo |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| `bin/` to `src/index.js` | Direct `require`/`import`, passes parsed Commander options object | Bin is thin; all decisions in index.js |
| `src/index.js` to installers | Direct function call, passes `(name, options)` | No shared state between installers |
| `src/installers/*` to `src/github.js` | Function calls: `fetchRaw(url)`, `fetchTree(path)` | Installers never construct GitHub URLs directly |
| `src/installers/*` to `src/fs.js` | Function calls: `ensureDir(path)`, `writeFile(path, content)`, `readJsonOrEmpty(path)`, `writeJson(path, data)` | All filesystem I/O centralized |
| `src/installers/hooks.js` to `src/platform.js` | `replacePythonCommands(config)` called before merge | Platform detection isolated; other installers need not know about it |

## Build Order (Dependency Graph)

Build in this order to avoid blocking:

```
1. package.json + bin/cc-templates.js     ← No dependencies; sets up npx invocation
2. src/platform.js                         ← Pure utility; no internal deps
3. src/github.js                           ← Pure utility; no internal deps
4. src/fs.js                               ← Pure utility; no internal deps
5. components.json + scripts/generate-catalog.js  ← Needs component dirs to exist
6. src/catalog.js                          ← Needs components.json
7. src/installers/agents.js                ← Needs github.js, fs.js
8. src/installers/commands.js              ← Needs github.js, fs.js
9. src/installers/skills.js                ← Needs github.js, fs.js (most complex)
10. src/installers/hooks.js                ← Needs github.js, fs.js, platform.js
11. src/menu.js                            ← Needs catalog.js + all installers
12. src/index.js                           ← Needs all of the above
```

**Rationale:** Pure utilities (platform, github, fs) have no internal dependencies and can be built and tested first. The catalog depends on component directories existing. Installers depend only on utilities. Menu depends on catalog and installers. The dispatcher (index.js) depends on everything and is assembled last.

## Anti-Patterns

### Anti-Pattern 1: The Monolith Entry Point

**What people do:** Put all logic — flag parsing, GitHub fetching, file writing, JSON merging, platform detection — in a single `src/index.js` file. (The reference implementation `davila7/claude-code-templates` has a 1,145-line `index.js`.)

**Why it's wrong:** Skills vs agents vs hooks have fundamentally different install flows. A monolith conflates them, making it impossible to test individual installers, hard to add new component types, and easy to introduce regressions across component types when changing one.

**Do this instead:** `src/index.js` is a dispatcher only — it reads flags and calls the correct installer module. Each installer is its own file in `src/installers/`. Each is independently importable and testable.

### Anti-Pattern 2: Constructing GitHub URLs in Installer Code

**What people do:** Hardcode `https://raw.githubusercontent.com/maystudios/cc-templates/main/` inside each installer function.

**Why it's wrong:** When the repo name, branch, or URL pattern changes, every installer needs to change. Difficult to mock in tests.

**Do this instead:** `src/github.js` owns all URL construction. Installers call `fetchRaw('agents/foo.md')` and `fetchTree('skills/video-download')`. The repo owner, name, and branch are configured in one place (package.json `config` or a constants file).

### Anti-Pattern 3: Replacing the Entire settings.json on Hook Install

**What people do:** Fetch the hook JSON and write it as the full `settings.json`, overwriting any user customizations.

**Why it's wrong:** Destroys other hooks, existing permissions, and user settings. Unrecoverable without a backup.

**Do this instead:** Always read-merge-write. Read existing JSON (or default to `{}`), merge hook entries into the `hooks` arrays using array concatenation, write back. Never replace the full file.

### Anti-Pattern 4: Dynamic Catalog Generation at Runtime

**What people do:** On every `npx cc-templates` invocation, call the GitHub Contents API to discover what components exist, then display the list.

**Why it's wrong:** Adds a network round-trip before the user sees any output, adds rate limit exposure, and fails completely if GitHub is unreachable. For a CLI tool invoked frequently, this is a bad user experience.

**Do this instead:** Pre-generate `components.json` at publish time. Ship it in the npm package. Load it synchronously at startup. Components list is always instant and offline-capable. Catalog is updated by releasing a new package version.

### Anti-Pattern 5: Skipping Windows path/executable handling

**What people do:** Write hooks and skills assuming Unix paths and `python3` as the Python executable.

**Why it's wrong:** Windows does not have `python3` in PATH by default. Hook command strings with `python3` will silently fail. Skill scripts with `#!/usr/bin/env python3` shebangs are also unreachable via the standard Windows Python launcher.

**Do this instead:** Run `replacePythonCommands()` from `src/platform.js` on all hook definitions before writing them on `process.platform === 'win32'`. Do not set executable bits (`chmod`) on Windows since it has no effect and `fs.chmod` can throw.

## Scaling Considerations

This is a CLI installer, not a server. "Scale" means the number of components and contributors, not concurrent users.

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-50 components | `components.json` is small; no special handling needed |
| 50-500 components | Add `type` and `tag` filtering in `src/catalog.js`; interactive menu needs pagination (Inquirer `autocomplete`) |
| 500+ components | Consider splitting `components.json` by type (`skills.json`, `agents.json`, etc.) to keep startup load fast; still pre-generated and shipped |

### Scaling Priorities

1. **First friction point:** Interactive menu becomes unwieldy with many components — add Inquirer `autocomplete` prompt type early (when component count exceeds ~30 per type).
2. **Second friction point:** `components.json` file size — at 500+ components it may approach 100KB; still fine, but consider type-split if startup latency is noticeable.

## Sources

- GitHub Git Trees API — recursive parameter behavior: [https://docs.github.com/en/rest/git/trees](https://docs.github.com/en/rest/git/trees?apiVersion=2022-11-28) (HIGH confidence — official docs)
- GitHub Contents API — directory vs file response format, download_url expiry: [https://docs.github.com/en/rest/repos/contents](https://docs.github.com/en/rest/repos/contents?apiVersion=2022-11-28) (HIGH confidence — official docs)
- Reference implementation internal structure: [https://deepwiki.com/davila7/claude-code-templates](https://deepwiki.com/davila7/claude-code-templates) (MEDIUM confidence — third-party analysis, verified against source)
- raw.githubusercontent.com URL format: [https://github.com/orgs/community/discussions/44370](https://github.com/orgs/community/discussions/44370) (HIGH confidence — GitHub community, confirmed pattern)
- Node.js CLI best practices (module boundaries, entry point, bin/ pattern): [https://github.com/lirantal/nodejs-cli-apps-best-practices](https://github.com/lirantal/nodejs-cli-apps-best-practices) (HIGH confidence — widely cited reference)
- Platform detection for Windows python3→python: Derived from reference implementation `replacePythonCommands()` function — source verified via WebFetch (HIGH confidence)

---
*Architecture research for: cc-templates npm CLI installer*
*Researched: 2026-02-24*

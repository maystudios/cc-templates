# Stack Research

**Domain:** Minimal npm CLI tool — Claude Code component installer
**Researched:** 2026-02-24
**Confidence:** HIGH

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Node.js | `>=18.17.0` | Runtime | Native fetch stable in v18+, `fs/promises` with `recursive: true` available since v12.12. Node 18 is the oldest LTS still receiving security patches. Require it explicitly in `engines`. |
| CommonJS (no `"type":"module"`) | — | Module format | Avoids the ESM-in-CLI footgun. `"type":"module"` breaks shebangs on some older npm/npx versions and complicates `__dirname` usage. CJS works everywhere npx runs, including Node 18 LTS. Revisit when Node 18 EOL (April 2025) fully clears the install base. |
| commander | `14.0.3` | Flag-based CLI interface (`--skill`, `--agent`, etc.) | Most downloaded CLI framework at 137M weekly downloads. Clean, git-style API. Less configuration ceremony than yargs. Auto-generates `--help`. Battle-tested by create-react-app, prisma, and hundreds of other CLIs. |
| @inquirer/prompts | `8.3.0` | Interactive menu when no flags supplied | The rewritten, modular successor to `inquirer`. ESM and CJS dual-published. Used by eslint, webpack, yarn, pm2. Supports `select`, `checkbox`, `input`, `confirm` — everything needed for a component picker. Smaller than the old `inquirer` monolith. |
| chalk | `5.6.2` | Terminal color output | De facto standard. 100M+ weekly downloads. Pure ESM in v5+ but also works from CJS via dynamic `import()`. Used to highlight selected item names, success/error messages. |
| ora | `9.3.0` | Spinner during downloads | Sindre Sorhus's spinner — the standard for "doing work" feedback in Node CLIs. Works alongside chalk. Zero configuration for basic usage. |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| fs-extra | `11.3.3` | File system operations beyond native `fs` | Use for `ensureDir`, `copy`, `outputFile`. Native `fs/promises` covers recursive `mkdir` but still lacks recursive directory copy, which is needed when installing skill directories. Eliminates boilerplate for path-safe writes. |
| Node.js native `fetch` | built-in (v18+) | HTTP requests to GitHub APIs | Use for all network calls: `raw.githubusercontent.com` direct file fetches and GitHub Contents API recursive directory listing. Zero dependency cost. Sufficient for this use case — no retries or HTTP/2 needed. Do NOT add `got`, `axios`, or `node-fetch` as dependencies. |
| Node.js native `fs/promises` | built-in | File reads/writes/stat | Use alongside fs-extra. Prefer `fs.promises.readFile` / `writeFile` for simple single-file operations; use fs-extra for directory copy, ensureDir. |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| `npm` (no bundler) | Package manager and publish pipeline | No build step needed. This is a plain JS CLI — source is the distribution. Add a `"files"` field to `package.json` to whitelist what gets published. No tsup/esbuild needed. |
| `eslint` | Lint | Optional but recommended. Use flat config (`eslint.config.js`). `eslint:recommended` ruleset is sufficient. |
| `prettier` | Formatting | Optional. Single-dev project can skip, but add if contributors are expected. |

## Installation

```bash
# Core (runtime dependencies)
npm install commander @inquirer/prompts chalk ora fs-extra

# Dev dependencies
npm install -D eslint prettier
```

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| `commander` | `yargs` | When you need middleware, extensible plugin system, or highly complex nested subcommands. Overkill for `--skill`, `--agent`, `--hook`, `--command` flag parsing. |
| `commander` | `minimist` / `meow` | For scripts with 1-2 flags. Too minimal when you want auto-generated help text and typed option definitions. |
| `@inquirer/prompts` | `@clack/prompts` (v1.0.1) | Clack produces visually beautiful output (spinners, grouped sections). Choose if UI polish is the priority. Tradeoff: smaller community (4K projects vs hundreds of thousands), fewer prompt types, very new (v1.0.1). |
| `@inquirer/prompts` | `prompts` | Lightweight async/await alternative. Good for 1-2 prompt types. `@inquirer/prompts` wins on prompt variety and community trust. |
| Native `fetch` | `got` (v14.6.6) | `got` adds automatic retries, HTTP/2, hooks. Justified only if the GitHub API becomes unreliable or you need advanced retry logic. Not needed for this tool's straightforward GET requests. |
| Native `fetch` | `axios` | Axios is a browser+Node dual package — that portability is wasted here. Adds ~50KB to install footprint. No advantage over native fetch for a pure-Node CLI. |
| Native `fetch` | `node-fetch` | `node-fetch` exists to polyfill `fetch` on older Node. With `engines: ">=18.17.0"`, native fetch is available and `node-fetch` is dead weight. |
| No bundler (plain JS) | TypeScript + `tsup` | TypeScript makes sense when team size grows or the API surface becomes complex. For a focused single-maintainer CLI, plain JS ships faster and eliminates a build step. Migrate to TypeScript if contributors join and bugs from type errors appear. |
| CJS | ESM (`"type":"module"`) | ESM brings cleaner import syntax but requires `import.meta.url` instead of `__dirname`, breaks in some npx edge cases with older npm versions, and forces dynamic `import()` for chalk v5. Use ESM only after dropping Node 18 support. |

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| `request` (deprecated 2020) | Unmaintained, security vulnerabilities, removed from npm recommendations | Native `fetch` |
| `node-fetch` | Redundant when Node engine is `>=18`. Adds a dependency for zero gain | Native `fetch` (built-in) |
| `axios` | Browser+Node dual target bloat; no benefit over native fetch for this use case | Native `fetch` |
| Old `inquirer` (pre-v9 or `inquirer` without `@`) | The monolith package was rewritten; old versions have known issues with newer Node and TypeScript | `@inquirer/prompts` |
| TypeScript for initial build | Adds build pipeline, tsconfig, and tooling overhead to a simple tool. The complexity cost exceeds the benefit for a small, focused CLI | Plain JS with JSDoc for IDE hints if needed |
| `boxen` | Nice-to-have visual boxes. Reference impl uses it, but this tool's UI needs are simpler. Can add later if summary panels are needed | `chalk` + `console.log` |
| `"type": "module"` in package.json | Breaks `__dirname`, complicates shebang handling, forces all deps to be ESM-compatible. CJS is safer for CLIs targeting the widest Node range | Omit `"type"` field (default CJS) |

## Stack Patterns by Variant

**If the component catalog grows large (50+ items):**
- Add fuzzy search with `fuse.js` or use `@inquirer/prompts` `search` prompt type (available in v8+)
- Because scrolling through 50 items in a flat list is unusable

**If GitHub API rate limits become a problem:**
- Add optional `GITHUB_TOKEN` env var support via `process.env.GITHUB_TOKEN` as Bearer header
- Because unauthenticated requests cap at 60/hour; authenticated requests get 5,000/hour
- The rate limit change announced by GitHub in May 2025 now also applies to `raw.githubusercontent.com` downloads

**If TypeScript is added later:**
- Use `tsup` (v8.5.1) to bundle — it's the current standard, outputting CJS + types
- Do not switch to `tsdown` yet — it's faster but less mature as of early 2026

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `chalk@5.x` | Node `>=12.20.0` | Pure ESM. From CJS, use `const { default: chalk } = await import('chalk')` or upgrade to a dynamic import pattern. Alternatively pin `chalk@4.x` (last CJS version) to avoid the pattern — chalk 4.1.2 still receives security patches. |
| `@inquirer/prompts@8.x` | Node `>=18.0.0` | Dual CJS/ESM. Works from CJS `require()` with no issues. |
| `commander@14.x` | Node `>=18.0.0` | CJS. Standard CommonJS. |
| `ora@9.x` | Node `>=18.0.0` | Pure ESM. Same dynamic import pattern as chalk applies. Use `ora@7.x` if staying CJS without dynamic imports. |
| `fs-extra@11.x` | Node `>=14.14.0` | CJS. No issues. |

**Chalk and Ora ESM note:** Both `chalk@5+` and `ora@9+` are pure ESM. If the package is CJS (no `"type":"module"`), two options:

1. Use `chalk@4.1.2` and `ora@7.x` (last CJS versions) — simpler, recommended for initial build
2. Use top-level `await import()` inside an async main function — works but adds complexity

**Recommendation:** Pin `chalk@4.1.2` and `ora@7.x` for the initial build. These versions are still maintained for security patches and avoid the ESM/CJS friction entirely.

## Concrete package.json Shape

```json
{
  "name": "cc-templates",
  "version": "0.1.0",
  "description": "Install Claude Code components (skills, agents, hooks, commands) from GitHub",
  "bin": {
    "cc-templates": "./bin/cli.js"
  },
  "engines": {
    "node": ">=18.17.0"
  },
  "files": [
    "bin/",
    "lib/"
  ],
  "scripts": {
    "start": "node bin/cli.js"
  },
  "dependencies": {
    "chalk": "^4.1.2",
    "@inquirer/prompts": "^8.3.0",
    "commander": "^14.0.3",
    "fs-extra": "^11.3.3",
    "ora": "^7.0.1"
  }
}
```

The `bin/cli.js` entry must start with `#!/usr/bin/env node`.

## Sources

- `npm view commander version` — confirmed v14.0.3 (run 2026-02-24)
- `npm view @inquirer/prompts version` — confirmed v8.3.0 (run 2026-02-24)
- `npm view chalk version` — confirmed v5.6.2 (run 2026-02-24, ESM-only)
- `npm view ora version` — confirmed v9.3.0 (run 2026-02-24, ESM-only)
- `npm view fs-extra version` — confirmed v11.3.3 (run 2026-02-24)
- [npmtrends: commander vs yargs vs minimist](https://npmtrends.com/commander-vs-minimist-vs-nopt-vs-optimist-vs-optionator-vs-yargs) — download volume comparison (MEDIUM confidence, web search)
- [GitHub REST API Rate Limits](https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api) — 60 req/hr unauthenticated, 5,000 req/hr authenticated (HIGH confidence, official docs)
- [GitHub Changelog: Updated rate limits for unauthenticated requests (May 2025)](https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/) — rate limits now also apply to raw.githubusercontent.com (HIGH confidence, official changelog)
- [Node.js Fetch stable](https://blog.logrocket.com/fetch-api-node-js/) — fetch stable since Node v21, available since v18 (MEDIUM confidence, web + official Node.js docs)
- [davila7/claude-code-templates package.json](https://raw.githubusercontent.com/davila7/claude-code-templates/main/package.json) — reference implementation uses commander, inquirer, chalk, ora, axios, fs-extra (HIGH confidence, official source)
- [TypeScript in 2025 ESM/CJS mess](https://lirantal.com/blog/typescript-in-2025-with-esm-and-cjs-npm-publishing) — ESM/CJS friction context (MEDIUM confidence, web search)
- [@clack/prompts npm page](https://www.npmjs.com/package/@clack/prompts) — confirmed v1.0.1, 4K projects (HIGH confidence, npm registry)

---
*Stack research for: cc-templates — minimal npm CLI installer for Claude Code components*
*Researched: 2026-02-24*

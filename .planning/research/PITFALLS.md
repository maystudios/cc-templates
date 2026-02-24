# Pitfalls Research

**Domain:** npm CLI tool — GitHub file fetcher / component installer
**Researched:** 2026-02-24
**Confidence:** HIGH (most pitfalls verified against official docs and real issue reports)

---

## Critical Pitfalls

### Pitfall 1: GitHub API Rate Limiting Kills Unauthenticated Users

**What goes wrong:**
The GitHub REST API (Contents API) allows only 60 requests per hour for unauthenticated callers — shared per IP address, not per user. A single skill install that recursively downloads a directory can consume 10–30+ API calls. On a shared network (office, university, CI), multiple users hitting the same IP exhaust the limit within minutes, causing hard 403/429 failures with no graceful fallback.

**Why it happens:**
Developers test locally with a clean IP and never hit the limit. Once real users on shared networks or CI pipelines use the tool, requests stack up. GitHub tightened unauthenticated limits further in May 2025 after increased scraping activity (GitHub Changelog: "Updated rate limits for unauthenticated requests").

**How to avoid:**
- Use `raw.githubusercontent.com` for **single-file** downloads (agents, commands) — these are served via CDN with more generous limits but are still subject to 429 throttling
- Reserve the **Contents API** exclusively for skill directory listings (mandatory because raw.githubusercontent.com cannot list directories)
- Detect 403/429 responses and surface a human-readable message: "GitHub rate limit hit. Wait ~1 hour or set GITHUB_TOKEN env var"
- Support optional `GITHUB_TOKEN` env var — authenticated requests get 5,000 req/hour; document this in README prominently
- Batch as few API calls as possible: use the Git Trees API (`?recursive=1`) for directory listing instead of per-file Contents API calls (Trees API returns the full tree in a single request)

**Warning signs:**
- Rate limit errors appear during development only after many consecutive test runs
- CI environments always fail even though local works fine
- Error messages say "403 Forbidden" or "429 Too Many Requests" from `api.github.com`

**Phase to address:** Phase 1 (Core installer). Handle rate limit errors and GITHUB_TOKEN support from day one — retrofitting graceful degradation is painful.

---

### Pitfall 2: npx Serves Stale Cached Versions

**What goes wrong:**
npx caches packages after first use. Subsequent `npx cc-templates` runs use the cached version, not the latest published one. Users running `npx cc-templates` in good faith may install from a version weeks behind the current release. This is a persistent, long-standing npm bug with multiple open issues (npm/cli#2329, npm/cli#4108, npm/cli#5262, npm/cli#6179).

**Why it happens:**
npx maintains a separate `_npx` cache directory that `npm cache clear --force` does not clear. The cache check does not reliably validate against the npm registry for non-versioned invocations.

**How to avoid:**
- Instruct users in README and first-run output to always use `npx cc-templates@latest` — the `@latest` tag forces a fresh resolution
- Add a startup version-check: on every run, fetch the `latest` version from the npm registry (`https://registry.npmjs.org/cc-templates/latest`) and warn if the running version is older
- Keep the version check non-blocking — warn and proceed, never block the install
- Document the `npx clear-npx-cache` workaround for users stuck on old versions

**Warning signs:**
- Users report "I installed component X but it's not showing up" — often because the old version doesn't know about that component
- Bug reports for issues that are already fixed in a newer release
- Users who ran the tool once never see new components in the catalog

**Phase to address:** Phase 1 (Core installer). Add version staleness check at first-run; document `@latest` in all user-facing output.

---

### Pitfall 3: File Conflict Handling — Silent Overwrites or Hard Crashes

**What goes wrong:**
When a component is already installed (e.g., `.claude/skills/video-download/` exists), the installer either silently overwrites the user's customized files or throws an `EEXIST` error and crashes. The reference implementation (davila7/claude-code-templates issue #48) has an unresolved bug where it tries to `mkdir` on a path that is already a file, causing an uncaught exception.

**Why it happens:**
Developers test install on clean systems. The conflict case — "what if the user already has this?" — is not considered during initial implementation. Node.js `fs.mkdir` throws `EEXIST` by default unless `{ recursive: true }` is passed, and `fs.copyFile` silently overwrites unless `COPYFILE_EXCL` flag is set.

**How to avoid:**
- Before installing any component, check whether the target path exists
- If it exists: prompt the user ("Component already installed. Overwrite? [y/N]")
- Support a `--force` flag to skip the prompt for scripted use
- Support a `--dry-run` flag showing what would be installed/overwritten without touching the filesystem
- Use `fs.mkdir(path, { recursive: true })` for directory creation — never bare `fs.mkdir`
- When overwriting a file, consider creating a `.bak` backup of the original

**Warning signs:**
- Test suite only tests installs on empty directories
- `EEXIST` errors in user issue reports
- Users complaining their customizations were lost after re-running the installer

**Phase to address:** Phase 1 (Core installer). Implement conflict detection and `--force` flag in the initial file-writing logic before shipping.

---

### Pitfall 4: Hooks Merge Corrupts or Destroys settings.json

**What goes wrong:**
Claude Code's `settings.json` is a structured JSON file with existing content. A naive hook installer that reads the file, appends to the hooks array, and writes it back can introduce:
- Duplicate hook entries on repeated installs (bloating the file)
- Overwrites of user-configured keys (`env`, `permissions`, other custom config)
- Malformed JSON if the merge logic crashes mid-write (file left in partial state)
- Structural collision if `hooks` key doesn't exist yet vs. already has entries

**Why it happens:**
JSON merging is deceptively simple at first glance — "just add to the array." In practice, settings.json may have arbitrary existing content, multiple hook types, matchers, and format variations. The reference implementation's hook installer is one of the most commonly reported failure points.

**How to avoid:**
- Use a proper deep-merge strategy: read existing JSON, merge only the hooks section, leave all other keys untouched
- Deduplicate hook entries by comparing `matcher` + `hooks[].command` before appending (idempotent installs)
- Validate the merged JSON can be serialized (JSON.stringify round-trip) before writing
- Write to a temp file then rename (atomic write pattern) to prevent partial-write corruption
- After writing, read the file back and validate it parses correctly
- Preserve the original formatting style (2-space indent is standard for Claude settings.json)
- Support both scopes: `~/.claude/settings.json` (user-global) and `./.claude/settings.json` (project-local)

**Warning signs:**
- Users report Claude Code stops working after hook install
- `settings.json` contains duplicate hook entries
- JSON parse errors from Claude Code about malformed settings
- "hooks" array missing or at wrong nesting level

**Phase to address:** Phase 1 (Hooks installer). The settings.json merge logic must be tested with pre-populated, edge-case settings files before shipping.

---

### Pitfall 5: Windows Path Separator Failures

**What goes wrong:**
Node.js path operations return backslash-separated paths on Windows (`C:\Users\foo\.claude\skills\video-download`). When these paths are used in string comparisons, URL construction, or passed to tools expecting forward slashes, installs silently fail or produce garbled paths. The shebang line (`#!/usr/bin/env node`) also causes issues: if the bin file has Windows CRLF line endings, env treats the executable name as `node\r`, which fails.

**Why it happens:**
Development happens on macOS/Linux. Windows is treated as an afterthought. `path.join()` is used correctly in some places but string concatenation with `/` is used in others (especially URL construction). Tests never run on Windows.

**How to avoid:**
- **Always** use `path.join()` and `path.resolve()` for filesystem paths — never string concatenation with `/`
- For URL construction (GitHub API paths), use `/` explicitly — these are URLs, not OS paths
- Use the `slash` npm package (`sindresorhus/slash`) to convert any OS path to forward-slash for display/logging
- Set `.gitattributes` to `* text=auto` and explicitly mark the bin entry point as `*.js text eol=lf` to prevent Git from adding CRLF on Windows checkout
- For hook command strings containing `python3`: detect Windows (`process.platform === 'win32'`) and replace with `python` (this is what the reference implementation does — keep this behavior)
- Use `cross-spawn` package if the installer ever needs to spawn child processes
- Test on Windows (GitHub Actions `windows-latest` runner) in CI

**Warning signs:**
- Path-related errors reported exclusively by Windows users
- `ENOENT` errors where the path contains backslashes inside a URL-like string
- Shebang errors on Windows ("bad interpreter")
- Hook commands fail on Windows with "python3 not found"

**Phase to address:** Phase 1 (Core installer). Use `path.join()` from the start; add Windows to CI matrix before first publish.

---

## Moderate Pitfalls

### Pitfall 6: GitHub Contents API Returns 1,000-File Limit — Skills Silently Truncated

**What goes wrong:**
The GitHub Contents API truncates directory listings at 1,000 files. If a skill directory grows large (unlikely now, possible later), files beyond the 1,000-entry limit are silently omitted from the install. The user gets a partial skill with no error.

**How to avoid:**
Use the Git Trees API (`GET /repos/{owner}/{repo}/git/trees/{tree_sha}?recursive=1`) instead of the Contents API for skill directory listing. Trees API returns all entries in a single request (up to 100,000 entries, 7 MB). Check the `truncated` field in the response and surface an error if true. Bonus: Trees API uses only 1 API call per skill instead of N calls for N-subdirectory levels.

**Phase to address:** Phase 1 (Skills installer). Prefer Trees API + targeted raw downloads over recursive Contents API from day one.

---

### Pitfall 7: npm Package Publishes Dev Files or Misses Production Files

**What goes wrong:**
Without an explicit `files` field in `package.json`, npm publishes everything not in `.gitignore`. This can include: test fixtures, local dev scripts, `.planning/` directory, `.claude/` dev configs, large binary fixtures, or any sensitive config files. Conversely, if `dist/` is in `.gitignore` and there's no `.npmignore`, the built output never gets published and `npx cc-templates` installs a broken package.

**Why it happens:**
The `files` field is optional and easy to omit. The interaction between `.gitignore`, `.npmignore`, and `files` is confusing — `.npmignore` completely replaces `.gitignore` when both exist.

**How to avoid:**
- Always define `"files": ["bin/", "lib/", "README.md"]` explicitly in `package.json`
- Run `npm pack --dry-run` before every publish to inspect the tarball contents
- Add `npm pack` inspection to the release checklist
- Never rely on `.npmignore` alone — use the `files` whitelist approach instead

**Phase to address:** Phase 2 (npm publish). Add `npm pack` dry-run check to the release process.

---

### Pitfall 8: Component Naming Conflicts and Catalog Drift

**What goes wrong:**
The reference implementation (davila7/claude-code-templates) has open issues about:
- Mismatched skill names between the catalog JSON and actual directory names (#338)
- marketplace.json referencing non-existent file paths (28 broken references, #274)
- Version output showing wrong version (#348)

When component names in the catalog diverge from actual directory names in the repo, installs fail with 404 on GitHub, or succeed but put files in the wrong place.

**Why it happens:**
Components are renamed or reorganized in the repo but the catalog/manifest file is not updated. No automated check verifies catalog-to-filesystem consistency.

**How to avoid:**
- Derive the catalog dynamically from the repository's actual file structure rather than maintaining a separate hand-edited manifest
- If a catalog file is used, add a CI check that validates every catalog entry has a corresponding directory/file in the repo
- Use exact directory names as the component identifier — no aliases, no display-name vs. id divergence
- Add an integration test that performs a real install of each catalog component in CI

**Phase to address:** Phase 1 (Catalog design) and ongoing (CI validation).

---

### Pitfall 9: npx Package Name Squatting / Phantom Package Risk

**What goes wrong:**
If `cc-templates` is not claimed on npm before the project is publicized, a malicious actor can register it. Users running `npx cc-templates` would then execute the squatter's code. A July 2025 security research scan found many "phantom" package names referenced in documentation but never registered — a major attack vector.

**How to avoid:**
- **Register `cc-templates` on npm immediately** — even as an empty package with a README — before announcing the project
- Enable npm 2FA on the publishing account
- Verify the package name is available before any public announcement

**Phase to address:** Phase 0 (Before first public mention). Register the npm package name on day one.

---

## Minor Pitfalls

### Pitfall 10: Download URLs from Contents API Expire

**What goes wrong:**
The `download_url` field returned by the GitHub Contents API expires and is intended for single-use. If the CLI caches these URLs (e.g., fetches the directory listing, then downloads files later), the download URLs may be stale by the time they are used.

**How to avoid:**
Always fetch a fresh `download_url` immediately before each file download. Do not cache Contents API download URLs between requests. For public repos, use `raw.githubusercontent.com/{owner}/{repo}/{branch}/{path}` constructed from the known path — this is stable and doesn't expire.

**Phase to address:** Phase 1 (File downloader). Use stable raw.githubusercontent.com URLs for known paths; only use Contents API download_url synchronously.

---

### Pitfall 11: Interactive Mode Breaks in Non-TTY Environments

**What goes wrong:**
If `npx cc-templates` (no flags) launches an interactive menu, it will hang or crash when run in CI, piped, or non-TTY environments. Libraries like `inquirer` or `@clack/prompts` throw errors or hang indefinitely when `process.stdin` is not a TTY.

**How to avoid:**
- Detect `process.stdin.isTTY` before launching interactive mode
- If not a TTY, require explicit flags (`--skill`, `--agent`, etc.) and print a usage error
- Document that the interactive menu requires a terminal

**Phase to address:** Phase 1 (CLI entry point).

---

### Pitfall 12: Missing or Wrong shebang Causes "Permission Denied" on Linux/macOS

**What goes wrong:**
If the bin entry point is missing `#!/usr/bin/env node` on the first line, or if the file lacks the executable bit, users get "permission denied" or "command not found" errors when npm links the binary.

**How to avoid:**
- First line of every bin script must be `#!/usr/bin/env node`
- npm sets the executable bit automatically on publish/install — do not manually chmod
- Ensure the bin file has LF line endings (not CRLF) — use `.gitattributes` to enforce this
- Test `npm link` locally before first publish

**Phase to address:** Phase 1 (CLI scaffold). Set up correctly before first commit.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Hardcode raw.githubusercontent.com URLs | Simpler code, no API calls for single files | Breaks if GitHub changes URL scheme; harder to support private repos | Acceptable for v1 on public repo |
| Maintain hand-edited catalog JSON | Easy to start | Catalog drifts from actual repo contents; causes 404 installs | Never — automate catalog generation |
| Skip `--force` flag, always prompt interactively | Less code | Breaks CI/scripted use; frustrates power users | Never — add `--force` from day one |
| No GITHUB_TOKEN support | Simpler env handling | Rate-limited users with no escape hatch | Never — add token support from day one |
| Skip Windows CI | Faster CI setup | Windows bugs reach users; hard to debug remotely | Never — add Windows CI before first publish |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| GitHub Contents API | Using per-file API calls to list directories recursively | Use Git Trees API with `?recursive=1` for the entire skill tree in 1 request |
| GitHub Contents API | Caching download_url and using it later | Construct `raw.githubusercontent.com` URL from path, or fetch fresh download_url immediately before use |
| raw.githubusercontent.com | Assuming no rate limits because it's a CDN | CDN still enforces 429 on high-volume unauthenticated access; handle 429 with retry-after |
| settings.json merge | Using JSON.parse/JSON.stringify then writing back | Deep merge preserving all non-hooks keys; atomic write via temp file + rename |
| npx distribution | Assuming users get latest version automatically | Always recommend `@latest`; add startup version check against registry |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Sequential file downloads for multi-file skills | Install takes 10–30 seconds for a skill with 10 files | Parallelise downloads with `Promise.all` (batch of 5–10 concurrent) | Every install, but especially painful at 60 req/hour unauthenticated |
| Per-file Contents API calls for directory listing | Hits rate limit installing a single large skill | Single Git Trees API call returns all paths | After ~30 files in a skill directory |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No integrity check on downloaded files | Compromised GitHub account or MITM delivers malicious skill files | For v1 on public repo: GitHub's TLS + HTTPS is sufficient. Future: consider SHA checksums in catalog |
| Publishing npm package from unprotected account | Supply chain attack via compromised npm token | Enable npm 2FA; use granular tokens with publish-only scope and short expiry (7 days) |
| Executing hook command strings from remote repo without disclosure | Users may not know what commands will run | Display the hook command string before installing and require confirmation |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Silent install with no output | User doesn't know if install succeeded | Print each file written: `+ .claude/skills/video-download/CLAUDE.md` |
| Crash on rate limit with raw error | User sees "403 Forbidden" and is confused | Catch 403/429, print "GitHub rate limit hit. Set GITHUB_TOKEN or wait 1 hour." |
| No `--list` command | User must visit GitHub to see available components | `npx cc-templates --list` prints catalog with one-liner descriptions |
| Overwrite without warning | User loses customizations | Prompt before overwriting; `--force` to skip |
| Interactive menu hangs in CI | CI pipeline hangs indefinitely | Detect non-TTY, require explicit flags |

---

## "Looks Done But Isn't" Checklist

- [ ] **Rate limiting:** Works on dev machine with fresh IP — verify it handles 403/429 and surfaces GITHUB_TOKEN option
- [ ] **Windows install:** Works on macOS — verify on Windows with `windows-latest` CI runner before publishing
- [ ] **Conflict handling:** Works on clean `.claude/` — verify behavior when component already exists
- [ ] **settings.json merge:** Works when settings.json is empty — verify with complex pre-populated settings (hooks, env, permissions)
- [ ] **Catalog accuracy:** Catalog looks right — run automated check that every catalog entry resolves to a real path in the repo
- [ ] **npm package contents:** Package publishes — run `npm pack --dry-run` to verify exactly which files ship
- [ ] **npx staleness:** Works when run immediately after publish — verify `@latest` is documented and version check warns appropriately
- [ ] **Non-TTY environments:** Interactive mode works in terminal — verify it fails gracefully in CI/pipe environments

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Rate limit not handled | MEDIUM | Add 403/429 detection + GITHUB_TOKEN support in a patch release; users with issues can set token manually |
| Catalog drift causes 404s | LOW | Publish corrected catalog; users re-run install |
| settings.json corruption | HIGH | No automated recovery; user must manually fix JSON; add atomic write + backup before this happens |
| File conflict silent overwrite | MEDIUM | Cannot recover lost user customizations; add conflict detection in next release |
| npm package name squatted | HIGH (if discovered late) | Register immediately; if squatted, file dispute with npm; may require rename |
| Windows path failures | MEDIUM | Patch release; discoverable via Windows CI before publish if set up early |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| GitHub API rate limiting | Phase 1: Core installer | Test with simulated 403 response; test with GITHUB_TOKEN set |
| npx stale cache | Phase 1: CLI entry point | Document `@latest`; add version check; verify in README |
| File conflict / EEXIST crash | Phase 1: File writer | Test install on pre-existing component; test `--force` flag |
| settings.json merge corruption | Phase 1: Hooks installer | Test merge with edge-case existing settings; verify atomic write |
| Windows path separators | Phase 1: All file operations | Add `windows-latest` to CI matrix before first publish |
| Contents API 1000-file limit | Phase 1: Skills installer | Use Git Trees API from day one |
| npm publish wrong files | Phase 2: npm publish | `npm pack --dry-run` in release checklist |
| Component naming / catalog drift | Phase 1: Catalog design + CI | Automated catalog-vs-repo validation in CI |
| npm name squatting | Phase 0: Before announcement | Register package name immediately |
| Download URL expiration | Phase 1: File downloader | Use stable raw URLs or synchronous fetch |
| Non-TTY interactive mode hang | Phase 1: CLI entry point | Test `echo "" | npx cc-templates` in CI |
| Shebang / CRLF line endings | Phase 1: CLI scaffold | `npm link` test locally; `.gitattributes` LF enforcement |

---

## Sources

- GitHub REST API rate limits (official): https://docs.github.com/en/rest/using-the-rest-api/rate-limits-for-the-rest-api
- GitHub Changelog — Updated rate limits for unauthenticated requests (May 2025): https://github.blog/changelog/2025-05-08-updated-rate-limits-for-unauthenticated-requests/
- GitHub Contents API 1000-file truncation: https://github.com/orgs/community/discussions/136892
- GitHub Git Trees API documentation: https://docs.github.com/en/rest/repos/contents
- npx stale cache bug (npm/cli#2329): https://github.com/npm/cli/issues/2329
- npx stale cache bug (npm/cli#4108): https://github.com/npm/cli/issues/4108
- npx stale cache bug (npm/cli#5262): https://github.com/npm/cli/issues/5262
- npx stale cache (npm/rfcs#700): https://github.com/npm/rfcs/issues/700
- davila7/claude-code-templates EEXIST issue #48: https://github.com/davila7/claude-code-templates/issues/48
- davila7/claude-code-templates marketplace.json bug #274: https://github.com/davila7/claude-code-templates/issues
- davila7/claude-code-templates plugin loading error #128: https://github.com/davila7/claude-code-templates/issues/128
- Windows path separator pitfalls (node-glob issue): https://github.com/isaacs/node-glob/issues/419
- sindresorhus/slash (path normalizer): https://github.com/sindresorhus/slash
- cross-spawn npm package: https://www.npmjs.com/package/cross-spawn
- CRLF shebang issue in npm bin scripts: https://github.com/npm/feedback/discussions/148
- npm publish files field best practices: https://blog.npmjs.org/post/165769683050/publishing-what-you-mean-to-publish.html
- npm phantom package / name squatting research (2025): https://www.aikido.dev/blog/npx-confusion-unclaimed-package-names
- npm supply chain attack risks: https://github.com/lirantal/npm-security-best-practices
- CLI UX best practices (clig.dev): https://clig.dev/
- raw.githubusercontent.com rate limit issue (bazarr): https://github.com/morpheus65535/bazarr/issues/3057

---
*Pitfalls research for: npm CLI tool — GitHub file fetcher / component installer (cc-templates)*
*Researched: 2026-02-24*

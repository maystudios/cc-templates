# Contributing to cc-templates

Contributions are welcome — new templates (skills, agents, hooks, commands), bug fixes, and documentation improvements are all valuable. The catalog grows because people add to it.

---

## Development Setup

Fork the repo, then:

```bash
git clone https://github.com/<your-username>/cc-templates.git
cd cc-templates
npm install
npm run build
npm test
```

`npm run build` compiles TypeScript (`src/` → `dist/`) and regenerates `components.json` from the `components/` directory.

`npm test` runs the smoke test suite via Node's built-in test runner.

---

## Adding a New Template

### 1. Choose a component type

| Type | What it is | Where it installs |
|------|------------|-------------------|
| skill | Instruction set for a specific task | `.claude/skills/<name>/` |
| agent | Custom sub-agent with a specialized behavior | `.claude/agents/<name>.md` |
| hook | Shell command on a Claude Code lifecycle event | `settings.json` |
| command | Custom slash command | `.claude/commands/<name>.md` |

### 2. Create the component files

**Skill** — create a directory `components/skills/<name>/` containing at minimum a `SKILL.md` file. Add any supporting reference files in subdirectories.

**Agent** — create `components/agents/<name>.md` with the agent persona and instructions.

**Hook** — create `components/hooks/<name>.yaml` with hook event, command, and metadata.

**Command** — create `components/commands/<name>.md` with the slash command content.

### 3. Register in the catalog

Edit `components.json` to add an entry in the appropriate array:

```json
{
  "name": "your-component-name",
  "description": "One sentence: what it does and when to use it",
  "author": "your-github-username",
  "version": "1.0.0",
  "tags": ["relevant", "tags"]
}
```

Alternatively, run `npm run build` — it regenerates `components.json` automatically from the `components/` directory if you include a manifest file.

### 4. Test locally

```bash
node bin/index.js --skill your-component-name
```

Verify the files land in the expected location, no errors are thrown, and the output message names the author correctly.

### 5. Open a PR

One template per PR is ideal. Fill in the PR description, make sure CI passes, and a maintainer will review within a week.

---

## Conventional Commits

This project uses [semantic-release](https://semantic-release.gitbook.io/) to automate version bumps and changelog generation. **Commit messages must follow the Conventional Commits format** or CI will not generate a release.

```
feat: add video-summarizer skill
fix: resolve path issue on Windows
docs: update README with agent examples
chore: update dependencies
feat!: rename component flag (BREAKING CHANGE)
```

**How version bumps work:**

| Prefix | Bump | When to use |
|--------|------|-------------|
| `feat` | minor (0.x.0) | New template or new feature |
| `fix` | patch (0.0.x) | Bug fix |
| `docs`, `chore`, `style`, `test` | none | No release triggered |
| `feat!` or `BREAKING CHANGE:` footer | major (x.0.0) | Removes or renames existing behavior |

Tip: adding a new skill or agent is a `feat`. Fixing a broken installer path is a `fix`.

---

## PR Process

- Keep PRs focused — one new template or one bug fix per PR
- Fill in the PR description with what the component does and when to use it
- All CI checks must pass before review
- Maintainers aim to review within a week of submission

---

## Code of Conduct

This project follows the [Contributor Covenant](https://www.contributor-covenant.org/).

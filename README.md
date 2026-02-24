# cc-templates

Install Claude Code components — skills, agents, hooks, and commands — with one command.

[![npm version](https://img.shields.io/npm/v/cc-templates.svg)](https://www.npmjs.com/package/cc-templates)
[![License: MIT](https://img.shields.io/npm/l/cc-templates.svg)](https://github.com/maystudios/cc-templates/blob/main/LICENSE)
[![Node.js >=22](https://img.shields.io/node/v/cc-templates.svg)](https://nodejs.org)

---

## Quick Start

### via npx

Run the interactive menu — pick a component type, pick a component, done:

```bash
npx cc-templates
```

```
? What type of component do you want to install? (Use arrow keys)
  Skill
  Agent
  Hook
  Command
? Which skill? (Use arrow keys)
  tech-product-landing
  video-download
  video-fetch-and-summarize
> video-summarizer

Installed skill video-download to .claude/skills/video-download/  by cc-templates
```

Install directly without the menu:

```bash
npx cc-templates --skill video-download
```

### via skills.sh

```bash
# Install all skills
npx skills add maystudios/cc-templates

# Install a specific skill
npx skills add maystudios/cc-templates --skill video-download
npx skills add maystudios/cc-templates --skill tech-product-landing
```

---

## Component Types

**Skills** are packaged instruction sets that extend Claude's capabilities for specific tasks. A skill is a directory of markdown rules and references. Installed to `.claude/skills/<name>/`.

**Agents** are custom sub-agents with specialized behaviors — each is a markdown file that defines a focused AI persona or workflow. Installed to `.claude/agents/<name>.md`.

**Hooks** are shell commands that run automatically on Claude Code lifecycle events (e.g., after a file save, before a commit). Merged into `settings.json` — never overwrites your existing hooks.

**Commands** are custom slash commands for Claude Code. Each adds a `/command-name` shortcut in the Claude Code interface. Installed to `.claude/commands/<name>.md`.

---

## Available Components

### Skills

| Name | Description | Author | Requires |
|------|-------------|--------|----------|
| `tech-product-landing` | Build production-grade landing pages for software/CLI tools and developer libraries. Dark theme, framer-motion animations, tabbed docs. Stack: Vite + React + TypeScript + Tailwind v4 | maystudios | node, npm |
| `video-download` | Download videos from YouTube, Instagram, TikTok, and 1000+ platforms via yt-dlp | cc-templates | yt-dlp |
| `video-fetch-and-summarize` | Download videos and generate structured AI summaries using Google Gemini | cc-templates | yt-dlp, GEMINI_API_KEY |
| `video-summarizer` | Generate AI summaries of existing MP4 files using Google Gemini | cc-templates | GEMINI_API_KEY |

### Agents, Hooks, Commands

No entries yet — the catalog grows via community contributions. See [CONTRIBUTING.md](./CONTRIBUTING.md) to add the first one.

---

## All CLI Commands

```bash
npx cc-templates                          # Interactive menu
npx cc-templates --skill <name>           # Install skill directly
npx cc-templates --agent <name>           # Install agent
npx cc-templates --hook <name>            # Install hook
npx cc-templates --command <name>         # Install command
npx cc-templates --list                   # Browse full catalog
npx cc-templates --skill <name> --global  # Install to ~/.claude/
npx cc-templates --skill <name> --force   # Reinstall over existing
```

---

## Requirements

- Node.js >= 22

---

## Contributing

New templates are welcome via pull request — skills, agents, hooks, and commands all accepted. See [CONTRIBUTING.md](./CONTRIBUTING.md) for the full guide: fork setup, how to add a component to the catalog, and the PR process.

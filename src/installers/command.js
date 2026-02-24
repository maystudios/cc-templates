// src/installers/command.js
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';

/**
 * Install a command component (.md file) to .claude/commands/<name>.md
 * @param {string} name - Command name
 * @param {object} opts - CLI options: { force, global, verbose }
 */
export async function installCommand(name, opts = {}) {
  // SAFE-01: validate before fetching
  validateName('command', name);

  // INST-05: resolve base dir
  const baseDir = opts.global ? homedir() : process.cwd();
  const targetPath = join(baseDir, '.claude', 'commands', `${name}.md`);

  // SAFE-02: conflict check
  if (existsSync(targetPath)) {
    if (!opts.force) {
      output.warn(`${name} already installed. Use --force to overwrite.`);
      return { success: false, reason: 'exists' };
    }
    // INST-06: --force warns before overwriting
    output.warn(`Overwriting existing: ${targetPath}`);
  }

  // Fetch from raw.githubusercontent.com
  const url = buildRawUrl('commands', `${name}.md`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch command "${name}" (HTTP ${res.status}): ${url}`);
  }
  const content = await res.text();

  // Write file (create parent dirs if needed)
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, 'utf8');

  if (opts.verbose) output.verbose(`  wrote ${targetPath}`);

  const displayPath = opts.global
    ? `~/.claude/commands/${name}.md`
    : `.claude/commands/${name}.md`;
  output.success(`Installed ${name} command to ${displayPath}`);
  output.hint(`Use this command in Claude Code with /${name}`);

  return { success: true };
}

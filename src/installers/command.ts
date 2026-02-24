// src/installers/command.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';
import { InstallOptions } from '../types.js';

/**
 * Install a command component (.md file) to .claude/commands/<name>.md
 */
export async function installCommand(name: string, opts: InstallOptions = {}): Promise<{ success: boolean; reason?: string }> {
  // SAFE-01: validate before fetching
  validateName('command', name);

  // INST-05: resolve base dir
  const baseDir: string = opts.global ? homedir() : process.cwd();
  const targetPath: string = join(baseDir, '.claude', 'commands', `${name}.md`);

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
  const url: string = buildRawUrl('commands', `${name}.md`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch command "${name}" (HTTP ${res.status}): ${url}`);
  }
  const content: string = await res.text();

  // Write file (create parent dirs if needed)
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, 'utf8');

  if (opts.verbose) output.verbose(`  wrote ${targetPath}`);

  const displayPath: string = opts.global
    ? `~/.claude/commands/${name}.md`
    : `.claude/commands/${name}.md`;
  output.success(`Installed ${name} command to ${displayPath}`);
  output.hint(`Use this command in Claude Code with /${name}`);

  return { success: true };
}

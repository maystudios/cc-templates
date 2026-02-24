// src/installers/agent.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';
import { InstallOptions } from '../types.js';

/**
 * Install an agent component (.md file) to .claude/agents/<name>.md
 */
export async function installAgent(name: string, opts: InstallOptions = {}): Promise<{ success: boolean; reason?: string }> {
  // SAFE-01: validate before fetching (catalog.js throws with inline list on failure)
  const entry = validateName('agent', name);

  // INST-05: resolve base dir
  const baseDir: string = opts.global ? homedir() : process.cwd();
  const targetPath: string = join(baseDir, '.claude', 'agents', `${name}.md`);

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
  const url: string = buildRawUrl('agents', `${name}.md`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch agent "${name}" (HTTP ${res.status}): ${url}`);
  }
  const content: string = await res.text();

  // Write file (create parent dirs if needed — INST-05 / --global may require dir creation)
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, 'utf8');

  if (opts.verbose) output.verbose(`  wrote ${targetPath}`);

  // One-line success summary (per CONTEXT.md output decisions)
  const displayPath: string = opts.global
    ? `~/.claude/agents/${name}.md`
    : `.claude/agents/${name}.md`;
  const authorSuffix = entry.author ? `  by ${entry.author}` : '';
  output.success(`${name} installed to ${displayPath}${authorSuffix}`);

  return { success: true };
}

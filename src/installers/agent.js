// src/installers/agent.js
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';

/**
 * Install an agent component (.md file) to .claude/agents/<name>.md
 * @param {string} name - Agent name (validated against catalog before calling)
 * @param {object} opts - CLI options: { force, global, verbose }
 */
export async function installAgent(name, opts = {}) {
  // SAFE-01: validate before fetching (catalog.js throws with inline list on failure)
  validateName('agent', name);

  // INST-05: resolve base dir
  const baseDir = opts.global ? homedir() : process.cwd();
  const targetPath = join(baseDir, '.claude', 'agents', `${name}.md`);

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
  const url = buildRawUrl('agents', `${name}.md`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch agent "${name}" (HTTP ${res.status}): ${url}`);
  }
  const content = await res.text();

  // Write file (create parent dirs if needed — INST-05 / --global may require dir creation)
  mkdirSync(dirname(targetPath), { recursive: true });
  writeFileSync(targetPath, content, 'utf8');

  if (opts.verbose) output.verbose(`  wrote ${targetPath}`);

  // One-line success summary (per CONTEXT.md output decisions)
  const displayPath = opts.global
    ? `~/.claude/agents/${name}.md`
    : `.claude/agents/${name}.md`;
  output.success(`Installed ${name} agent to ${displayPath}`);
  output.hint(`Use this agent in Claude Code with @${name}`);

  return { success: true };
}

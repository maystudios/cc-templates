// src/installers/skill.js
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { buildContentsApiUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';

const GITHUB_HEADERS = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'cc-templates',
};

/**
 * Recursively download all files in a GitHub directory to a local target dir.
 * @param {string} apiUrl - GitHub Contents API URL for this directory
 * @param {string} targetDir - Local directory path to write files into
 * @param {object} opts - { verbose }
 * @returns {boolean} false if apiUrl returns 404, true on success
 */
async function downloadDirectory(apiUrl, targetDir, opts) {
  const res = await fetch(apiUrl, { headers: GITHUB_HEADERS });

  if (res.status === 404) return false;
  if (res.status === 403) {
    const body = await res.json().catch(() => ({}));
    const msg = body.message ?? 'forbidden';
    throw new Error(
      `GitHub API returned 403: ${msg}. ` +
      `You may have hit the unauthenticated rate limit (60 req/hour). ` +
      `Wait a minute and try again, or set GITHUB_TOKEN env var.`
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub Contents API error: HTTP ${res.status} for ${apiUrl}`);
  }

  const items = await res.json();
  mkdirSync(targetDir, { recursive: true });

  for (const item of items) {
    if (item.type === 'file') {
      const fileRes = await fetch(item.download_url);
      if (!fileRes.ok) {
        throw new Error(`Failed to download file ${item.name} (HTTP ${fileRes.status})`);
      }
      const content = await fileRes.text();
      const filePath = join(targetDir, item.name);
      writeFileSync(filePath, content, 'utf8');
      if (opts.verbose) output.verbose(`  wrote ${item.name}`);
    } else if (item.type === 'dir') {
      await downloadDirectory(item.url, join(targetDir, item.name), opts);
    }
  }
  return true;
}

/**
 * Install a skill component (directory) to .claude/skills/<name>/
 * @param {string} name - Skill name
 * @param {object} opts - CLI options: { force, global, verbose }
 */
export async function installSkill(name, opts = {}) {
  // SAFE-01: validate before any network call
  validateName('skill', name);

  // INST-05: resolve base dir
  const baseDir = opts.global ? homedir() : process.cwd();
  const targetDir = join(baseDir, '.claude', 'skills', name);

  // SAFE-02: conflict check
  if (existsSync(targetDir)) {
    if (!opts.force) {
      output.warn(`${name} already installed. Use --force to overwrite.`);
      return { success: false, reason: 'exists' };
    }
    // INST-06: --force warns before overwriting
    output.warn(`Overwriting existing skill: ${name} (all files will be replaced)`);
  }

  const apiUrl = buildContentsApiUrl('skills', name);
  if (opts.verbose) output.verbose(`  fetching ${apiUrl}`);

  const found = await downloadDirectory(apiUrl, targetDir, opts);
  if (!found) {
    // Component was in catalog but not found on GitHub — data integrity issue
    throw new Error(
      `Skill "${name}" is listed in the catalog but not found on GitHub. ` +
      `This may be a temporary GitHub issue. Try again, or report a bug.`
    );
  }

  const displayPath = opts.global
    ? `~/.claude/skills/${name}/`
    : `.claude/skills/${name}/`;
  output.success(`Installed ${name} skill to ${displayPath}`);
  output.hint(`Use this skill in Claude Code with /${name}`);

  return { success: true };
}

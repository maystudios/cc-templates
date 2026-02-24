// src/installers/skill.ts
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { buildContentsApiUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';
import { InstallOptions, GitHubContentsItem } from '../types.js';

const GITHUB_HEADERS: Record<string, string> = {
  'Accept': 'application/vnd.github.v3+json',
  'User-Agent': 'cc-templates',
};

/**
 * Recursively download all files in a GitHub directory to a local target dir.
 */
async function downloadDirectory(apiUrl: string, targetDir: string, opts: InstallOptions): Promise<boolean> {
  const res = await fetch(apiUrl, { headers: GITHUB_HEADERS });

  if (res.status === 404) return false;
  if (res.status === 403) {
    const body = await res.json().catch(() => ({})) as { message?: string };
    const msg: string = body.message ?? 'forbidden';
    throw new Error(
      `GitHub API returned 403: ${msg}. ` +
      `You may have hit the unauthenticated rate limit (60 req/hour). ` +
      `Wait a minute and try again, or set GITHUB_TOKEN env var.`
    );
  }
  if (!res.ok) {
    throw new Error(`GitHub Contents API error: HTTP ${res.status} for ${apiUrl}`);
  }

  const items = await res.json() as GitHubContentsItem[];
  mkdirSync(targetDir, { recursive: true });

  for (const item of items) {
    if (item.type === 'file') {
      const fileRes = await fetch(item.download_url as string);
      if (!fileRes.ok) {
        throw new Error(`Failed to download file ${item.name} (HTTP ${fileRes.status})`);
      }
      const content: string = await fileRes.text();
      const filePath: string = join(targetDir, item.name);
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
 */
export async function installSkill(name: string, opts: InstallOptions = {}): Promise<{ success: boolean; reason?: string }> {
  // SAFE-01: validate before any network call
  validateName('skill', name);

  // INST-05: resolve base dir
  const baseDir: string = opts.global ? homedir() : process.cwd();
  const targetDir: string = join(baseDir, '.claude', 'skills', name);

  // SAFE-02: conflict check
  if (existsSync(targetDir)) {
    if (!opts.force) {
      output.warn(`${name} already installed. Use --force to overwrite.`);
      return { success: false, reason: 'exists' };
    }
    // INST-06: --force warns before overwriting
    output.warn(`Overwriting existing skill: ${name} (all files will be replaced)`);
  }

  const apiUrl: string = buildContentsApiUrl('skills', name);
  if (opts.verbose) output.verbose(`  fetching ${apiUrl}`);

  const found: boolean = await downloadDirectory(apiUrl, targetDir, opts);
  if (!found) {
    // Component was in catalog but not found on GitHub — data integrity issue
    throw new Error(
      `Skill "${name}" is listed in the catalog but not found on GitHub. ` +
      `This may be a temporary GitHub issue. Try again, or report a bug.`
    );
  }

  const displayPath: string = opts.global
    ? `~/.claude/skills/${name}/`
    : `.claude/skills/${name}/`;
  output.success(`Installed ${name} skill to ${displayPath}`);
  output.hint(`Use this skill in Claude Code with /${name}`);

  return { success: true };
}

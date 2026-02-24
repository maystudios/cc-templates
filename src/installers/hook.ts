// src/installers/hook.ts
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';
import { InstallOptions } from '../types.js';

// write-file-atomic 7.x is CJS — use createRequire for reliable ESM interop.
// Direct default import works in some Node 20+ builds; createRequire is the safe fallback.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let writeFileAtomic: (path: string, data: string) => Promise<void>;
try {
  const mod = await import('write-file-atomic');
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeFileAtomic = (mod.default ?? mod) as (path: string, data: string) => Promise<void>;
} catch {
  const { createRequire } = await import('node:module');
  const require = createRequire(import.meta.url);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  writeFileAtomic = require('write-file-atomic') as (path: string, data: string) => Promise<void>;
}

/**
 * Install a hook component by deep-merging its JSON into settings.json.
 */
export async function installHook(name: string, opts: InstallOptions = {}): Promise<{ success: boolean }> {
  // SAFE-01: validate before any network call
  const entry = validateName('hook', name);

  // INST-05: resolve settings.json path
  const baseDir: string = opts.global ? homedir() : process.cwd();
  const settingsPath: string = join(baseDir, '.claude', 'settings.json');

  // Fetch hook JSON from GitHub
  const url: string = buildRawUrl('hooks', `${name}.json`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch hook "${name}" (HTTP ${res.status}): ${url}`);
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let hookData: any = await res.json();

  // SAFE-07: Windows python3 → python replacement
  // Applied to the whole JSON string (safe because component authors don't embed "python3" in path names)
  if (process.platform === 'win32') {
    hookData = JSON.parse(JSON.stringify(hookData).replace(/\bpython3\b/g, 'python'));
    if (opts.verbose) output.verbose('  applied python3\u2192python replacement (Windows)');
  }

  // SAFE-06: Read existing settings.json
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let existing: Record<string, any> = {};
  if (existsSync(settingsPath)) {
    const raw: string = readFileSync(settingsPath, 'utf8');
    try {
      existing = JSON.parse(raw);
    } catch {
      // Malformed JSON — abort, do not touch file (SAFE-06 locked decision)
      throw new Error(
        `settings.json at ${settingsPath} contains invalid JSON. ` +
        `Fix it manually before installing hooks.`
      );
    }
  }

  // SAFE-06: Array-append merge — never replace existing hook entries
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const merged: Record<string, any> = { ...existing };
  merged.hooks = { ...(existing.hooks ?? {}) };
  const addedKeys: string[] = [];

  for (const [event, matchers] of Object.entries(hookData.hooks ?? {})) {
    if (!Array.isArray(merged.hooks[event])) {
      merged.hooks[event] = [];
    }
    // CRITICAL: spread existing array, then append new matchers
    merged.hooks[event] = [...merged.hooks[event], ...(matchers as unknown[])];
    addedKeys.push(event);
  }

  // Ensure parent directory exists (--global may need ~/.claude/ creation)
  mkdirSync(dirname(settingsPath), { recursive: true });

  // SAFE-06: Atomic write — write to temp file, then rename (no partial-write corruption)
  await writeFileAtomic(settingsPath, JSON.stringify(merged, null, 2) + '\n');

  const authorSuffix = entry.author ? `  by ${entry.author}` : '';
  output.success(`${name} hook added to settings.json${authorSuffix}`);
  if (opts.verbose) {
    for (const key of addedKeys) {
      output.verbose(`  ${key}: appended ${hookData.hooks[key].length} matcher group(s)`);
    }
  }

  return { success: true };
}

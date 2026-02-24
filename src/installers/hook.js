// src/installers/hook.js
import { existsSync, readFileSync, mkdirSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { createRequire } from 'node:module';
import { buildRawUrl } from '../fetch.js';
import { output } from '../output.js';
import { validateName } from '../catalog.js';

// write-file-atomic 7.x is CJS — use createRequire for reliable ESM interop.
// Direct default import works in some Node 20+ builds; createRequire is the safe fallback.
let writeFileAtomic;
try {
  const mod = await import('write-file-atomic');
  writeFileAtomic = mod.default;
} catch {
  const require = createRequire(import.meta.url);
  writeFileAtomic = require('write-file-atomic');
}

/**
 * Install a hook component by deep-merging its JSON into settings.json.
 * @param {string} name - Hook name
 * @param {object} opts - CLI options: { force, global, verbose }
 */
export async function installHook(name, opts = {}) {
  // SAFE-01: validate before any network call
  validateName('hook', name);

  // INST-05: resolve settings.json path
  const baseDir = opts.global ? homedir() : process.cwd();
  const settingsPath = join(baseDir, '.claude', 'settings.json');

  // Fetch hook JSON from GitHub
  const url = buildRawUrl('hooks', `${name}.json`);
  if (opts.verbose) output.verbose(`  fetching ${url}`);

  const res = await fetch(url);
  if (!res.ok) {
    throw new Error(`Failed to fetch hook "${name}" (HTTP ${res.status}): ${url}`);
  }

  let hookData = await res.json();

  // SAFE-07: Windows python3 → python replacement
  // Applied to the whole JSON string (safe because component authors don't embed "python3" in path names)
  if (process.platform === 'win32') {
    hookData = JSON.parse(JSON.stringify(hookData).replace(/\bpython3\b/g, 'python'));
    if (opts.verbose) output.verbose('  applied python3\u2192python replacement (Windows)');
  }

  // SAFE-06: Read existing settings.json
  let existing = {};
  if (existsSync(settingsPath)) {
    const raw = readFileSync(settingsPath, 'utf8');
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
  const merged = { ...existing };
  merged.hooks = { ...(existing.hooks ?? {}) };
  const addedKeys = [];

  for (const [event, matchers] of Object.entries(hookData.hooks ?? {})) {
    if (!Array.isArray(merged.hooks[event])) {
      merged.hooks[event] = [];
    }
    // CRITICAL: spread existing array, then append new matchers
    merged.hooks[event] = [...merged.hooks[event], ...matchers];
    addedKeys.push(event);
  }

  // Ensure parent directory exists (--global may need ~/.claude/ creation)
  mkdirSync(dirname(settingsPath), { recursive: true });

  // SAFE-06: Atomic write — write to temp file, then rename (no partial-write corruption)
  await writeFileAtomic(settingsPath, JSON.stringify(merged, null, 2) + '\n');

  const keyList = addedKeys.join(', ');
  output.success(`Added ${keyList} hook to settings.json`);
  if (opts.verbose) {
    for (const key of addedKeys) {
      output.verbose(`  ${key}: appended ${hookData.hooks[key].length} matcher group(s)`);
    }
  }

  return { success: true };
}

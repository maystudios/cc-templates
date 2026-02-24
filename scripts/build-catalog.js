#!/usr/bin/env node
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { createRequire } from 'node:module';

// js-yaml 4.x is CJS — import as default works in Node 20+ ESM context.
// If default import fails, createRequire fallback is used.
let yaml;
try {
  const mod = await import('js-yaml');
  yaml = mod.default;
} catch {
  const require = createRequire(import.meta.url);
  yaml = require('js-yaml');
}

const __dirname = fileURLToPath(new URL('.', import.meta.url));
const ROOT = join(__dirname, '..');
const COMPONENT_TYPES = ['skills', 'hooks', 'commands', 'mcp'];
const REQUIRED_FIELDS = ['name', 'description'];

function extractFrontmatter(filePath) {
  if (!existsSync(filePath)) return null;
  const content = readFileSync(filePath, 'utf8');
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  if (!match) return null;
  return yaml.load(match[1]);
}

function getMainFile(typeDir, entry) {
  const entryPath = join(typeDir, entry);
  if (statSync(entryPath).isDirectory()) {
    // Skills are directories; primary file is skill.md
    return join(entryPath, 'skill.md');
  }
  // Hooks, commands, mcp are individual files
  if (entry === '.gitkeep') return null;
  return entryPath;
}

function buildCatalog() {
  const catalog = {};
  const errors = [];

  for (const type of COMPONENT_TYPES) {
    catalog[type] = [];
    const typeDir = join(ROOT, 'components', type);

    if (!existsSync(typeDir)) {
      console.warn(`WARN: components/${type}/ does not exist — skipping`);
      continue;
    }

    for (const entry of readdirSync(typeDir)) {
      const mainFile = getMainFile(typeDir, entry);
      if (!mainFile) continue; // .gitkeep or null

      const fm = extractFrontmatter(mainFile);
      if (!fm) {
        errors.push(`${mainFile}: missing or unparseable frontmatter`);
        continue;
      }

      for (const field of REQUIRED_FIELDS) {
        if (!fm[field]) {
          errors.push(`${mainFile}: missing required field "${field}"`);
        }
      }

      catalog[type].push({
        name: fm.name ?? null,
        description: fm.description ?? null,
        author: fm.author ?? null,
        version: fm.version ?? null,
        tags: Array.isArray(fm.tags) ? fm.tags : [],
      });
    }
  }

  if (errors.length > 0) {
    console.error('\nCatalog build FAILED — fix the following errors:\n');
    for (const e of errors) console.error(`  ERROR: ${e}`);
    process.exit(1);
  }

  const outPath = join(ROOT, 'components.json');
  writeFileSync(outPath, JSON.stringify(catalog, null, 2) + '\n');
  const total = Object.values(catalog).reduce((n, arr) => n + arr.length, 0);
  console.log(`components.json written — ${total} component(s) across ${COMPONENT_TYPES.length} types`);
}

buildCatalog();

// src/catalog.ts
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { CatalogEntry, ComponentType } from './types.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, '../components.json'), 'utf8')
);

// Map CLI type name to components.json key.
// CLI flag: skill, agent, command, hook, mcp
// components.json key: skills, agents, commands, hooks, mcp
function getCatalogKey(type: ComponentType): string {
  if (type === 'mcp') return 'mcp';
  return `${type}s`; // skill -> skills, agent -> agents, command -> commands, hook -> hooks
}

// Get all available entries for a component type.
export function getAvailable(type: ComponentType): CatalogEntry[] {
  return catalog[getCatalogKey(type)] ?? [];
}

// Validate that a component name exists in the bundled catalog.
// Throws with inline list of available names if not found (SAFE-01).
export function validateName(type: ComponentType, name: string): CatalogEntry {
  const entries = getAvailable(type);
  const found = entries.find((e: CatalogEntry) => e.name === name);
  if (!found) {
    const available = entries.map((e: CatalogEntry) => e.name);
    const listStr = available.length > 0 ? available.join(', ') : '(none yet)';
    throw new Error(
      `"${name}" is not a known ${type}. Available ${type}s: ${listStr}`
    );
  }
  return found; // returns the catalog entry (has name, description, author)
}

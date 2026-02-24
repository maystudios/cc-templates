// src/catalog.js
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const catalog = JSON.parse(
  readFileSync(join(__dirname, '../components.json'), 'utf8')
);

/**
 * Map CLI type name to components.json key.
 * CLI flag: skill, agent, command, hook, mcp
 * components.json key: skills, agents, commands, hooks, mcp
 */
function getCatalogKey(type) {
  if (type === 'mcp') return 'mcp';
  return `${type}s`; // skill -> skills, agent -> agents, command -> commands, hook -> hooks
}

/**
 * Get all available entries for a component type.
 * @param {string} type - 'skill' | 'agent' | 'command' | 'hook' | 'mcp'
 * @returns {Array} array of catalog entries
 */
export function getAvailable(type) {
  return catalog[getCatalogKey(type)] ?? [];
}

/**
 * Validate that a component name exists in the bundled catalog.
 * Throws with inline list of available names if not found (SAFE-01).
 * @param {string} type - 'skill' | 'agent' | 'command' | 'hook' | 'mcp'
 * @param {string} name - Component name to validate
 */
export function validateName(type, name) {
  const entries = getAvailable(type);
  const found = entries.find(e => e.name === name);
  if (!found) {
    const available = entries.map(e => e.name);
    const listStr = available.length > 0 ? available.join(', ') : '(none yet)';
    throw new Error(
      `"${name}" is not a known ${type}. Available ${type}s: ${listStr}`
    );
  }
  return found; // returns the catalog entry (has name, description, author)
}

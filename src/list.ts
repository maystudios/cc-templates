// src/list.ts
import chalk from 'chalk';
import { getAvailable } from './catalog.js';
import type { ComponentType } from './types.js';

const TYPES: ComponentType[] = ['skill', 'agent', 'command', 'hook'];

const TYPE_LABELS: Record<ComponentType, string> = {
  skill: 'Skills',
  agent: 'Agents',
  command: 'Commands',
  hook: 'Hooks',
  mcp: 'MCP',
};

/**
 * Print all available catalog components grouped by type.
 * Uses TTY-aware chalk formatting: colored output when stdout is a TTY,
 * plain text when piped. Empty sections are silently skipped.
 */
export function printList(): void {
  const isTTY = Boolean(process.stdout.isTTY);
  let total = 0;
  let typeCount = 0;

  for (const type of TYPES) {
    const entries = getAvailable(type);

    if (entries.length === 0) continue;

    typeCount++;
    total += entries.length;

    // Section header
    if (isTTY) {
      console.log(chalk.bold(`## ${TYPE_LABELS[type]}`));
    } else {
      console.log(`## ${TYPE_LABELS[type]}`);
    }

    console.log();

    for (const entry of entries) {
      const name = entry.name ?? '(unknown)';
      const desc = entry.description ?? '';
      const author = entry.author ? `  by ${entry.author}` : '';

      if (isTTY) {
        console.log(`  ${chalk.cyan(name)}${chalk.dim(author)}`);
        if (desc) {
          console.log(`    ${chalk.dim(desc)}`);
        }
      } else {
        console.log(`  ${name}${author}`);
        if (desc) {
          console.log(`    ${desc}`);
        }
      }
    }

    console.log();
  }

  // Summary count line
  const summary = `${total} component${total !== 1 ? 's' : ''} available across ${typeCount} type${typeCount !== 1 ? 's' : ''}`;

  if (isTTY) {
    console.log(chalk.dim(summary));
  } else {
    console.log(summary);
  }
}

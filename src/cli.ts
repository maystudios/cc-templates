// src/cli.ts
import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { runInstall } from './install.js';
import type { InstallOptions } from './types.js';
import { runMenu } from './menu.js';
import { printList } from './list.js';
import { ExitPromptError } from '@inquirer/core';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8')) as { version: string };

export async function run(): Promise<void> {
  const program = new Command();

  program
    .name('cc-templates')
    .description('Install Claude Code components with one command')
    .version(pkg.version, '-v, --version', 'Show version number')
    .helpOption('-h, --help', 'Show this help message');

  program.addHelpText('beforeAll', 'cc-templates — Install Claude Code components\n');

  // Component type flags (INST-01 through INST-04 + INST-02 agent)
  program
    .option('--skill <name>',   'Install a skill component')
    .option('--agent <name>',   'Install an agent component')
    .option('--hook <name>',    'Install a hook component')
    .option('--command <name>', 'Install a command component')
    .option('--mcp <name>',     'Install an MCP component (coming soon)');

  // Listing
  program
    .option('--list',           'List all available components');

  // Behavior modifiers
  program
    .option('--force',   'Overwrite existing component without prompting (INST-06)')
    .option('--global',  'Install to ~/.claude/ instead of .claude/ (INST-05)')
    .option('--yes',     'Skip all confirmation prompts — CI mode (SAFE-04)')
    .option('--verbose', 'Show detailed output for each file written');

  program.addHelpText('after', `
Examples:
  npx cc-templates --list
  npx cc-templates --skill video-download
  npx cc-templates --skill video-download --global
  npx cc-templates --hook auto-format
  npx cc-templates --skill video-download --hook auto-format
  npx cc-templates --command git-summary --force
  npx cc-templates --skill video-download --yes`);

  program.parse(process.argv);

  const opts = program.opts<InstallOptions>();

  if (opts.list) {
    printList();
    return;
  }

  // Install flags: dispatch to runInstall orchestrator
  const hasInstallFlag = opts.skill || opts.agent || opts.command || opts.hook || opts.mcp;

  if (hasInstallFlag) {
    // opts.mcp is not implemented in Phase 2 — warn if attempted
    if (opts.mcp) {
      console.error('MCP install is not yet implemented. Check back in a future version.');
      process.exit(1);
    }
    await runInstall(opts);
    return;
  }

  // No flags: launch interactive menu (DISC-01)
  if (!process.stdin.isTTY) {
    console.error('Interactive menu requires a terminal. Run with --help for usage.');
    process.exit(1);
  }
  try {
    await runMenu();
  } catch (err) {
    if (err instanceof ExitPromptError) {
      // User pressed Ctrl+C or Escape — clean exit, no message (locked decision)
      process.exitCode = 0;
      return;
    }
    throw err; // unexpected error — surface it
  }
}

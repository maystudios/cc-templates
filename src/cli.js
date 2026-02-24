import { Command } from 'commander';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const pkg = JSON.parse(readFileSync(join(__dirname, '../package.json'), 'utf8'));

export function run() {
  const program = new Command();

  program
    .name('cc-templates')
    .description('Install Claude Code components with one command')
    .version(pkg.version, '-v, --version', 'Show version number')
    .helpOption('-h, --help', 'Show this help message');

  program.addHelpText('beforeAll', 'cc-templates — Install Claude Code components\n');

  program
    .option('--skill <name>',   'Install a skill component')
    .option('--hook <name>',    'Install a hook component')
    .option('--command <name>', 'Install a command component')
    .option('--mcp <name>',     'Install an MCP component')
    .option('--list',           'List all available components');

  program.addHelpText('after', `
Examples:
  npx cc-templates --list
  npx cc-templates --skill video-download
  npx cc-templates --hook auto-format
  npx cc-templates --command git-summary`);

  program.parse(process.argv);

  const opts = program.opts();

  // Phase 2 will implement actual install logic. For now, print a "coming soon" stub
  // for any recognized flag so the CLI feels usable during Phase 1 testing.
  if (opts.skill)   { console.log(`[stub] Would install skill: ${opts.skill}`); }
  if (opts.hook)    { console.log(`[stub] Would install hook: ${opts.hook}`); }
  if (opts.command) { console.log(`[stub] Would install command: ${opts.command}`); }
  if (opts.mcp)     { console.log(`[stub] Would install mcp: ${opts.mcp}`); }
  if (opts.list)    { console.log('[stub] Would list all components'); }
}

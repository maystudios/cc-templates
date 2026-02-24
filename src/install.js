// src/install.js
import { installSkill } from './installers/skill.js';
import { installAgent } from './installers/agent.js';
import { installCommand } from './installers/command.js';
import { installHook } from './installers/hook.js';
import { validateName } from './catalog.js';
import { output } from './output.js';

/**
 * Run all installs requested by CLI opts.
 * Dispatches to per-type installers; fails fast on first error.
 * @param {object} opts - Parsed commander options
 *   { skill, agent, command, hook, mcp, force, global, yes, verbose, list }
 */
export async function runInstall(opts) {
  // Build ordered install plan from present flags
  // Each item: { type: string, name: string }
  const plan = [];

  // opts values: each flag is a single string (not array) per CONTEXT.md decision
  // "multiple flags in single invocation" means --skill foo --hook bar, not --skill foo bar
  if (opts.skill)   plan.push({ type: 'skill',   name: opts.skill });
  if (opts.agent)   plan.push({ type: 'agent',   name: opts.agent });
  if (opts.command) plan.push({ type: 'command', name: opts.command });
  if (opts.hook)    plan.push({ type: 'hook',    name: opts.hook });
  // opts.mcp: not implemented in Phase 2 (no INST-mcp requirement); skip silently

  if (plan.length === 0) {
    // No install flag provided — caller (cli.js) should have already handled this case,
    // but guard here to avoid silent no-op
    output.info('No components to install. Run --help for usage.');
    return;
  }

  // SAFE-01: Validate ALL names against catalog before starting any installs
  // This gives a clean error upfront rather than failing halfway through multi-install
  for (const item of plan) {
    try {
      validateName(item.type, item.name);
    } catch (err) {
      output.error(err.message);
      process.exit(1);
    }
  }

  // Execute each install in plan order; fail fast on first error
  for (const item of plan) {
    try {
      switch (item.type) {
        case 'skill':
          await installSkill(item.name, opts);
          break;
        case 'agent':
          await installAgent(item.name, opts);
          break;
        case 'command':
          await installCommand(item.name, opts);
          break;
        case 'hook':
          await installHook(item.name, opts);
          break;
        default:
          output.warn(`Unknown component type "${item.type}" — skipping`);
      }
    } catch (err) {
      // Fail fast: report which component failed and why, then exit 1
      output.error(`Failed to install ${item.type} "${item.name}": ${err.message}`);
      process.exit(1);
    }
  }
}

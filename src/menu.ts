// src/menu.ts
import { select, search, Separator } from '@inquirer/prompts';
import { getAvailable } from './catalog.js';
import { runInstall } from './install.js';
import type { ComponentType, InstallOptions } from './types.js';

const COMPONENT_TYPES: Array<{ label: string; type: ComponentType }> = [
  { label: 'Skills',   type: 'skill' },
  { label: 'Agents',   type: 'agent' },
  { label: 'Commands', type: 'command' },
  { label: 'Hooks',    type: 'hook' },
];

/**
 * Run the two-level interactive component picker.
 *
 * Level 1: Select component type (skill, agent, command, hook)
 * Level 2: Search/filter components of chosen type, then install on Enter
 *
 * ExitPromptError (Ctrl+C / Escape at level 1) is NOT caught here — that
 * is handled in src/cli.ts (single catch point, locked decision).
 */
export async function runMenu(): Promise<void> {
  while (true) {
    // Level 1: pick component type
    const chosenType = await select<ComponentType>({
      message: 'What type of component do you want to install?',
      choices: COMPONENT_TYPES.map((ct) => ({
        name: ct.label,
        value: ct.type,
      })),
    });

    // Level 2: search/filter components of chosen type
    const entries = getAvailable(chosenType);

    const chosenName = await search<string | '__back__'>({
      message: `Pick a ${chosenType} to install`,
      source: (input: string | void) => {
        const term = (input ?? '').toLowerCase();
        const filtered = entries.filter((entry) => {
          if (!term) return true;
          const name = (entry.name ?? '').toLowerCase();
          const description = (entry.description ?? '').toLowerCase();
          return name.includes(term) || description.includes(term);
        });
        const filteredChoices = filtered.map((entry) => ({
          name: entry.name ?? '',
          value: entry.name ?? '',
          description: entry.description ?? undefined,
        }));
        return Promise.resolve([
          { name: '← Back', value: '__back__' as const },
          new Separator(),
          ...filteredChoices,
        ]);
      },
    });

    if (chosenName === '__back__') {
      // Return to level 1
      continue;
    }

    // Immediate install — no confirmation step (locked decision)
    await runInstall({ [chosenType]: chosenName } as InstallOptions);
    break;
  }
}

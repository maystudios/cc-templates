// src/output.ts
import chalk from 'chalk';

export const output = {
  success: (msg: string): void => console.log(`${chalk.green('✓')} ${msg}`),
  warn:    (msg: string): void => console.warn(`${chalk.yellow('⚠')} ${msg}`),
  error:   (msg: string): void => console.error(`${chalk.red('✗')} ${msg}`),
  hint:    (msg: string): void => console.log(chalk.dim(`→ ${msg}`)),
  verbose: (msg: string): void => console.log(chalk.dim(msg)),
  info:    (msg: string): void => console.log(msg),
};

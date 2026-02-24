// src/output.js
import chalk from 'chalk';

export const output = {
  success: (msg) => console.log(`${chalk.green('✓')} ${msg}`),
  warn:    (msg) => console.warn(`${chalk.yellow('⚠')} ${msg}`),
  error:   (msg) => console.error(`${chalk.red('✗')} ${msg}`),
  hint:    (msg) => console.log(chalk.dim(`→ ${msg}`)),
  verbose: (msg) => console.log(chalk.dim(msg)),
  info:    (msg) => console.log(msg),
};

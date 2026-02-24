// test/smoke.test.js
// Smoke tests: verify CLI build artifacts and --help output
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execSync } from 'node:child_process';
import { existsSync } from 'node:fs';

test('dist/cli.js exists after build', () => {
  assert.ok(existsSync('dist/cli.js'), 'dist/cli.js must exist');
});

test('dist/installers/ directory exists', () => {
  assert.ok(existsSync('dist/installers'), 'dist/installers/ must exist');
});

test('components.json exists', () => {
  assert.ok(existsSync('components.json'), 'components.json must exist');
});

test('bin/index.js --help exits with code 0 and contains cc-templates', () => {
  const output = execSync('node bin/index.js --help', { encoding: 'utf8' });
  assert.ok(output.includes('cc-templates'), '--help must mention cc-templates');
});

test('bin/index.js --version exits with code 0', () => {
  const output = execSync('node bin/index.js --version', { encoding: 'utf8' });
  // version string matches semver pattern
  assert.match(output.trim(), /^\d+\.\d+\.\d+/);
});

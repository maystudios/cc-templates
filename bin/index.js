#!/usr/bin/env node
import { run } from '../src/cli.js';

run().catch(err => {
  console.error(err.message);
  process.exit(1);
});

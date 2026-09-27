#!/usr/bin/env node

/**
 * Fail unless a migration version exists exactly once in both local and linked
 * Supabase history. Run after applying a committed migration:
 *   node scripts/assert-supabase-migration-version.mjs 20260926121048
 *
 * This catches migration-API applications that register a generated timestamp
 * instead of the version in the committed filename.
 */
import { spawnSync } from 'node:child_process';

const version = process.argv[2];
if (!version || !/^\d{8,14}$/.test(version)) {
  console.error('Usage: node scripts/assert-supabase-migration-version.mjs <8-14 digit version>');
  process.exit(2);
}

const result = spawnSync('supabase', ['migration', 'list', '--linked'], {
  encoding: 'utf8',
  maxBuffer: 10 * 1024 * 1024,
});
if (result.error || result.status !== 0) {
  console.error(result.stderr || result.error?.message || `supabase exited ${result.status}`);
  process.exit(result.status || 1);
}

const output = `${result.stdout}\n${result.stderr}`;
const jsonLine = output.split(/\r?\n/).find((line) => line.startsWith('{"migrations":'));
if (!jsonLine) {
  console.error('Could not parse migration list output; no JSON migrations record was found.');
  process.exit(1);
}

let migrations;
try {
  migrations = JSON.parse(jsonLine).migrations;
} catch (error) {
  console.error(`Could not parse Supabase migration list JSON: ${error.message}`);
  process.exit(1);
}

const matches = migrations.filter((migration) =>
  migration.local === version || migration.remote === version,
);
if (matches.length !== 1 || matches[0].local !== version || matches[0].remote !== version) {
  console.error(`Migration version ${version} is not aligned exactly once.`);
  console.error(JSON.stringify(matches, null, 2));
  process.exit(1);
}

console.log(`Migration version ${version} is present locally and remotely.`);

#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

export function parseMigrationList(output) {
  const line = `${output}`.split(/\r?\n/).find((item) => item.trimStart().startsWith('{"migrations":'));
  if (!line) throw new Error('Supabase CLI did not return migration JSON.');
  const parsed = JSON.parse(line);
  if (!Array.isArray(parsed.migrations)) throw new Error('Supabase migration JSON is missing migrations[].');
  return parsed.migrations;
}

export function findMigrationDrift(migrations) {
  const duplicates = [];
  const locals = new Map();
  for (const migration of migrations) {
    if (migration.local) locals.set(migration.local, (locals.get(migration.local) ?? 0) + 1);
  }
  for (const [version, count] of locals) if (count !== 1) duplicates.push(version);
  const oneSided = migrations.filter((migration) => migration.local !== migration.remote);
  return { duplicates, oneSided };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const result = spawnSync('supabase', ['migration', 'list', '--linked', '--output-format', 'json'], {
    encoding: 'utf8',
    maxBuffer: 10 * 1024 * 1024,
  });
  if (result.error || result.status !== 0) {
    console.error('Could not read linked Supabase migration history. No history was changed.');
    process.exit(result.status || 1);
  }
  try {
    const { duplicates, oneSided } = findMigrationDrift(parseMigrationList(result.stdout));
    if (duplicates.length || oneSided.length) {
      console.error('Migration history drift found. Do not run db push or migration repair until each row is understood.');
      if (duplicates.length) console.error(`Duplicate local versions: ${duplicates.join(', ')}`);
      for (const migration of oneSided) {
        console.error(`local=${migration.local ?? '—'} remote=${migration.remote ?? '—'}`);
      }
      process.exit(1);
    }
    console.log('Local and linked migration histories match exactly; no history was changed.');
  } catch (error) {
    console.error(error instanceof Error ? error.message : 'Could not validate migration history.');
    process.exit(1);
  }
}

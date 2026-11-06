#!/usr/bin/env node
/**
 * Decides whether a push must run `verify:calendar`, which takes about 15 minutes
 * and reads production on every run. It runs when anything it could depend on
 * changed, when the changed files cannot be worked out, and on the nightly schedule
 * (which also catches golden fixtures edited in the database with no commit).
 * packages/dharma-rules/harness/calendar-check-scope.test.ts fails if the check
 * comes to import a file these paths do not cover.
 */
import { execFileSync } from 'node:child_process';
import { appendFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';

export const CALENDAR_CHECK_PATHS = [
  '.github/workflows/ci.yml',
  'package-lock.json',
  'package.json',
  'packages/dharma-rules/',
  'packages/panchang-engine/',
  'scripts/ci/',
  'src/lib/calendar/',
  'src/lib/observance-route.ts',
  'src/lib/panchang.ts',
  'src/lib/vrat-data.ts',
  'src/types/database.ts',
  'supabase/migrations/',
];

export function touchesCalendarCheck(files) {
  return files.some((file) =>
    CALENDAR_CHECK_PATHS.some((path) => (path.endsWith('/') ? file.startsWith(path) : file === path)),
  );
}

export function decide({ eventName, base, head, changedFiles }) {
  if (eventName !== 'push' && eventName !== 'pull_request') return { run: true, reason: `event ${eventName}` };
  if (!base || /^0+$/.test(base) || !head) return { run: true, reason: 'no base commit to compare with' };
  let files;
  try {
    files = changedFiles(base, head);
  } catch {
    return { run: true, reason: 'could not list the changed files' };
  }
  if (files.length === 0) return { run: true, reason: 'no changed files listed' };
  return touchesCalendarCheck(files)
    ? { run: true, reason: 'a file it depends on changed' }
    : { run: false, reason: 'nothing it depends on changed' };
}

function gitChangedFiles(base, head) {
  return execFileSync('git', ['diff', '--name-only', `${base}...${head}`], { encoding: 'utf8' })
    .split('\n')
    .filter(Boolean);
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const { run, reason } = decide({
    eventName: process.env.GITHUB_EVENT_NAME,
    base: process.env.BASE_SHA,
    head: process.env.HEAD_SHA,
    changedFiles: gitChangedFiles,
  });
  console.log(`Calendar fixture verification: ${run ? 'run' : 'skip'} (${reason})`);
  if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `run=${run}\n`);
}

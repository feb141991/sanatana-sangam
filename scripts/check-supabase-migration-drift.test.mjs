import test from 'node:test';
import assert from 'node:assert/strict';
import { findMigrationDrift, parseMigrationList } from './check-supabase-migration-drift.mjs';

test('migration report parses the CLI JSON record and passes aligned versions', () => {
  const migrations = parseMigrationList('info: linking project\n{"migrations":[{"local":"20261001","remote":"20261001"}]}');
  assert.deepEqual(findMigrationDrift(migrations), { duplicates: [], oneSided: [] });
});

test('migration report fails closed on local-only, remote-only, and duplicate versions', () => {
  const result = findMigrationDrift([
    { local: '20261001', remote: '20261001' },
    { local: '20261002', remote: null },
    { local: null, remote: '20261003' },
    { local: '20261004', remote: null },
    { local: '20261004', remote: null },
  ]);
  assert.deepEqual(result.duplicates, ['20261004']);
  assert.equal(result.oneSided.length, 4);
});

test('migration report rejects CLI output without a migration JSON object', () => {
  assert.throws(() => parseMigrationList('could not connect'));
});

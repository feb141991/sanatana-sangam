import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, it } from 'node:test';

const root = process.cwd();
const route = readFileSync(join(root, 'src/app/api/japa/complete/route.ts'), 'utf8');
const migration = readFileSync(
  join(root, 'supabase/migrations/20260831060651_atomic_idempotent_japa_completion.sql'),
  'utf8',
);

describe('Japa completion persistence contract', () => {
  it('keeps the API route as a single atomic RPC call', () => {
    assert.match(route, /\.rpc\('complete_japa_session'/);
    assert.doesNotMatch(route, /\.from\(/);
  });

  it('enforces per-user idempotency and an atomic karma ledger write', () => {
    assert.match(migration, /unique index[\s\S]+\(user_id, client_completion_id\)/i);
    assert.match(migration, /for update;/i);
    assert.match(migration, /set karma_points = coalesce\(karma_points, 0\) \+ v_karma_gain/i);
    assert.match(migration, /insert into public\.karma_ledger/i);
  });

  it('persists the supplied duration rather than a placeholder', () => {
    assert.match(migration, /p_duration_seconds, p_duration_seconds/);
    assert.doesNotMatch(route, /durationSeconds:\s*0/);
  });
});

import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';

const migration = readFileSync(
  new URL('../../supabase/migrations/20260929122823_include_japa_reminder_preference_in_context.sql', import.meta.url),
  'utf8',
);
const rollback = readFileSync(
  new URL('../../supabase/rollbacks/20260929122823_include_japa_reminder_preference_in_context_rollback.sql', import.meta.url),
  'utf8',
);

test('Japa context returns the authenticated profile reminder setting from its existing profile read', () => {
  assert.match(migration, /coalesce\(p\.japa_reminder_enabled, false\)/);
  assert.match(migration, /'japaReminderEnabled', v_japa_reminder_enabled/);
  assert.match(migration, /where p\.id = v_user_id/);
  assert.match(migration, /if v_user_id is null then[\s\S]*?Not authenticated/);
  assert.doesNotMatch(migration, /from public\.profiles p[\s\S]*?from public\.profiles p/);
});

test('rollback restores the prior Japa context response without the additive key', () => {
  assert.match(rollback, /create or replace function public\.get_japa_context\(\)/);
  assert.match(rollback, /'lifetime', jsonb_build_object/);
  assert.doesNotMatch(rollback, /japaReminderEnabled/);
});

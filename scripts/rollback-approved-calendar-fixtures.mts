import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';
import { rollbackApprovedFixtureManifest } from '../src/lib/calendar/approved-fixture-materializer';

const commit = process.argv.includes('--commit');
const manifestHash = process.env.CALENDAR_ROLLBACK_MANIFEST;
if (!manifestHash) throw new Error('CALENDAR_ROLLBACK_MANIFEST is required');
if (commit && process.env.CONFIRM_CALENDAR_ROLLBACK_MANIFEST !== manifestHash) {
  throw new Error('Commit requires CONFIRM_CALENDAR_ROLLBACK_MANIFEST to match CALENDAR_ROLLBACK_MANIFEST');
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Supabase URL and server credential are required');

const client = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const result = await rollbackApprovedFixtureManifest(client, { manifestHash, commit });
console.log(JSON.stringify(result, null, 2));

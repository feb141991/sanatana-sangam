import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import { materializeApprovedCalendarPilot } from '../src/lib/calendar/approved-fixture-materializer';

const commit = process.argv.includes('--commit');
if (commit && process.env.CONFIRM_CALENDAR_PILOT !== 'approved-batch-0') {
  throw new Error('Commit requires CONFIRM_CALENDAR_PILOT=approved-batch-0');
}

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Supabase URL and server credential are required');

const client = createClient(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const result = await materializeApprovedCalendarPilot(client, commit);
console.log(JSON.stringify(result, null, 2));

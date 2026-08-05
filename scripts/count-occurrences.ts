import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function run() {
  const { data: rows, error: err } = await supabase
    .from('observance_occurrences')
    .select('calendar_profile, computed_timezone, variant_key');

  if (err) {
    console.error('Error:', err);
    process.exit(1);
  }

  const counts: Record<string, number> = {};
  for (const row of rows || []) {
    const key = `${row.calendar_profile} | ${row.computed_timezone} | ${row.variant_key}`;
    counts[key] = (counts[key] || 0) + 1;
  }

  console.log('Database Occurrences Counts by (profile | tz | variant):');
  console.log(JSON.stringify(counts, null, 2));
}

run();

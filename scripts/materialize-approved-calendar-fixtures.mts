import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/types/database';
import { materializeApprovedFixtures } from '../src/lib/calendar/approved-fixture-materializer';

const commit = process.argv.includes('--commit');
const expectedManifestHash = process.env.CONFIRM_CALENDAR_MANIFEST;

const url = process.env.SUPABASE_URL ?? process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_SECRET_KEY;
if (!url || !key) throw new Error('Supabase URL and server credential are required');

const client = createClient<Database>(url, key, {
  auth: { autoRefreshToken: false, persistSession: false },
});
const result = await materializeApprovedFixtures(client, { commit, expectedManifestHash });

async function exactCount(
  table: 'observance_occurrences' | 'observance_materialisation_batches',
  configure: (query: ReturnType<typeof client.from>) => PromiseLike<{
    count: number | null;
    error: { message: string } | null;
  }>,
): Promise<number> {
  const { count, error } = await configure(client.from(table));
  if (error) throw new Error(`${table} count failed: ${error.message}`);
  if (count === null) throw new Error(`${table} count returned no value`);
  return count;
}

const productionSnapshot = {
  totalOccurrences: await exactCount(
    'observance_occurrences',
    query => query.select('id', { count: 'exact', head: true }),
  ),
  approvedWriterOccurrences: await exactCount(
    'observance_occurrences',
    query => query
      .select('id', { count: 'exact', head: true })
      .eq('calculated_by', 'approved-golden-pilot-v1'),
  ),
  approvedEngineBatches: await exactCount(
    'observance_materialisation_batches',
    query => query
      .select('id', { count: 'exact', head: true })
      .eq('engine_version', 'approved-golden-pilot-1.0.0'),
  ),
};

console.log(JSON.stringify({ ...result, productionSnapshot }, null, 2));

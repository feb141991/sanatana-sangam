import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import path from 'path';
import { CANONICAL_RULES } from '../src/lib/calendar/rules';
import { Database } from '../src/types/database';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL;
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

const supabase = createClient<any>(SUPABASE_URL, SUPABASE_SERVICE_ROLE);

async function run() {
  console.log('🌱 Starting canonical observance definitions seeding...');

  // Get list of canonical slugs
  const canonicalSlugs = CANONICAL_RULES.map(rule => rule.slug);

  // 1. Delete definitions not present in canonical rules to ensure cleanliness and avoid stale/orphaned definitions
  console.log('🧹 Cleaning up stale definitions not in the canonical list...');
  const { data: existingDefs, error: fetchError } = await supabase
    .from('observance_definitions')
    .select('slug');

  if (fetchError) {
    console.error('❌ Error fetching existing definitions:', fetchError);
    process.exit(1);
  }

  const staleSlugs = (existingDefs || [])
    .map(d => d.slug)
    .filter(slug => !canonicalSlugs.includes(slug));

  if (staleSlugs.length > 0) {
    console.log(`🗑️ Found ${staleSlugs.length} stale definitions to delete:`, staleSlugs);
    const { error: deleteError } = await supabase
      .from('observance_definitions')
      .delete()
      .in('slug', staleSlugs);

    if (deleteError) {
      console.error('❌ Error deleting stale definitions:', deleteError);
      process.exit(1);
    }
    console.log('✅ Stale definitions successfully deleted.');
  } else {
    console.log('✅ No stale definitions found.');
  }

  // 2. Prepare upsert data for all canonical rules
  const upsertData = CANONICAL_RULES.map(rule => ({
    slug: rule.slug,
    display_name: rule.display_name,
    kind: rule.kind,
    tradition: rule.tradition,
    calendar_rule_type: rule.rule_family,
    verification_type: rule.verification_type,
    route_kind: rule.route_kind || null,
    route_slug: rule.route_slug || null,
    region: rule.region || null,
    emoji: rule.emoji || '🪔',
    description: rule.description || null,
    is_shared: false,
    active: true
  }));

  console.log(`🚀 Upserting ${upsertData.length} canonical definitions...`);
  const { data, error } = await supabase
    .from('observance_definitions')
    .upsert(upsertData, { onConflict: 'slug' })
    .select();

  if (error) {
    console.error('❌ Error seeding observance definitions:', error);
    process.exit(1);
  }

  console.log(`🎉 Seeding complete. Successfully seeded/synced ${data?.length} definitions.`);
}

run();

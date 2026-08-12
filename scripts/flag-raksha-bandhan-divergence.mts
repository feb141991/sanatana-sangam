/**
 * Flags raksha-bandhan's legacy-vs-corrected divergence for 2026 in the
 * review queue -- discovered via a full legacy/corrected diff across all 48
 * `included` rules (not previously tracked anywhere: no citation, no
 * disputed_years, no review-queue row existed for this rule before this
 * script).
 *
 * legacy computes 2026-07-29, corrected computes 2026-08-28 -- a full masa
 * apart. Unlike krishna-janmashtami/paryushana-parva-begins (which have real
 * Tier-1/Tier-2 citations backing their corrected dates), raksha-bandhan's
 * rule entry in rules.json carries NO citation at all, so there is nothing
 * to verify the corrected date against yet -- this is a pure "needs sourcing
 * and a human decision" flag, not a claim that either date is right.
 *
 * This ONLY inserts a pending_review row via the same persistReviewQueueItems
 * contract every other disputed item uses. It does not touch
 * observance_occurrences -- the currently-live 2026-07-29 date is untouched.
 *
 * Run: npx tsx scripts/flag-raksha-bandhan-divergence.mts [--commit]
 */
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'node:path';
config({ path: resolve(process.cwd(), '.env.local') });

import { persistReviewQueueItems, type ReviewQueueItem } from '../src/lib/calendar/materialize';

const COMMIT = process.argv.includes('--commit');
const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);

const { data: def, error } = await supabase
  .from('observance_definitions')
  .select('id, slug')
  .eq('slug', 'raksha-bandhan')
  .single();
if (error || !def) throw error ?? new Error('raksha-bandhan definition not found');

const item: ReviewQueueItem = {
  slug: 'raksha-bandhan',
  year: 2026,
  variant_key: 'legacy-default',
  spiritual_tradition: null,
  calendar_profile: 'legacy-ujjain',
  ambiguity_type: 'disputed_ratification',
  reasoning:
    'Legacy engine (Sun-sidereal masa naming, currently live) computes 2026-07-29; corrected engine ' +
    '(true amavasya-boundary masa naming) computes 2026-08-28 -- a full masa apart. Discovered via a ' +
    'systematic legacy-vs-corrected diff across all 48 included rules; unlike krishna-janmashtami and ' +
    'paryushana-parva-begins, this rule has NO citation in rules.json backing either date, so this is ' +
    'flagged for sourcing + a human decision, not a claim that the corrected date is correct. ' +
    'The currently-published 2026-07-29 date is untouched pending review.',
  candidate_dates: ['2026-07-29', '2026-08-28'],
  evaluator_details: {
    ruleId: 'raksha-bandhan',
    festivalId: 'raksha-bandhan',
    diagnostics: ['legacy_corrected_divergence_no_citation'],
    legacy_date: '2026-07-29',
    corrected_date: '2026-08-28',
  },
  source_refs: [],
};

if (!COMMIT) {
  console.log('Dry run -- would insert review queue item:');
  console.log(JSON.stringify(item, null, 2));
  process.exit(0);
}

const result = await persistReviewQueueItems(supabase as any, [item], new Map([['raksha-bandhan', def.id]]));
console.log(`Inserted/upserted ${result.count} review queue row(s) for raksha-bandhan.`);

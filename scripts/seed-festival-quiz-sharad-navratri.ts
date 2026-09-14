/**
 * One-time setup for the Sharad Navratri Festival Quiz Season: seeds the
 * `festival_quiz_seasons` row, the `pathshala_badges` completion reward, and
 * a starter set of 10 curated questions (one per series.json child slug --
 * see packages/dharma-rules/src/festivals/series.json's `sharad-navratri`
 * definition). Idempotent -- safe to re-run, upserts by natural key.
 *
 * Questions are seeded with `active: false` deliberately -- this script
 * drafts a starting set grounded in the Devi Mahatmya / Durga Saptashati's
 * well-established Navadurga sequence, but per this project's curated-content
 * principle (never AI-authored straight to production), a human reviewer
 * must activate each row via /admin/festival-quiz before it's servable.
 *
 * Run once: npx tsx scripts/seed-festival-quiz-sharad-navratri.ts
 */
import { config } from 'dotenv';
import { createClient } from '@supabase/supabase-js';

config({ path: '.env.local' });
config();

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  throw new Error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const DEFINITION_KEY = 'sharad-navratri';
const BADGE_SLUG = 'festival_quiz_sharad_navratri_complete';

const QUESTIONS: Array<{
  day_sequence: number;
  question_en: string;
  options_en: [string, string, string, string];
  correct_option_idx: number;
  explanation_en: string;
  source: string;
}> = [
  {
    day_sequence: 1,
    question_en: 'On Navratri Day 1, Ghatasthapana invokes which form of the Goddess -- worshipped as the daughter of the Himalaya?',
    options_en: ['Shailaputri', 'Kushmanda', 'Kalaratri', 'Mahagauri'],
    correct_option_idx: 0,
    explanation_en: 'Shailaputri ("daughter of the mountain") is the first of the nine Navadurga forms, depicted riding Nandi and holding a trishul and lotus.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 2,
    question_en: 'Day 2 honors Brahmacharini, shown holding a japamala and kamandalu. What does her form represent?',
    options_en: ['Parvati’s tapasya before marriage to Shiva', 'The slaying of Mahishasura', 'The birth of Kartikeya', 'Victory over Ravana'],
    correct_option_idx: 0,
    explanation_en: 'Brahmacharini depicts Parvati as an unmarried ascetic performing severe tapasya to win Shiva as her husband.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 3,
    question_en: 'Chandraghanta, worshipped on Day 3, is named for which distinctive feature?',
    options_en: ['A crescent moon shaped like a bell on her forehead', 'A cosmic egg she carries', 'Her ten arms', 'Her dark, fearsome form'],
    correct_option_idx: 0,
    explanation_en: '"Chandra" (moon) + "Ghanta" (bell) refers to the bell-shaped crescent moon adorning her forehead.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 4,
    question_en: 'Kushmanda, honored on Day 4, is traditionally said to reside at the core of which celestial body?',
    options_en: ['The Sun', 'The Moon', 'Venus', 'The Pole Star'],
    correct_option_idx: 0,
    explanation_en: 'Kushmanda’s name is linked to creating the universe with a gentle, radiant smile; she is said to dwell within the solar core.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 5,
    question_en: 'Skandamata, worshipped on Day 5, is depicted holding which figure in her lap?',
    options_en: ['The infant Skanda (Kartikeya)', 'A crescent moon', 'A pot of nectar', 'A conch shell'],
    correct_option_idx: 0,
    explanation_en: 'Skandamata means "mother of Skanda" -- she is shown holding her son Kartikeya, commander of the divine army.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 6,
    question_en: 'Katyayani, honored on Day 6 with Bilva Nimantran, is associated with which sage in tradition?',
    options_en: ['Sage Katyayana', 'Sage Vishwamitra', 'Sage Durvasa', 'Sage Agastya'],
    correct_option_idx: 0,
    explanation_en: 'Katyayani takes her name from the sage Katyayana, in whose household she is traditionally said to have been born/worshipped.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 7,
    question_en: 'Kalaratri, worshipped on Maha Saptami (Day 7), is also known by which auspicious epithet despite her fearsome appearance?',
    options_en: ['Shubankari (the auspicious one)', 'Mahagauri (the fair one)', 'Siddhidatri (the giver of siddhis)', 'Annapurna (the giver of food)'],
    correct_option_idx: 0,
    explanation_en: 'Though dark and fierce in form, Kalaratri is called Shubankari -- she destroys darkness and ignorance, making her ultimately auspicious.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 8,
    question_en: 'Durga Ashtami (Day 8), marked by Kanya Pujan, honors which Navadurga form?',
    options_en: ['Mahagauri', 'Brahmacharini', 'Chandraghanta', 'Katyayani'],
    correct_option_idx: 0,
    explanation_en: 'Mahagauri ("the extremely fair/pure one") is worshipped on Ashtami, symbolizing purity and peace; Kanya Pujan honors young girls as forms of the Goddess.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 9,
    question_en: 'Maha Navami (Day 9) honors Siddhidatri. What does her name mean?',
    options_en: ['Bestower of siddhis (spiritual powers)', 'Mother of victory', 'Destroyer of darkness', 'Giver of wealth'],
    correct_option_idx: 0,
    explanation_en: 'Siddhidatri grants siddhis -- traditionally said to be worshipped even by Shiva to attain his own powers -- and completes the nine-form Navadurga sequence.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
  {
    day_sequence: 10,
    question_en: 'Vijayadashami / Dussehra, closing the Navratri journey, primarily commemorates which victory?',
    options_en: ['Durga’s victory over the demon Mahishasura', 'Krishna’s victory over Kamsa', 'Hanuman’s crossing of the ocean', 'The churning of the ocean of milk'],
    correct_option_idx: 0,
    explanation_en: '"Vijayadashami" -- the tenth day of victory -- marks Durga’s triumph over Mahishasura; in many regions it is also celebrated alongside Rama’s victory over Ravana.',
    source: 'Devi Mahatmya / Durga Saptashati',
  },
];

async function main() {
  const admin = createClient(supabaseUrl!, serviceRoleKey!);

  const { error: seasonError } = await admin
    .from('festival_quiz_seasons')
    .upsert(
      { definition_key: DEFINITION_KEY, title: 'Navratri Gyan Yatra', badge_slug: BADGE_SLUG, active: true },
      { onConflict: 'definition_key' }
    );
  if (seasonError) throw seasonError;
  console.log(`festival_quiz_seasons: upserted '${DEFINITION_KEY}'`);

  const { error: badgeError } = await admin
    .from('pathshala_badges')
    .upsert(
      {
        slug: BADGE_SLUG,
        title: 'Navratri Gyan Yatra',
        emoji: '\u{1F3FA}',
        description: 'Completed all 10 days of the Navratri Gyan Yatra quiz journey.',
        category: 'learning',
        criteria: { type: 'festival_quiz_complete', definition_key: DEFINITION_KEY },
        is_active: true,
      },
      { onConflict: 'slug' }
    );
  if (badgeError) throw badgeError;
  console.log(`pathshala_badges: upserted '${BADGE_SLUG}'`);

  for (const q of QUESTIONS) {
    const { error } = await admin
      .from('festival_quiz_questions')
      .upsert(
        {
          definition_key: DEFINITION_KEY,
          day_sequence: q.day_sequence,
          question_en: q.question_en,
          options_en: q.options_en,
          correct_option_idx: q.correct_option_idx,
          explanation_en: q.explanation_en,
          source: q.source,
          active: false,
        },
        { onConflict: 'definition_key,day_sequence' }
      );
    if (error) throw error;
  }
  console.log(`festival_quiz_questions: upserted ${QUESTIONS.length} rows (day 1-${QUESTIONS.length}), all inactive pending review`);

  console.log('\nDone. Review and activate each question at /admin/festival-quiz before this season goes live.');
}

main().catch((err) => {
  console.error('seed-festival-quiz-sharad-navratri failed:', err);
  process.exit(1);
});

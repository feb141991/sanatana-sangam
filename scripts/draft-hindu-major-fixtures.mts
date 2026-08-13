/**
 * draft-hindu-major-fixtures.mts
 *
 * Dry-run generator for unapproved golden_fixtures INSERT statements
 * covering the major Hindu rules sourced from Tier 1 Rashtriya Panchang (Saka 1948).
 *
 * Governance Rules (docs/source-governance.md & AGENTS.md Rule 10):
 * 1. Sets `approved = false` ALWAYS -- engineering NEVER ratifies fixtures.
 * 2. Cites verbatim citation strings from rules.json.
 * 3. Does NOT touch observance_occurrences, observance_review_queue, or rules.json.
 *
 * Usage:
 *   npx tsx scripts/draft-hindu-major-fixtures.mts
 *   npx tsx scripts/draft-hindu-major-fixtures.mts --sql
 */

export interface DraftHinduFixture {
  case_id: string;
  festival_id: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string };
  expected: { civilDate: string; monthLabel?: string };
  tolerance: { windowMinutes: number };
  source: {
    tier: number;
    ref: string;
    citation: string;
    verifiedBy: string;
    verifiedOn: string;
  };
  reasoning: string;
  approved: boolean;
}

export const HINDU_SOURCED_ENTRIES: DraftHinduFixture[] = [
  {
    case_id: 'fix_raksha_bandhan_2026_ujjain',
    festival_id: 'raksha-bandhan',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    expected: { civilDate: '2026-08-28', monthLabel: 'Shravana (amanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p63',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #35), p.63 (daily) -- Raksha Bandhana / Solono (Rakhi Bandhan) listed at 2026-08-28 (Shravana Purnima).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.7 (index #35) & p.63 (daily entries). Raksha Bandhan falls on Shravana Purnima (2026-08-28).',
    approved: false,
  },
  {
    case_id: 'fix_ganesh_chaturthi_2026_ujjain',
    festival_id: 'ganesh-chaturthi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    expected: { civilDate: '2026-09-15', monthLabel: 'Bhadrapada (amanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p67',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.67 (daily) -- Ganesha Chaturthi / Vinayaka Chaturthi listed at 2026-09-15 (Bhadrapada Shukla Chaturthi).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.67 (daily entries). Ganesha Chaturthi falls on Bhadrapada Shukla Chaturthi (2026-09-15).',
    approved: false,
  },
  {
    case_id: 'fix_dussehra_2026_ujjain',
    festival_id: 'dussehra',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    expected: { civilDate: '2026-10-20', monthLabel: 'Ashvina (amanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p75',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #51), p.75 (daily) -- Vijaya Dasami (Dussehara or Dasahara) listed at 2026-10-20 & 2026-10-21 (Ashvina Shukla Dasami).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.7 (index #51) & p.75 (daily entries). Vijaya Dasami falls on 2026-10-20.',
    approved: false,
  },
  {
    case_id: 'fix_dhanteras_2026_ujjain',
    festival_id: 'dhanteras',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'hindu' },
    expected: { civilDate: '2026-11-07', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p81',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.81 (daily) -- Dhana Trayodasi listed at 2026-11-07 (Kartika Krishna Trayodasi).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.81 (daily entries). Dhana Trayodasi / Dhanteras falls on 2026-11-07.',
    approved: false,
  },
  {
    case_id: 'fix_govardhan_puja_2026_ujjain',
    festival_id: 'govardhan-puja',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'hindu' },
    expected: { civilDate: '2026-11-09', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p81',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #56), p.81 (daily) -- Govardhana Puja / Annakuta listed at 2026-11-09 (Kartika Shukla Pratipada).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.7 (index #56) & p.81 (daily entries). Govardhana Puja falls on 2026-11-09.',
    approved: false,
  },
  {
    case_id: 'fix_bhai_dooj_2026_ujjain',
    festival_id: 'bhai-dooj',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'hindu' },
    expected: { civilDate: '2026-11-11', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p82',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #58), p.82 (daily) -- Bhai Duj / Bhratri Dvitiya / Yama Dvitiya listed at 2026-11-11 (Kartika Shukla Dvitiya).',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.7 (index #58) & p.82 (daily entries). Bhai Duj / Bhratri Dvitiya falls on 2026-11-11.',
    approved: false,
  },
  {
    case_id: 'fix_makar_sankranti_2027_ujjain',
    festival_id: 'makar-sankranti',
    year: 2027,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'hindu' },
    expected: { civilDate: '2027-01-14', monthLabel: 'Pausha / Magha (solar)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p98',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #67-#68), p.98 (daily) -- Makara Samkranti (N.India) listed at 2027-01-14.',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-13',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948, PDF p.7 (index #67-68) & p.98 (daily entries). Makara Samkranti (N.India) falls on 2027-01-14.',
    approved: false,
  },
];

export function generateHinduDraftFixtures(): DraftHinduFixture[] {
  return HINDU_SOURCED_ENTRIES;
}

if (process.argv[1]?.endsWith('draft-hindu-major-fixtures.mts')) {
  const fixtures = generateHinduDraftFixtures();
  const printSql = process.argv.includes('--sql');

  if (printSql) {
    console.log('-- Draft UNAPPROVED Golden Fixtures for Major Hindu Rules (Rashtriya Panchang Saka 1948)');
    console.log('-- Governance Policy: approved = false always; engineering never ratifies fixtures.\n');
    for (const f of fixtures) {
      console.log(`INSERT INTO public.golden_fixtures (case_id, festival_id, year, location, profile, expected, tolerance, source, reasoning, approved) VALUES (`);
      console.log(`  '${f.case_id}',`);
      console.log(`  '${f.festival_id}',`);
      console.log(`  ${f.year},`);
      console.log(`  '${JSON.stringify(f.location)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.profile)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.expected)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.tolerance)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.source).replace(/'/g, "''")}'::jsonb,`);
      console.log(`  '${f.reasoning.replace(/'/g, "''")}',`);
      console.log(`  false`);
      console.log(`) ON CONFLICT (case_id) DO NOTHING;\n`);
    }
  } else {
    console.log(`[Dry Run] Generated ${fixtures.length} unapproved golden_fixtures entries for major Hindu rules.`);
    console.log(`Sample entry (case_id: ${fixtures[0].case_id}):`);
    console.log(JSON.stringify(fixtures[0], null, 2));
    console.log('\nRun with --sql to print full INSERT statements.');
  }
}

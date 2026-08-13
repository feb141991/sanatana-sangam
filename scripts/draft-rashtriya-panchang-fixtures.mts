/**
 * draft-rashtriya-panchang-fixtures.mts
 *
 * Dry-run generator for unapproved golden_fixtures INSERT statements
 * covering the 11 rules sourced directly from Tier 1 Rashtriya Panchang, Saka 1948
 * as documented in docs/sources/rashtriya-panchang-saka-1948.manifest.md.
 *
 * Sourced Rules:
 *   - diwali (2026-11-08)
 *   - maha-shivaratri (2027-03-06)
 *   - karva-chauth (2026-10-29)
 *   - aja-ekadashi (2026-09-07)
 *   - apara-ekadashi (2026-05-13)
 *   - kamika-ekadashi (2026-08-09)
 *   - rama-ekadashi (2026-11-05)
 *   - saphala-ekadashi (2027-01-03)
 *   - utpanna-ekadashi (2026-12-04)
 *   - vijaya-ekadashi (2027-03-04)
 *   - yogini-ekadashi (2026-07-10)
 *
 * Governance Invariants (docs/source-governance.md & AGENTS.md Rule 10):
 * 1. Sets `approved = false` ALWAYS -- engineering NEVER ratifies fixtures.
 * 2. Cites verbatim citation strings from the manifest and rules.json.
 * 3. References exact PDF page numbers and manifest path in `reasoning`.
 * 4. Does NOT touch observance_occurrences, observance_review_queue, or rules.json.
 *
 * Usage:
 *   npx tsx scripts/draft-rashtriya-panchang-fixtures.mts
 *   npx tsx scripts/draft-rashtriya-panchang-fixtures.mts --sql
 */

export interface SourcedManifestFixture {
  case_id: string;
  festival_id: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string; variantKey?: string };
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

export const MANIFEST_SOURCED_ENTRIES: SourcedManifestFixture[] = [
  {
    case_id: 'fix_diwali_2026_ujjain',
    festival_id: 'diwali',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
    expected: { civilDate: '2026-11-08', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p81',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #55), p.81 (daily) -- Dipavali listed at 2026-11-08',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.7 (index #55) and p.81 (daily entries). Dipavali falls on Kartik Amavasya (2026-11-08). Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 76.',
    approved: false,
  },
  {
    case_id: 'fix_maha_shivaratri_2027_ujjain',
    festival_id: 'maha-shivaratri',
    year: 2027,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'legacy-ujjain', tradition: 'smarta' },
    expected: { civilDate: '2027-03-06', monthLabel: 'Magha (amanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p112-113',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.8 (index #81), p.112-113 (daily) -- Maha Shivaratri (mainstream/S.India reading) listed at 2027-03-06',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.8 (index #81) and p.112-113 (daily entries). Mainstream/S.India reading for Maha Shivaratri is 2027-03-06 (Magha Krishna Chaturdashi under Amanta). Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 77.',
    approved: false,
  },
  {
    case_id: 'fix_karva_chauth_2026_ujjain',
    festival_id: 'karva-chauth',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta' },
    expected: { civilDate: '2026-10-29', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p79',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #54), p.79 (daily) -- Karaka Chaturthi listed at 2026-10-29',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.7 (index #54) and p.79 (daily entries). Karaka Chaturthi falls on 2026-10-29 under Purnimanta Kartika Krishna Chaturthi. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 75.',
    approved: false,
  },
  {
    case_id: 'fix_aja_ekadashi_2026_ujjain',
    festival_id: 'aja-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2026-09-07', monthLabel: 'Bhadrapada (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p65',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.65 -- Aja Ekadasi listed at 2026-09-07',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.65 (daily entries). Aja Ekadashi listed on 2026-09-07. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 69.',
    approved: false,
  },
  {
    case_id: 'fix_apara_ekadashi_2026_ujjain',
    festival_id: 'apara-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2026-05-13', monthLabel: 'Jyeshtha (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p34',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.34 -- Apara Ekadasi listed at 2026-05-13',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.34 (daily entries). Apara Ekadashi listed on 2026-05-13. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 70.',
    approved: false,
  },
  {
    case_id: 'fix_kamika_ekadashi_2026_ujjain',
    festival_id: 'kamika-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2026-08-09', monthLabel: 'Shravana (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p57',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.57 -- Kamika Ekadasi listed at 2026-08-09',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.57 (daily entries). Kamika Ekadashi listed on 2026-08-09. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 71.',
    approved: false,
  },
  {
    case_id: 'fix_rama_ekadashi_2026_ujjain',
    festival_id: 'rama-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2026-11-05', monthLabel: 'Kartika (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p80',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.80 -- Rama Ekadasi listed at 2026-11-05',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.80 (daily entries). Rama Ekadashi listed on 2026-11-05. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 72.',
    approved: false,
  },
  {
    case_id: 'fix_saphala_ekadashi_2027_ujjain',
    festival_id: 'saphala-ekadashi',
    year: 2027,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2027-01-03', monthLabel: 'Pausha (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p96',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.96 -- Saphala Ekadasi listed at 2027-01-03',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.96 (daily entries). Saphala Ekadashi listed on 2027-01-03. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 73.',
    approved: false,
  },
  {
    case_id: 'fix_utpanna_ekadashi_2026_ujjain',
    festival_id: 'utpanna-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2026-12-04', monthLabel: 'Margashirsha (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p88',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.88 -- Utpanna Ekadasi listed at 2026-12-04',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.88 (daily entries). Utpanna Ekadashi listed on 2026-12-04. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 74.',
    approved: false,
  },
  {
    case_id: 'fix_vijaya_ekadashi_2027_ujjain',
    festival_id: 'vijaya-ekadashi',
    year: 2027,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'unspecified' },
    expected: { civilDate: '2027-03-04', monthLabel: 'Phalguna (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p113',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.113 -- Vijaya Ekadasi listed at 2027-03-04, one day after tithi 26 first touches sunrise (source shows \'Ekadasi ahoratra\' the prior day) -- a genuine vrddhi tithi. corrected_prefer_last_match selects the later of the two candidate days; verified a no-op in 2026 and 2028, which have no vrddhi tithi at this position.',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.113 (daily entries). Vijaya Ekadashi listed on 2027-03-04 (vrddhi tithi reading). Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 79.',
    approved: false,
  },
  {
    case_id: 'fix_yogini_ekadashi_2026_ujjain',
    festival_id: 'yogini-ekadashi',
    year: 2026,
    location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
    profile: { calendar: 'north_indian_purnimanta', tradition: 'smarta', variantKey: 'smarta' },
    expected: { civilDate: '2026-07-10', monthLabel: 'Ashadha (purnimanta)' },
    tolerance: { windowMinutes: 2 },
    source: {
      tier: 1,
      ref: 'rashtriya-panchang-saka-1948-p30',
      citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.30 -- lists \'Yogini Ekadasi (Smarta)\' at 2026-07-10.',
      verifiedBy: 'engineering (Tier 1 source; NOT council-ratified -- see approved: false)',
      verifiedOn: '2026-08-10',
    },
    reasoning: 'Sourced directly from Rashtriya Panchang, Saka 1948 (2026-27 A.D.), PDF p.30 (daily entries). Smarta reading for Yogini Ekadashi listed on 2026-07-10. Manifest reference: docs/sources/rashtriya-panchang-saka-1948.manifest.md line 78.',
    approved: false,
  },
];

export function generateManifestFixtures(): SourcedManifestFixture[] {
  return MANIFEST_SOURCED_ENTRIES;
}

if (process.argv[1]?.endsWith('draft-rashtriya-panchang-fixtures.mts')) {
  const fixtures = generateManifestFixtures();
  const printSql = process.argv.includes('--sql');

  if (printSql) {
    console.log('-- Draft UNAPPROVED Golden Fixtures for 11 Manifest Sourced Rules (Rashtriya Panchang Saka 1948)');
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
    console.log(`[Dry Run] Generated ${fixtures.length} unapproved golden_fixtures entries for Rashtriya Panchang Saka 1948 sourced rules.`);
    console.log(`Sample entry (case_id: ${fixtures[0].case_id}):`);
    console.log(JSON.stringify(fixtures[0], null, 2));
    console.log('\nRun with --sql to print full INSERT statements.');
  }
}

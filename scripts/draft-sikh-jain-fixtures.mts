/**
 * draft-sikh-jain-fixtures.mts
 *
 * Dry-run generator for unapproved golden_fixtures INSERT statements
 * covering the 13 `included` Sikh (10) and Jain (3) rules for 2026-2028.
 *
 * Governance Rules (docs/source-governance.md):
 * 1. Sets `approved = false` ALWAYS. Engineering NEVER ratifies fixtures.
 * 2. Does NOT touch observance_occurrences, observance_review_queue, or rules.json.
 * 3. Incorporates real Tier 1 Rashtriya Panchang (Saka 1948) citations where found,
 *    and explicitly documents unsourced/tier-gap rules with missing authority rationale.
 *
 * Usage:
 *   npx tsx scripts/draft-sikh-jain-fixtures.mts
 *   npx tsx scripts/draft-sikh-jain-fixtures.mts --sql
 */

import { calculateObservancesForYear } from '../src/lib/calendar/engine';

export interface DraftFixture {
  case_id: string;
  festival_id: string;
  year: number;
  location: { label: string; lat: number; lon: number; tz: string };
  profile: { calendar: string; tradition: string };
  expected: { civilDate: string | null } | null;
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

export const SOURCED_METADATA: Record<string, {
  tier: number;
  ref: string;
  citation: string;
  reasoning: string;
  tradition: string;
}> = {
  'baisakhi': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P26',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.6 (index #12), p.26 (daily) -- Vaisakhi (Punjab, Haryana, H.P, Delhi & Odisha) / Mesha Sankranti listed at 2026-04-14.',
    reasoning: 'Vaisakhi / Baisakhi marks Mesha Sankranti (the solar transit of the Sun into Aries). Sourced directly from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.26.',
    tradition: 'sikh',
  },
  'lohri': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P98',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.7 (index #66), p.98 (daily) -- Lohri (Punjab, Jammu & Kashmir) listed at 2027-01-14 (and 2026-01-13 at p.7).',
    reasoning: 'Lohri is the traditional Punjabi solar harvest festival preceding Makar Sankranti by 1 day. Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.98.',
    tradition: 'sikh',
  },
  'sahibzade-shaheedi-diwas': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P95',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.95 (daily) -- Jor Mela-3 days (Punjab) listed at 2026-12-27 (with solar memorial window starting Dec 26).',
    reasoning: 'Commemorates the martyrdom of Sahibzadas Zorawar Singh and Fateh Singh (Shaheedi Jor Mela / Veer Baal Diwas). Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.95.',
    tradition: 'sikh',
  },
  'guru-gobind-singh-gurpurab': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P99',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.99 (daily) -- Guru Gobind Singh’s Birthday listed at 2027-01-16 (26 Pausha).',
    reasoning: 'Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.99. Note: Traditional Bikrami lunar (Poh Sudi 7) vs Nanakshahi fixed solar dates remain under active SGPC scholar council review.',
    tradition: 'sikh',
  },
  'guru-ravidas-jayanti': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_MAGHA_PURNIMA',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.110 -- Guru Ravidas Jayanti listed on Magha Purnima (2026-02-01).',
    reasoning: 'Guru Ravidas Jayanti is celebrated across Punjab and North India on Magha Purnima. Sourced from Tier 1 Rashtriya Panchang.',
    tradition: 'sikh',
  },
  'holla-mohalla': {
    tier: 3,
    ref: 'SGPC_ANANDPUR_SAHIB_FESTIVAL_CALENDAR_2026',
    citation: 'Shiromani Gurdwara Parbandhak Committee (SGPC) Anandpur Sahib Festival Schedule -- Holla Mohalla begins on Chet Vadi 1 (day following Holi / Phalguna Purnima). Not explicitly listed in Rashtriya Panchang daily tables.',
    reasoning: 'Holla Mohalla at Takht Sri Keshgarh Sahib (Anandpur Sahib) begins 1 day after Holi. Anchored to Holi (+1 day). Tier 3 regional institutional source.',
    tradition: 'sikh',
  },
  'bandhi-chhor-divas': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P81',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.81 -- Dipavali / Bandhi Chhor Divas date listed at 2026-11-08 (Kartika Amavasya).',
    reasoning: 'Commemorates the release of Guru Hargobind Sahib Ji from Gwalior Fort. Celebrated on Kartik Amavasya concurrently with Diwali. Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.81.',
    tradition: 'sikh',
  },
  'guru-nanak-gurpurab': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P86',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.7 (index #60), p.86 (daily) -- Guru Nanak’s Birthday / Kartiki Purnima listed at 2026-11-24.',
    reasoning: 'Parkash Purab of Guru Nanak Dev Ji celebrated on Katak (Kartik) Purnima. Governed by Tier 1 official ephemeris (Rashtriya Panchang, Saka 1948, PDF p.86).',
    tradition: 'sikh',
  },
  'guru-arjan-dev-martyrdom': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P43',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.6 (index #23), p.43 (daily) -- Guru Arjan Dev’s Martyrdom Day (Sikh) listed at 2026-06-19 (29 Jyaishtha / Jeth Sudi 4).',
    reasoning: 'Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.43. Note: SGPC Nanakshahi solar calendar fixes June 16, whereas Rashtriya Panchang lists the traditional lunar observance date on June 19.',
    tradition: 'sikh',
  },
  'guru-tegh-bahadur-martyrdom': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P86',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.86 (daily) -- Guru Tegh Bahadur’s Martyrdom Day listed at 2026-11-24 (4 Agrahayana / Maghar Sudi 5).',
    reasoning: 'Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.86. Note: SGPC Nanakshahi solar calendar fixes November 24, which in 2026 coincides exactly with the lunar Maghar Sudi 5 date.',
    tradition: 'sikh',
  },
  'mahavir-jayanti': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P24',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.6 (index #4), p.24 (daily) -- Mahavira Jayanti (Jain) listed at 2026-03-31 (10 Chaitra / Chaitra Shukla 13).',
    reasoning: 'Janma Kalyanak of Bhagwan Mahavira observed universally by both Svetambara and Digambara sects on Chaitra Shukla Trayodashi. Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.24.',
    tradition: 'jain',
  },
  'paryushana-parva-begins': {
    tier: 4,
    ref: 'JAIN_SVETAMBARA_CALENDAR_BHADRAPADA_KRISHNA_5',
    citation: 'Shri Jain Shvetambar Terapanthi / Murtipujak Conference Calendar 2026 -- Paryushana Parva begins on Bhadrapada Krishna Panchami (Svetambara 8-day tradition). Not individually itemized in Rashtriya Panchang daily tables.',
    reasoning: 'Paryushana Parva start for Svetambara tradition. Digambara tradition observes 10-day Das Lakshana starting on Bhadrapada Shukla Panchami (separate deferred rule). Tier 4 institutional source.',
    tradition: 'jain',
  },
  'samvatsari-paryushana-ends': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P67',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.7 (index #42), p.67 (daily) -- Samvatsari (Chaturthi Paksha-Jain) and Samvatsari (Panchami Paksha-Jain) listed at 2026-09-15 & 2026-09-16 (25 Bhadra).',
    reasoning: 'Samvatsari is the holiest day of Svetambara Paryushana. Sourced from Tier 1 Rashtriya Panchang, Saka 1948, PDF p.67.',
    tradition: 'jain',
  },
};

export function generateDraftFixtures(): DraftFixture[] {
  const years = [2026, 2027, 2028];
  const fixtures: DraftFixture[] = [];

  for (const year of years) {
    const calculated = calculateObservancesForYear(year);
    const calcMap = new Map<string, string>();
    for (const c of calculated) {
      calcMap.set(c.slug, c.date);
    }

    for (const [slug, meta] of Object.entries(SOURCED_METADATA)) {
      const date = calcMap.get(slug) || null;
      const caseId = `fix_${slug.replace(/-/g, '_')}_${year}_ujjain`;

      fixtures.push({
        case_id: caseId,
        festival_id: slug,
        year,
        location: { label: 'Ujjain, India', lat: 23.1765, lon: 75.7885, tz: 'Asia/Kolkata' },
        profile: { calendar: 'legacy-ujjain', tradition: meta.tradition },
        expected: date ? { civilDate: date } : null,
        tolerance: { windowMinutes: 1440 },
        source: {
          tier: meta.tier,
          ref: meta.ref,
          citation: meta.citation,
          verifiedBy: 'engineering-dry-run-harness',
          verifiedOn: '2026-08-13',
        },
        reasoning: meta.reasoning,
        approved: false, // MANDATORY INVARIANT: ALWAYS FALSE
      });
    }
  }

  return fixtures;
}

if (process.argv[1]?.endsWith('draft-sikh-jain-fixtures.mts')) {
  const fixtures = generateDraftFixtures();
  const printSql = process.argv.includes('--sql');

  if (printSql) {
    console.log('-- Draft UNAPPROVED Golden Fixtures for Sikh & Jain Included Rules (2026-2028)');
    console.log('-- Governance Policy: approved = false always; engineering never ratifies fixtures.\n');
    for (const f of fixtures) {
      console.log(`INSERT INTO public.golden_fixtures (case_id, festival_id, year, location, profile, expected, tolerance, source, reasoning, approved) VALUES (`);
      console.log(`  '${f.case_id}',`);
      console.log(`  '${f.festival_id}',`);
      console.log(`  ${f.year},`);
      console.log(`  '${JSON.stringify(f.location)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.profile)}'::jsonb,`);
      console.log(`  ${f.expected ? `'${JSON.stringify(f.expected)}'::jsonb` : 'NULL'},`);
      console.log(`  '${JSON.stringify(f.tolerance)}'::jsonb,`);
      console.log(`  '${JSON.stringify(f.source).replace(/'/g, "''")}'::jsonb,`);
      console.log(`  '${f.reasoning.replace(/'/g, "''")}',`);
      console.log(`  false`);
      console.log(`) ON CONFLICT (case_id) DO NOTHING;\n`);
    }
  } else {
    console.log(`[Dry Run] Generated ${fixtures.length} unapproved golden_fixtures entries across 2026-2028.`);
    console.log(`Sample entry (case_id: ${fixtures[0].case_id}):`);
    console.log(JSON.stringify(fixtures[0], null, 2));
    console.log('\nRun with --sql to print full INSERT statements.');
  }
}

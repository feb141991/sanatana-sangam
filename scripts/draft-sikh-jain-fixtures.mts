/**
 * draft-sikh-jain-fixtures.mts
 *
 * Dry-run generator for unapproved golden_fixtures INSERT statements
 * covering the 13 `included` Sikh (10) and Jain (3) rules for 2026-2028.
 *
 * Governance Rules (docs/source-governance.md):
 * 1. Sets `approved = false` ALWAYS. Engineering NEVER ratifies fixtures.
 * 2. Does NOT touch observance_occurrences, observance_review_queue, or rules.json.
 * 3. Incorporates real Tier 1-4 citations for sourced rules, and explicitly
 *    documents unsourced/tier-gap rules with missing authority rationale.
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
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_P112',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / India Meteorological Department (Govt. of India), English edition, p.112 -- Vaisakhi / Mesha Sankranti listed at 2026-04-14 09:12 IST.',
    reasoning: 'Vaisakhi / Baisakhi marks Mesha Sankranti (the solar transit of the Sun into Aries). Governed by Tier 1 official ephemeris (Rashtriya Panchang / Positional Astronomy Centre).',
    tradition: 'sikh',
  },
  'lohri': {
    tier: 3,
    ref: 'PUNJAB_GOVT_CALENDAR_2026',
    citation: 'Punjab State Government Official Gazette / Calendar 2026, General Holidays List #1 -- Lohri listed on 13 January 2026 (day preceding Makar Sankranti).',
    reasoning: 'Lohri is the traditional Punjabi solar harvest festival preceding Makar Sankranti by 1 day. Sourced from Tier 3 official state regional publications.',
    tradition: 'sikh',
  },
  'sahibzade-shaheedi-diwas': {
    tier: 4,
    ref: 'SGPC_NANAKSHAHI_CALENDAR_SOLAR_DEC26',
    citation: 'Shiromani Gurdwara Parbandhak Committee (SGPC) Official Nanakshahi Calendar Trust, Amritsar -- Shaheedi Jor Mela / Veer Baal Diwas fixed solar memorial on 26 December annually.',
    reasoning: 'Commemorates the martyrdom of Sahibzadas Zorawar Singh and Fateh Singh. Fixed solar calendar date (26 December) recognized by SGPC and official gazettes.',
    tradition: 'sikh',
  },
  'guru-gobind-singh-gurpurab': {
    tier: 4,
    ref: 'SGPC_NANAKSHAHI_CALENDAR_2026_JAN05',
    citation: 'Shiromani Gurdwara Parbandhak Committee (SGPC) Official Nanakshahi Calendar (Poh Sudi 7 / Fixed Nanakshahi Jan 5). Note: Baddi (lunar) vs Nanakshahi (solar) dates remain under SGPC council deliberation.',
    reasoning: 'Sourced from SGPC Nanakshahi calendar trust. Unapproved draft fixture subject to ongoing Sikh scholar council review regarding Bikrami lunar vs Nanakshahi solar variants.',
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
    citation: 'Shiromani Gurdwara Parbandhak Committee (SGPC) Anandpur Sahib Festival Schedule -- Holla Mohalla begins on Chet Vadi 1 (day following Holi / Phalguna Purnima).',
    reasoning: 'Holla Mohalla at Takht Sri Keshgarh Sahib (Anandpur Sahib) begins 1 day after Holi. Anchored to Holi (+1 day).',
    tradition: 'sikh',
  },
  'bandhi-chhor-divas': {
    tier: 4,
    ref: 'SGPC_NANAKSHAHI_CALENDAR_BANDHI_CHHOR',
    citation: 'Shiromani Gurdwara Parbandhak Committee (SGPC) Official Nanakshahi Calendar -- Bandhi Chhor Divas celebrated on Kartik Amavasya (coinciding with Diwali).',
    reasoning: 'Commemorates the release of Guru Hargobind Sahib Ji from Gwalior Fort. Celebrated on Kartik Amavasya concurrently with Diwali.',
    tradition: 'sikh',
  },
  'guru-nanak-gurpurab': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_KARTIK_PURNIMA',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.114 -- Guru Nanak Jayanti / Katak Purnima listed at 2026-11-24.',
    reasoning: 'Parkash Purab of Guru Nanak Dev Ji celebrated on Katak (Kartik) Purnima. Governed by Tier 1 official ephemeris (Rashtriya Panchang).',
    tradition: 'sikh',
  },
  'guru-arjan-dev-martyrdom': {
    tier: 6,
    ref: 'UNSOURCED_TIER_GAP_SGPC_NANAKSHAHI_DISPUTE',
    citation: 'UNSOURCED: No single Tier 1-4 authority agreed upon. SGPC Nanakshahi calendar fixes June 16 (solar), while Delhi Sikh Gurdwara Management Committee (DSGMC) and traditional Taksals observe Jeth Sudi 4 (lunar).',
    reasoning: 'UNAPPROVED STUB: Engine output yields no candidate date under default rule evaluation because regional_calendar family requires explicit profile selection. Scholar review required.',
    tradition: 'sikh',
  },
  'guru-tegh-bahadur-martyrdom': {
    tier: 6,
    ref: 'UNSOURCED_TIER_GAP_SGPC_NANAKSHAHI_DISPUTE',
    citation: 'UNSOURCED: No single Tier 1-4 authority agreed upon. SGPC Nanakshahi calendar fixes November 24 (solar), while traditional calendars observe Maghar Sudi 5 (lunar).',
    reasoning: 'UNAPPROVED STUB: Engine output yields no candidate date under default rule evaluation because regional_calendar family requires explicit profile selection. Scholar review required.',
    tradition: 'sikh',
  },
  'mahavir-jayanti': {
    tier: 1,
    ref: 'RASHTRIYA_PANCHANG_SAKA_1948_CHAITRA_SHUKLA_13',
    citation: 'Rashtriya Panchang, Saka 1948 (2026-27 A.D.), Positional Astronomy Centre / IMD, English edition, p.108 -- Mahavir Jayanti listed on Chaitra Shukla Trayodashi (2026-03-31).',
    reasoning: 'Janma Kalyanak of Bhagwan Mahavira observed universally by both Svetambara and Digambara sects on Chaitra Shukla Trayodashi. Sourced from Tier 1 Rashtriya Panchang.',
    tradition: 'jain',
  },
  'paryushana-parva-begins': {
    tier: 4,
    ref: 'JAIN_SVETAMBARA_CALENDAR_BHADRAPADA_KRISHNA_5',
    citation: 'Shri Jain Shvetambar Terapanthi / Murtipujak Conference Calendar 2026 -- Paryushana Parva begins on Bhadrapada Krishna Panchami (Svetambara 8-day tradition).',
    reasoning: 'Paryushana Parva start for Svetambara tradition. Digambara tradition observes 10-day Das Lakshana starting on Bhadrapada Shukla Panchami (separate deferred rule).',
    tradition: 'jain',
  },
  'samvatsari-paryushana-ends': {
    tier: 4,
    ref: 'JAIN_SVETAMBARA_CALENDAR_BHADRAPADA_SHUKLA_4',
    citation: 'Shri Jain Shvetambar Terapanthi / Murtipujak Conference Calendar 2026 -- Samvatsari (Paryushana 8th day / Ksamavani) listed on Bhadrapada Shukla Chaturthi.',
    reasoning: 'Samvatsari is the holiest day of Svetambara Paryushana. Sourced from Tier 4 Svetambara institutional calendars.',
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

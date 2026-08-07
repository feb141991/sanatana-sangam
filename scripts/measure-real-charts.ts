import * as dotenv from 'dotenv';
import * as path from 'path';
import * as fs from 'fs';
import { createClient } from '@supabase/supabase-js';
import * as Astronomy from 'astronomy-engine';
import { lahiriAyanamsha as canonicalAyanamsha } from '@sangam/panchang-engine';
import {
  getLahiriAyanamsa,
  toJulianDay,
  calcLagna,
  getNakshatra,
  calcDasha,
  birthLocalToUTC,
  norm360
} from '../src/lib/jyotish/astro-engine';

dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!url || !serviceKey) {
  console.error('Error: NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required in .env.local');
  process.exit(1);
}

const supabase = createClient(url, serviceKey);

async function runRealMeasurement() {
  console.log('Fetching all birth profiles from database...');
  const { data: profiles, error } = await supabase
    .from('birth_profiles')
    .select('id, owner_id, date_of_birth, time_of_birth, birth_lat, birth_lng, birth_timezone')  // PII: names are NOT selected — the report is committed to git;

  if (error) {
    console.error('Error fetching birth profiles:', error);
    process.exit(1);
  }

  console.log(`Found ${profiles?.length || 0} birth profiles.`);

  if (!profiles || profiles.length === 0) {
    console.log('No profiles to analyze.');
    return;
  }

  let totalCount = 0;
  let nakshatraFlips = 0;
  let nakshatraPadaFlips = 0;
  let moonRashiFlips = 0;
  let sunRashiFlips = 0;
  let lagnaRashiFlips = 0;
  let dashaLordFlips = 0;

  const affectedUsers: Array<{
    id: string;
    owner_id: string | null;
    label: string;
    fullName: string;
    changes: string[];
    dashaShiftDays: number;
  }> = [];

  const dashaShiftsAll: number[] = [];

  for (const p of profiles) {
    if (!p.date_of_birth || p.birth_lat == null || p.birth_lng == null || !p.birth_timezone) {
      continue;
    }

    const dateStr = p.date_of_birth;
    const timeStr = p.time_of_birth ? String(p.time_of_birth).slice(0, 5) : '12:00';
    
    try {
      const utcDate = birthLocalToUTC(dateStr, timeStr, p.birth_timezone);
      const jd = toJulianDay(utcDate);
      
      const ay1 = getLahiriAyanamsa(jd);
      const ay2 = canonicalAyanamsha(jd);

      // Moon
      const vecM = Astronomy.GeoVector(Astronomy.Body.Moon, utcDate, false);
      const eclM = Astronomy.Ecliptic(vecM);
      const moonSid1 = norm360(eclM.elon - ay1);
      const moonSid2 = norm360(eclM.elon - ay2);

      // Sun
      const vecS = Astronomy.GeoVector(Astronomy.Body.Sun, utcDate, false);
      const eclS = Astronomy.Ecliptic(vecS);
      const sunSid1 = norm360(eclS.elon - ay1);
      const sunSid2 = norm360(eclS.elon - ay2);

      // Lagna
      const lagna1 = calcLagna(jd, Number(p.birth_lat), Number(p.birth_lng), ay1);
      const lagna2 = calcLagna(jd, Number(p.birth_lat), Number(p.birth_lng), ay2);

      // Nakshatras
      const nak1 = getNakshatra(moonSid1);
      const nak2 = getNakshatra(moonSid2);

      // Dashas
      const dasha1 = calcDasha(nak1, utcDate);
      const dasha2 = calcDasha(nak2, utcDate);

      totalCount++;

      const nakChanged = nak1.name !== nak2.name;
      const padaChanged = nak1.name !== nak2.name || nak1.pada !== nak2.pada;
      const moonRashiChanged = Math.floor(moonSid1 / 30) !== Math.floor(moonSid2 / 30);
      const sunRashiChanged = Math.floor(sunSid1 / 30) !== Math.floor(sunSid2 / 30);
      const lagnaChanged = lagna1.rashiIndex !== lagna2.rashiIndex;

      const lord1 = dasha1.timeline[0]?.planet;
      const lord2 = dasha2.timeline[0]?.planet;
      const lordChanged = lord1 !== lord2;

      const dashaEndMs1 = Date.parse(dasha1.timeline[0].endDate);
      const dashaEndMs2 = Date.parse(dasha2.timeline[0].endDate);
      const shiftDays = Math.abs(dashaEndMs1 - dashaEndMs2) / (1000 * 60 * 60 * 24);
      dashaShiftsAll.push(shiftDays);

      const changes: string[] = [];
      if (nakChanged) {
        nakshatraFlips++;
        changes.push(`nakshatra: ${nak1.name} -> ${nak2.name}`);
      }
      if (padaChanged) {
        nakshatraPadaFlips++;
        changes.push(`pada: ${nak1.pada} -> ${nak2.pada}`);
      }
      if (moonRashiChanged) {
        moonRashiFlips++;
        changes.push('moon_rashi');
      }
      if (sunRashiChanged) {
        sunRashiFlips++;
        changes.push('sun_rashi');
      }
      if (lagnaChanged) {
        lagnaRashiFlips++;
        changes.push('lagna');
      }
      if (lordChanged) {
        dashaLordFlips++;
        changes.push(`dasha_lord: ${lord1} -> ${lord2}`);
      }

      if (changes.length > 0 || shiftDays > 0.01) {
        affectedUsers.push({
          id: p.id,
          owner_id: p.owner_id,
          // PII: neither `label` nor `full_name` is selected or emitted. This
          // report is committed to git; an earlier version claimed "PII
          // anonymized" while listing real names in a Relationship column.
          label: '(withheld)',
          fullName: '(withheld)',
          changes,
          dashaShiftDays: shiftDays
        });
      }
    } catch (err) {
      console.error(`Error calculating profile ${p.id}:`, err);
    }
  }

  // Calculate median shift
  dashaShiftsAll.sort((a, b) => a - b);
  const mid = Math.floor(dashaShiftsAll.length / 2);
  const medianShift = dashaShiftsAll.length % 2 !== 0 
    ? dashaShiftsAll[mid] 
    : (dashaShiftsAll[mid - 1] + dashaShiftsAll[mid]) / 2;

  const maxShift = dashaShiftsAll.length > 0 ? dashaShiftsAll[dashaShiftsAll.length - 1] : 0;

  // Build markdown report content
  let report = `# Ayanamsha Real-Population Impact Report

## Overview
This report analyzes the impact of switching from the old linear ayanamsha formula to the canonical Chitrapaksha (Lahiri) formula across all saved profiles in the database.

## Metrics
- **Total Valid Profiles Evaluated**: ${totalCount}
- **Nakshatra Flips**: ${nakshatraFlips} (Rate: ${(nakshatraFlips / totalCount * 100).toFixed(4)}%)
- **Pada Flips**: ${nakshatraPadaFlips} (Rate: ${(nakshatraPadaFlips / totalCount * 100).toFixed(4)}%)
- **Moon Rashi Flips**: ${moonRashiFlips} (Rate: ${(moonRashiFlips / totalCount * 100).toFixed(4)}%)
- **Sun Rashi Flips**: ${sunRashiFlips} (Rate: ${(sunRashiFlips / totalCount * 100).toFixed(4)}%)
- **Lagna Rashi Flips**: ${lagnaRashiFlips} (Rate: ${(lagnaRashiFlips / totalCount * 100).toFixed(4)}%)
- **Dasha Lord Flips**: ${dashaLordFlips} (Rate: ${(dashaLordFlips / totalCount * 100).toFixed(4)}%)
- **Dasha Timing Shifts**:
  - Median shift: ${medianShift.toFixed(2)} days
  - Max shift: ${maxShift.toFixed(2)} days

## Affected Birth Profiles
Below is the list of affected profile IDs and their specific updates (PII anonymized for safety):

| Birth Profile ID | Owner User ID | Changes Detected | Dasha Timing Shift |
| --- | --- | --- | --- | --- |
`;

  for (const aff of affectedUsers) {
    report += `| \`${aff.id}\` | \`${aff.owner_id || 'guest'}\` | ${aff.label} | ${aff.changes.join(', ') || 'Timing only'} | ${aff.dashaShiftDays.toFixed(2)} days |\n`;
  }

  const outPath = path.resolve(process.cwd(), 'docs/AYANAMSHA_REAL_POPULATION_REPORT.md');
  fs.writeFileSync(outPath, report, 'utf8');
  console.log(`Report written to docs/AYANAMSHA_REAL_POPULATION_REPORT.md`);
  console.log(`Analyzed ${totalCount} profiles. Median shift: ${medianShift} days. Max shift: ${maxShift} days.`);
}

runRealMeasurement();

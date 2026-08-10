/**
 * Tracker 2.8 — solar months and regional day-assignment.
 *
 * The point of this module is that ONE astronomical Sankranti assigns to
 * DIFFERENT civil days depending on region. So the tests that matter are the
 * ones that prove divergence, not the ones that prove a single number.
 *
 * A suite that only checked "Tamil month for date X is Thai" would pass just as
 * happily with all four rules collapsed into same_day_rule, which is precisely
 * the bug worth guarding against.
 *
 * Everything here is `[S]` and unratified. The tests assert the rules behave as
 * calendar-profiles.md §2 documents them; they do not assert the rules are
 * religiously correct, which is not engineering's call.
 */
import { describe, it, expect } from 'vitest';
import {
  getSolarMonth,
  assignSankrantiToCivilDay,
  compareAssignments,
  PROFILE_RULE,
  type SolarProfile,
} from '../index.js';
import { findSankrantisBetween } from '../../lunar-month/index.js';

const CHENNAI = { lat: 13.0827, lon: 80.2707, tz: 'Asia/Kolkata' };
const KOCHI = { lat: 9.9312, lon: 76.2673, tz: 'Asia/Kolkata' };
const KOLKATA = { lat: 22.5726, lon: 88.3639, tz: 'Asia/Kolkata' };
const PURI = { lat: 19.8135, lon: 85.8312, tz: 'Asia/Kolkata' };

/** Makara Sankranti — the ingress behind Pongal / Maghi / Magh Bihu / Uttarayan. */
function makaraSankranti(year: number) {
  const s = findSankrantisBetween(
    new Date(`${year}-01-05T00:00:00Z`),
    new Date(`${year}-01-25T00:00:00Z`),
  );
  const makara = s.find(x => x.rashi === 9); // 0 = Mesha, so 9 = Makara
  if (!makara) throw new Error(`No Makara Sankranti found in ${year}`);
  return makara;
}

describe('2.8 — day-assignment rules', () => {
  it('same_day_rule keeps the Sankranti on its own local day', () => {
    const { at } = makaraSankranti(2026);
    const { civilDate } = assignSankrantiToCivilDay(at, 'same_day_rule', PURI);
    const localDay = new Intl.DateTimeFormat('en-CA', {
      timeZone: PURI.tz, year: 'numeric', month: '2-digit', day: '2-digit',
    }).format(at);
    expect(civilDate).toBe(localDay);
  });

  it('midnight_rule always lands on the day after the Sankranti day', () => {
    // The spec phrases this as a condition ("before midnight -> next day"), but
    // every instant is before the midnight ending its own day, so it has no
    // false branch. Asserting that explicitly stops someone "fixing" it later
    // into a conditional that silently changes Bengali dates.
    const { at } = makaraSankranti(2026);
    const same = assignSankrantiToCivilDay(at, 'same_day_rule', KOLKATA).civilDate;
    const midnight = assignSankrantiToCivilDay(at, 'midnight_rule', KOLKATA).civilDate;

    const delta =
      (Date.parse(midnight + 'T00:00:00Z') - Date.parse(same + 'T00:00:00Z')) / 86_400_000;
    expect(delta).toBe(1);
  });

  it('sunset_rule and aparahna_rule differ from each other for at least one Sankranti', () => {
    // Aparahna starts before sunset, so there is a window in which a Sankranti
    // is after aparahna-start but before sunset: Kerala rolls to the next day
    // while Tamil Nadu does not. If these two ever agree across a whole year,
    // one of them is not being evaluated.
    const sankrantis = findSankrantisBetween(
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-12-31T23:59:59Z'),
    );
    expect(sankrantis.length).toBeGreaterThanOrEqual(11);

    const divergent = sankrantis.filter(s => {
      const tamil = assignSankrantiToCivilDay(s.at, 'sunset_rule', CHENNAI).civilDate;
      const kerala = assignSankrantiToCivilDay(s.at, 'aparahna_rule', KOCHI).civilDate;
      return tamil !== kerala;
    });

    expect(
      divergent.length,
      'sunset_rule and aparahna_rule never diverged across a full year — suspect one is not evaluated',
    ).toBeGreaterThan(0);
  });

  it('the four rules do not collapse into one another', () => {
    // The whole reason this module exists. If every rule returns the same civil
    // day for every Sankranti in a year, the regional modelling is decorative.
    const sankrantis = findSankrantisBetween(
      new Date('2026-01-01T00:00:00Z'),
      new Date('2026-12-31T23:59:59Z'),
    );

    const anyDivergence = sankrantis.some(s => {
      const a = compareAssignments(s.at, CHENNAI);
      return new Set(Object.values(a)).size > 1;
    });

    expect(anyDivergence, 'all four rules produced identical dates all year').toBe(true);
  });
});

describe('2.8 — month naming', () => {
  const cases: Array<[SolarProfile, any]> = [
    ['tamil', CHENNAI],
    ['malayalam', KOCHI],
    ['bengali', KOLKATA],
    ['odia', PURI],
  ];

  it.each(cases)('%s resolves a month with a sane day-of-month', (profile, loc) => {
    const res = getSolarMonth(new Date('2026-06-15T06:00:00Z'), profile, loc);
    expect(res.ok, `getSolarMonth failed for ${profile}`).toBe(true);
    if (!res.ok) return;

    expect(res.monthName).toBeTruthy();
    expect(res.rashi).toBeGreaterThanOrEqual(0);
    expect(res.rashi).toBeLessThan(12);
    // Solar months run 29-32 days; a day-of-month outside that means the
    // governing Sankranti was mis-selected.
    expect(res.dayOfMonth).toBeGreaterThanOrEqual(1);
    expect(res.dayOfMonth).toBeLessThanOrEqual(32);
    expect(res.rule).toBe(PROFILE_RULE[profile]);
    expect(res.ratified).toBe(false);
  });

  it('Malayalam names are offset from Meṣa, not aligned to it', () => {
    // Malayalam begins at Chingam (Simha), so its list is rotated four places.
    // Getting this wrong names every Kerala month four months out — plausible
    // enough to survive casual review, which is why it is asserted directly.
    const instant = new Date('2026-04-20T06:00:00Z'); // Sun in Mesha
    const tamil = getSolarMonth(instant, 'tamil', CHENNAI);
    const mal = getSolarMonth(instant, 'malayalam', KOCHI);

    expect(tamil.ok && mal.ok).toBe(true);
    if (!tamil.ok || !mal.ok) return;

    // Same rāśi, different names: Tamil calls Meṣa "Chithirai", Malayalam "Medam".
    expect(mal.rashi).toBe(tamil.rashi);
    expect(tamil.monthName).toBe('Chithirai');
    expect(mal.monthName).toBe('Medam');
  });

  it('every profile names all twelve rāśis without repeating', () => {
    for (const [profile, loc] of cases) {
      const seen = new Set<string>();
      // Sample monthly through a year; each Sankranti should give a new name.
      for (let m = 0; m < 12; m++) {
        const res = getSolarMonth(new Date(Date.UTC(2026, m, 20, 6, 0, 0)), profile, loc);
        if (res.ok) seen.add(res.monthName);
      }
      expect(seen.size, `${profile} produced ${seen.size} distinct month names across a year`).toBe(12);
    }
  });
});

describe('2.8 — [S] honesty', () => {
  it('never reports itself as ratified', () => {
    const res = getSolarMonth(new Date('2026-06-15T06:00:00Z'), 'tamil', CHENNAI);
    expect(res.ok).toBe(true);
    if (!res.ok) return;
    expect(res.ratified).toBe(false);
    expect(
      res.diagnostics.some(d => d.includes('[S]')),
      'result must carry an [S] diagnostic so no caller mistakes these rules for ratified',
    ).toBe(true);
  });
});

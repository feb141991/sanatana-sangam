/**
 * Read-only spot-check claims transcribed from the cited, edition-checked
 * manifests in docs/sources. These are evidence candidates, not rules,
 * fixtures, publication dates, or a calendar harvester.
 */
export type OfficialCalendarClaim = {
  slug: string;
  date: string;
  tradition: 'hindu' | 'sikh';
  authority: string;
  edition: string;
  locator: string;
  sourceUrl: string;
  manifest: string;
  variant?: string;
};

const rashtriya = {
  tradition: 'hindu' as const,
  authority: 'Positional Astronomy Centre / IMD',
  edition: 'Rashtriya Panchang, Saka 1948 (2026–27)',
  sourceUrl: 'https://www.packolkata.gov.in/rashtriya-panchang-english.php',
  manifest: 'docs/sources/rashtriya-panchang-saka-1948.manifest.md',
};

const sgpc = {
  tradition: 'sikh' as const,
  authority: 'Shiromani Gurdwara Parbandhak Committee',
  edition: 'Nanakshahi Samvat 558 (2026–27)',
  sourceUrl: 'https://sgpc.net/nanakshahi-calendar/',
  manifest: 'docs/sources/sgpc-nanakshahi-558.manifest.md',
};

export const OFFICIAL_CALENDAR_CLAIMS: readonly OfficialCalendarClaim[] = [
  { ...rashtriya, slug: 'aja-ekadashi', date: '2026-09-07', locator: 'daily page 65' },
  { ...rashtriya, slug: 'apara-ekadashi', date: '2026-05-13', locator: 'daily page 34' },
  { ...rashtriya, slug: 'kamika-ekadashi', date: '2026-08-09', locator: 'daily page 57' },
  { ...rashtriya, slug: 'rama-ekadashi', date: '2026-11-05', locator: 'daily page 80' },
  { ...rashtriya, slug: 'saphala-ekadashi', date: '2027-01-03', locator: 'daily page 96' },
  { ...rashtriya, slug: 'utpanna-ekadashi', date: '2026-12-04', locator: 'daily page 88' },
  { ...rashtriya, slug: 'karva-chauth', date: '2026-10-29', locator: 'index page 7; daily page 79' },
  { ...rashtriya, slug: 'diwali', date: '2026-11-08', locator: 'index page 7; daily page 81' },
  { ...rashtriya, slug: 'maha-shivaratri', date: '2027-03-06', locator: 'index page 8; daily pages 112–113', variant: 'mainstream / South India; Kashmir is 2027-03-05' },
  { ...rashtriya, slug: 'yogini-ekadashi', date: '2026-07-10', locator: 'printed page 29 (PDF page 49)', variant: 'Smarta' },
  { ...rashtriya, slug: 'yogini-ekadashi', date: '2026-07-11', locator: 'printed page 30 (PDF page 50)', variant: 'Vaishnava / Vidhava' },
  { ...rashtriya, slug: 'vijaya-ekadashi', date: '2027-03-04', locator: 'printed page 92 (PDF page 112)' },
  { ...sgpc, slug: 'baisakhi', date: '2026-04-14', locator: 'Gurpurab list: 01 Vaisakh' },
  { ...sgpc, slug: 'guru-arjan-dev-martyrdom', date: '2026-06-18', locator: 'Gurpurab list: 04 Harh' },
  { ...sgpc, slug: 'bandhi-chhor-divas', date: '2026-11-08', locator: 'Gurpurab list: 23 Katak' },
  { ...sgpc, slug: 'guru-nanak-gurpurab', date: '2026-11-24', locator: 'Gurpurab list: 09 Maghar' },
  { ...sgpc, slug: 'guru-tegh-bahadur-martyrdom', date: '2026-12-14', locator: 'Gurpurab list: 29 Maghar' },
  { ...sgpc, slug: 'guru-gobind-singh-gurpurab', date: '2027-01-15', locator: 'Gurpurab list: 02 Magh' },
  { ...sgpc, slug: 'guru-ravidas-jayanti', date: '2027-02-20', locator: 'Gurpurab list: 08 Phagun' },
];

export type FixtureEvidence = {
  case_id: string;
  updated_at?: string;
  festival_id: string;
  year: number;
  expected: { civilDate?: string | null } | null;
  source?: { tier: number; ref: string; citation: string; verifiedBy?: string; verifiedOn?: string } | null;
  reasoning?: string;
  approved: boolean;
  profile: { calendar?: string; tradition?: string } | null;
  location: { label?: string; tz?: string } | null;
};

export type ClaimComparison = {
  claim: OfficialCalendarClaim;
  status: 'no_fixture' | 'fixture_needs_source' | 'matching_unapproved' | 'matching_approved' | 'different_date' | 'mixed_dates';
  fixtures: FixtureEvidence[];
};

export function compareOfficialClaims(
  claims: readonly OfficialCalendarClaim[],
  fixtures: readonly FixtureEvidence[],
): ClaimComparison[] {
  return claims.map((claim) => {
    const year = Number(claim.date.slice(0, 4));
    const matchingIdentity = fixtures.filter((fixture) => fixture.festival_id === claim.slug && fixture.year === year);
    const matchingDates = matchingIdentity.filter((fixture) => fixture.expected?.civilDate === claim.date);
    const status: ClaimComparison['status'] = matchingIdentity.length === 0
      ? 'no_fixture'
      : matchingIdentity.every((fixture) => !fixture.expected?.civilDate)
        ? 'fixture_needs_source'
        : matchingDates.length === 0
        ? 'different_date'
        : matchingIdentity.some((fixture) => fixture.expected?.civilDate && fixture.expected.civilDate !== claim.date)
          ? 'mixed_dates'
          : matchingDates.some((fixture) => fixture.approved)
          ? 'matching_approved'
          : 'matching_unapproved';
    return { claim, status, fixtures: matchingIdentity };
  });
}

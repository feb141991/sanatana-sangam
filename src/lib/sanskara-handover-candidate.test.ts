import { describe, expect, it } from 'vitest';
import {
  buildSanskaraHandoverCandidates,
  SANSKARA_HANDOVER_NOTICES,
  SANSKARA_HANDOVER_WORDINGS,
  withSanskaraHandoverWording,
  type SanskaraHandoverDueRow,
} from './sanskara-handover-candidate';
import { SANSKARA_ACTION_URL } from './sanskara-reminder-candidate';

const NOW = new Date('2026-11-03T06:00:00.000Z');
const SUBJECT = '8a1f3c52-1b7e-4c0a-9d3e-5f6a7b8c9d01';
const ACCOUNT = '2b4d6f80-aaaa-4bbb-8ccc-0123456789ab';
// The keys sanskara_validate_handover_candidate allows in metadata.
const ALLOWED_METADATA = ['local_date', 'notice', 'profile_generation', 'subject_id', 'timezone'];

function row(overrides: Partial<SanskaraHandoverDueRow> = {}): SanskaraHandoverDueRow {
  return {
    subject_id: SUBJECT,
    account_id: ACCOUNT,
    notice: 'open_30',
    audience_variant: 'manager',
    profile_generation: 3,
    local_date: '2026-11-04',
    scheduled_for: '2026-11-04T03:30:00.000Z',
    timezone: 'Asia/Kolkata',
    language: 'en',
    quiet_hours_start: 22,
    quiet_hours_end: 6,
    ...overrides,
  };
}
const build = (rows: SanskaraHandoverDueRow[], now = NOW) => buildSanskaraHandoverCandidates(rows, now);

describe('buildSanskaraHandoverCandidates', () => {
  it('maps a due row to a candidate in the H key space, keyed by the child\'s subject id', () => {
    const { candidates, malformedCount, outsideHorizonCount } = build([row()]);
    expect(malformedCount + outsideHorizonCount).toBe(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      user_id: ACCOUNT,
      event_type: 'sanskar_milestone',
      event_id: SUBJECT,
      event_instance: 'Hopen_30',
      local_date: '2026-11-04',
      audience_variant: 'manager',
      scheduled_for: '2026-11-04T03:30:00.000Z',
      action_url: SANSKARA_ACTION_URL,
      timezone: 'Asia/Kolkata',
      language: 'en',
    });
  });

  it('never uses the L key space of the milestone reminders', () => {
    for (const notice of SANSKARA_HANDOVER_NOTICES) {
      const audience_variant = notice.startsWith('open_') ? 'manager' : 'former_manager';
      const [candidate] = build([row({ notice, audience_variant })]).candidates;
      expect(candidate.event_instance).toBe(`H${notice}`);
      expect(candidate.event_instance).not.toMatch(/^L/);
    }
  });

  it('carries exactly the five metadata keys the insert trigger allows', () => {
    const [candidate] = build([row()]).candidates;
    expect(Object.keys(candidate.metadata as object).sort()).toEqual(ALLOWED_METADATA);
    expect(candidate.metadata).toEqual({
      subject_id: SUBJECT, notice: 'open_30', profile_generation: 3, local_date: '2026-11-04', timezone: 'Asia/Kolkata',
    });
  });

  it('keeps metadata.local_date and metadata.timezone equal to the columns', () => {
    const [candidate] = build([row({ timezone: 'America/New_York', scheduled_for: '2026-11-04T14:00:00.000Z' })]).candidates;
    const metadata = candidate.metadata as { local_date: string; timezone: string };
    expect(metadata.local_date).toBe(candidate.local_date);
    expect(metadata.timezone).toBe(candidate.timezone);
  });

  it('uses a link with no id and no query', () => {
    const [candidate] = build([row()]).candidates;
    expect(candidate.action_url).toMatch(/^\/[a-z0-9/_-]*$/);
    expect(candidate.action_url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-/i);
  });

  it('shows the same text for every notice, so the lock screen reveals no stage', () => {
    const texts = SANSKARA_HANDOVER_NOTICES.map((notice) => {
      const [c] = build([row({ notice, audience_variant: notice.startsWith('open_') ? 'manager' : 'former_manager' })]).candidates;
      return `${c.title}|${c.body}`;
    });
    expect(new Set(texts).size).toBe(1);
  });

  it.each(['en', 'hi', 'pa'] as const)('writes %s text with no digit, id, age, date or the words hand over / birthday', (language) => {
    for (const w of SANSKARA_HANDOVER_WORDINGS[language]) {
      const text = `${w.title} ${w.body}`;
      expect(text).not.toMatch(/\d|[0-9a-f]{8}-/i);
      expect(text.toLowerCase()).not.toMatch(/hand ?over|birthday|child|18/);
    }
  });

  it('falls back to English for an unknown or missing language', () => {
    expect(build([row({ language: 'fr' })]).candidates[0].language).toBe('en');
    expect(build([row({ language: null })]).candidates[0].language).toBe('en');
  });

  it('expires a notice at the end of its own local day', () => {
    const [candidate] = build([row({ timezone: 'Asia/Kolkata', local_date: '2026-11-04' })]).candidates;
    expect(candidate.expires_at).toBe('2026-11-04T18:30:00.000Z');
  });

  it('drops a notice whose day has already ended', () => {
    const { candidates, malformedCount } = build([row()], new Date('2026-11-04T19:00:00.000Z'));
    expect(candidates).toHaveLength(0);
    expect(malformedCount).toBe(1);
  });

  it('refuses to schedule further ahead than the trigger allows', () => {
    const { candidates, outsideHorizonCount } = build([row({ scheduled_for: '2026-11-06T09:00:00.000Z', local_date: '2026-11-06' })]);
    expect(candidates).toHaveLength(0);
    expect(outsideHorizonCount).toBe(1);
  });

  it.each([
    ['a non-uuid subject', { subject_id: 'nope' }],
    ['a non-uuid account', { account_id: '1' }],
    ['an unknown notice', { notice: 'open_1' }],
    ['a notice in the reminder lead format', { notice: 'L7' }],
    ['an open notice addressed to a former manager', { audience_variant: 'former_manager' }],
    ['a closing notice addressed to a manager', { notice: 'closing_7', audience_variant: 'manager' }],
    ['an unknown audience', { audience_variant: 'viewer' }],
    ['a fractional generation', { profile_generation: 1.5 }],
    ['a string generation', { profile_generation: '3' as unknown as number }],
    ['a malformed date', { local_date: '04/11/2026' }],
    ['an empty timezone', { timezone: '' }],
    ['an unparseable schedule', { scheduled_for: 'tomorrow' }],
  ])('counts %s as malformed and creates nothing', (_label, overrides) => {
    const { candidates, malformedCount } = build([row(overrides as Partial<SanskaraHandoverDueRow>)]);
    expect(candidates).toHaveLength(0);
    expect(malformedCount).toBe(1);
  });

  it('keeps the good rows when one in the batch is bad', () => {
    const other = '9c2e4a60-1111-4222-8333-abcdefabcdef';
    const { candidates, malformedCount } = build([row(), row({ subject_id: 'bad' }), row({ subject_id: other, notice: 'open_7' })]);
    expect(candidates.map((c) => c.event_id)).toEqual([SUBJECT, other]);
    expect(malformedCount).toBe(1);
  });

  it('never receives or returns a name or a birth date', () => {
    const serialised = JSON.stringify(build([row()]).candidates[0]);
    for (const key of ['display_name', 'birth_date', 'custom_title', 'rite_key']) expect(serialised).not.toContain(key);
  });

  describe('wording ladder', () => {
    const refusedBy = (name: string, w: { title: string; body: string }) => `${w.title} ${w.body}`.toLowerCase().includes(name.toLowerCase());
    const NAMES = ['Sana', 'Kara', 'Tim', 'Eli', 'Mel', 'Aya', 'Naya', 'Ara', 'Ansh', 'Ravi', 'Asha', 'Dev', 'Aarav', 'Ishaan', 'Anaya', 'Diya',
      'Kabir', 'Meera', 'Tara', 'Sara', 'Rani', 'Nina', 'Ria', 'Mia', 'Remi', 'Emi', 'Mina', 'Sans', 'Kar', 'San', 'Ron', 'Dan', 'Sam', 'Ted', 'Lin',
      'तिथि', 'समय', 'दिन', 'आज', 'याद', 'संस्कार', 'आपका', 'ਯਾਦ', 'ਦਿਨ', 'ਤਾਰੀਖ', 'ਤੁਹਾਡਾ'];

    it.each(['en', 'hi', 'pa'] as const)('leaves every name in the corpus a %s wording that does not contain it', (language) => {
      for (const name of NAMES) {
        const survivors = SANSKARA_HANDOVER_WORDINGS[language].filter((w) => !refusedBy(name, w));
        expect(survivors.length, `${language} ${name}`).toBeGreaterThan(0);
      }
    });

    it('swaps only the text', () => {
      const [first] = build([row()]).candidates;
      const second = withSanskaraHandoverWording(first, 1)!;
      expect(second.title).not.toBe(first.title);
      expect({ ...second, title: first.title, body: first.body }).toEqual(first);
    });

    it('returns null once the wordings run out', () => {
      const [first] = build([row()]).candidates;
      expect(withSanskaraHandoverWording(first, SANSKARA_HANDOVER_WORDINGS.en.length)).toBeNull();
    });
  });
});

import { describe, expect, it } from 'vitest';
import {
  buildSanskaraReminderCandidates,
  SANSKARA_ACTION_URL,
  SANSKARA_WORDINGS,
  withSanskaraWording,
  type SanskaraDueRow,
} from './sanskara-reminder-candidate';

const NOW = new Date('2026-11-03T06:00:00.000Z');
const SUB = '8a1f3c52-1b7e-4c0a-9d3e-5f6a7b8c9d01';
const ACCOUNT = '2b4d6f80-aaaa-4bbb-8ccc-0123456789ab';
// The keys sanskara_validate_candidate allows in metadata.
const ALLOWED_METADATA = ['local_date', 'profile_generation', 'record_version', 'subscription_generation', 'subscription_id', 'timezone'];

function row(overrides: Partial<SanskaraDueRow> = {}): SanskaraDueRow {
  return {
    subscription_id: SUB,
    subscription_generation: 2,
    record_version: 5,
    profile_generation: 3,
    account_id: ACCOUNT,
    lead_days: 1,
    audience_variant: 'manager',
    local_date: '2026-11-04',
    scheduled_for: '2026-11-04T03:30:00.000Z',
    timezone: 'Asia/Kolkata',
    language: 'en',
    quiet_hours_start: 22,
    quiet_hours_end: 6,
    ...overrides,
  };
}

function build(rows: SanskaraDueRow[], now = NOW) {
  return buildSanskaraReminderCandidates(rows, now);
}

describe('buildSanskaraReminderCandidates', () => {
  it('maps a due row to a candidate keyed by subscription and lead time', () => {
    const { candidates, malformedCount, outsideHorizonCount } = build([row()]);
    expect(malformedCount).toBe(0);
    expect(outsideHorizonCount).toBe(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      user_id: ACCOUNT,
      event_type: 'sanskar_milestone',
      event_id: SUB,
      event_instance: 'L1',
      local_date: '2026-11-04',
      audience_variant: 'manager',
      scheduled_for: '2026-11-04T03:30:00.000Z',
      action_url: SANSKARA_ACTION_URL,
      timezone: 'Asia/Kolkata',
      language: 'en',
    });
  });

  it('carries exactly the opaque ids and versions the insert trigger allows, and nothing else', () => {
    const [candidate] = build([row()]).candidates;
    expect(Object.keys(candidate.metadata as object).sort()).toEqual(ALLOWED_METADATA);
    expect(candidate.metadata).toEqual({
      subscription_id: SUB,
      subscription_generation: 2,
      record_version: 5,
      profile_generation: 3,
      local_date: '2026-11-04',
      timezone: 'Asia/Kolkata',
    });
  });

  it('keeps metadata.local_date and metadata.timezone equal to the columns (the trigger refuses any difference)', () => {
    const [candidate] = build([row({ timezone: 'America/New_York', local_date: '2026-11-04', scheduled_for: '2026-11-04T14:00:00.000Z' })]).candidates;
    const metadata = candidate.metadata as { local_date: string; timezone: string };
    expect(metadata.local_date).toBe(candidate.local_date);
    expect(metadata.timezone).toBe(candidate.timezone);
  });

  it('uses a link with no id and no query, as the trigger requires', () => {
    const [candidate] = build([row()]).candidates;
    expect(candidate.action_url).toMatch(/^\/[a-z0-9/_-]*$/);
    expect(candidate.action_url).not.toMatch(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-/i);
  });

  it.each(['en', 'hi', 'pa'])('writes %s text that repeats no id, date, name or relationship', (language) => {
    for (const lead of [0, 7]) {
      const [candidate] = build([row({ language, lead_days: lead })]).candidates;
      const text = `${candidate.title} ${candidate.body}`;
      expect(text).not.toMatch(/\d/);
      expect(text).not.toMatch(/[0-9a-f]{8}-/i);
      expect(candidate.language).toBe(language);
      expect(candidate.title.length).toBeGreaterThan(0);
      expect(candidate.body.length).toBeGreaterThan(0);
    }
  });

  it('gives the same wording to every audience, so the text reveals nothing about the relationship', () => {
    const texts = (['self', 'manager', 'viewer'] as const).map((audience_variant) => {
      const [candidate] = build([row({ audience_variant })]).candidates;
      return `${candidate.title}|${candidate.body}`;
    });
    expect(new Set(texts).size).toBe(1);
  });

  it('says "today" only for a same-day reminder', () => {
    const today = build([row({ lead_days: 0 })]).candidates[0].body;
    const soon = build([row({ lead_days: 3 })]).candidates[0].body;
    expect(today).not.toBe(soon);
  });

  it('falls back to English for an unknown or missing language', () => {
    expect(build([row({ language: 'fr' })]).candidates[0].language).toBe('en');
    expect(build([row({ language: null })]).candidates[0].language).toBe('en');
  });

  it('expires a reminder at the end of its own local day, never the next', () => {
    const [candidate] = build([row({ timezone: 'Asia/Kolkata', local_date: '2026-11-04' })]).candidates;
    // 2026-11-05T00:00 in Kolkata (UTC+5:30)
    expect(candidate.expires_at).toBe('2026-11-04T18:30:00.000Z');
  });

  it('still produces a late reminder whose moment has passed but whose day has not ended', () => {
    const late = new Date('2026-11-04T05:00:00.000Z');
    const { candidates } = build([row()], late);
    expect(candidates).toHaveLength(1);
    expect(new Date(candidates[0].expires_at).getTime()).toBeGreaterThan(late.getTime());
  });

  it('drops a reminder whose day has already ended, rather than creating something already expired', () => {
    const tooLate = new Date('2026-11-04T19:00:00.000Z');
    const { candidates, malformedCount } = build([row()], tooLate);
    expect(candidates).toHaveLength(0);
    expect(malformedCount).toBe(1);
  });

  it('refuses to schedule further ahead than the trigger allows', () => {
    const { candidates, outsideHorizonCount } = build([row({ scheduled_for: '2026-11-06T09:00:00.000Z', local_date: '2026-11-06' })]);
    expect(candidates).toHaveLength(0);
    expect(outsideHorizonCount).toBe(1);
  });

  it.each([
    ['a non-uuid subscription', { subscription_id: 'not-a-uuid' }],
    ['a non-uuid account', { account_id: '123' }],
    ['a fractional version', { record_version: 1.5 }],
    ['a negative generation', { subscription_generation: -1 }],
    ['a string generation', { profile_generation: '3' as unknown as number }],
    ['a lead time the table does not allow', { lead_days: 2 }],
    ['an unknown audience', { audience_variant: 'admin' }],
    ['a malformed local date', { local_date: '04/11/2026' }],
    ['an empty timezone', { timezone: '' }],
    ['an unparseable schedule', { scheduled_for: 'tomorrow' }],
  ])('counts %s as malformed and creates nothing for it', (_label, overrides) => {
    const { candidates, malformedCount } = build([row(overrides as Partial<SanskaraDueRow>)]);
    expect(candidates).toHaveLength(0);
    expect(malformedCount).toBe(1);
  });

  it('keeps the good rows when one in the batch is bad', () => {
    const other = '9c2e4a60-1111-4222-8333-abcdefabcdef';
    const { candidates, malformedCount } = build([row(), row({ subscription_id: 'bad' }), row({ subscription_id: other, lead_days: 7 })]);
    expect(candidates.map((c) => c.event_id)).toEqual([SUB, other]);
    expect(malformedCount).toBe(1);
  });

  it('never reads or returns a name, title or rite: the row type has none and the output has none', () => {
    const [candidate] = build([row()]).candidates;
    const serialised = JSON.stringify(candidate);
    for (const key of ['display_name', 'custom_title', 'rite_key', 'birth_date']) expect(serialised).not.toContain(key);
  });

  describe('wording ladder (the insert trigger refuses text that contains a person\'s name)', () => {
    // Mirrors the trigger: a name of three or more characters found anywhere in title + body, case-insensitively.
    const refusedBy = (name: string, title: string, body: string) => `${title} ${body}`.toLowerCase().includes(name.toLowerCase());
    const NAMES = ['Sana', 'Kara', 'Tim', 'Eli', 'Mel', 'Aya', 'Naya', 'Ara', 'Ansh', 'Ravi', 'Asha', 'Dev', 'Aarav', 'Ishaan', 'Anaya',
      'Diya', 'Kabir', 'Meera', 'Tara', 'Sara', 'Rani', 'Nina', 'Ria', 'Mia', 'Remi', 'Emi', 'Mina', 'Sans', 'Kar', 'San', 'Ron', 'Dan',
      'तिथि', 'समय', 'दिन', 'आज', 'याद', 'संस्कार', 'आपका', 'ਯਾਦ', 'ਦਿਨ', 'ਤਾਰੀਖ', 'ਤੁਹਾਡਾ'];

    it.each(['en', 'hi', 'pa'] as const)('leaves every name in the corpus a %s wording that does not contain it', (language) => {
      for (const lead of [0, 7]) {
        for (const name of NAMES) {
          const survivors = SANSKARA_WORDINGS[language].filter((w) => !refusedBy(name, w.title, lead === 0 ? w.today : w.soon));
          expect(survivors.length, `${language} lead ${lead} name ${name}`).toBeGreaterThan(0);
        }
      }
    });

    it('swaps only the text and keeps every other field, including the metadata the trigger checks', () => {
      const [first] = build([row({ language: 'en', lead_days: 0 })]).candidates;
      const second = withSanskaraWording(first, 1)!;
      expect(second.title).not.toBe(first.title);
      expect(second.body).not.toBe(first.body);
      expect({ ...second, title: first.title, body: first.body }).toEqual(first);
    });

    it('picks the lead-time sentence for the alternate wording too', () => {
      const today = withSanskaraWording(build([row({ lead_days: 0 })]).candidates[0], 1)!.body;
      const soon = withSanskaraWording(build([row({ lead_days: 7 })]).candidates[0], 1)!.body;
      expect(today).not.toBe(soon);
    });

    it('returns null once the wordings run out, and never invents one', () => {
      const [first] = build([row()]).candidates;
      expect(withSanskaraWording(first, SANSKARA_WORDINGS.en.length)).toBeNull();
    });

    it('keeps the alternate wordings as plain as the first: no digits, no ids', () => {
      for (const language of ['en', 'hi', 'pa'] as const) {
        for (const w of SANSKARA_WORDINGS[language]) expect(`${w.title} ${w.today} ${w.soon}`).not.toMatch(/\d|[0-9a-f]{8}-/i);
      }
    });
  });
});

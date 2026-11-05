import { describe, expect, it } from 'vitest';
import {
  buildSanskaraEarlyApprovalCandidates,
  SANSKARA_EARLY_APPROVAL_INSTANCE,
  type SanskaraEarlyApprovalDueRow,
} from './sanskara-early-approval-candidate';
import { SANSKARA_HANDOVER_WORDINGS, withSanskaraHandoverWording } from './sanskara-handover-candidate';
import { SANSKARA_ACTION_URL } from './sanskara-reminder-candidate';

const NOW = new Date('2026-11-04T06:00:00.000Z');
const HANDOVER = '8a1f3c52-1b7e-4c0a-9d3e-5f6a7b8c9d01';
const ACCOUNT = '2b4d6f80-aaaa-4bbb-8ccc-0123456789ab';
// The keys sanskara_validate_early_approval_candidate allows in metadata.
const ALLOWED_METADATA = ['handover_id', 'local_date', 'profile_generation', 'timezone'];

function row(overrides: Partial<SanskaraEarlyApprovalDueRow> = {}): SanskaraEarlyApprovalDueRow {
  return {
    handover_id: HANDOVER,
    account_id: ACCOUNT,
    profile_generation: 3,
    local_date: '2026-11-04',
    scheduled_for: '2026-11-04T06:00:00.000Z',
    timezone: 'Asia/Kolkata',
    language: 'en',
    quiet_hours_start: 22,
    quiet_hours_end: 6,
    ...overrides,
  };
}
const build = (rows: SanskaraEarlyApprovalDueRow[], now = NOW) => buildSanskaraEarlyApprovalCandidates(rows, now);

describe('buildSanskaraEarlyApprovalCandidates', () => {
  it('maps a due row to a candidate in the E key space, keyed by the hand-over id', () => {
    const { candidates, malformedCount, outsideHorizonCount } = build([row()]);
    expect(malformedCount + outsideHorizonCount).toBe(0);
    expect(candidates).toHaveLength(1);
    expect(candidates[0]).toMatchObject({
      user_id: ACCOUNT,
      event_type: 'sanskar_milestone',
      event_id: HANDOVER,
      event_instance: 'Eapproval',
      local_date: '2026-11-04',
      audience_variant: 'manager',
      action_url: SANSKARA_ACTION_URL,
      timezone: 'Asia/Kolkata',
      language: 'en',
    });
    expect(SANSKARA_EARLY_APPROVAL_INSTANCE).toBe('Eapproval');
  });

  it('never uses the L (reminder) or H (hand-over notice) key spaces', () => {
    const [candidate] = build([row()]).candidates;
    expect(candidate.event_instance).not.toMatch(/^[LH]/);
  });

  it('carries exactly the metadata keys the insert trigger allows, and nothing about the child or the starter', () => {
    const [candidate] = build([row()]).candidates;
    expect(Object.keys(candidate.metadata as object).sort()).toEqual(ALLOWED_METADATA);
    expect(JSON.stringify(candidate)).not.toMatch(/subject|child|name|birth|initiat/i);
  });

  it('uses the generic reviewed wording in each language, and nothing else', () => {
    for (const language of ['en', 'hi', 'pa'] as const) {
      const [candidate] = build([row({ language })]).candidates;
      expect(candidate.title).toBe(SANSKARA_HANDOVER_WORDINGS[language][0].title);
      expect(candidate.body).toBe(SANSKARA_HANDOVER_WORDINGS[language][0].body);
    }
    // An unknown or empty language falls back to English.
    expect(build([row({ language: 'fr' })]).candidates[0].language).toBe('en');
    expect(build([row({ language: null })]).candidates[0].language).toBe('en');
  });

  it('can be reworded with the shared next generic wording', () => {
    const [candidate] = build([row()]).candidates;
    const next = withSanskaraHandoverWording(candidate, 1);
    expect(next).not.toBeNull();
    expect(next?.event_instance).toBe('Eapproval');
    expect(next?.metadata).toEqual(candidate.metadata);
  });

  it('is deliverable for 12 hours after it is due, never expiring before it is scheduled', () => {
    const [candidate] = build([row()]).candidates;
    expect(Date.parse(candidate.expires_at) - Date.parse(candidate.scheduled_for)).toBe(12 * 60 * 60 * 1000);
    const late = build([row({ scheduled_for: '2026-11-04T01:00:00.000Z' })]).candidates[0];
    expect(Date.parse(late.expires_at)).toBeGreaterThan(NOW.getTime());
  });

  it('counts, and does not insert, malformed rows', () => {
    const bad: Partial<SanskaraEarlyApprovalDueRow>[] = [
      { handover_id: 'nope' },
      { account_id: '' },
      { profile_generation: -1 },
      { profile_generation: 1.5 },
      { local_date: '04/11/2026' },
      { timezone: '' },
      { scheduled_for: 'tomorrow' },
    ];
    const result = build(bad.map((b) => row(b)));
    expect(result.candidates).toHaveLength(0);
    expect(result.malformedCount).toBe(bad.length);
  });

  it('counts, and does not insert, a row scheduled beyond the horizon', () => {
    const result = build([row({ scheduled_for: '2026-11-07T06:00:00.000Z' })]);
    expect(result.candidates).toHaveLength(0);
    expect(result.outsideHorizonCount).toBe(1);
  });
});

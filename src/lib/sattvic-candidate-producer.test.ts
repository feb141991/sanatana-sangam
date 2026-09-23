import { describe, it, expect } from 'vitest';
import {
  produceSattvicCandidate,
  SANDHYA_NUDGE_BY_TRADITION,
  type DevoteeProfileForSattvic,
} from './sattvic-candidate-producer';

describe('sattvic-candidate-producer', () => {
  const baseDevotee: DevoteeProfileForSattvic = {
    id: 'user-sattvic-123',
    tradition: 'hindu',
    timezone: 'Asia/Kolkata',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    wants_nitya_reminders: true,
    is_deleting: false,
  };

  it('produces a valid candidate at 17:00 local time for opted-in devotee', () => {
    const candidate = produceSattvicCandidate(baseDevotee, '2026-09-23');
    expect(candidate).not.toBeNull();
    expect(candidate?.user_id).toBe('user-sattvic-123');
    expect(candidate?.event_type).toBe('sattvic');
    expect(candidate?.event_id).toBe('sandhya');
    expect(candidate?.event_instance).toBe('');
    expect(candidate?.local_date).toBe('2026-09-23');
    expect(candidate?.action_url).toBe('/bhakti/zen');
    expect(candidate?.title).toBe(SANDHYA_NUDGE_BY_TRADITION.hindu.title);
    expect(candidate?.body).toBe(SANDHYA_NUDGE_BY_TRADITION.hindu.body);
    expect(candidate?.priority).toBe(60);
    // 17:00 IST = 11:30 UTC
    expect(candidate?.scheduled_for).toBe('2026-09-23T11:30:00.000Z');
  });

  it('suppresses candidate if wants_nitya_reminders is not true', () => {
    const optedOutDevotee: DevoteeProfileForSattvic = {
      ...baseDevotee,
      wants_nitya_reminders: false,
    };
    expect(produceSattvicCandidate(optedOutDevotee, '2026-09-23')).toBeNull();

    const unsetDevotee: DevoteeProfileForSattvic = {
      ...baseDevotee,
      wants_nitya_reminders: null,
    };
    expect(produceSattvicCandidate(unsetDevotee, '2026-09-23')).toBeNull();
  });

  it('suppresses candidate if devotee account is marked for deletion', () => {
    const deletingDevotee: DevoteeProfileForSattvic = {
      ...baseDevotee,
      is_deleting: true,
    };
    expect(produceSattvicCandidate(deletingDevotee, '2026-09-23')).toBeNull();
  });

  it('suppresses candidate if 17:00 falls inside quiet hours', () => {
    const quietDevotee: DevoteeProfileForSattvic = {
      ...baseDevotee,
      notification_quiet_hours_start: 16,
      notification_quiet_hours_end: 20,
    };
    expect(produceSattvicCandidate(quietDevotee, '2026-09-23')).toBeNull();
  });

  it('selects tradition-specific reflection copy accurately', () => {
    const sikh = produceSattvicCandidate({ ...baseDevotee, tradition: 'sikh' }, '2026-09-23');
    expect(sikh?.title).toBe(SANDHYA_NUDGE_BY_TRADITION.sikh.title);
    expect(sikh?.body).toBe(SANDHYA_NUDGE_BY_TRADITION.sikh.body);

    const buddhist = produceSattvicCandidate({ ...baseDevotee, tradition: 'buddhist' }, '2026-09-23');
    expect(buddhist?.title).toBe(SANDHYA_NUDGE_BY_TRADITION.buddhist.title);

    const jain = produceSattvicCandidate({ ...baseDevotee, tradition: 'jain' }, '2026-09-23');
    expect(jain?.title).toBe(SANDHYA_NUDGE_BY_TRADITION.jain.title);
  });

  it('allows custom title and body overrides', () => {
    const candidate = produceSattvicCandidate(baseDevotee, '2026-09-23', {
      title: 'Custom Evening Practice',
      body: 'Take time for peace.',
    });
    expect(candidate?.title).toBe('Custom Evening Practice');
    expect(candidate?.body).toBe('Take time for peace.');
  });
});

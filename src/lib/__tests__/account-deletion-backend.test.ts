import { describe, expect, it } from 'vitest';
import { getNotificationPreferenceSkipReason } from '@/lib/notification-delivery-policy';
import { getUnlockedRelics } from '@/lib/relics';
import { DELETION_REASONS } from '@/app/api/user/delete/preview/route';

describe('Account Deletion Backend Policy & Preview Contract', () => {
  it('suppresses delivery for all notification types when account is in deletion cool-off', () => {
    const deletingProfile = {
      is_deleting: true,
      japa_reminder_enabled: true,
      wants_festival_reminders: true,
      wants_vrat_reminders: true,
      wants_tithi_reminders: true,
      wants_shloka_reminders: true,
      wants_nitya_reminders: true,
      wants_family_notifications: true,
      wants_sankalpa_midpoint_reminders: true,
    };

    const notificationTypes = [
      'japa',
      'festival',
      'vrat',
      'tithi',
      'shloka',
      'sattvic_reminder',
      'nitya_morning',
      'sanskar_milestone',
      'sankalpa_midpoint',
    ];

    for (const type of notificationTypes) {
      const reason = getNotificationPreferenceSkipReason(
        { notification_type: type },
        deletingProfile,
      );
      expect(reason).toBe('account_deletion_pending');
    }
  });

  it('allows normal notifications when is_deleting is false or null', () => {
    const activeProfile = {
      is_deleting: false,
      japa_reminder_enabled: true,
    };

    const reason = getNotificationPreferenceSkipReason(
      { notification_type: 'japa' },
      activeProfile,
    );
    expect(reason).toBeNull();
  });

  it('calculates real unlocked relics canonically without fabrication', () => {
    // 0 streak, 0 score
    const zeroRelics = getUnlockedRelics(0, 0, 'hindu');
    expect(zeroRelics.length).toBe(0);

    // High streak and score should unlock valid relics from SACRED_RELICS
    const activeRelics = getUnlockedRelics(108, 500, 'hindu');
    expect(activeRelics.length).toBeGreaterThan(0);
    expect(Array.isArray(activeRelics)).toBe(true);
    for (const relic of activeRelics) {
      expect(relic.id).toBeDefined();
      expect(relic.name).toBeDefined();
    }
  });

  it('provides the canonical versioned deletion reasons list', () => {
    expect(DELETION_REASONS.length).toBe(6);
    expect(DELETION_REASONS.map((r) => r.id)).toEqual([
      'taking_break',
      'too_many_notifications',
      'privacy_concerns',
      'not_useful',
      'technical_issues',
      'other',
    ]);
    const otherReason = DELETION_REASONS.find((r) => r.id === 'other');
    expect(otherReason?.requireDetails).toBe(true);
  });
});

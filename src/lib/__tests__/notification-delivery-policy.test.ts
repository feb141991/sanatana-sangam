import { describe, expect, it } from "vitest";
import {
  getNotificationPreferenceSkipReason,
  getScheduledNotificationActionPath,
  getScheduledNotificationPushData,
} from "../notification-delivery-policy";

describe("notification delivery policy", () => {
  const sanskarRow = {
    notification_type: "sanskar_milestone",
    notification_key: "sanskar_milestone:abc",
    metadata: { sanskara_id: "namakarana", kul_member_id: "member-1" },
  };

  it("fails closed when family notifications are disabled or unavailable", () => {
    expect(getNotificationPreferenceSkipReason(sanskarRow, { wants_family_notifications: false }))
      .toBe("family_notifications_disabled");
    expect(getNotificationPreferenceSkipReason(sanskarRow, { wants_family_notifications: null }))
      .toBe("family_notifications_disabled");
  });

  it("allows Sanskar delivery only after explicit family preference", () => {
    expect(getNotificationPreferenceSkipReason(sanskarRow, { wants_family_notifications: true }))
      .toBeNull();
  });

  it("fails closed for Sankalpa midpoint reminders until the user explicitly opts in", () => {
    const row = { notification_type: "sankalpa_midpoint", notification_key: "candidate:sankalpa-1:midpoint" };
    expect(getNotificationPreferenceSkipReason(row, {})).toBe("sankalpa_midpoint_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_sankalpa_midpoint_reminders: false }))
      .toBe("sankalpa_midpoint_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_sankalpa_midpoint_reminders: true })).toBeNull();
  });

  it("routes Sanskar notifications to the Sanskara screen", () => {
    expect(getScheduledNotificationActionPath(sanskarRow)).toBe("/kul/sanskara");
  });

  it("preserves a valid producer-owned action path", () => {
    expect(getScheduledNotificationActionPath({
      ...sanskarRow,
      metadata: { ...sanskarRow.metadata, action_url: "/kul/sanskara/namakarana" },
    })).toBe("/kul/sanskara/namakarana");
  });

  it("forwards Sanskar identity through push data", () => {
    expect(getScheduledNotificationPushData(sanskarRow)).toEqual({
      type: "sanskar_milestone",
      notification_key: "sanskar_milestone:abc",
      sanskara_id: "namakarana",
      kul_member_id: "member-1",
    });
  });

  it("skips festival/vrat/tithi when user preferences are explicitly false", () => {
    const festivalRow = {
      notification_type: "festival",
      notification_key: "observance-v1:diwali:d7:2026-11-08:general",
    };
    expect(getNotificationPreferenceSkipReason(festivalRow, { wants_festival_reminders: false }))
      .toBe("festival_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(festivalRow, { wants_festival_reminders: true }))
      .toBeNull();

    const vratRow = {
      notification_type: "vrat",
      notification_key: "observance-v1:ekadashi:d1:2026-11-02:general",
    };
    expect(getNotificationPreferenceSkipReason(vratRow, { wants_vrat_reminders: false }))
      .toBe("vrat_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(vratRow, { wants_vrat_reminders: true }))
      .toBeNull();

    const tithiRow = {
      notification_type: "tithi",
      notification_key: "tithi:ekadashi:today",
    };
    expect(getNotificationPreferenceSkipReason(tithiRow, { wants_tithi_reminders: false }))
      .toBe("tithi_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(tithiRow, { wants_tithi_reminders: true }))
      .toBeNull();
  });

  it("extracts push data for observance notifications", () => {
    const festivalRow = {
      notification_type: "festival",
      notification_key: "observance-v1:diwali:d7:2026-11-08:general",
      metadata: {
        occurrence_id: "occ-123",
        slug: "diwali",
        category: "festival",
        days_away: 7,
      },
    };
    expect(getScheduledNotificationPushData(festivalRow)).toEqual({
      type: "festival",
      notification_key: "observance-v1:diwali:d7:2026-11-08:general",
      festival_id: "occ-123",
      slug: "diwali",
      category: "festival",
      days_away: "7",
    });

    const vratRow = {
      notification_type: "vrat",
      notification_key: "observance-v1:ekadashi:d1:2026-11-02:general",
      metadata: {
        occurrence_id: "occ-456",
        slug: "ekadashi",
        category: "vrat",
        days_away: 1,
      },
    };
    expect(getScheduledNotificationPushData(vratRow)).toEqual({
      type: "vrat",
      notification_key: "observance-v1:ekadashi:d1:2026-11-02:general",
      festival_id: "occ-456",
      vrat_id: "occ-456",
      slug: "ekadashi",
      category: "vrat",
      days_away: "1",
    });
  });
});

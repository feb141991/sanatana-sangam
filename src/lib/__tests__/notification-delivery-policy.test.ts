import { describe, expect, it } from "vitest";
import {
  DEFAULT_QUIET_HOURS,
  getNotificationPreferenceSkipReason,
  getQuietHoursSkipReason,
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

  it("fails closed on family remembrance unless its dedicated opt-in is true", () => {
    const row = { notification_type: "family_remembrance", notification_key: "family-remembrance:annual" };
    expect(getNotificationPreferenceSkipReason(row, {})).toBe("family_remembrance_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_family_remembrance_reminders: false }))
      .toBe("family_remembrance_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_family_remembrance_reminders: true }))
      .toBeNull();
    // The legacy family activity toggle is independent; this feature has its
    // own explicit, default-off consent gate.
    expect(getNotificationPreferenceSkipReason(row, {
      wants_family_notifications: false,
      wants_family_remembrance_reminders: true,
    })).toBeNull();
  });

  it("routes family remembrance into the KUL family dates and keeps push data generic", () => {
    const row = {
      notification_type: "family_remembrance",
      notification_key: "family-remembrance:annual",
    };
    expect(getScheduledNotificationActionPath(row)).toBe("/kul?section=family");
    expect(getScheduledNotificationPushData(row)).toEqual({
      type: "family_remembrance",
      notification_key: "family-remembrance:annual",
    });
  });

  it("fails closed for Japa if the reminder was turned off after scheduling", () => {
    const row = { notification_type: "japa", notification_key: "japa:2026-09-29" };
    expect(getNotificationPreferenceSkipReason(row, {})).toBe("japa_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { japa_reminder_enabled: false }))
      .toBe("japa_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { japa_reminder_enabled: true })).toBeNull();
  });

  it("fails closed for Daily Quiz until the user opts in and routes the reminder to Quiz", () => {
    const row = { notification_type: "quiz", notification_key: "candidate:quiz:2026-10-05" };
    expect(getNotificationPreferenceSkipReason(row, {})).toBe("quiz_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { quiz_reminder_enabled: false }))
      .toBe("quiz_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { quiz_reminder_enabled: true })).toBeNull();
    expect(getScheduledNotificationActionPath(row)).toBe("/quiz");
  });

  it("suppresses queued Sattvic and Nitya reminders if the opt-in was turned off after scheduling", () => {
    for (const notification_type of ["sattvic", "sattvic_reminder", "nitya", "nitya_madhyahn", "nitya_sandhya"]) {
      const row = { notification_type, notification_key: `${notification_type}:2026-10-02` };
      expect(getNotificationPreferenceSkipReason(row, { wants_nitya_reminders: false }), notification_type)
        .toBe("nitya_reminders_disabled");
      expect(getNotificationPreferenceSkipReason(row, { wants_nitya_reminders: true }), notification_type).toBeNull();
      // Producers require the flag to be true, so an absent value is not a delivery-time veto.
      expect(getNotificationPreferenceSkipReason(row, {}), notification_type).toBeNull();
    }
  });

  it("does not apply the Nitya opt-in to unrelated types", () => {
    for (const notification_type of ["mood_checkin", "brahma_muhurta", "festival"]) {
      const row = { notification_type, notification_key: `${notification_type}:x` };
      expect(getNotificationPreferenceSkipReason(row, { wants_nitya_reminders: false }), notification_type)
        .not.toBe("nitya_reminders_disabled");
    }
  });

  it("suppresses a queued Shloka reminder if the user turned it off after scheduling", () => {
    const row = { notification_type: "shloka", notification_key: "candidate:shloka:2026-09-29" };
    expect(getNotificationPreferenceSkipReason(row, { wants_shloka_reminders: false }))
      .toBe("shloka_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_shloka_reminders: true })).toBeNull();
    // Preserve the producer's existing compatibility behavior for legacy rows
    // whose preference is null or absent: only explicit opt-out suppresses.
    expect(getNotificationPreferenceSkipReason(row, {})).toBeNull();
  });

  it("routes Shloka reminders to the Shloka focus even when action metadata is absent", () => {
    expect(getScheduledNotificationActionPath({ notification_type: "shloka" }))
      .toBe("/home?focus=shloka");
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

  it("suppresses all notification delivery when account deletion is pending", () => {
    const rows = [
      { notification_type: "japa" },
      { notification_type: "festival" },
      { notification_type: "vrat" },
      { notification_type: "tithi" },
      { notification_type: "shloka" },
      { notification_type: "sattvic_reminder" },
      { notification_type: "nitya_morning" },
      { notification_type: "sanskar_milestone" },
      { notification_type: "sankalpa_midpoint" },
    ];

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

    for (const row of rows) {
      expect(getNotificationPreferenceSkipReason(row, deletingProfile))
        .toBe("account_deletion_pending");
    }
  });

  it("fails closed on Brahma Muhurta unless its explicit opt-in is true", () => {
    const row = { notification_type: "brahma_muhurta", notification_key: "brahma_muhurta:u:2026-10-11" };
    expect(getNotificationPreferenceSkipReason(row, {})).toBe("brahma_muhurta_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_brahma_muhurta_reminders: null }))
      .toBe("brahma_muhurta_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_brahma_muhurta_reminders: false }))
      .toBe("brahma_muhurta_reminders_disabled");
    expect(getNotificationPreferenceSkipReason(row, { wants_brahma_muhurta_reminders: true })).toBeNull();
  });
});

describe("quiet hours at delivery", () => {
  const london = { timezone: "Europe/London" };
  // Europe/London is BST (UTC+1) on these dates.
  const at = (londonClock: string) => new Date(`2026-10-11T${londonClock}:00+01:00`);
  const row = (notification_type: string) => ({ notification_type, notification_key: `${notification_type}:k` });

  it("uses 22:00-06:00 as the default night window", () => {
    expect(DEFAULT_QUIET_HOURS).toEqual({ startHour: 22, endHour: 6 });
  });

  it("blocks app-timed reminders at night when the user set no quiet hours", () => {
    for (const type of ["mood", "sattvic_reminder", "daily_digest", "dharm_veer", "shloka", "nitya_morning", "weekly_summary", "general"]) {
      expect(getQuietHoursSkipReason(row(type), london, at("23:30"))).toBe("default_quiet_hours");
      expect(getQuietHoursSkipReason(row(type), london, at("05:59"))).toBe("default_quiet_hours");
    }
  });

  it("leaves daytime alone, including the window edges", () => {
    expect(getQuietHoursSkipReason(row("mood"), london, at("06:00"))).toBeNull();
    expect(getQuietHoursSkipReason(row("mood"), london, at("21:59"))).toBeNull();
    expect(getQuietHoursSkipReason(row("mood"), london, at("22:00"))).toBe("default_quiet_hours");
  });

  it("honours times the user picked and the Brahma Muhurta opt-in", () => {
    for (const type of ["japa", "quiz", "family_remembrance", "festival", "vrat", "tithi", "brahma_muhurta"]) {
      expect(getQuietHoursSkipReason(row(type), london, at("01:00"))).toBeNull();
    }
  });

  it("applies a user-set window to every type, picked times included", () => {
    const profile = { ...london, notification_quiet_hours_start: 23, notification_quiet_hours_end: 7 };
    expect(getQuietHoursSkipReason(row("japa"), profile, at("01:00"))).toBe("quiet_hours_active");
    expect(getQuietHoursSkipReason(row("brahma_muhurta"), profile, at("05:00"))).toBe("quiet_hours_active");
    // The user's own window replaces the default: 22:30 is outside 23-07.
    expect(getQuietHoursSkipReason(row("mood"), profile, at("22:30"))).toBeNull();
  });

  it("evaluates the window in the user's own timezone", () => {
    // 01:00 in London is 05:30 in Kolkata (inside) and 20:00 in New York (outside).
    expect(getQuietHoursSkipReason(row("mood"), { timezone: "Asia/Kolkata" }, at("01:00"))).toBe("default_quiet_hours");
    expect(getQuietHoursSkipReason(row("mood"), { timezone: "America/New_York" }, at("01:00"))).toBeNull();
  });

  it("treats a half-set or invalid user window as unset", () => {
    expect(getQuietHoursSkipReason(row("mood"), { ...london, notification_quiet_hours_start: 23, notification_quiet_hours_end: null }, at("23:30")))
      .toBe("default_quiet_hours");
    expect(getQuietHoursSkipReason(row("mood"), { ...london, notification_quiet_hours_start: 99, notification_quiet_hours_end: 7 }, at("23:30")))
      .toBe("default_quiet_hours");
  });
});

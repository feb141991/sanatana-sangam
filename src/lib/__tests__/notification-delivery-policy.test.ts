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
});

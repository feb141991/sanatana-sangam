import type { ConsentDecision, MarketingChannel, RecipientProfile } from "./types";

/**
 * Validates E.164 phone numbers (e.g. +919876543210, +14155552671).
 * Must start with + and country code, followed by 6 to 14 digits.
 */
export function isValidE164(phone: string | null | undefined): boolean {
  if (!phone || typeof phone !== "string") return false;
  const trimmed = phone.trim();
  return /^\+[1-9]\d{6,14}$/.test(trimmed);
}

/**
 * Evaluates live recipient consent and deliverability at the exact moment of dispatch.
 * Default policy: FAIL CLOSED.
 */
export function evaluateMarketingConsent(
  profile: RecipientProfile | null | undefined,
  channel: MarketingChannel,
  campaignType: "newsletter" | "festival_reminder" | "announcement" = "newsletter"
): ConsentDecision {
  if (!profile || !profile.id) {
    return { eligible: false, reasonCode: "account_deleted" };
  }

  if (profile.is_banned === true) {
    return { eligible: false, reasonCode: "account_banned" };
  }

  if (channel === "email") {
    const rawEmail = profile.email?.trim();
    if (!rawEmail) {
      return { eligible: false, reasonCode: "missing_email" };
    }

    if (rawEmail.endsWith("@whatsapp.shoonaya.app") || rawEmail.includes("placeholder")) {
      return { eligible: false, reasonCode: "placeholder_email" };
    }

    if (campaignType === "festival_reminder") {
      // Festival reminder email follows established email_festivals contract
      if (profile.email_festivals !== true) {
        return { eligible: false, reasonCode: "email_festivals_disabled" };
      }
      return { eligible: true, reasonCode: "eligible" };
    }

    // Standard newsletter / announcement marketing emails require active marketing consent AND newsletter toggle
    if (profile.marketing_consent !== true) {
      return { eligible: false, reasonCode: "missing_marketing_consent" };
    }

    if (profile.email_newsletter !== true) {
      return { eligible: false, reasonCode: "email_newsletter_disabled" };
    }

    return { eligible: true, reasonCode: "eligible" };
  }

  if (channel === "whatsapp") {
    if (profile.marketing_consent !== true) {
      return { eligible: false, reasonCode: "missing_marketing_consent" };
    }

    if (profile.whatsapp_opt_in !== true) {
      return { eligible: false, reasonCode: "whatsapp_opt_in_disabled" };
    }

    if (!isValidE164(profile.whatsapp_number)) {
      return { eligible: false, reasonCode: "invalid_whatsapp_number" };
    }

    return { eligible: true, reasonCode: "eligible" };
  }

  return { eligible: false, reasonCode: "unsupported_channel" };
}

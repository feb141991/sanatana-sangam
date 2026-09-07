import { describe, it, expect } from "vitest";
import { evaluateMarketingConsent, isValidE164 } from "./consent";
import type { RecipientProfile } from "./types";

describe("Marketing Consent Policy", () => {
  describe("isValidE164", () => {
    it("accepts valid international E.164 phone numbers", () => {
      expect(isValidE164("+919876543210")).toBe(true);
      expect(isValidE164("+14155552671")).toBe(true);
      expect(isValidE164("+447911123456")).toBe(true);
    });

    it("rejects local or malformed phone numbers without +", () => {
      expect(isValidE164("9876543210")).toBe(false);
      expect(isValidE164("14155552671")).toBe(false);
      expect(isValidE164("+01234567")).toBe(false);
      expect(isValidE164(null)).toBe(false);
      expect(isValidE164("")).toBe(false);
    });
  });

  describe("Newsletter Email Consent", () => {
    it("allows email when marketing_consent and email_newsletter are both true", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "seeker@shoonaya.com",
        marketing_consent: true,
        email_newsletter: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "newsletter");
      expect(decision).toEqual({ eligible: true, reasonCode: "eligible" });
    });

    it("suppresses email when marketing_consent is false or missing", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "seeker@shoonaya.com",
        marketing_consent: false,
        email_newsletter: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "missing_marketing_consent" });
    });

    it("suppresses email when email_newsletter is false", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "seeker@shoonaya.com",
        marketing_consent: true,
        email_newsletter: false,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "email_newsletter_disabled" });
    });

    it("suppresses placeholder or whatsapp-synthetic emails", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "user_12345@whatsapp.shoonaya.app",
        marketing_consent: true,
        email_newsletter: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "placeholder_email" });
    });

    it("suppresses banned accounts even with valid consent", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "banned@shoonaya.com",
        marketing_consent: true,
        email_newsletter: true,
        is_banned: true,
      };
      const decision = evaluateMarketingConsent(profile, "email", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "account_banned" });
    });
  });

  describe("Festival Reminder Email Consent", () => {
    it("allows festival reminder when email_festivals is true", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "seeker@shoonaya.com",
        email_festivals: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "festival_reminder");
      expect(decision).toEqual({ eligible: true, reasonCode: "eligible" });
    });

    it("suppresses festival reminder when email_festivals is false", () => {
      const profile: RecipientProfile = {
        id: "u1",
        email: "seeker@shoonaya.com",
        email_festivals: false,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "email", "festival_reminder");
      expect(decision).toEqual({ eligible: false, reasonCode: "email_festivals_disabled" });
    });
  });

  describe("WhatsApp Marketing Consent", () => {
    it("allows WhatsApp when marketing_consent and whatsapp_opt_in are true with valid E.164 number", () => {
      const profile: RecipientProfile = {
        id: "u1",
        whatsapp_number: "+919876543210",
        marketing_consent: true,
        whatsapp_opt_in: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "whatsapp", "newsletter");
      expect(decision).toEqual({ eligible: true, reasonCode: "eligible" });
    });

    it("suppresses WhatsApp when marketing_consent is missing", () => {
      const profile: RecipientProfile = {
        id: "u1",
        whatsapp_number: "+919876543210",
        marketing_consent: false,
        whatsapp_opt_in: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "whatsapp", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "missing_marketing_consent" });
    });

    it("suppresses WhatsApp when whatsapp_opt_in is false", () => {
      const profile: RecipientProfile = {
        id: "u1",
        whatsapp_number: "+919876543210",
        marketing_consent: true,
        whatsapp_opt_in: false,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "whatsapp", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "whatsapp_opt_in_disabled" });
    });

    it("suppresses WhatsApp when number is invalid or missing", () => {
      const profile: RecipientProfile = {
        id: "u1",
        whatsapp_number: "9876543210", // Missing +
        marketing_consent: true,
        whatsapp_opt_in: true,
        is_banned: false,
      };
      const decision = evaluateMarketingConsent(profile, "whatsapp", "newsletter");
      expect(decision).toEqual({ eligible: false, reasonCode: "invalid_whatsapp_number" });
    });
  });
});

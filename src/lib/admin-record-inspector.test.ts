import { describe, it, expect } from "vitest";
import {
  sanitizeAdminMetadata,
  type CalendarFindingRecord,
  type ContentReportRecord,
  type ClientErrorRecord,
  type DharmVeerRecord,
} from "./admin-inspector-types";

describe("Admin Record Inspector (Prompt 3)", () => {
  describe("sanitizeAdminMetadata", () => {
    it("redacts sensitive auth tokens, passwords, and secret keys", () => {
      const raw = {
        user_prompt: "Tell me about Maha Shivaratri",
        ai_text: "Maha Shivaratri is celebrated on Chaturdashi...",
        bearer_token: "secret-token-12345",
        password_hash: "hashed_pass_xyz",
        api_key: "sk-proj-999",
        session_id: "sess_abc",
      };

      const sanitized = sanitizeAdminMetadata(raw);
      expect(sanitized).not.toBeNull();
      expect(sanitized?.user_prompt).toBe("Tell me about Maha Shivaratri");
      expect(sanitized?.ai_text).toBe("Maha Shivaratri is celebrated on Chaturdashi...");
      expect(sanitized?.bearer_token).toBe("[REDACTED]");
      expect(sanitized?.password_hash).toBe("[REDACTED]");
      expect(sanitized?.api_key).toBe("[REDACTED]");
      expect(sanitized?.session_id).toBe("[REDACTED]");
    });

    it("handles nested sensitive structures safely", () => {
      const nested = {
        context: {
          route: "/api/ai/chat",
          authHeader: "Bearer xyz",
          details: {
            admin_secret: "12345",
            safe_metric: 42,
          },
        },
      };

      const sanitized: any = sanitizeAdminMetadata(nested);
      expect(sanitized?.context?.authHeader).toBe("[REDACTED]");
      expect(sanitized?.context?.details?.admin_secret).toBe("[REDACTED]");
      expect(sanitized?.context?.details?.safe_metric).toBe(42);
    });

    it("returns null for non-object or null input", () => {
      expect(sanitizeAdminMetadata(null)).toBeNull();
      expect(sanitizeAdminMetadata(undefined)).toBeNull();
    });
  });

  describe("Record Contract Integrity", () => {
    it("validates Calendar Finding record structure", () => {
      const finding: CalendarFindingRecord = {
        type: "calendar_finding",
        id: "f-123",
        slug: "maha-shivaratri",
        year: 2026,
        severity: "critical",
        status: "open",
        title: "Discrepancy in Maha Shivaratri date calculation",
        summary: "Calculated date deviates from swiss ephemeris golden standard",
        discrepancy: {
          expectedDate: "2026-02-15",
          calculatedDate: "2026-02-16",
          ruleReasoning: "Nishita kala occurs on previous night",
        },
      };

      expect(finding.type).toBe("calendar_finding");
      expect(finding.severity).toBe("critical");
      expect(finding.discrepancy?.expectedDate).toBe("2026-02-15");
    });

    it("validates Content Report record structure", () => {
      const report: ContentReportRecord = {
        type: "content_report",
        id: "rep-456",
        contentType: "ai_chat_response",
        contentId: "chat-msg-789",
        reason: "hallucination",
        status: "pending",
        reportedBy: "user-1",
        createdAt: "2026-09-05T12:00:00Z",
        metadata: {
          user_prompt: "Who is Chhatrapati Shivaji?",
          ai_text: "He was a great Maratha king...",
        },
      };

      expect(report.type).toBe("content_report");
      expect(report.status).toBe("pending");
      expect(report.metadata?.user_prompt).toBeDefined();
    });

    it("validates Client Error record structure", () => {
      const errorItem: ClientErrorRecord = {
        type: "client_error",
        fingerprint: "fp-abc-999",
        errorName: "TypeError",
        errorMessage: "Cannot read properties of undefined (reading tithi)",
        route: "/panchang",
        source: "pwa",
        firstSeen: "2026-09-05T10:00:00Z",
        lastSeen: "2026-09-05T12:00:00Z",
        count1h: 3,
        count24h: 15,
        totalCount: 42,
        distinctSessionsCount: 12,
        browserFamily: "Mobile Safari",
        osFamily: "iOS 18.2",
        sampleStack: "TypeError: Cannot read properties of undefined\n at PanchangCard...",
      };

      expect(errorItem.type).toBe("client_error");
      expect(errorItem.count1h).toBe(3);
      expect(errorItem.browserFamily).toBe("Mobile Safari");
    });

    it("validates Dharm Veer record structure", () => {
      const hero: DharmVeerRecord = {
        type: "dharm_veer",
        slug: "chhatrapati-shivaji",
        name: "Chhatrapati Shivaji Maharaj",
        tradition: "hindu",
        era: "1630–1680 CE",
        tagline: "Founder of the Maratha Empire and protector of Dharma",
        journey: "Born in Shivneri fort...",
        trial: "Fought against Mughal tyranny...",
        teaching: "Swarajya is my birthright...",
        moral: "Righteous governance...",
        createdAt: "2026-09-05T08:00:00Z",
        sourceCitations: [
          {
            sourceName: "Archive.org Historical Records",
            sourceUrl: "https://archive.org/details/shivaji",
            rightsStatus: "public_domain",
            excerpt: "Shivaji was known for his military prowess...",
          },
        ],
      };

      expect(hero.type).toBe("dharm_veer");
      expect(hero.sourceCitations?.length).toBe(1);
      expect(hero.sourceCitations?.[0].rightsStatus).toBe("public_domain");
    });
  });
});

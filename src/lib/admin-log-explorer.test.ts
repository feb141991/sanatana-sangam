import { describe, it, expect } from "vitest";
import {
  parseLogFiltersFromSearchParams,
  serializeLogFiltersToSearchParams,
  redactSensitiveLogData,
  extractCorrelationLinks,
} from "./admin-log-explorer-helpers";
import type { LogExplorerFilters, LogEventCorrelation } from "./admin-log-explorer-types";

describe("Admin Log Explorer Contract & Utilities", () => {
  describe("Filter Parsing & URL Persistence", () => {
    it("parses default filters cleanly when no search params provided", () => {
      const params = new URLSearchParams();
      const parsed = parseLogFiltersFromSearchParams(params);

      expect(parsed.source).toBe("all");
      expect(parsed.severity).toBe("all");
      expect(parsed.limit).toBe(25);
      expect(parsed.route).toBeUndefined();
      expect(parsed.requestId).toBeUndefined();
      expect(parsed.fingerprint).toBeUndefined();
    });

    it("parses valid filters and bounds limit to 50", () => {
      const params = new URLSearchParams({
        source: "client_errors",
        severity: "critical",
        route: "/home",
        requestId: "req_12345",
        fingerprint: "fp_abcde",
        cronJob: "brahma-muhurta",
        deploymentSha: "ffe66fe",
        userId: "usr_999",
        startDate: "2026-09-01T00:00:00Z",
        endDate: "2026-09-05T00:00:00Z",
        limit: "100", // exceeds maximum allowed limit
      });

      const parsed = parseLogFiltersFromSearchParams(params);
      expect(parsed.source).toBe("client_errors");
      expect(parsed.severity).toBe("critical");
      expect(parsed.route).toBe("/home");
      expect(parsed.requestId).toBe("req_12345");
      expect(parsed.fingerprint).toBe("fp_abcde");
      expect(parsed.cronJob).toBe("brahma-muhurta");
      expect(parsed.deploymentSha).toBe("ffe66fe");
      expect(parsed.userId).toBe("usr_999");
      expect(parsed.limit).toBe(50); // Capped at 50 for bounded query bounds
    });

    it("serializes filters to URL search params round-trip", () => {
      const original: LogExplorerFilters = {
        source: "crons",
        severity: "warning",
        route: "/api/cron/nitya-reminder",
        cronJob: "nitya-reminder",
        deploymentSha: "204b759",
        limit: 30,
      };

      const serialized = serializeLogFiltersToSearchParams(original);
      const parsed = parseLogFiltersFromSearchParams(serialized);

      expect(parsed.source).toBe(original.source);
      expect(parsed.severity).toBe(original.severity);
      expect(parsed.route).toBe(original.route);
      expect(parsed.cronJob).toBe(original.cronJob);
      expect(parsed.deploymentSha).toBe(original.deploymentSha);
      expect(parsed.limit).toBe(30);
    });
  });

  describe("PII and Sensitive Data Redaction", () => {
    it("redacts sensitive keys in object payloads", () => {
      const rawPayload = {
        user_id: "usr_123",
        auth_token: "secret-token-xyz",
        bearer: "Bearer secret-123",
        password: "mySuperSecretPassword",
        nested: {
          api_key: "api-live-key",
          public_info: "safe-text",
        },
      };

      const sanitized = redactSensitiveLogData(rawPayload) as any;
      expect(sanitized.user_id).toBe("usr_123");
      expect(sanitized.auth_token).toBe("[REDACTED]");
      expect(sanitized.password).toBe("[REDACTED]");
      expect(sanitized.nested.api_key).toBe("[REDACTED]");
      expect(sanitized.nested.public_info).toBe("safe-text");
    });

    it("redacts email addresses and phone numbers in error messages and strings", () => {
      const rawString = "User test.devotee@example.com reported failure at +1-555-123-4567";
      const sanitized = redactSensitiveLogData(rawString);
      expect(sanitized).toBe("User [REDACTED_EMAIL] reported failure at [REDACTED_PHONE]");
    });

    it("redacts raw Bearer token headers", () => {
      const bearerHeader = "Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9";
      const sanitized = redactSensitiveLogData(bearerHeader);
      expect(sanitized).toBe("Bearer [REDACTED_TOKEN]");
    });
  });

  describe("Correlation Link Extraction", () => {
    it("extracts correlation links only when real exact identifiers exist", () => {
      const correlation: LogEventCorrelation = {
        requestId: "req_xyz987",
        traceId: "trace_456",
        fingerprint: "fp_fe32a",
        cronJob: "brahma-muhurta",
        deploymentSha: "204b759abcd",
        userId: "usr_555",
        notificationKey: "d0_brahma_muhurta",
        incidentId: "inc_001",
        festivalId: "diwali",
      };

      const links = extractCorrelationLinks(correlation);
      expect(links.length).toBe(9);

      const reqLink = links.find((l) => l.key === "req_id");
      expect(reqLink?.value).toBe("req_xyz987");
      expect(reqLink?.href).toBe("/admin/logs?requestId=req_xyz987");

      const fpLink = links.find((l) => l.key === "fingerprint");
      expect(fpLink?.value).toBe("fp_fe32a");
      expect(fpLink?.href).toContain("/admin/monitoring");

      const userLink = links.find((l) => l.key === "user_id");
      expect(userLink?.value).toBe("usr_555");
      expect(userLink?.href).toBe("/admin/users/usr_555");
    });

    it("ignores empty strings, whitespace, or undefined correlation fields", () => {
      const emptyCorrelation: LogEventCorrelation = {
        requestId: "",
        fingerprint: "   ",
        cronJob: undefined,
        userId: null,
      };

      const links = extractCorrelationLinks(emptyCorrelation);
      expect(links).toEqual([]);
    });
  });
});

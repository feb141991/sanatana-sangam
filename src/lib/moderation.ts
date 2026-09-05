export type ReportType = "post" | "comment" | "profile" | "user_profile";

const REASON_MAP: Record<string, string> = {
  "Inappropriate Content": "other",
  "Hate Speech / Harassment": "harassment",
  "Spam / Misleading": "spam",
  "Privacy Violation": "privacy",
  "Other": "other",
};

const VALID_REASONS = new Set([
  "harassment",
  "hate",
  "sexual_content",
  "violence",
  "spam",
  "impersonation",
  "privacy",
  "other",
]);

function normalizeReason(raw: string): string {
  if (REASON_MAP[raw]) return REASON_MAP[raw];
  const lower = raw.toLowerCase().trim().replace(/\s+/g, "_");
  return VALID_REASONS.has(lower) ? lower : "other";
}

function normalizeTargetType(raw: ReportType | string): "post" | "comment" | "user_profile" {
  if (raw === "profile" || raw === "user_profile") return "user_profile";
  if (raw === "post") return "post";
  if (raw === "comment") return "comment";
  throw new Error(`Unsupported report target type: ${raw}`);
}

/**
 * submitReport — client-safe helper called from user-facing components (e.g. ReportDialog).
 * Sends an authenticated POST request to /api/mandali/report.
 * User identity is strictly derived on the server side (Rule #4).
 * Supports both standard (targetId, targetType, reason, details) and legacy (reporterId, targetId, ...) calls.
 */
export async function submitReport(
  arg1: string,
  arg2: string | ReportType,
  arg3: string | ReportType,
  arg4?: string,
  arg5?: string
) {
  let targetId: string;
  let targetType: string;
  let reason: string;
  let details: string | undefined;

  // Detect whether 1st argument was legacy reporterId or modern targetId
  if (
    arg5 !== undefined ||
    (typeof arg2 === "string" && ["post", "comment", "profile", "user_profile"].includes(arg3 as string))
  ) {
    targetId = String(arg2);
    targetType = String(arg3);
    reason = String(arg4 || "other");
    details = arg5;
  } else {
    targetId = String(arg1);
    targetType = String(arg2);
    reason = String(arg3 || "other");
    details = arg4;
  }

  const normalizedType = normalizeTargetType(targetType);
  const normalizedReasonCode = normalizeReason(reason);

  const res = await fetch("/api/mandali/report", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      targetId,
      targetType: normalizedType,
      reason: normalizedReasonCode,
      details,
    }),
  });

  if (!res.ok) {
    const errorData = await res.json().catch(() => ({ error: "Failed to submit report" }));
    throw new Error(errorData.error || "Failed to submit report");
  }

  return res.json();
}

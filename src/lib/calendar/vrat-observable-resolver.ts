import { NextRequest } from "next/server";
import { resolveRequestProfile, shiftDate, PROFILE_RESOLUTION_PAD_DAYS } from "@/lib/calendar/request-profile";
import { localSpiritualDate } from "@/lib/sacred-time";
import {
  formatOccurrencesToResults,
  type ClientObservanceResult,
} from "@/lib/calendar/observance-formatter";
import { attachMaterialisationBatches, CALENDAR_OCCURRENCE_SELECT } from "@/lib/calendar/occurrence-reader";
import { UUID_REGEX } from "@/lib/vrat-observation";
import { isOccurrenceObservableInItsSeries } from "@/lib/calendar/observance-series-eligibility";

export interface ObservableVratResultSuccess {
  success: true;
  user: {
    id: string | null;
    timezone: string;
    calendarProfile: string;
    tradition: string;
    sampradaya: string | null;
  };
  occurrence: {
    id: string;
    date: string;
    vratId: string;
    vratName: string;
    calendarProfile: string;
    tradition: string;
    sampradayaIdentity: string | null;
    variantKey: string | null;
  };
  result: ClientObservanceResult;
}

export interface ObservableVratResultFailure {
  success: false;
  statusCode: number;
  errorCode: string;
  userMessage: string;
}

export type ObservableVratResult = ObservableVratResultSuccess | ObservableVratResultFailure;

/**
 * Resolves whether an occurrence is currently observable by the authenticated user today.
 * Reuses the canonical calendar pipeline (request profile, withholding, batches, tradition/variant resolution).
 */
export async function resolveObservableVratOccurrence(
  request: NextRequest,
  occurrenceId: string,
  options: { requireToday?: boolean; requestedTimezone?: string } = {},
): Promise<ObservableVratResult> {
  if (!occurrenceId || !UUID_REGEX.test(occurrenceId)) {
    return {
      success: false,
      statusCode: 400,
      errorCode: "INVALID_OCCURRENCE_ID",
      userMessage: "Invalid occurrence ID format",
    };
  }

  const resolved = await resolveRequestProfile(request, { tradition: "all", calendarProfile: "" });
  if (resolved.invalidCredentials) {
    return {
      success: false,
      statusCode: 401,
      errorCode: "UNAUTHORIZED",
      userMessage: "Authentication required",
    };
  }

  if (resolved.profileError) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "PROFILE_READ_FAILURE",
      userMessage: "Failed to read profile context",
    };
  }

  if (options.requireToday !== false && !resolved.isAuthenticated) {
    return {
      success: false,
      statusCode: 401,
      errorCode: "UNAUTHENTICATED",
      userMessage: "Authentication required",
    };
  }

  const tz = resolved.isAuthenticated
    ? resolved.timezone
    : options.requestedTimezone ?? "Asia/Kolkata";
  if (!tz) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "TIMEZONE_REQUIRED",
      userMessage: "User profile timezone not set",
    };
  }

  const todayStr = localSpiritualDate(tz, 4);
  const calendarProfile = resolved.calendarProfile;
  const tradition = resolved.tradition;
  const sampradaya = resolved.sampradaya;
  const supabase = resolved.supabase;

  let anchorDate = todayStr;
  if (options.requireToday === false) {
    const { data: target, error: targetError } = await supabase
      .from("observance_occurrences")
      .select("date")
      .eq("id", occurrenceId)
      .maybeSingle();

    if (targetError) {
      return {
        success: false,
        statusCode: 500,
        errorCode: "DATABASE_ERROR",
        userMessage: "Failed to query observance occurrence",
      };
    }
    if (!target?.date) {
      return {
        success: false,
        statusCode: 404,
        errorCode: "OCCURRENCE_NOT_FOUND",
        userMessage: "This observance occurrence is unavailable",
      };
    }
    anchorDate = target.date;
  }

  // Query the target's canonical family so read-time profile and variant
  // selection can establish whether this exact UUID is the user's primary row.
  const { data: occurrencesData, error: occError } = await supabase
    .from("observance_occurrences")
    .select(CALENDAR_OCCURRENCE_SELECT)
    .gte("date", shiftDate(anchorDate, -PROFILE_RESOLUTION_PAD_DAYS))
    .lte("date", shiftDate(anchorDate, PROFILE_RESOLUTION_PAD_DAYS))
    .in("calendar_profile", [calendarProfile, "legacy-ujjain"])
    .eq("observance_definitions.active", true)
    .eq("observance_definitions.kind", "vrat")
    .eq("publication_status", "published")
    .eq("review_status", "reviewed")
    .eq("verification_status", "verified")
    .eq("audit_status", "completed")
    .neq("final_date_source", "fallback")
    .order("date", { ascending: true });

  if (occError) {
    return {
      success: false,
      statusCode: 500,
      errorCode: "DATABASE_ERROR",
      userMessage: "Failed to query observance occurrences",
    };
  }

  const occurrencesWithBatches = await attachMaterialisationBatches(
    occurrencesData || [],
    undefined,
    calendarProfile,
    resolved.context.effectiveCalculationLocation,
  );

  const formattedResults = formatOccurrencesToResults(
    occurrencesWithBatches,
    [],
    tradition,
    calendarProfile,
    sampradaya,
    shiftDate(anchorDate, -PROFILE_RESOLUTION_PAD_DAYS),
    shiftDate(anchorDate, PROFILE_RESOLUTION_PAD_DAYS),
    resolved.context,
  );

  const matched = formattedResults.find(
    (r) =>
      r.id === occurrenceId &&
      r.isPrimary === true &&
      r.status === "resolved" &&
      r.kind === "vrat" &&
      (options.requireToday === false || r.civilDate === todayStr || r.date === todayStr)
  );

  if (!matched) {
    return {
      success: false,
      statusCode: options.requireToday === false ? 404 : 400,
      errorCode: "OCCURRENCE_NOT_OBSERVABLE",
      userMessage: "This observance is not active or eligible to observe today",
    };
  }

  // Reject observation writes for a multi-day series (e.g. Navratri,
  // Diwali-five-days) child when the parent series is incomplete/under_review
  // -- even though this single occurrence individually passed the eligibility
  // filter above. Reuses the exact per-user profile/location/tradition
  // already resolved for this request, so this check is fully precise (no
  // canonical-profile proxying, unlike the batch notification-cron gate).
  const seriesObservable = isOccurrenceObservableInItsSeries(
    formattedResults,
    {
      spiritualDate: todayStr,
      profile: { calendar: calendarProfile, tradition: matched.profile.tradition },
      location: matched.location,
      tradition,
    },
    occurrenceId,
    matched.slug,
  );
  if (!seriesObservable) {
    return {
      success: false,
      statusCode: 409,
      errorCode: "SERIES_INCOMPLETE",
      userMessage: "This observance is part of a multi-day sequence that is not yet fully confirmed or is not currently active",
    };
  }

  const matchedRaw = occurrencesWithBatches.find(
    (row: { id?: string | null }) => row.id === occurrenceId,
  );

  return {
    success: true,
    user: {
      id: resolved.userId,
      timezone: tz,
      calendarProfile,
      tradition,
      sampradaya,
    },
    occurrence: {
      id: matched.id!,
      date: matched.civilDate ?? matched.date,
      vratId: matched.festivalId,
      vratName: matched.display_name,
      calendarProfile: matched.profile.calendar,
      tradition: matched.profile.tradition,
      sampradayaIdentity: matchedRaw?.spiritual_tradition ?? null,
      variantKey: matched.variantKey ?? null,
    },
    result: matched,
  };
}

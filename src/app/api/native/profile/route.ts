import { NextRequest, NextResponse } from "next/server";

import { getApiUser } from "@/lib/api-auth";

export const runtime = "nodejs";

const APP_LANGUAGES = new Set(["en", "hi", "pa"]);
const GENDER_CONTEXTS = new Set(["female", "general"]);
const LIFE_STAGES = new Set(["brahmacharya", "grihastha", "vanaprastha", "sannyasa"]);
const EDITABLE_TEXT_FIELDS = new Set(["full_name", "sampradaya", "ishta_devata", "city", "country"]);
const EDITABLE_LANGUAGE_FIELDS = new Set(["app_language", "meaning_language", "transliteration_language"]);
const EDITABLE_BOOLEAN_FIELDS = new Set([
  "wants_festival_reminders",
  "wants_shloka_reminders",
  "wants_nitya_reminders",
  "wants_community_notifications",
  "wants_family_notifications",
  "consent_religious_data",
]);

const RASHIS = new Set([
  "mesha", "vrishabha", "mithuna", "karka", "simha", "kanya",
  "tula", "vrishchika", "dhanu", "makara", "kumbha", "meena",
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces"
]);

const NAKSHATRAS = new Set([
  "ashwini", "bharani", "krittika", "rohini", "mrigashira", "ardra",
  "punarvasu", "pushya", "ashlesha", "magha", "purva_phalguni", "uttara_phalguni",
  "hasta", "chitra", "swati", "vishakha", "anuradha", "jyeshtha",
  "mula", "purva_ashadha", "uttara_ashadha", "shravana", "dhanishta", "shatabhisha",
  "purva_bhadrapada", "uttara_bhadrapada", "revati"
]);

const CALENDAR_PROFILES = new Set([
  "north_indian_purnimanta", "gujarati_amanta", "marathi_amanta", "kannada_amanta",
  "telugu_amanta", "tamil_solar", "malayalam_solar", "bengali_solar",
  "odia", "nepali_bikram", "global_sanatan"
]);

const CALENDAR_SCOPES = new Set(["major_only", "all_observances"]);

const VALID_GOALS = new Set([
  "daily_practice", "deeper_faith", "community", "peace", "knowledge", "new_guide"
]);

const HINDU_ONLY_FIELDS = ["rashi", "nakshatra", "gotra", "calendar_profile", "calendar_scope"] as const;

function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function sanitizeText(value: unknown, maxLength: number) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed.slice(0, maxLength) : null;
}

const DATE_OF_BIRTH_RE = /^\d{4}-\d{2}-\d{2}$/;

function sanitizeDateOfBirth(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!DATE_OF_BIRTH_RE.test(trimmed)) return undefined;
  const parsed = new Date(`${trimmed}T00:00:00Z`);
  if (Number.isNaN(parsed.getTime())) return undefined;
  if (parsed.getTime() > Date.now()) return undefined;
  return trimmed;
}

function sanitizeAvatarUrl(value: unknown) {
  if (value === null) return null;
  if (typeof value !== "string") return undefined;
  const trimmed = value.trim();
  if (!trimmed) return null;
  if (trimmed.length > 1000) return undefined;

  try {
    const url = new URL(trimmed);
    if (!/^https?:$/.test(url.protocol)) return undefined;
    if (!url.pathname.includes("/storage/v1/object/public/avatars/")) return undefined;
    return trimmed;
  } catch {
    return undefined;
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { user, error: authError, supabase } = await getApiUser(req);
    if (!user || !supabase) {
      return NextResponse.json({ error: authError?.message ?? "Unauthenticated" }, { status: 401 });
    }

    const rawBody = await req.json().catch(() => null);
    if (!isObject(rawBody)) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    // Check if Hindu-only fields are included
    const hasHinduOnlyField = HINDU_ONLY_FIELDS.some((f) => f in rawBody);
    if (hasHinduOnlyField) {
      const { data: userProfile, error: profileError } = await supabase
        .from("profiles")
        .select("tradition")
        .eq("id", user.id)
        .single();

      if (profileError || !userProfile) {
        return NextResponse.json({ error: "Failed to read user profile" }, { status: 500 });
      }

      const isHindu = userProfile.tradition === "hindu";
      if (!isHindu) {
        // Non-Hindu users cannot set non-null Hindu-only fields
        for (const field of HINDU_ONLY_FIELDS) {
          if (field in rawBody && rawBody[field] !== null && rawBody[field] !== "") {
            return NextResponse.json(
              { error: "Field '" + field + "' is only available for Hindu tradition profiles" },
              { status: 400 }
            );
          }
        }
      }
    }

    const updates: Record<string, string | boolean | null> = {};

    for (const field of EDITABLE_TEXT_FIELDS) {
      if (!(field in rawBody)) continue;
      const maxLength = field === "full_name" ? 80 : 64;
      const value = sanitizeText(rawBody[field], maxLength);
      if (value === undefined) {
        return NextResponse.json({ error: field + " must be a string or null" }, { status: 400 });
      }
      updates[field] = value;
    }

    if ("avatar_url" in rawBody) {
      const value = sanitizeAvatarUrl(rawBody.avatar_url);
      if (value === undefined) {
        return NextResponse.json({ error: "avatar_url must be a public avatars storage URL or null" }, { status: 400 });
      }
      updates.avatar_url = value;
    }

    for (const field of EDITABLE_LANGUAGE_FIELDS) {
      if (!(field in rawBody)) continue;
      const value = rawBody[field];
      if (typeof value !== "string" || !APP_LANGUAGES.has(value)) {
        return NextResponse.json({ error: field + " must be one of en, hi, pa" }, { status: 400 });
      }
      updates[field] = value;
    }

    for (const field of EDITABLE_BOOLEAN_FIELDS) {
      if (!(field in rawBody)) continue;
      const value = rawBody[field];
      if (typeof value !== "boolean") {
        return NextResponse.json({ error: field + " must be a boolean" }, { status: 400 });
      }
      updates[field] = value;
    }

    if ("date_of_birth" in rawBody) {
      const value = sanitizeDateOfBirth(rawBody.date_of_birth);
      if (value === undefined) {
        return NextResponse.json({ error: "date_of_birth must be a YYYY-MM-DD string in the past, or null" }, { status: 400 });
      }
      updates.date_of_birth = value;
    }

    if ("gender_context" in rawBody) {
      const value = rawBody.gender_context;
      if (value !== null && (typeof value !== "string" || !GENDER_CONTEXTS.has(value))) {
        return NextResponse.json({ error: "gender_context must be one of female, general, or null" }, { status: 400 });
      }
      updates.gender_context = value;
    }

    if ("life_stage" in rawBody) {
      const value = rawBody.life_stage;
      if (value !== null && (typeof value !== "string" || !LIFE_STAGES.has(value))) {
        return NextResponse.json({ error: "life_stage must be one of brahmacharya, grihastha, vanaprastha, sannyasa, or null" }, { status: 400 });
      }
      updates.life_stage = value;
    }

    if ("rashi" in rawBody) {
      const val = rawBody.rashi;
      if (val === null || val === "") {
        updates.rashi = null;
      } else if (typeof val === "string" && RASHIS.has(val.toLowerCase().trim())) {
        updates.rashi = val.toLowerCase().trim();
      } else {
        return NextResponse.json({ error: "rashi must be a valid Rashi identifier or null" }, { status: 400 });
      }
    }

    if ("nakshatra" in rawBody) {
      const val = rawBody.nakshatra;
      if (val === null || val === "") {
        updates.nakshatra = null;
      } else if (typeof val === "string" && NAKSHATRAS.has(val.toLowerCase().trim())) {
        updates.nakshatra = val.toLowerCase().trim();
      } else {
        return NextResponse.json({ error: "nakshatra must be a valid Nakshatra identifier or null" }, { status: 400 });
      }
    }

    if ("gotra" in rawBody) {
      const val = rawBody.gotra;
      if (val === null || val === "") {
        updates.gotra = null;
      } else if (typeof val === "string") {
        const trimmed = val.trim();
        updates.gotra = trimmed.length > 0 ? trimmed.slice(0, 64) : null;
      } else {
        return NextResponse.json({ error: "gotra must be a string or null" }, { status: 400 });
      }
    }

    if ("calendar_profile" in rawBody) {
      const val = rawBody.calendar_profile;
      if (val === null || val === "") {
        updates.calendar_profile = null;
      } else if (typeof val === "string" && CALENDAR_PROFILES.has(val.toLowerCase().trim())) {
        updates.calendar_profile = val.toLowerCase().trim();
      } else {
        return NextResponse.json({ error: "calendar_profile must be a valid calendar profile slug or null" }, { status: 400 });
      }
    }

    if ("calendar_scope" in rawBody) {
      const val = rawBody.calendar_scope;
      if (val === null || val === "") {
        updates.calendar_scope = null;
      } else if (typeof val === "string" && CALENDAR_SCOPES.has(val.toLowerCase().trim())) {
        updates.calendar_scope = val.toLowerCase().trim();
      } else {
        return NextResponse.json({ error: "calendar_scope must be one of major_only, all_observances, or null" }, { status: 400 });
      }
    }

    if ("onboarding_goal" in rawBody) {
      const val = rawBody.onboarding_goal;
      if (val === null || val === "") {
        updates.onboarding_goal = null;
      } else if (typeof val === "string") {
        const items = val.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean);
        const allValid = items.length > 0 && items.every((k) => VALID_GOALS.has(k));
        if (!allValid) {
          return NextResponse.json({ error: "onboarding_goal contains invalid goal identifiers" }, { status: 400 });
        }
        updates.onboarding_goal = items.join(",");
      } else if (Array.isArray(val)) {
        const allValid = val.length > 0 && val.every((k) => typeof k === "string" && VALID_GOALS.has(k.toLowerCase().trim()));
        if (!allValid) {
          return NextResponse.json({ error: "onboarding_goal contains invalid goal identifiers" }, { status: 400 });
        }
        updates.onboarding_goal = val.map((k) => k.toLowerCase().trim()).join(",");
      } else {
        return NextResponse.json({ error: "onboarding_goal must be a string, array of goals, or null" }, { status: 400 });
      }
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json({ error: "No editable profile fields provided" }, { status: 400 });
    }

    // Returns the persisted values plus updated_at (auto-maintained by the
    // set_profiles_updated_at trigger) so a client-side desired-state cache
    // can acknowledge exactly this write -- a later, unrelated GET is not
    // sufficient proof a specific pending write landed unless its
    // updated_at is at least this recent.
    const { data, error } = await supabase
      .from("profiles")
      .update(updates)
      .eq("id", user.id)
      .select(`${Object.keys(updates).join(", ")}, updated_at`)
      .single();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const { updated_at, ...persisted } = data as Record<string, unknown> & { updated_at: string };
    return NextResponse.json({ success: true, persisted, updatedAt: updated_at });
  } catch (err: unknown) {
    console.error("[PATCH /api/native/profile] Server error:", err);
    const message = err instanceof Error ? err.message : "Server error";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

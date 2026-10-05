import { randomBytes, randomUUID } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isIsoDate,
  isRecord,
  NativeKulDependencyError,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";
import {
  getKulLocalDate,
  kulTithiRequestKey,
  resolveKulRecurringGregorianDate,
  resolveNextKulTithiDates,
  type KulTithiRequest,
} from "@/lib/native-kul-tithi";

export const runtime = "nodejs";

const ALLOWED_EMOJI = new Set(["🏡", "🪔", "🌿", "🕉️", "🪷", "🙏"]);

type KulRow = {
  id: string;
  name: string;
  invite_code: string;
  avatar_emoji: string;
  created_at: string;
  gotra: string | null;
  pravara: string | null;
  kuldevi_name: string | null;
  kuldevta_name: string | null;
  kuldevi_place_id: string | null;
  kuldevta_place_id: string | null;
  ancestral_origin: string | null;
  kulachara_notes: string | null;
  calendar_latitude: number;
  calendar_longitude: number;
  calendar_reference_label: string;
  calendar_timezone: string;
  calendar_month_system: "amanta" | "purnimanta";
};
type MemberRow = {
  id: string;
  user_id: string;
  role: "guardian" | "sadhak";
  joined_at: string;
};
type ProfileRow = {
  id: string;
  full_name: string | null;
  username: string | null;
  avatar_url: string | null;
  tradition: string | null;
  sampradaya: string | null;
};
type TaskRow = {
  id: string;
  title: string;
  description: string | null;
  task_type: string;
  content_ref: string | null;
  due_date: string | null;
  completed: boolean;
  completed_at: string | null;
  assigned_to: string;
  assigned_by: string;
};
type MessageRow = {
  id: string;
  content: string;
  sender_id: string;
  reaction: string | null;
  created_at: string;
};
type FamilyRow = {
  id: string;
  name: string;
  role: string | null;
  generation: number | null;
  parent_id: string | null;
  spouse_id: string | null;
  is_alive: boolean;
};
type EventRow = {
  id: string;
  title: string;
  event_type: string;
  event_date: string;
  recurring: boolean;
  description: string | null;
  member_id: string | null;
  date_system: "gregorian" | "tithi";
  masa: number | null;
  paksha: "shukla" | "krishna" | null;
  tithi: number | null;
  month_system: "amanta" | "purnimanta" | null;
  masa_is_adhika: boolean;
  tithi_resolution: "sunrise";
};
type KulTirthaRow = {
  id: string;
  place_id: string;
  status: "wishlist" | "visited";
  visited_at: string | null;
  notes: string | null;
  created_at: string;
  place: { id: string; name: string; tradition: string; deity: string | null; address: string | null; lat: number; lon: number } | Array<{ id: string; name: string; tradition: string; deity: string | null; address: string | null; lat: number; lon: number }> | null;
};

function fail(message: string, status: number, diagnostic?: { code: string; requestId: string }) {
  return NextResponse.json(
    { error: message, ...(diagnostic ?? {}) },
    {
      status,
      headers: {
        "Cache-Control": "private, no-store",
        ...(diagnostic ? { "X-Request-ID": diagnostic.requestId } : {}),
      },
    },
  );
}

function requestIdFor(request: NextRequest): string {
  const candidate = request.headers.get("x-request-id");
  return candidate && /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(candidate)
    ? candidate
    : randomUUID();
}

export async function GET(request: NextRequest) {
  const requestStartedAt = performance.now();
  const requestId = requestIdFor(request);
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);

  try {
    const membershipStartedAt = performance.now();
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) {
      return NextResponse.json(
        {
          userId: user.id,
          today: new Date().toISOString().slice(0, 10),
          kul: null,
          role: null,
          members: [],
          tasks: [],
          messages: [],
          familyMembers: [],
          events: [],
          tirthaWishes: [],
        },
        { headers: {
          "Cache-Control": "private, no-store",
          "Server-Timing": `membership;dur=${(performance.now() - membershipStartedAt).toFixed(2)}, total;dur=${(performance.now() - requestStartedAt).toFixed(2)}`,
        } },
      );
    }

    const kulResult = await supabase
      .from("kuls")
      .select("id, name, invite_code, avatar_emoji, created_at, gotra, pravara, kuldevi_name, kuldevta_name, kuldevi_place_id, kuldevta_place_id, ancestral_origin, kulachara_notes, calendar_latitude, calendar_longitude, calendar_reference_label, calendar_timezone, calendar_month_system")
      .eq("id", membership.kulId)
      .maybeSingle();
    if (kulResult.error) throw new NativeKulDependencyError("kul_lookup", kulResult.error.code);
    const kul = kulResult.data as KulRow | null;
    if (!kul)
      return fail("Your family circle could not be found. Refresh and try again.", 409);

    const today = getKulLocalDate(new Date(), kul.calendar_timezone);
    const dataStartedAt = performance.now();
    const [
      membersResult,
      tasksResult,
      messagesResult,
      familyResult,
      eventsResult,
      tirthaResult,
    ] = await Promise.all([
      supabase
        .from("kul_members")
        .select("id, user_id, role, joined_at")
        .eq("kul_id", membership.kulId)
        .order("joined_at", { ascending: true })
        .limit(6),
      supabase
        .from("kul_tasks")
        .select(
          "id, title, description, task_type, content_ref, due_date, completed, completed_at, assigned_to, assigned_by",
        )
        .eq("kul_id", membership.kulId)
        .order("completed", { ascending: true })
        .order("due_date", { ascending: true, nullsFirst: false })
        .limit(25),
      supabase
        .from("kul_messages")
        .select("id, content, sender_id, reaction, created_at")
        .eq("kul_id", membership.kulId)
        .order("created_at", { ascending: false })
        .limit(30),
      supabase
        .from("kul_family_members")
        .select("id, name, role, generation, parent_id, spouse_id, is_alive")
        .eq("kul_id", membership.kulId)
        .order("generation", { ascending: true, nullsFirst: false })
        .order("display_order", { ascending: true })
        .limit(100),
      supabase
        .from("kul_events")
        .select(
          "id, title, event_type, event_date, recurring, description, member_id, date_system, masa, paksha, tithi, month_system, masa_is_adhika, tithi_resolution",
        )
        .eq("kul_id", membership.kulId)
        .or(`event_date.gte.${today},recurring.eq.true,date_system.eq.tithi`)
        .order("event_date", { ascending: true })
        .limit(100),
      supabase
        .from("kul_tirtha_wishes")
        .select("id, place_id, status, visited_at, notes, created_at, place:tirtha_places(id, name, tradition, deity, address, lat, lon)")
        .eq("kul_id", membership.kulId)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);

    const queryFailures = [
      ["member_list", membersResult.error],
      ["task_list", tasksResult.error],
      ["message_list", messagesResult.error],
      ["family_list", familyResult.error],
      ["event_list", eventsResult.error],
      ["tirtha_list", tirthaResult.error],
    ] as const;
    const queryFailure = queryFailures.find(([, error]) => error !== null);
    if (queryFailure) {
      throw new NativeKulDependencyError(queryFailure[0], queryFailure[1]?.code);
    }
    const dataDurationMs = performance.now() - dataStartedAt;
    const profileStartedAt = performance.now();
    const memberRows = (membersResult.data ?? []) as MemberRow[];
    const memberIds = memberRows.map((member) => member.user_id);
    const profilesResult =
      memberIds.length > 0
        ? await supabase
            .from("profiles")
            .select(
              "id, full_name, username, avatar_url, tradition, sampradaya",
            )
            .in("id", memberIds)
        : { data: [], error: null };
    if (profilesResult.error) {
      throw new NativeKulDependencyError("member_profiles", profilesResult.error.code);
    }
    const profileDurationMs = performance.now() - profileStartedAt;
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const profileById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );

    const messages = ((messagesResult.data ?? []) as MessageRow[]).reverse();
    const tasks = (tasksResult.data ?? []) as TaskRow[];
    const familyMembers = (familyResult.data ?? []) as FamilyRow[];
    const eventRows = (eventsResult.data ?? []) as EventRow[];
    const tithiRows = eventRows.filter(
      (event) => event.date_system === "tithi" && event.masa !== null &&
        event.paksha !== null && event.tithi !== null && event.month_system !== null,
    );
    const tithiRequests: KulTithiRequest[] = tithiRows.flatMap((event) =>
      event.masa !== null && event.paksha !== null && event.tithi !== null && event.month_system !== null
        ? [{ masa: event.masa, paksha: event.paksha, tithi: event.tithi, monthSystem: event.month_system, masaIsAdhika: event.masa_is_adhika }]
        : [],
    );
    const calendarStartedAt = performance.now();
    const tithiResolutions = resolveNextKulTithiDates(
      tithiRequests,
      today,
      { lat: kul.calendar_latitude, lon: kul.calendar_longitude, tz: kul.calendar_timezone },
    );
    const events = eventRows.map((event) => {
      if (event.date_system === "tithi") {
        const request: KulTithiRequest | null =
          event.masa !== null && event.paksha !== null && event.tithi !== null && event.month_system !== null
            ? { masa: event.masa, paksha: event.paksha, tithi: event.tithi, monthSystem: event.month_system, masaIsAdhika: event.masa_is_adhika }
            : null;
        const resolution = request ? tithiResolutions.get(kulTithiRequestKey(request)) : null;
        return {
          ...event,
          resolved_civil_date: resolution?.civilDate ?? null,
          tithi_label: resolution?.tithiLabel ?? null,
          calculation_location: kul.calendar_reference_label,
        };
      }
      return {
        ...event,
        resolved_civil_date: resolveKulRecurringGregorianDate(event.event_date, today, event.recurring),
        tithi_label: null,
        calculation_location: null,
      };
    });
    const tirthaWishes = ((tirthaResult.data ?? []) as KulTirthaRow[]).map((wish) => {
      const place = Array.isArray(wish.place) ? wish.place[0] : wish.place;
      return {
        id: wish.id,
        placeId: wish.place_id,
        name: place?.name ?? "Sacred place",
        tradition: place?.tradition ?? "other",
        deity: place?.deity ?? null,
        address: place?.address ?? null,
        latitude: place?.lat ?? 0,
        longitude: place?.lon ?? 0,
        status: wish.status,
        visitedAt: wish.visited_at,
        notes: wish.notes,
        createdAt: wish.created_at,
      };
    });

    const response = NextResponse.json(
      {
        userId: user.id,
        kul: {
          id: kul.id,
          name: kul.name,
          avatarEmoji: kul.avatar_emoji,
          createdAt: kul.created_at,
          inviteCode: membership.role === "guardian" ? kul.invite_code : null,
          lineage: {
            gotra: kul.gotra,
            pravara: kul.pravara,
            kuldeviName: kul.kuldevi_name,
            kuldevtaName: kul.kuldevta_name,
            kuldeviPlaceId: kul.kuldevi_place_id,
            kuldevtaPlaceId: kul.kuldevta_place_id,
            ancestralOrigin: kul.ancestral_origin,
            kulacharaNotes: kul.kulachara_notes,
          },
          calendarReference: {
            label: kul.calendar_reference_label,
            timezone: kul.calendar_timezone,
            monthSystem: kul.calendar_month_system,
            latitude: membership.role === "guardian" ? kul.calendar_latitude : null,
            longitude: membership.role === "guardian" ? kul.calendar_longitude : null,
          },
        },
        today,
        role: membership.role,
        members: memberRows.map((member) => ({
          id: member.id,
          userId: member.user_id,
          role: member.role,
          joinedAt: member.joined_at,
          profile: profileById.get(member.user_id) ?? null,
        })),
        tasks,
        messages,
        familyMembers,
        events,
        tirthaWishes,
      },
      { headers: {
        "Cache-Control": "private, no-store",
        "Server-Timing": `membership;dur=${(dataStartedAt - membershipStartedAt).toFixed(2)}, data;dur=${dataDurationMs.toFixed(2)}, profiles;dur=${profileDurationMs.toFixed(2)}, calendar;dur=${(performance.now() - calendarStartedAt).toFixed(2)}, total;dur=${(performance.now() - requestStartedAt).toFixed(2)}`,
      } },
    );
    return response;
  } catch (error) {
    const stage = error instanceof NativeKulDependencyError ? error.stage : "snapshot_processing";
    const code = error instanceof NativeKulDependencyError ? error.code : "KUL_SNAPSHOT_FAILED";
    console.error("[native-kul] snapshot failed", {
      stage,
      code,
      requestId,
      durationMs: Math.round(performance.now() - requestStartedAt),
    });
    return fail("Could not load your KUL right now. Please retry.", 503, {
      code: "KUL_BACKEND_UNAVAILABLE",
      requestId,
    });
  }
}

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body) || (body.action !== "create" && body.action !== "join")) {
    return fail("Choose whether to create or join a family circle.", 400);
  }

  try {
    if (body.action === "join") {
      const inviteCode = textField(body.inviteCode, 16)?.toUpperCase() ?? null;
      if (!inviteCode || !/^[A-Z0-9]{6,16}$/.test(inviteCode)) {
        return fail("Enter a valid family invite code.", 400);
      }
      const { data, error } = await supabase.rpc("join_kul", {
        p_invite_code: inviteCode,
      });
      if (error || !data)
        return fail(
          "That invite could not be joined. Check the code or try again.",
          400,
        );
      return NextResponse.json(
        { success: true },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const name = textField(body.name, 60);
    const emoji =
      typeof body.emoji === "string" && ALLOWED_EMOJI.has(body.emoji)
        ? body.emoji
        : null;
    if (!name || name.length < 2 || !emoji)
      return fail("Add a family name and choose an emblem.", 400);

    for (let attempt = 0; attempt < 3; attempt += 1) {
      const inviteCode = randomBytes(6).toString("hex").toUpperCase();
      const { data, error } = await supabase.rpc("create_kul", {
        p_name: name,
        p_emoji: emoji,
        p_invite_code: inviteCode,
      });
      if (!error && data) {
        return NextResponse.json(
          { success: true },
          { status: 201, headers: { "Cache-Control": "private, no-store" } },
        );
      }
      const message = error?.message.toLowerCase() ?? "";
      if (
        !message.includes("invite code") &&
        !message.includes("duplicate key")
      ) {
        return fail("Could not create your family circle. Please retry.", 400);
      }
    }
    return fail("Could not create a unique invite code. Please retry.", 503);
  } catch (error) {
    console.error("[native-kul] membership mutation failed", {
      userId: user.id,
      error,
    });
    return fail("Could not update your family circle. Please retry.", 503);
  }
}

import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isIsoDate,
  isRecord,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";

export const runtime = "nodejs";

const ALLOWED_EMOJI = new Set(["🏡", "🪔", "🌿", "🕉️", "🪷", "🙏"]);

type KulRow = {
  id: string;
  name: string;
  invite_code: string;
  avatar_emoji: string;
  created_at: string;
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
};

function fail(message: string, status: number) {
  return NextResponse.json(
    { error: message },
    {
      status,
      headers: { "Cache-Control": "private, no-store" },
    },
  );
}

export async function GET(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);

  try {
    const requestedToday = request.nextUrl.searchParams.get("today");
    const today = isIsoDate(requestedToday)
      ? requestedToday
      : new Date().toISOString().slice(0, 10);
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership) {
      return NextResponse.json(
        {
          userId: user.id,
          kul: null,
          role: null,
          members: [],
          tasks: [],
          messages: [],
          familyMembers: [],
          events: [],
        },
        { headers: { "Cache-Control": "private, no-store" } },
      );
    }

    const [
      kulResult,
      membersResult,
      tasksResult,
      messagesResult,
      familyResult,
      eventsResult,
    ] = await Promise.all([
      supabase
        .from("kuls")
        .select("id, name, invite_code, avatar_emoji, created_at")
        .eq("id", membership.kulId)
        .maybeSingle(),
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
          "id, title, event_type, event_date, recurring, description, member_id",
        )
        .eq("kul_id", membership.kulId)
        .or(`event_date.gte.${today},recurring.eq.true`)
        .order("event_date", { ascending: true })
        .limit(100),
    ]);

    const queryError =
      kulResult.error ||
      membersResult.error ||
      tasksResult.error ||
      messagesResult.error ||
      familyResult.error ||
      eventsResult.error;
    if (queryError) throw new Error("KUL snapshot query failed");
    const kul = kulResult.data as KulRow | null;
    if (!kul)
      return fail(
        "Your family circle could not be found. Refresh and try again.",
        409,
      );

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
    if (profilesResult.error)
      throw new Error("KUL member profile query failed");
    const profiles = (profilesResult.data ?? []) as ProfileRow[];
    const profileById = new Map(
      profiles.map((profile) => [profile.id, profile]),
    );

    const messages = ((messagesResult.data ?? []) as MessageRow[]).reverse();
    const tasks = (tasksResult.data ?? []) as TaskRow[];
    const familyMembers = (familyResult.data ?? []) as FamilyRow[];
    const events = (eventsResult.data ?? []) as EventRow[];

    return NextResponse.json(
      {
        userId: user.id,
        kul: {
          id: kul.id,
          name: kul.name,
          avatarEmoji: kul.avatar_emoji,
          createdAt: kul.created_at,
          inviteCode: membership.role === "guardian" ? kul.invite_code : null,
        },
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
      },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[native-kul] snapshot failed", { userId: user.id, error });
    return fail("Could not load your KUL right now. Please retry.", 503);
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

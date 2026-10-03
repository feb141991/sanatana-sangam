import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isRecord,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body))
    return NextResponse.json({ error: "Invalid message." }, { status: 400 });
  const content = textField(body.content, 500);
  if (!content)
    return NextResponse.json(
      { error: "Write a message of 1–500 characters." },
      { status: 400 },
    );

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership)
      return NextResponse.json(
        { error: "Join a family circle before posting." },
        { status: 409 },
      );
    const { data, error } = await supabase
      .from("kul_messages")
      .insert({ kul_id: membership.kulId, sender_id: user.id, content })
      .select("id, content, sender_id, reaction, created_at")
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not send your message. Please retry." },
        { status: 503 },
      );
    return NextResponse.json(data, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[native-kul] message write failed", {
      userId: user.id,
      error,
    });
    return NextResponse.json(
      { error: "Could not send your message. Please retry." },
      { status: 503 },
    );
  }
}

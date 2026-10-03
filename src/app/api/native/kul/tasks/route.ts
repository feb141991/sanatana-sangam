import { NextRequest, NextResponse } from "next/server";

import { getApiAuthFailureResponse, getApiUser } from "@/lib/api-auth";
import {
  isIsoDate,
  isRecord,
  resolveNativeKulMembership,
  textField,
} from "@/lib/native-kul";

export const runtime = "nodejs";

const TASK_TYPES = new Set(["read", "recite", "practice", "memorise"]);
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

type TaskOwner = { id: string; assigned_to: string; completed: boolean };

export async function POST(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  if (!isRecord(body))
    return NextResponse.json({ error: "Invalid task." }, { status: 400 });
  const title = textField(body.title, 100);
  const description =
    body.description == null ? null : textField(body.description, 500);
  const assignedTo =
    typeof body.assignedTo === "string" && UUID_RE.test(body.assignedTo)
      ? body.assignedTo
      : null;
  const taskType =
    typeof body.taskType === "string" && TASK_TYPES.has(body.taskType)
      ? body.taskType
      : null;
  const dueDate =
    body.dueDate == null || body.dueDate === ""
      ? null
      : isIsoDate(body.dueDate)
        ? body.dueDate
        : undefined;
  if (
    !title ||
    !assignedTo ||
    !taskType ||
    (description === null && body.description != null) ||
    dueDate === undefined
  ) {
    return NextResponse.json(
      { error: "Check the task title, assignee, type, and due date." },
      { status: 400 },
    );
  }

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership)
      return NextResponse.json(
        { error: "Join a family circle before assigning a task." },
        { status: 409 },
      );
    if (membership.role !== "guardian")
      return NextResponse.json(
        { error: "Only a family guardian can assign tasks." },
        { status: 403 },
      );
    const memberResult = await supabase
      .from("kul_members")
      .select("user_id")
      .eq("kul_id", membership.kulId)
      .eq("user_id", assignedTo)
      .maybeSingle();
    if (memberResult.error) throw new Error("KUL assignee check failed");
    if (!memberResult.data)
      return NextResponse.json(
        { error: "Choose someone in your family circle." },
        { status: 400 },
      );

    const { data, error } = await supabase
      .from("kul_tasks")
      .insert({
        kul_id: membership.kulId,
        assigned_by: user.id,
        assigned_to: assignedTo,
        title,
        description,
        task_type: taskType,
        due_date: dueDate,
      })
      .select(
        "id, title, description, task_type, content_ref, due_date, completed, completed_at, assigned_to, assigned_by",
      )
      .single();
    if (error || !data)
      return NextResponse.json(
        { error: "Could not assign the task. Please retry." },
        { status: 503 },
      );
    return NextResponse.json(data, {
      status: 201,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("[native-kul] task creation failed", {
      userId: user.id,
      error,
    });
    return NextResponse.json(
      { error: "Could not assign the task. Please retry." },
      { status: 503 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  const { user, error: authError, supabase } = await getApiUser(request);
  if (!user || !supabase) return getApiAuthFailureResponse(authError);
  const body: unknown = await request.json().catch(() => null);
  const taskId =
    isRecord(body) &&
    typeof body.taskId === "string" &&
    UUID_RE.test(body.taskId)
      ? body.taskId
      : null;
  const completed = isRecord(body) ? body.completed : undefined;
  if (!taskId || completed !== true)
    return NextResponse.json(
      { error: "Invalid task update." },
      { status: 400 },
    );

  try {
    const membership = await resolveNativeKulMembership(supabase, user.id);
    if (!membership)
      return NextResponse.json(
        { error: "Join a family circle first." },
        { status: 409 },
      );
    const current = await supabase
      .from("kul_tasks")
      .select("id, assigned_to, completed")
      .eq("id", taskId)
      .eq("kul_id", membership.kulId)
      .maybeSingle();
    if (current.error) throw new Error("KUL task lookup failed");
    const task = current.data as TaskOwner | null;
    if (!task)
      return NextResponse.json({ error: "Task not found." }, { status: 404 });
    if (task.assigned_to !== user.id && membership.role !== "guardian") {
      return NextResponse.json(
        { error: "Only the assignee or a guardian can complete this task." },
        { status: 403 },
      );
    }
    if (task.completed)
      return NextResponse.json({
        id: task.id,
        completed: true,
        alreadyCompleted: true,
      });

    const { data, error } = await supabase
      .from("kul_tasks")
      .update({ completed: true, completed_at: new Date().toISOString() })
      .eq("id", task.id)
      .eq("kul_id", membership.kulId)
      .eq("completed", false)
      .select("id, completed, completed_at")
      .maybeSingle();
    if (error) throw new Error("KUL task update failed");
    if (data)
      return NextResponse.json(data, {
        headers: { "Cache-Control": "private, no-store" },
      });

    // Another device may have completed it between the read and update.
    const latest = await supabase
      .from("kul_tasks")
      .select("id, completed, completed_at")
      .eq("id", task.id)
      .eq("kul_id", membership.kulId)
      .maybeSingle();
    if (latest.error || !latest.data || !latest.data.completed)
      throw new Error("KUL task completion was not confirmed");
    return NextResponse.json(
      { ...latest.data, alreadyCompleted: true },
      { headers: { "Cache-Control": "private, no-store" } },
    );
  } catch (error) {
    console.error("[native-kul] task completion failed", {
      userId: user.id,
      taskId,
      error,
    });
    return NextResponse.json(
      { error: "Could not update this task. Please retry." },
      { status: 503 },
    );
  }
}

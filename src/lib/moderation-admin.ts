import { createAdminClient } from "@/lib/supabase-admin";

export type ReportStatus = "pending" | "reviewed" | "actioned" | "dismissed";

/**
 * getPendingReports — server-side admin helper.
 * Uses service-role client via createAdminClient().
 * MUST only be called from authenticated admin routes/actions.
 */
export async function getPendingReports() {
  const supabase = createAdminClient();
  const { data, error } = await supabase
    .from("content_reports")
    .select("id, reason, status, reported_by, content_type, content_id, metadata, created_at, admin_note, content_author_id")
    .eq("status", "pending")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

/**
 * resolveReport — server-side admin helper.
 * Uses service-role client via createAdminClient().
 * Updates status and admin note in content_reports with compare-and-set concurrency guard.
 * Strictly enforces canonical database status constraint: 'pending' | 'reviewed' | 'actioned' | 'dismissed'.
 */
export async function resolveReport(
  reportId: string,
  action: "reviewed" | "actioned" | "dismissed",
  adminNote?: string
) {
  const validActions = new Set(["reviewed", "actioned", "dismissed"]);
  if (!validActions.has(action)) {
    throw new Error(`Invalid moderation action status: "${action}". Database constraint permits only "reviewed", "actioned", or "dismissed".`);
  }

  const supabase = createAdminClient();
  const updatePayload: { status: ReportStatus; admin_note?: string | null } = { status: action };
  if (adminNote !== undefined) {
    updatePayload.admin_note = adminNote;
  }

  const { data, error } = await (supabase.from("content_reports") as any)
    .update(updatePayload)
    .eq("id", reportId)
    .eq("status", "pending")
    .select("id, status");

  if (error) throw error;
  if (!data || data.length === 0) {
    throw new Error("Report conflict: this report has already been reviewed or updated.");
  }

  return data[0];
}

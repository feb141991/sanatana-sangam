export const dynamic = "force-dynamic";

import fs from "fs";
import path from "path";
import { createAdminClient } from "@/lib/supabase-admin";
import RagRetrievalClient, { type RetrievalEvent } from "./RagRetrievalClient";

function readReportIfPresent(fileName: string): string | null {
  try {
    const filePath = path.join(process.cwd(), fileName);
    if (!fs.existsSync(filePath)) return null;
    return fs.readFileSync(filePath, "utf-8");
  } catch {
    return null;
  }
}

export default async function RagRetrievalPage() {
  const adminSupabase = createAdminClient();

  let events: RetrievalEvent[] = [];
  try {
    const { data } = await adminSupabase
      .from("monitoring_events")
      .select("timestamp, latency_ms, provider, context")
      .eq("route", "ai/retrieval/pathshala_context")
      .order("timestamp", { ascending: false })
      .limit(500);
    events = (data ?? []) as RetrievalEvent[];
  } catch {
    events = [];
  }

  const gitaReport = readReportIfPresent("gita_retrieval_comparison.md");
  const upanishadsReport = readReportIfPresent("upanishads_retrieval_comparison.md");

  return (
    <RagRetrievalClient
      events={events}
      gitaReport={gitaReport}
      upanishadsReport={upanishadsReport}
    />
  );
}

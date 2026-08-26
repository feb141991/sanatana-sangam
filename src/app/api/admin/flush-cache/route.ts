import { verifyAdminCookieAuth } from "@/lib/admin-auth";
import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

export async function POST(request: NextRequest) {
  const authError = await verifyAdminCookieAuth(request);
  if (authError) return authError;

  try {
    // Purges and revalidates all ISR & Edge caches across the entire website
    revalidatePath("/", "layout");
    revalidatePath("/panchang");
    revalidatePath("/calendar");
    revalidatePath("/vrat");
    revalidatePath("/admin/monitoring");

    return NextResponse.json({
      success: true,
      timestamp: new Date().toISOString(),
      message: "All global edge caches and page layouts flushed and revalidated successfully."
    });
  } catch (err) {
    console.error("[admin/flush-cache] Cache flush failed:", err);
    return NextResponse.json(
      { error: "Failed to flush cache" },
      { status: 500 }
    );
  }
}

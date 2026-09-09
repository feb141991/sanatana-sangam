import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const { toEmail, subject } = await req.json();

    if (!toEmail || !toEmail.includes("@")) {
      return NextResponse.json({ error: "Invalid recipient email address" }, { status: 400 });
    }

    const resendApiKey = process.env.RESEND_API_KEY || "";

    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from: "onboarding@resend.dev",
        to: toEmail,
        subject: subject || "Shoonaya — SMTP Delivery Test",
        html: `
          <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
            <h2 style="color: #ca8a04;">🕉️ Shoonaya — Email System Test</h2>
            <p>Namaste,</p>
            <p>This is a live transactional email test from the <strong>Shoonaya Admin Console</strong> verifying delivery via Resend SMTP.</p>
            <hr style="border: none; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 12px; color: #64748b;">Timestamp: ${new Date().toISOString()}</p>
          </div>
        `,
      }),
    });

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json(
        { error: result.message || "Failed to send email via Resend" },
        { status: res.status }
      );
    }

    return NextResponse.json({ success: true, messageId: result.id });
  } catch (error) {
    console.error("[admin/email-monitoring/send-test] Error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Internal error sending test email" },
      { status: 500 }
    );
  }
}

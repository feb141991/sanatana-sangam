import { NextResponse } from 'next/server';
import twilio from 'twilio';

export async function POST(request: Request) {
  const { phone } = await request.json();
  const client = twilio(process.env.TWILIO_ACCOUNT_SID!, process.env.TWILIO_AUTH_TOKEN!);
  try {
    await client.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verifications.create({ to: phone, channel: 'whatsapp' });
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

import { NextResponse } from 'next/server';
import twilio from 'twilio';
import { createClient } from '@supabase/supabase-js';

// Uses admin/service-role client — never expose this key client-side
function getAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } });
}

export async function POST(request: Request) {
  const { phone, code } = await request.json();

  if (!phone || !code) {
    return NextResponse.json({ error: 'phone and code are required' }, { status: 400 });
  }

  // 1. Verify OTP with Twilio
  const twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
  );

  try {
    const check = await twilioClient.verify.v2
      .services(process.env.TWILIO_VERIFY_SID!)
      .verificationChecks.create({ to: phone, code });

    if (check.status !== 'approved') {
      return NextResponse.json({ error: 'Invalid or expired code' }, { status: 400 });
    }
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }

  // 2. Find or create the Supabase user via admin API
  const supabase = getAdminClient();

  // Look up by phone in profiles table
  const { data: profile } = await supabase
    .from('profiles')
    .select('id, email')
    .eq('phone', phone)
    .maybeSingle();

  let userEmail: string;
  let isNewUser = false;

  if (profile?.email) {
    userEmail = profile.email;
  } else {
    // New user — create account with a placeholder email derived from phone
    const placeholder = `wa_${phone.replace(/\D/g, '')}@whatsapp.shoonaya.app`;
    const { data: created, error: createErr } = await supabase.auth.admin.createUser({
      email: placeholder,
      phone,
      phone_confirm: true,
      email_confirm: true,
      user_metadata: { phone, signup_channel: 'whatsapp', onboarding_completed: false },
    });

    if (createErr || !created?.user) {
      return NextResponse.json({ error: createErr?.message ?? 'Could not create account' }, { status: 500 });
    }

    // Persist phone on newly created profile (trigger may have already inserted a row)
    await supabase
      .from('profiles')
      .update({ phone })
      .eq('id', created.user.id);

    userEmail = placeholder;
    isNewUser = true;
  }

  // 3. Generate a magic link — client follows it to get a real session
  const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
    type: 'magiclink',
    email: userEmail,
    options: { redirectTo: `${process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.app'}/auth/callback?next=${isNewUser ? '/onboarding' : '/home'}` },
  });

  if (linkErr || !linkData?.properties?.action_link) {
    return NextResponse.json({ error: linkErr?.message ?? 'Could not generate session' }, { status: 500 });
  }

  return NextResponse.json({
    success: true,
    redirect: linkData.properties.action_link,
  });
}

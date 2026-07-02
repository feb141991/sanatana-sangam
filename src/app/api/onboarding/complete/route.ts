import { NextRequest, NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export async function POST(req: NextRequest) {
  try {
    const supabase = await createServerSupabaseClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await req.json().catch(() => null) as {
      tradition?: string;
      goal?: string;
      name?: string;
      life_stage?: string;
      gender?: string;
      interests?: string[];
      whatsapp_number?: string;
      whatsapp_opt_in?: boolean;
      rashi?: string | null;
      nakshatra?: string | null;
      date_of_birth?: string | null;
    } | null;

    const tradition = body?.tradition?.trim();
    const goal = body?.goal?.trim();
    const name = body?.name?.trim() ?? '';
    const whatsapp_number = body?.whatsapp_number?.trim();
    const whatsapp_opt_in = !!body?.whatsapp_opt_in;

    const { data: existingProfile, error: existingError } = await supabase
      .from('profiles')
      .select('full_name')
      .eq('id', user.id)
      .maybeSingle();

    // maybeSingle returns null data (not error) when no row found — that's fine
    if (existingError) throw existingError;

    const updatePayload: {
      tradition?: string;
      onboarding_completed: boolean;
      onboarding_goal?: string | null;
      full_name?: string;
      life_stage?: string;
      gender_context?: string;
      seeking?: string[];
      whatsapp_number?: string | null;
      whatsapp_opt_in?: boolean;
      rashi?: string | null;
      nakshatra?: string | null;
      date_of_birth?: string | null;
    } = {
      onboarding_completed: true,
    };

    if (tradition) updatePayload.tradition = tradition;
    if (goal) updatePayload.onboarding_goal = goal;
    // Always ensure full_name is set — especially for Google OAuth users
    if (name) {
      updatePayload.full_name = name;
    } else if (!existingProfile?.full_name) {
      updatePayload.full_name = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seeker';
    }
    if (body?.life_stage) updatePayload.life_stage = body.life_stage;
    if (body?.gender) updatePayload.gender_context = body.gender;
    if (body?.interests) updatePayload.seeking = body.interests;
    if (body?.rashi !== undefined) updatePayload.rashi = body.rashi || null;
    if (body?.nakshatra !== undefined) updatePayload.nakshatra = body.nakshatra || null;
    if (body?.date_of_birth !== undefined) updatePayload.date_of_birth = body.date_of_birth || null;

    // Validate phone number format if provided
    let cleanWhatsApp: string | null = null;
    if (whatsapp_number) {
      const cleaned = whatsapp_number.replace(/\s+/g, '');
      const phoneRegex = /^\+[1-9]\d{6,14}$/; // E.164 format: + followed by 7-15 digits
      if (!phoneRegex.test(cleaned)) {
        return NextResponse.json({ error: 'Invalid WhatsApp number format. Must start with country code (e.g. +91...)' }, { status: 400 });
      }
      cleanWhatsApp = cleaned;
    }

    updatePayload.whatsapp_number = cleanWhatsApp;
    updatePayload.whatsapp_opt_in = whatsapp_opt_in;

    const { error } = await supabase
      .from('profiles')
      .update(updatePayload as never)
      .eq('id', user.id);

    if (error) throw error;

    // --- Referral Attribution Check ---
    try {
      const { data: existingAttr } = await supabase
        .from('referral_attributions')
        .select('id')
        .eq('referee_user_id', user.id)
        .maybeSingle();

      if (!existingAttr) {
        let referrerSthapakaNumber: number | null = null;
        let rawSource = 'direct';

        // 1. Check waitlist table
        if (user.email) {
          const { data: waitlistRow } = await supabase
            .from('waitlist')
            .select('referred_by_number, referral_source')
            .ilike('email', user.email)
            .maybeSingle();

          if (waitlistRow?.referred_by_number) {
            referrerSthapakaNumber = waitlistRow.referred_by_number;
            rawSource = waitlistRow.referral_source || 'direct';
          }
        }

        // 2. Check auth metadata if waitlist check yielded nothing
        if (!referrerSthapakaNumber) {
          const referredByCode = user.user_metadata?.referred_by_code;
          if (referredByCode) {
            const { data: resolvedNumber } = await supabase
              .rpc('resolve_invite_code', { p_code: String(referredByCode) });
            if (resolvedNumber) {
              referrerSthapakaNumber = resolvedNumber;
              rawSource = user.user_metadata?.referral_source || 'direct';
            }
          }
        }

        // 3. Insert referral attribution if referrer found
        if (referrerSthapakaNumber) {
          // Normalize source: ('whatsapp' | 'twitter' | 'direct')
          let finalSource: 'whatsapp' | 'twitter' | 'direct' = 'direct';
          const srcLower = rawSource.toLowerCase();
          if (srcLower.includes('whatsapp') || srcLower.includes('wa')) {
            finalSource = 'whatsapp';
          } else if (srcLower.includes('twitter') || srcLower.includes('x')) {
            finalSource = 'twitter';
          }

          await supabase
            .from('referral_attributions')
            .insert({
              referrer_sthapaka_number: referrerSthapakaNumber,
              referee_user_id: user.id,
              source: finalSource,
            });
        }
      }
    } catch (refError) {
      // Non-blocking: don't fail onboarding if attribution tracking fails
      console.error('[onboarding complete] Referral attribution tracking failed:', refError);
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[api/onboarding/complete POST]', error);
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}

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
      rashi?: string | null;
      nakshatra?: string | null;
      date_of_birth?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      city?: string | null;
      country?: string | null;
      timezone?: string | null;
      observance_location_source?: 'manual' | 'device' | 'unset' | null;
      calendar_profile?: string | null;
      sampradaya?: string | null;
      calendar_scope?: 'major_only' | 'all_observances' | null;
      calendar_language?: string | null;
    } | null;

    const tradition = body?.tradition?.trim();
    const goal = body?.goal?.trim();
    const name = body?.name?.trim() ?? '';

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
      rashi?: string | null;
      nakshatra?: string | null;
      date_of_birth?: string | null;
      latitude?: number | null;
      longitude?: number | null;
      city?: string | null;
      country?: string | null;
      timezone?: string | null;
      observance_location_source?: 'manual' | 'device' | 'unset' | null;
      calendar_profile?: string | null;
      sampradaya?: string | null;
      calendar_scope?: 'major_only' | 'all_observances' | null;
      calendar_language?: string | null;
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

    // Calendar Profile & Observance Location fields
    if (body?.latitude !== undefined) updatePayload.latitude = body.latitude;
    if (body?.longitude !== undefined) updatePayload.longitude = body.longitude;
    if (body?.city !== undefined) updatePayload.city = body.city;
    if (body?.country !== undefined) updatePayload.country = body.country;
    if (body?.timezone !== undefined) updatePayload.timezone = body.timezone;
    if (body?.observance_location_source !== undefined) {
      updatePayload.observance_location_source = body.observance_location_source;
    }
    if (body?.calendar_profile !== undefined) updatePayload.calendar_profile = body.calendar_profile;
    if (body?.sampradaya !== undefined) updatePayload.sampradaya = body.sampradaya;
    if (body?.calendar_scope !== undefined) updatePayload.calendar_scope = body.calendar_scope;
    if (body?.calendar_language !== undefined) updatePayload.calendar_language = body.calendar_language;

    // WhatsApp sending and number verification were retired on 2026-11-12 (no number was ever stored). A number in the
    // request is ignored: it could no longer be verified, and nothing would use it.

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

// ============================================================
// Nudge Engine — Adaptive streak recovery (Phase 2)
//
// Learns what style of message brings each user back after
// a streak break: gentle encouragement, challenge, or community.
// Uses Gemini Flash via the ai-nudge Edge Function.
// Delivers push notifications via OneSignal.
//
// Usage:
//   const nudge = new NudgeEngine(supabase, config);
//   await nudge.registerDevice(userId, oneSignalPlayerId);
//   const msg = await nudge.getStreakRecoveryMessage(userId, daysMissed);
//   await nudge.sendPush(userId, 'streak_recovery', { days_missed: 2 });
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { NudgeStyle, SadhanaEngineConfig } from '../types';

export interface NudgeMessage {
  message: string;
  style: NudgeStyle;
  call_to_action: string;
  generated_at: string;
  push_sent?: boolean;
  push_error?: string | null;
}

export interface NudgeOutcome {
  nudge_id: string;
  user_id: string;
  style: NudgeStyle;
  returned: boolean;       // did user open the app within 24h?
  recorded_at: string;
}

export type DevicePlatform = 'web' | 'ios' | 'android';

// Static fallbacks — shown if Edge Function is unavailable
const FALLBACK_NUDGES: Record<NudgeStyle, NudgeMessage> = {
  gentle: {
    message: "Your practice is waiting for you, gently. Even a single mantra counts.",
    style: 'gentle',
    call_to_action: "Resume my sadhana",
    generated_at: '',
  },
  challenge: {
    message: "Great practitioners don't wait for the perfect moment — they create it. Your mandali is still going.",
    style: 'challenge',
    call_to_action: "Get back on track",
    generated_at: '',
  },
  community: {
    message: "Your mandali noticed your absence. Come back and practice together.",
    style: 'community',
    call_to_action: "Rejoin my mandali",
    generated_at: '',
  },
  unknown: {
    message: "Your practice missed you. Come back whenever you're ready.",
    style: 'unknown',
    call_to_action: "Open Sangam",
    generated_at: '',
  },
};

export class NudgeEngine {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config = config;
  }

  // ── Device registration ──
  // Call this once after the user grants notification permission.
  // OneSignal provides the player_id (also called subscription_id in SDK v5+).
  //
  // Example (in your PWA using OneSignal SDK v16):
  //   OneSignal.User.pushSubscription.addEventListener('change', async (event) => {
  //     if (event.current.optedIn && event.current.id) {
  //       await nudge.registerDevice(userId, event.current.id, 'web');
  //     }
  //   });

  async registerDevice(
    userId: string,
    playerId: string,
    platform: DevicePlatform = 'web'
  ): Promise<void> {
    // Use the SQL function which handles upsert + reassignment if the player_id
    // was previously registered to a different user (e.g. after reinstall)
    const { error } = await this.supabase.rpc('upsert_device_token', {
      p_user_id: userId,
      p_player_id: playerId,
      p_platform: platform,
    });

    if (error) {
      console.error('[NudgeEngine] registerDevice failed:', error.message);
    }
  }

  // ── Deactivate a device token ──
  // Call this if the user revokes notification permission.

  async unregisterDevice(userId: string, playerId: string): Promise<void> {
    await this.supabase
      .from('device_tokens')
      .update({ is_active: false })
      .eq('user_id', userId)
      .eq('player_id', playerId);
  }

  // ── Primary: get a personalised streak recovery message ──
  // The Edge Function reads the user's nudge history and picks
  // the style most likely to bring them back.

  async getStreakRecoveryMessage(
    userId: string,
    daysMissed: number
  ): Promise<NudgeMessage> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-nudge', {
        body: { user_id: userId, days_missed: daysMissed },
      });

      if (error) throw error;
      return data as NudgeMessage;
    } catch {
      // Fallback: determine style from local history if possible
      const style = await this.getKnownNudgeStyle(userId);
      const fallback = { ...FALLBACK_NUDGES[style] };
      fallback.generated_at = new Date().toISOString();
      return fallback;
    }
  }

  // ── Send a push notification ──
  // Generates the message AND delivers it via OneSignal in one call.
  // The Edge Function looks up the user's player_ids from device_tokens.
  //
  // nudgeType: 'streak_recovery' | 'vrata_reminder' | 'morning_reminder'
  // params: additional body fields (days_missed, vrata_name, tithi, panchang)

  async sendPush(
    userId: string,
    nudgeType: 'streak_recovery' | 'vrata_reminder' | 'morning_reminder',
    params: Record<string, unknown> = {}
  ): Promise<NudgeMessage> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-nudge', {
        body: {
          user_id: userId,
          type: nudgeType,
          send_push: true,
          ...params,
        },
      });

      if (error) throw error;
      return data as NudgeMessage;
    } catch {
      const style = await this.getKnownNudgeStyle(userId);
      const fallback = { ...FALLBACK_NUDGES[style] };
      fallback.generated_at = new Date().toISOString();
      fallback.push_sent = false;
      return fallback;
    }
  }

  // ── Record whether a nudge worked ──
  // Call this when the user opens the app after receiving a nudge.
  // This is how the system learns what works for each person.

  async recordNudgeOutcome(
    userId: string,
    nudgeId: string,
    style: NudgeStyle,
    returned: boolean
  ): Promise<void> {
    await this.supabase.from('sadhana_events').insert({
      user_id: userId,
      event_type: returned ? 'streak_recovered' : 'notification_dismissed',
      event_data: {
        nudge_id: nudgeId,
        nudge_style: style,
        returned,
      },
    });
  }

  // ── Get the nudge style that has worked for this user before ──

  async getKnownNudgeStyle(userId: string): Promise<NudgeStyle> {
    const { data } = await this.supabase
      .from('sadhana_events')
      .select('event_data')
      .eq('user_id', userId)
      .eq('event_type', 'streak_recovered')
      .order('created_at', { ascending: false })
      .limit(5);

    if (!data || data.length === 0) return 'gentle'; // default for new users

    const counts: Record<string, number> = {};
    for (const row of data) {
      const style = (row.event_data as Record<string, string>)?.nudge_style;
      if (style) counts[style] = (counts[style] ?? 0) + 1;
    }

    if (Object.keys(counts).length === 0) return 'gentle';

    const best = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
    return best as NudgeStyle;
  }

  // ── Vrata reminder (panchang-driven) ──
  // Sent the evening before a major vrata day.

  async getVrataReminder(
    userId: string,
    vrataName: string,
    tomorrowTithi: string
  ): Promise<NudgeMessage> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-nudge', {
        body: {
          user_id: userId,
          type: 'vrata_reminder',
          vrata_name: vrataName,
          tithi: tomorrowTithi,
        },
      });
      if (error) throw error;
      return data as NudgeMessage;
    } catch {
      return {
        message: `Tomorrow is ${vrataName}. Prepare yourself — light a lamp, observe the fast, and begin with Vishnu Sahasranama.`,
        style: 'gentle',
        call_to_action: "See tomorrow's vrata guide",
        generated_at: new Date().toISOString(),
      };
    }
  }

  // ── Morning brahma muhurta reminder ──

  async getMorningReminder(userId: string, todayPanchang: {
    tithi: string;
    vrata?: string;
    festival?: string;
  }): Promise<NudgeMessage> {
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-nudge', {
        body: {
          user_id: userId,
          type: 'morning_reminder',
          panchang: todayPanchang,
        },
      });
      if (error) throw error;
      return data as NudgeMessage;
    } catch {
      const special = todayPanchang.vrata ?? todayPanchang.festival;
      const msg = special
        ? `Jai Shri Krishna. Today is ${special}. Begin your practice at this auspicious hour.`
        : `Jai Shri Krishna. Brahma muhurta — the most sacred time for practice. Begin now.`;
      return {
        message: msg,
        style: 'gentle',
        call_to_action: "Start my practice",
        generated_at: new Date().toISOString(),
      };
    }
  }
}

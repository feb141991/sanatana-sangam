// ============================================================
// Practice Profile — computes user's spiritual profile from events
// Runs nightly via Supabase cron, or on-demand
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  SadhanaEvent,
  UserPracticeProfile,
  PracticeTime,
  SpiritualPath,
  Tradition,
  ContentDepth,
  NudgeStyle,
} from '../types';

const MANTRA_DEITY_MAP: Record<string, { deity: string; tradition: Tradition }> = {
  gayatri: { deity: 'Surya', tradition: 'smarta' },
  hare_krishna: { deity: 'Krishna', tradition: 'vaishnav' },
  om_namah_shivaya: { deity: 'Shiva', tradition: 'shaiv' },
  om_namo_narayanaya: { deity: 'Vishnu', tradition: 'vaishnav' },
  om_aim_hreem_kleem: { deity: 'Devi', tradition: 'shakta' },
  hanuman_chalisa: { deity: 'Hanuman', tradition: 'vaishnav' },
  vishnu_sahasranama: { deity: 'Vishnu', tradition: 'vaishnav' },
  lalita_sahasranama: { deity: 'Lalita', tradition: 'shakta' },
  maha_mrityunjaya: { deity: 'Shiva', tradition: 'shaiv' },
  ganesh_mantra: { deity: 'Ganesha', tradition: 'smarta' },
};

const DAYS = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];

export class ProfileComputer {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  async computeProfile(userId: string): Promise<UserPracticeProfile> {
    const events = await this.recentEvents(userId, 30);

    const profile: UserPracticeProfile = {
      user_id: userId,
      preferred_time: this.preferredTime(events),
      avg_session_duration_s: this.avgDuration(events),
      consistency_score: this.consistency(events),
      current_streak: await this.streak(userId, 'current'),
      longest_streak: await this.streak(userId, 'longest'),
      primary_path: this.path(events),
      preferred_deity: this.deity(events),
      tradition: this.tradition(events),
      content_depth: this.depth(events),
      language_pref: ['english', 'sanskrit'],
      favorite_texts: this.favoriteTexts(events),
      most_active_day: this.activeDay(events),
      skip_pattern: this.skipPattern(events),
      re_engagement_style: this.nudgeStyle(events),
      updated_at: new Date().toISOString(),
    };

    await this.supabase.from('user_practice').upsert(profile, { onConflict: 'user_id' });
    return profile;
  }

  async computeAllProfiles(): Promise<{ computed: number; errors: number }> {
    const since = new Date(Date.now() - 7 * 86400000).toISOString();
    const { data } = await this.supabase
      .from('sadhana_events')
      .select('user_id')
      .gte('created_at', since)
      .limit(1000);

    const users = [...new Set(data?.map(e => e.user_id) || [])];
    let computed = 0, errors = 0;

    for (const uid of users) {
      try { await this.computeProfile(uid); computed++; }
      catch { errors++; }
    }
    return { computed, errors };
  }

  // --- Inference methods ---

  private preferredTime(events: SadhanaEvent[]): PracticeTime {
    const hours = events
      .filter(e => e.event_type === 'app_open')
      .map(e => (e.event_data as any).hour as number)
      .filter(h => h !== undefined);

    if (hours.length < 3) return 'irregular';
    const avg = hours.reduce((a, b) => a + b, 0) / hours.length;
    if (avg < 6) return 'brahma_muhurta';
    if (avg < 11) return 'morning';
    if (avg >= 17) return 'evening';
    return 'irregular';
  }

  private avgDuration(events: SadhanaEvent[]): number {
    const d = events
      .filter(e => e.event_type === 'japa_session')
      .map(e => (e.event_data as any).duration_seconds as number)
      .filter(v => v > 0);
    return d.length ? Math.round(d.reduce((a, b) => a + b, 0) / d.length) : 0;
  }

  private consistency(events: SadhanaEvent[]): number {
    const dates = new Set<string>();
    events.forEach(e => {
      if (['japa_session', 'shloka_read', 'vrata_observed'].includes(e.event_type)) {
        dates.add(new Date(e.created_at || '').toISOString().slice(0, 10));
      }
    });
    return Math.min(1, dates.size / 30);
  }

  private path(events: SadhanaEvent[]): SpiritualPath {
    const j = events.filter(e => e.event_type === 'japa_session').length;
    const s = events.filter(e => e.event_type === 'shloka_read').length;
    const v = events.filter(e => e.event_type === 'vrata_observed').length;
    const t = j + s + v;
    if (t === 0) return 'bhakti';
    if (j / t > 0.5) return 'bhakti';
    if (s / t > 0.5) return 'jnana';
    if (v / t > 0.4) return 'karma';
    return 'dhyana';
  }

  private topMantraField(events: SadhanaEvent[]): string | null {
    const ids = events
      .filter(e => e.event_type === 'japa_session')
      .map(e => (e.event_data as any).mantra_id as string)
      .filter(Boolean);
    if (!ids.length) return null;
    const c: Record<string, number> = {};
    ids.forEach(m => { c[m] = (c[m] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1])[0][0];
  }

  private deity(events: SadhanaEvent[]): string {
    const top = this.topMantraField(events);
    return top ? (MANTRA_DEITY_MAP[top]?.deity || 'general') : 'general';
  }

  private tradition(events: SadhanaEvent[]): Tradition {
    const top = this.topMantraField(events);
    return top ? (MANTRA_DEITY_MAP[top]?.tradition || 'general') : 'general';
  }

  private depth(events: SadhanaEvent[]): ContentDepth {
    const reads = events.filter(e => e.event_type === 'shloka_read');
    const bm = events.filter(e => e.event_type === 'shloka_bookmark');
    if (!reads.length) return 'beginner';
    const times = reads.map(e => (e.event_data as any).time_spent_s as number).filter(t => t > 0);
    const avg = times.length ? times.reduce((a, b) => a + b, 0) / times.length : 0;
    const bmRate = bm.length / reads.length;
    if (avg > 60 && bmRate > 0.3) return 'advanced';
    if (avg > 30 || bmRate > 0.15) return 'intermediate';
    return 'beginner';
  }

  private favoriteTexts(events: SadhanaEvent[]): string[] {
    const t = events
      .filter(e => ['shloka_read', 'shloka_bookmark'].includes(e.event_type))
      .map(e => (e.event_data as any).text_id as string)
      .filter(Boolean);
    const c: Record<string, number> = {};
    t.forEach(x => { c[x] = (c[x] || 0) + 1; });
    return Object.entries(c).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([k]) => k);
  }

  private activeDay(events: SadhanaEvent[]): string {
    const c: Record<string, number> = {};
    events.forEach(e => {
      const d = DAYS[new Date(e.created_at || '').getDay()];
      c[d] = (c[d] || 0) + 1;
    });
    return Object.keys(c).length ? Object.entries(c).sort((a, b) => b[1] - a[1])[0][0] : 'unknown';
  }

  private skipPattern(events: SadhanaEvent[]) {
    const c: Record<string, number> = {};
    DAYS.forEach(d => { c[d] = 0; });
    events.forEach(e => { c[DAYS[new Date(e.created_at || '').getDay()]]++; });
    const skip = Object.entries(c).sort((a, b) => a[1] - b[1]).slice(0, 2).filter(([, v]) => v === 0).map(([k]) => k);
    return { common_skip_days: skip, avg_skip_after_days: 7 };
  }

  private nudgeStyle(events: SadhanaEvent[]): NudgeStyle {
    const opened = events.filter(e => e.event_type === 'notification_opened').length;
    const dismissed = events.filter(e => e.event_type === 'notification_dismissed').length;
    if (opened + dismissed < 3) return 'unknown';
    if (opened > dismissed) return 'gentle';
    const community = events.filter(e => e.event_type === 'mandali_event_attended').length;
    if (community > 2) return 'community';
    return 'challenge';
  }

  private async streak(userId: string, type: 'current' | 'longest'): Promise<number> {
    const order = type === 'longest' ? 'streak_count' : 'date';
    const { data } = await this.supabase
      .from('daily_sadhana')
      .select('streak_count, date')
      .eq('user_id', userId)
      .eq('any_practice', true)
      .order(order, { ascending: false })
      .limit(1);
    if (!data?.length) return 0;
    if (type === 'longest') return data[0].streak_count;
    const diff = Math.floor((Date.now() - new Date(data[0].date).getTime()) / 86400000);
    return diff <= 1 ? data[0].streak_count : 0;
  }

  private async recentEvents(userId: string, days: number): Promise<SadhanaEvent[]> {
    const since = new Date(Date.now() - days * 86400000).toISOString();
    const { data } = await this.supabase
      .from('sadhana_events').select('*')
      .eq('user_id', userId).gte('created_at', since)
      .order('created_at', { ascending: false }).limit(500);
    return data || [];
  }
}

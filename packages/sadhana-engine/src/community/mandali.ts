// ============================================================
// Mandali — Geo-based community & satsang coordination
//
// A mandali is a local spiritual community — people who meet
// physically for satsang, group japa, and festival celebrations.
// This module handles the social layer on top of the kul system:
// satsang scheduling, seva logging, and group sankalpa challenges.
//
// The kul system handles AI-assisted online practice groups.
// Mandali handles local/physical community coordination.
//
// Usage:
//   const m = new MandaliManager(supabase, config);
//   await m.scheduleSatsang(userId, kulId, { ... });
//   await m.logSeva(userId, 'Cleaned the temple kitchen', { kulId });
//   await m.createGroupChallenge(userId, kulId, { ... });
//   const members = await m.getSharedKulMembers(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type SevaType = 'temple_service' | 'food_distribution' | 'teaching' | 'event_help' | 'other';

export class MandaliManager {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Satsang scheduling ──
  // Uses kul_events as the backing table.

  async scheduleSatsang(
    hostId: string,
    kulId: string,
    details: {
      title: string;
      description?: string;
      locationName: string;
      scheduledAt: Date;
      durationMinutes?: number;
      isVirtual?: boolean;
      meetingLink?: string;
    }
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from('kul_events')
      .insert({
        kul_id:      kulId,
        title:       details.title,
        description: details.description ?? null,
        event_date:  details.scheduledAt.toISOString().split('T')[0],
        event_time:  details.scheduledAt.toTimeString().slice(0, 5),
        location:    details.locationName,
        created_by:  hostId,
        event_data:  {
          duration_minutes: details.durationMinutes ?? 60,
          is_virtual:       details.isVirtual ?? false,
          meeting_link:     details.meetingLink ?? null,
        },
      })
      .select('id')
      .single();

    if (error) {
      if (this.config.debug) console.error('[MandaliManager] scheduleSatsang failed:', error.message);
      return null;
    }
    return data;
  }

  // ── Get upcoming satsangs for a kul ──

  async getUpcomingSatsangs(kulId: string, limit = 10): Promise<Array<{
    id: string;
    title: string;
    event_date: string;
    event_time: string | null;
    location: string | null;
    created_by: string;
  }>> {
    const today = new Date().toISOString().split('T')[0];
    const { data } = await this.supabase
      .from('kul_events')
      .select('id, title, event_date, event_time, location, created_by')
      .eq('kul_id', kulId)
      .gte('event_date', today)
      .order('event_date')
      .limit(limit);
    return data ?? [];
  }

  // ── RSVP to a satsang ──

  async rsvpSatsang(
    userId: string,
    eventId: string,
    kulId: string,
    attending: boolean
  ): Promise<boolean> {
    const { error } = await this.supabase
      .from('kul_messages')
      .upsert({
        kul_id:   kulId,
        user_id:  userId,
        message:  attending ? 'attending' : 'not_attending',
        msg_type: 'rsvp',
        metadata: { event_id: eventId, attending },
      }, { onConflict: 'kul_id,user_id,msg_type' });
    return !error;
  }

  // ── Seva logging ──
  // Records a service act in sadhana_events and posts to kul feed.

  async logSeva(
    userId: string,
    description: string,
    options: {
      kulId?: string;
      sevaType?: SevaType;
      durationMinutes?: number;
      location?: string;
    } = {}
  ): Promise<boolean> {
    const { error } = await this.supabase.from('sadhana_events').insert({
      user_id:    userId,
      event_type: 'mandali_event_attended',
      event_data: {
        seva_type:        options.sevaType ?? 'other',
        description,
        kul_id:           options.kulId ?? null,
        duration_minutes: options.durationMinutes ?? null,
        location:         options.location ?? null,
      },
    });

    if (!error && options.kulId) {
      await this.supabase.from('kul_messages').insert({
        kul_id:   options.kulId,
        user_id:  userId,
        message:  `🙏 Seva: ${description}`,
        msg_type: 'seva',
        metadata: { seva_type: options.sevaType ?? 'other', duration_minutes: options.durationMinutes ?? null },
      });
    }

    return !error;
  }

  // ── Get seva history ──

  async getSevaHistory(userId: string, limit = 20): Promise<Array<{
    description: string;
    seva_type: string;
    kul_id: string | null;
    duration_minutes: number | null;
    location: string | null;
    logged_at: string;
  }>> {
    const { data } = await this.supabase
      .from('sadhana_events')
      .select('event_data, created_at')
      .eq('user_id', userId)
      .eq('event_type', 'mandali_event_attended')
      .order('created_at', { ascending: false })
      .limit(limit);

    return (data ?? []).map(r => ({
      description:      (r.event_data as Record<string, unknown>).description as string ?? '',
      seva_type:        (r.event_data as Record<string, unknown>).seva_type as string ?? 'other',
      kul_id:           (r.event_data as Record<string, unknown>).kul_id as string ?? null,
      duration_minutes: (r.event_data as Record<string, unknown>).duration_minutes as number ?? null,
      location:         (r.event_data as Record<string, unknown>).location as string ?? null,
      logged_at:        r.created_at,
    }));
  }

  // ── Group sankalpa challenge ──
  // The whole kul commits to a collective japa/shloka target.

  async createGroupChallenge(
    createdBy: string,
    kulId: string,
    challenge: {
      title: string;
      description: string;
      challengeType: 'japa' | 'shloka' | 'vrata' | 'seva';
      targetTotal: number;
      endDate: Date;
    }
  ): Promise<{ id: string } | null> {
    const { data, error } = await this.supabase
      .from('kul_tasks')
      .insert({
        kul_id:       kulId,
        assigned_to:  null,
        assigned_by:  createdBy,
        title:        challenge.title,
        description:  challenge.description,
        task_type:    challenge.challengeType,
        due_date:     challenge.endDate.toISOString().split('T')[0],
        completed:    false,
        guardian_note:`Group challenge — target: ${challenge.targetTotal.toLocaleString()}`,
        metadata: { is_group_challenge: true, target_total: challenge.targetTotal, progress_total: 0 },
      })
      .select('id')
      .single();

    if (error) {
      if (this.config.debug) console.error('[MandaliManager] createGroupChallenge failed:', error.message);
      return null;
    }

    await this.supabase.from('kul_messages').insert({
      kul_id:   kulId,
      user_id:  createdBy,
      message:  `🔥 New group challenge: ${challenge.title} — target: ${challenge.targetTotal.toLocaleString()}`,
      msg_type: 'challenge_announcement',
      metadata: { task_id: data.id, target: challenge.targetTotal },
    });

    return data;
  }

  // ── Contribute to a group challenge ──

  async contributeToChallenge(
    userId: string,
    kulId: string,
    taskId: string,
    contribution: number
  ): Promise<boolean> {
    const { data: task } = await this.supabase
      .from('kul_tasks')
      .select('metadata, title')
      .eq('id', taskId)
      .single();

    if (!task) return false;

    const meta     = (task.metadata as Record<string, unknown>) ?? {};
    const newTotal = ((meta.progress_total as number) ?? 0) + contribution;
    const target   = (meta.target_total as number) ?? 0;
    const done     = target > 0 && newTotal >= target;

    await this.supabase.from('kul_tasks').update({
      metadata:     { ...meta, progress_total: newTotal },
      completed:    done,
      completed_at: done ? new Date().toISOString() : null,
    }).eq('id', taskId);

    await this.supabase.from('kul_messages').insert({
      kul_id:   kulId,
      user_id:  userId,
      message:  `+${contribution.toLocaleString()} toward "${task.title}" (${newTotal.toLocaleString()}${target > 0 ? '/' + target.toLocaleString() : ''})`,
      msg_type: 'challenge_update',
      metadata: { task_id: taskId, contribution, new_total: newTotal },
    });

    return true;
  }

  // ── Find members who share kuls with you ──

  async getSharedKulMembers(userId: string): Promise<Array<{
    user_id: string;
    shared_kul_count: number;
    kul_ids: string[];
  }>> {
    const { data: myKuls } = await this.supabase
      .from('kul_members')
      .select('kul_id')
      .eq('user_id', userId);

    if (!myKuls?.length) return [];
    const myKulIds = myKuls.map(k => k.kul_id);

    const { data: members } = await this.supabase
      .from('kul_members')
      .select('user_id, kul_id')
      .in('kul_id', myKulIds)
      .neq('user_id', userId);

    if (!members?.length) return [];

    const grouped: Record<string, string[]> = {};
    for (const m of members) {
      if (!grouped[m.user_id]) grouped[m.user_id] = [];
      grouped[m.user_id].push(m.kul_id);
    }

    return Object.entries(grouped)
      .map(([uid, kuls]) => ({ user_id: uid, shared_kul_count: kuls.length, kul_ids: kuls }))
      .sort((a, b) => b.shared_kul_count - a.shared_kul_count);
  }

  // ── Share a festival greeting with the kul ──

  async shareGreeting(
    userId: string,
    kulId: string,
    festivalName: string,
    message?: string
  ): Promise<boolean> {
    const { error } = await this.supabase.from('kul_messages').insert({
      kul_id:   kulId,
      user_id:  userId,
      message:  message ?? `🙏 ${festivalName} ki shubhkamnayein! May this auspicious day bring joy to all.`,
      msg_type: 'greeting',
      metadata: { festival: festivalName },
    });

    if (!error) {
      await this.supabase.from('sadhana_events').insert({
        user_id:    userId,
        event_type: 'greeting_shared',
        event_data: { festival: festivalName, kul_id: kulId },
      });
    }

    return !error;
  }
}

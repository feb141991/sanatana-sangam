// ============================================================
// Tirtha Library — Pilgrimage & Temple Tracker (Phase 4)
//
// Browse tirthas, log visits, plan yatras, and get
// AI-generated preparation guides via ai-yatra-guide.
//
// Usage:
//   const tirtha = new TirthaLibrary(supabase, config);
//   const jyotirlingas = await tirtha.getByType('jyotirlinga');
//   const guide = await tirtha.getYatraGuide(userId, 'kedarnath');
//   await tirtha.logVisit(userId, tirtha.id, new Date());
//   const progress = await tirtha.getProgress(userId);
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { SadhanaEngineConfig } from '../types';

export type TirthaType =
  | 'char_dham'
  | 'chota_char_dham'
  | 'jyotirlinga'
  | 'shakti_peeth'
  | 'divya_desam'
  | 'pancha_dwaraka'
  | 'kshetra'
  | 'river'
  | 'other';

export type YatraContext = 'planning' | 'arriving' | 'completed';

export interface Tirtha {
  id: string;
  slug: string;
  name: string;
  name_sanskrit: string | null;
  deity: string | null;
  tradition: string | null;
  tirtha_type: TirthaType;
  series_name: string | null;
  series_number: number | null;
  state: string | null;
  country: string;
  lat: number | null;
  lng: number | null;
  elevation_m: number | null;
  significance: string | null;
  best_months: string[] | null;
  darshan_url: string | null;
  tags: string[] | null;
}

export interface TirthaVisit {
  id: string;
  user_id: string;
  tirtha_id: string;
  visited_at: string;
  notes: string | null;
  created_at: string;
}

export interface YatraGuide {
  guide: string;
  arrival_prayer: string | null;
  mantras: string[];
  checklist: string[];
  darshan_tips: string[];
  what_to_pray: string | null;
  post_visit: string | null;
  tirtha: Tirtha;
  visit_count: number;
  last_visited: string | null;
  generated_at: string;
}

export interface YatraProgress {
  user_id: string;
  tirtha_type: string;
  series_name: string;
  total_in_series: number;
  visited: number;
  pct_complete: number;
}

export interface YatraPlan {
  id: string;
  user_id: string;
  name: string;
  description: string | null;
  tirtha_ids: string[];
  status: 'planned' | 'in_progress' | 'completed' | 'cancelled';
  target_date: string | null;
  started_at: string | null;
  completed_at: string | null;
  created_at: string;
}

export interface TirthaFilter {
  type?: TirthaType;
  tradition?: string;
  state?: string;
  seriesName?: string;
  tags?: string[];
}

export class TirthaLibrary {
  private supabase: SupabaseClient;
  private config: SadhanaEngineConfig;

  constructor(supabase: SupabaseClient, config: SadhanaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Browse tirthas ──

  async getAll(filter?: TirthaFilter): Promise<Tirtha[]> {
    let query = this.supabase
      .from('tirthas')
      .select('*')
      .order('series_name', { nullsFirst: false })
      .order('series_number');

    if (filter?.type)       query = query.eq('tirtha_type', filter.type);
    if (filter?.tradition)  query = query.eq('tradition', filter.tradition);
    if (filter?.state)      query = query.eq('state', filter.state);
    if (filter?.seriesName) query = query.eq('series_name', filter.seriesName);
    if (filter?.tags?.length) query = query.overlaps('tags', filter.tags);

    const { data } = await query;
    return (data ?? []) as Tirtha[];
  }

  async getByType(type: TirthaType): Promise<Tirtha[]> {
    return this.getAll({ type });
  }

  async getBySlug(slug: string): Promise<Tirtha | null> {
    const { data } = await this.supabase
      .from('tirthas')
      .select('*')
      .eq('slug', slug)
      .single();
    return data as Tirtha | null;
  }

  async getById(id: string): Promise<Tirtha | null> {
    const { data } = await this.supabase
      .from('tirthas')
      .select('*')
      .eq('id', id)
      .single();
    return data as Tirtha | null;
  }

  // ── Find tirthas near a coordinate ──
  // Simple bounding-box filter (no PostGIS needed).

  async getNearby(lat: number, lng: number, radiusKm = 100): Promise<Tirtha[]> {
    // ~1 degree latitude = 111km
    const latDelta = radiusKm / 111;
    const lngDelta = radiusKm / (111 * Math.cos(lat * Math.PI / 180));

    const { data } = await this.supabase
      .from('tirthas')
      .select('*')
      .gte('lat', lat - latDelta)
      .lte('lat', lat + latDelta)
      .gte('lng', lng - lngDelta)
      .lte('lng', lng + lngDelta)
      .not('lat', 'is', null);

    return (data ?? []) as Tirtha[];
  }

  // ── AI yatra guide ──

  async getYatraGuide(
    userId: string,
    tirthaSlugOrId: string,
    context: YatraContext = 'planning'
  ): Promise<YatraGuide | null> {
    const isUuid = /^[0-9a-f-]{36}$/i.test(tirthaSlugOrId);
    try {
      const { data, error } = await this.supabase.functions.invoke('ai-yatra-guide', {
        body: {
          user_id:      userId,
          tirtha_slug:  isUuid ? undefined : tirthaSlugOrId,
          tirtha_id:    isUuid ? tirthaSlugOrId : undefined,
          context,
        },
      });
      if (error) throw error;
      return data as YatraGuide;
    } catch (err) {
      if (this.config.debug) console.error('[TirthaLibrary] getYatraGuide failed:', err);
      return null;
    }
  }

  // ── Log a visit ──

  async logVisit(
    userId: string,
    tirthaId: string,
    visitedAt: Date = new Date(),
    notes?: string
  ): Promise<TirthaVisit | null> {
    const { data, error } = await this.supabase
      .from('tirtha_visits')
      .upsert({
        user_id:    userId,
        tirtha_id:  tirthaId,
        visited_at: visitedAt.toISOString().split('T')[0],
        notes:      notes ?? null,
      }, { onConflict: 'user_id,tirtha_id,visited_at' })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[TirthaLibrary] logVisit failed:', error.message);
      return null;
    }
    return data as TirthaVisit;
  }

  // ── Get visit history ──

  async getVisits(userId: string): Promise<(TirthaVisit & { tirtha: Tirtha })[]> {
    const { data } = await this.supabase
      .from('tirtha_visits')
      .select('*, tirtha:tirthas(*)')
      .eq('user_id', userId)
      .order('visited_at', { ascending: false });

    return (data ?? []) as (TirthaVisit & { tirtha: Tirtha })[];
  }

  async hasVisited(userId: string, tirthaId: string): Promise<boolean> {
    const { count } = await this.supabase
      .from('tirtha_visits')
      .select('id', { count: 'exact', head: true })
      .eq('user_id', userId)
      .eq('tirtha_id', tirthaId);

    return (count ?? 0) > 0;
  }

  // ── Series completion progress ──
  // Uses the user_tirtha_progress view (from migration 008).

  async getProgress(userId: string): Promise<YatraProgress[]> {
    const { data } = await this.supabase
      .from('user_tirtha_progress')
      .select('*')
      .eq('user_id', userId)
      .order('pct_complete', { ascending: false });

    return (data ?? []) as YatraProgress[];
  }

  async getSeriesProgress(
    userId: string,
    seriesName: string
  ): Promise<YatraProgress | null> {
    const { data } = await this.supabase
      .from('user_tirtha_progress')
      .select('*')
      .eq('user_id', userId)
      .eq('series_name', seriesName)
      .single();

    return data as YatraProgress | null;
  }

  // ── Yatra plans ──

  async createPlan(
    userId: string,
    name: string,
    tirthaIds: string[],
    options?: { description?: string; targetDate?: Date }
  ): Promise<YatraPlan | null> {
    const { data, error } = await this.supabase
      .from('yatra_plans')
      .insert({
        user_id:     userId,
        name,
        tirtha_ids:  tirthaIds,
        description: options?.description ?? null,
        target_date: options?.targetDate?.toISOString().split('T')[0] ?? null,
      })
      .select()
      .single();

    if (error) {
      if (this.config.debug) console.error('[TirthaLibrary] createPlan failed:', error.message);
      return null;
    }
    return data as YatraPlan;
  }

  async getPlans(userId: string): Promise<YatraPlan[]> {
    const { data } = await this.supabase
      .from('yatra_plans')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    return (data ?? []) as YatraPlan[];
  }

  async updatePlanStatus(
    planId: string,
    userId: string,
    status: YatraPlan['status']
  ): Promise<boolean> {
    const updates: Record<string, unknown> = { status };
    if (status === 'in_progress') updates.started_at = new Date().toISOString().split('T')[0];
    if (status === 'completed')   updates.completed_at = new Date().toISOString().split('T')[0];

    const { error } = await this.supabase
      .from('yatra_plans')
      .update(updates)
      .eq('id', planId)
      .eq('user_id', userId);

    return !error;
  }

  // ── Convenience: unvisited tirthas in a series ──

  async getUnvisited(userId: string, seriesName: string): Promise<Tirtha[]> {
    const visits = await this.getVisits(userId);
    const visitedIds = new Set(visits.map(v => v.tirtha_id));
    const all = await this.getAll({ seriesName });
    return all.filter(t => !visitedIds.has(t.id));
  }
}

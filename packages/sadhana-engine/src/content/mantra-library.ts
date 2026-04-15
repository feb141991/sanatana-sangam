// ============================================================
// Mantra Library — Phase 2
//
// Client-side module for browsing, filtering and selecting mantras.
// Data is seeded from supabase/seed/mantra-library.json and stored
// in Supabase (mantras table) OR accessed as a bundled local JSON
// for offline-first use.
//
// Usage:
//   const lib = new MantraLibrary(supabase);
//   const daily = await lib.getDailyMantra(userId);
//   const byDeity = await lib.getByDeity('Shiva');
//   const search = await lib.search('protection');
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { Mantra, Tradition } from '../types';

export type MantraLevel = 'beginner' | 'intermediate' | 'advanced';

export interface MantraEntry extends Mantra {
  meaning: string;
  description: string;
  japa_instructions: string;
  tags: string[];
  recommended_rounds: number;
  level: MantraLevel;
}

export interface MantraFilter {
  tradition?: Tradition;
  deity?: string;
  level?: MantraLevel;
  tags?: string[];
  search?: string;
}

// Recommended starter mantras per tradition — shown to new users
const STARTER_MANTRAS: Record<Tradition | 'general', string> = {
  vaishnav: 'om_namo_bhagavate_vasudevaya',
  shaiv:    'om_namah_shivaya',
  shakta:   'om_dum_durgayei_namaha',
  smarta:   'gayatri_mantra',
  general:  'gayatri_mantra',
};

// Mantras especially suited for brahma muhurta (predawn practice)
const BRAHMA_MUHURTA_MANTRAS = [
  'gayatri_mantra', 'mahamrityunjaya', 'om_namah_shivaya',
  'om_namo_bhagavate_vasudevaya', 'hare_krishna_maha_mantra',
  'vishnu_gayatri', 'shiva_gayatri',
];

export class MantraLibrary {
  private supabase: SupabaseClient;
  private cache: MantraEntry[] | null = null;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // ── Fetch all mantras (cached) ──

  async getAll(): Promise<MantraEntry[]> {
    if (this.cache) return this.cache;

    const { data, error } = await this.supabase
      .from('mantras')
      .select('*')
      .order('name', { ascending: true });

    if (error) throw new Error(`Failed to fetch mantras: ${error.message}`);
    this.cache = (data ?? []) as MantraEntry[];
    return this.cache;
  }

  // ── Get a single mantra by ID ──

  async getById(id: string): Promise<MantraEntry | null> {
    const all = await this.getAll();
    return all.find(m => m.id === id) ?? null;
  }

  // ── Filter mantras ──

  async filter(filters: MantraFilter): Promise<MantraEntry[]> {
    let all = await this.getAll();

    if (filters.tradition) {
      all = all.filter(m => m.tradition === filters.tradition || m.tradition === 'general');
    }
    if (filters.deity) {
      all = all.filter(m => m.deity.toLowerCase().includes(filters.deity!.toLowerCase()));
    }
    if (filters.level) {
      all = all.filter(m => m.level === filters.level);
    }
    if (filters.tags?.length) {
      all = all.filter(m => filters.tags!.some(t => m.tags.includes(t)));
    }
    if (filters.search) {
      const q = filters.search.toLowerCase();
      all = all.filter(m =>
        m.name.toLowerCase().includes(q) ||
        m.meaning.toLowerCase().includes(q) ||
        m.deity.toLowerCase().includes(q) ||
        m.tags.some(t => t.includes(q))
      );
    }

    return all;
  }

  // ── Get mantras by deity ──

  async getByDeity(deity: string): Promise<MantraEntry[]> {
    return this.filter({ deity });
  }

  // ── Get mantras by tradition ──

  async getByTradition(tradition: Tradition): Promise<MantraEntry[]> {
    return this.filter({ tradition });
  }

  // ── Get beginner mantras — for onboarding ──

  async getBeginnerMantras(): Promise<MantraEntry[]> {
    return this.filter({ level: 'beginner' });
  }

  // ── Get the recommended starter mantra for a tradition ──

  async getStarterMantra(tradition: Tradition | 'general'): Promise<MantraEntry | null> {
    const id = STARTER_MANTRAS[tradition] ?? STARTER_MANTRAS['general'];
    return this.getById(id);
  }

  // ── Get mantras for brahma muhurta ──

  async getBrahmaMuhurtaMantras(): Promise<MantraEntry[]> {
    const all = await this.getAll();
    return all.filter(m => BRAHMA_MUHURTA_MANTRAS.includes(m.id));
  }

  // ── Get the day's recommended mantra for a user ──
  // Rotates through mantras appropriate for their tradition,
  // biased toward mantras they haven't done recently.

  async getDailyMantra(
    userId: string,
    tradition: Tradition = 'general'
  ): Promise<MantraEntry> {
    // Get mantras for this tradition
    const pool = await this.filter({ tradition });

    // Get recently used mantra IDs from events
    const { data: recentEvents } = await this.supabase
      .from('sadhana_events')
      .select('event_data')
      .eq('user_id', userId)
      .eq('event_type', 'japa_session')
      .order('created_at', { ascending: false })
      .limit(14);

    const recentIds = new Set(
      (recentEvents ?? []).map(e => (e.event_data as Record<string, string>)?.mantra_id).filter(Boolean)
    );

    // Prefer mantras not done recently
    const fresh = pool.filter(m => !recentIds.has(m.id));
    const candidates = fresh.length > 0 ? fresh : pool;

    // Deterministic daily rotation based on date
    const dayOfYear = Math.floor(Date.now() / 86400000);
    return candidates[dayOfYear % candidates.length];
  }

  // ── Get mantras suitable for a vrata ──

  async getVrataMantras(vrataName: string): Promise<MantraEntry[]> {
    const vrataMap: Record<string, string[]> = {
      'Ekadashi':            ['om_namo_bhagavate_vasudevaya', 'vishnu_gayatri', 'om_namo_narayanaya'],
      'Pradosh':             ['om_namah_shivaya', 'mahamrityunjaya', 'shiva_gayatri'],
      'Sankashti Chaturthi': ['om_gam_ganapataye_namaha', 'ganesh_gayatri'],
      'Purnima':             ['gayatri_mantra', 'om_chandraya_namah', 'om_shrim_mahalakshmiyei_namaha'],
      'Amavasya':            ['mahamrityunjaya', 'om_namah_shivaya', 'pitru_tarpana_mantra'],
      'Som Vaar':            ['om_namah_shivaya', 'mahamrityunjaya'],
      'Brihaspati Vaar':     ['om_namo_bhagavate_vasudevaya', 'vishnu_gayatri'],
      'Shukra Vaar':         ['om_shrim_mahalakshmiyei_namaha', 'lakshmi_gayatri'],
      'Shani Vaar':          ['om_hanumate_namah', 'om_sri_ramaya_namah'],
    };

    const ids = vrataMap[vrataName] ?? [];
    if (ids.length === 0) return this.getBrahmaMuhurtaMantras();

    const all = await this.getAll();
    return all.filter(m => ids.includes(m.id));
  }

  // ── Search ──

  async search(query: string): Promise<MantraEntry[]> {
    return this.filter({ search: query });
  }

  // ── Clear cache (call after seeding new data) ──

  clearCache() {
    this.cache = null;
  }
}

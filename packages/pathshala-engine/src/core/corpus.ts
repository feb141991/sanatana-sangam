// ============================================================
// Corpus — browse and search the scripture library
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type {
  ScriptureChunk, ScriptureTranslation,
  CorpusFilter, TextCategory, PathshalaEngineConfig,
} from '../types';

export class Corpus {
  private supabase: SupabaseClient;
  private config:   PathshalaEngineConfig;

  constructor(supabase: SupabaseClient, config: PathshalaEngineConfig) {
    this.supabase = supabase;
    this.config   = config;
  }

  // ── Browse ────────────────────────────────────────────────────────────────

  /** List all distinct text_ids in the corpus (book names) */
  async listTexts(filter?: { language?: string; text_category?: TextCategory }): Promise<
    Array<{ text_id: string; language: string; text_category: string; chunk_count: number }>
  > {
    let query = this.supabase
      .from('scripture_chunks')
      .select('text_id, language, text_category')
      .order('text_id');

    if (filter?.language)      query = query.eq('language', filter.language);
    if (filter?.text_category) query = query.eq('text_category', filter.text_category);

    const { data } = await query;
    if (!data) return [];

    // Group by text_id and count
    const map = new Map<string, { text_id: string; language: string; text_category: string; chunk_count: number }>();
    for (const row of data) {
      const key = row.text_id;
      if (map.has(key)) {
        map.get(key)!.chunk_count++;
      } else {
        map.set(key, { text_id: row.text_id, language: row.language, text_category: row.text_category, chunk_count: 1 });
      }
    }
    return Array.from(map.values()).sort((a, b) => a.text_id.localeCompare(b.text_id));
  }

  /** List chapters for a text */
  async listChapters(textId: string): Promise<number[]> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('chapter')
      .eq('text_id', textId)
      .not('chapter', 'is', null)
      .order('chapter');

    if (!data) return [];
    const chapters = [...new Set(data.map(r => r.chapter as number))];
    return chapters.sort((a, b) => a - b);
  }

  /** Get verses for a text + chapter */
  async getChapter(textId: string, chapter: number): Promise<ScriptureChunk[]> {
    const { data, error } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .order('verse');

    if (error && this.config.debug) console.error('[Corpus] getChapter:', error.message);
    return (data ?? []) as ScriptureChunk[];
  }

  /** Get a single verse */
  async getVerse(textId: string, chapter: number, verse: number): Promise<ScriptureChunk | null> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();

    return (data ?? null) as ScriptureChunk | null;
  }

  /** Get chunk by ID */
  async getById(chunkId: string): Promise<ScriptureChunk | null> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('id', chunkId)
      .single();

    return (data ?? null) as ScriptureChunk | null;
  }

  /** Filter chunks by multiple criteria */
  async filter(f: CorpusFilter, limit = 50): Promise<ScriptureChunk[]> {
    let query = this.supabase
      .from('scripture_chunks')
      .select('*')
      .limit(limit);

    if (f.text_id)          query = query.eq('text_id', f.text_id);
    if (f.language)         query = query.eq('language', f.language);
    if (f.tradition_region) query = query.eq('tradition_region', f.tradition_region);
    if (f.chapter)          query = query.eq('chapter', f.chapter);

    if (f.text_category) {
      if (Array.isArray(f.text_category)) {
        query = query.in('text_category', f.text_category);
      } else {
        query = query.eq('text_category', f.text_category);
      }
    }

    if (f.tags && f.tags.length > 0) {
      query = query.overlaps('tags', f.tags);
    }

    const { data, error } = await query;
    if (error && this.config.debug) console.error('[Corpus] filter:', error.message);
    return (data ?? []) as ScriptureChunk[];
  }

  /** Full-text search across translation + tags */
  async search(query: string, limit = 20): Promise<ScriptureChunk[]> {
    const { data, error } = await this.supabase
      .rpc('match_scriptures_text', {
        query_text:       query,
        match_count:      limit,
        match_threshold:  0.05,
        filter_text_ids:  null,
      });

    if (error && this.config.debug) console.error('[Corpus] search:', error.message);
    return (data ?? []) as ScriptureChunk[];
  }

  /** Random verse — optionally filtered by category/tradition */
  async random(filter?: { text_category?: TextCategory; language?: string }): Promise<ScriptureChunk | null> {
    const chunks = await this.filter({ ...filter }, 100);
    if (!chunks.length) return null;
    return chunks[Math.floor(Math.random() * chunks.length)];
  }

  // ── Translations ──────────────────────────────────────────────────────────

  /** Get all translations for a chunk */
  async getTranslations(chunkId: string): Promise<ScriptureTranslation[]> {
    const { data } = await this.supabase
      .from('pathshala_translations')
      .select('*')
      .eq('chunk_id', chunkId)
      .order('verified', { ascending: false });

    return (data ?? []) as ScriptureTranslation[];
  }

  /** Get translation in a specific language */
  async getTranslation(chunkId: string, language: string): Promise<ScriptureTranslation | null> {
    const { data } = await this.supabase
      .from('pathshala_translations')
      .select('*')
      .eq('chunk_id', chunkId)
      .eq('language', language)
      .maybeSingle();

    return (data ?? null) as ScriptureTranslation | null;
  }

  /** Best available translation: prefer verified, then ai-generated, then original */
  async getBestTranslation(chunkId: string, preferredLang: string): Promise<string | null> {
    const translation = await this.getTranslation(chunkId, preferredLang);
    if (translation) return translation.translation;

    // Fallback to English
    if (preferredLang !== 'en') {
      const en = await this.getTranslation(chunkId, 'en');
      if (en) return en.translation;
    }

    // Fallback to original translation column on scripture_chunks
    const chunk = await this.getById(chunkId);
    return chunk?.translation ?? null;
  }
}

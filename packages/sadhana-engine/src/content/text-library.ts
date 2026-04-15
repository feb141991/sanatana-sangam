// ============================================================
// Text Library — scripture content management
// Loads from Supabase, provides verse navigation
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';
import type { ScriptureVerse, ReadingProgress } from '../types';

export interface TextMetadata {
  id: string;
  name: string;
  sanskrit_name: string;
  chapters: number;
  total_verses: number;
  tradition: string;
  description: string;
}

export const AVAILABLE_TEXTS: TextMetadata[] = [
  { id: 'gita', name: 'Bhagavad Gita', sanskrit_name: 'श्रीमद्भगवद्गीता', chapters: 18, total_verses: 700, tradition: 'general', description: 'Song of God — Krishna\'s teachings to Arjuna' },
  { id: 'isha', name: 'Isha Upanishad', sanskrit_name: 'ईशोपनिषद्', chapters: 1, total_verses: 18, tradition: 'general', description: 'The Lord dwells in everything' },
  { id: 'kena', name: 'Kena Upanishad', sanskrit_name: 'केनोपनिषद्', chapters: 4, total_verses: 35, tradition: 'general', description: 'By whom is the mind directed?' },
  { id: 'katha', name: 'Katha Upanishad', sanskrit_name: 'कठोपनिषद्', chapters: 6, total_verses: 119, tradition: 'general', description: 'Nachiketa\'s dialogue with Death' },
  { id: 'mundaka', name: 'Mundaka Upanishad', sanskrit_name: 'मुण्डकोपनिषद्', chapters: 3, total_verses: 64, tradition: 'general', description: 'Higher and lower knowledge' },
  { id: 'mandukya', name: 'Mandukya Upanishad', sanskrit_name: 'माण्डूक्योपनिषद्', chapters: 1, total_verses: 12, tradition: 'general', description: 'AUM and states of consciousness' },
  { id: 'vishnu_sahasranama', name: 'Vishnu Sahasranama', sanskrit_name: 'विष्णुसहस्रनाम', chapters: 1, total_verses: 107, tradition: 'vaishnav', description: '1000 names of Lord Vishnu' },
  { id: 'hanuman_chalisa', name: 'Hanuman Chalisa', sanskrit_name: 'हनुमान चालीसा', chapters: 1, total_verses: 43, tradition: 'vaishnav', description: '40 verses praising Lord Hanuman' },
  { id: 'sunderkand', name: 'Sunderkand', sanskrit_name: 'सुन्दरकाण्ड', chapters: 1, total_verses: 60, tradition: 'vaishnav', description: 'Hanuman\'s journey to Lanka' },
];

export class TextLibrary {
  private supabase: SupabaseClient;

  constructor(supabase: SupabaseClient) {
    this.supabase = supabase;
  }

  // Get all available texts
  getAvailableTexts(): TextMetadata[] {
    return AVAILABLE_TEXTS;
  }

  // Get text metadata by ID
  getTextInfo(textId: string): TextMetadata | undefined {
    return AVAILABLE_TEXTS.find(t => t.id === textId);
  }

  // Get a specific verse
  async getVerse(textId: string, chapter: number, verse: number): Promise<ScriptureVerse | null> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();
    return data;
  }

  // Get all verses in a chapter
  async getChapter(textId: string, chapter: number): Promise<ScriptureVerse[]> {
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .order('verse', { ascending: true });
    return data || [];
  }

  // Get next unread verse for a user
  async getNextVerse(userId: string, textId: string): Promise<ScriptureVerse | null> {
    // Find their latest reading position
    const { data: progress } = await this.supabase
      .from('reading_progress')
      .select('chapter, verse')
      .eq('user_id', userId)
      .eq('text_id', textId)
      .eq('completed', true)
      .order('chapter', { ascending: false })
      .order('verse', { ascending: false })
      .limit(1);

    let nextChapter = 1;
    let nextVerse = 1;

    if (progress?.length) {
      nextChapter = progress[0].chapter;
      nextVerse = progress[0].verse + 1;
    }

    // Try to get next verse in same chapter
    let verse = await this.getVerse(textId, nextChapter, nextVerse);

    // If no more verses in chapter, go to next chapter
    if (!verse) {
      verse = await this.getVerse(textId, nextChapter + 1, 1);
    }

    return verse;
  }

  // Get random verse (for daily shloka when no AI is available)
  async getRandomVerse(textId = 'gita'): Promise<ScriptureVerse | null> {
    // Count total verses
    const { count } = await this.supabase
      .from('scripture_chunks')
      .select('*', { count: 'exact', head: true })
      .eq('text_id', textId);

    if (!count) return null;

    const offset = Math.floor(Math.random() * count);
    const { data } = await this.supabase
      .from('scripture_chunks')
      .select('*')
      .eq('text_id', textId)
      .order('chapter')
      .order('verse')
      .range(offset, offset)
      .single();

    return data;
  }

  // Get user's reading progress for a text
  async getProgress(userId: string, textId: string): Promise<{
    completed: number;
    total: number;
    percentage: number;
    current_chapter: number;
    current_verse: number;
    bookmarked: ScriptureVerse[];
  }> {
    const textInfo = this.getTextInfo(textId);
    const total = textInfo?.total_verses || 0;

    const { data: progress } = await this.supabase
      .from('reading_progress')
      .select('chapter, verse, bookmarked')
      .eq('user_id', userId)
      .eq('text_id', textId)
      .eq('completed', true);

    const completed = progress?.length || 0;
    const lastRead = progress?.sort((a, b) =>
      a.chapter !== b.chapter ? b.chapter - a.chapter : b.verse - a.verse
    )[0];

    // Get bookmarked verses with full content
    const bookmarkedRefs = progress?.filter(p => p.bookmarked) || [];
    const bookmarked: ScriptureVerse[] = [];

    for (const ref of bookmarkedRefs.slice(0, 10)) {
      const verse = await this.getVerse(textId, ref.chapter, ref.verse);
      if (verse) bookmarked.push(verse);
    }

    return {
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0,
      current_chapter: lastRead?.chapter || 1,
      current_verse: lastRead?.verse || 0,
      bookmarked,
    };
  }

  // Mark a verse as read
  async markRead(userId: string, textId: string, chapter: number, verse: number, timeSpentS: number): Promise<void> {
    await this.supabase.from('reading_progress').upsert({
      user_id: userId,
      text_id: textId,
      chapter,
      verse,
      completed: true,
      time_spent_s: timeSpentS,
      read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,text_id,chapter,verse' });
  }

  // Toggle bookmark
  async toggleBookmark(userId: string, textId: string, chapter: number, verse: number): Promise<boolean> {
    const { data } = await this.supabase
      .from('reading_progress')
      .select('bookmarked')
      .eq('user_id', userId)
      .eq('text_id', textId)
      .eq('chapter', chapter)
      .eq('verse', verse)
      .single();

    const newState = !(data?.bookmarked || false);

    await this.supabase.from('reading_progress').upsert({
      user_id: userId,
      text_id: textId,
      chapter,
      verse,
      bookmarked: newState,
      read_at: new Date().toISOString(),
    }, { onConflict: 'user_id,text_id,chapter,verse' });

    return newState;
  }
}

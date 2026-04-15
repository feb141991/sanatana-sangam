// ============================================================
// @sangam/sadhana-engine — Type definitions
// ============================================================

// --- Event types ---

export type SadhanaEventType =
  | 'app_open'
  | 'japa_session'
  | 'japa_bead_tap'
  | 'shloka_read'
  | 'shloka_bookmark'
  | 'shloka_listen'
  | 'panchang_viewed'
  | 'vrata_observed'
  | 'tirtha_visited'
  | 'tirtha_saved'
  | 'mandali_joined'
  | 'mandali_event_attended'
  | 'greeting_shared'
  | 'streak_break'
  | 'streak_recovered'
  | 'sankalpa_created'
  | 'sankalpa_completed'
  | 'notification_opened'
  | 'notification_dismissed';

export interface SadhanaEvent {
  id?: string;
  user_id: string;
  event_type: SadhanaEventType;
  event_data: Record<string, unknown>;
  created_at?: string;
  synced?: boolean; // false = still in offline queue
}

// --- Japa types ---

export interface JapaSession {
  mantra_id: string;
  mantra_name: string;
  rounds_completed: number;
  beads_count: number;
  duration_seconds: number;
  completed: boolean;
  started_at: string;
  completed_at?: string;
}

export interface Mantra {
  id: string;
  name: string;
  sanskrit: string;
  transliteration: string;
  deity: string;
  tradition: Tradition;
  beads_per_round: number; // usually 108
  audio_url?: string;
  description?: string;
}

// --- Shastra types ---

export interface ScriptureVerse {
  id?: string;
  text_id: string; // 'gita', 'isha_upanishad', etc.
  chapter: number;
  verse: number;
  sanskrit: string;
  transliteration?: string;
  translation: string;
  word_by_word?: Record<string, string>;
  commentary?: string;
  tags: string[];
  embedding?: number[]; // vector for pgvector
}

export interface ReadingProgress {
  user_id: string;
  text_id: string;
  chapter: number;
  verse: number;
  completed: boolean;
  bookmarked: boolean;
  read_at: string;
}

// --- Panchang types ---

export interface Panchang {
  date: string;
  tithi: string;
  tithi_number: number; // 1-30
  paksha: 'shukla' | 'krishna';
  nakshatra: string;
  yoga: string;
  karana: string;
  masa: string;
  ritu: string;
  samvatsara: string;
  sunrise: string;
  sunset: string;
  vratas: Vrata[];
  festivals: Festival[];
}

export interface Vrata {
  name: string;
  type: 'ekadashi' | 'pradosh' | 'chaturthi' | 'purnima' | 'amavasya' | 'other';
  deity: string;
  fasting_rules?: string;
  katha_id?: string;
  special_practice?: string;
}

export interface Festival {
  name: string;
  description: string;
  regional: boolean;
  regions?: string[];
}

// --- Profile types ---

export type Tradition = 'vaishnav' | 'shaiv' | 'shakta' | 'smarta' | 'general';
export type SpiritualPath = 'bhakti' | 'jnana' | 'karma' | 'dhyana';
export type ContentDepth = 'beginner' | 'intermediate' | 'advanced';
export type PracticeTime = 'brahma_muhurta' | 'morning' | 'evening' | 'irregular';
export type NudgeStyle = 'gentle' | 'challenge' | 'community' | 'unknown';

export interface UserPracticeProfile {
  user_id: string;

  // Practice rhythm
  preferred_time: PracticeTime;
  avg_session_duration_s: number;
  consistency_score: number; // 0-1
  current_streak: number;
  longest_streak: number;

  // Spiritual profile
  primary_path: SpiritualPath;
  preferred_deity: string;
  tradition: Tradition;

  // Content preferences
  content_depth: ContentDepth;
  language_pref: string[];
  favorite_texts: string[];

  // Engagement patterns
  most_active_day: string;
  skip_pattern: {
    common_skip_days: string[];
    avg_skip_after_days: number;
  };
  re_engagement_style: NudgeStyle;

  updated_at: string;
}

// --- Streak types ---

export interface DailySadhana {
  id?: string;
  user_id: string;
  date: string; // YYYY-MM-DD
  japa_done: boolean;
  shloka_done: boolean;
  panchang_viewed: boolean;
  any_practice: boolean;
  streak_count: number;
}

// --- Sankalpa types ---

export type SankalpaStatus = 'active' | 'completed' | 'broken' | 'paused';

export interface Sankalpa {
  id?: string;
  user_id: string;
  type: 'japa' | 'shloka' | 'vrata' | 'custom';
  description: string;
  target_days: number; // 21, 40, 108, etc.
  target_count?: number; // for japa: total beads/rounds
  mantra_id?: string;
  text_id?: string;
  started_at: string;
  current_streak: number;
  longest_streak: number;
  status: SankalpaStatus;
  completed_at?: string;
}

// --- AI response types ---

export interface PersonalisedContent {
  shloka: ScriptureVerse;
  shloka_context: string;
  greeting: string;
  practice_suggestion: string;
  nudge?: string;
  panchang: Panchang;
  generated_at: string;
}

export interface ScriptureSearchResult {
  verse: ScriptureVerse;
  similarity: number;
  explanation?: string;
}

// --- Engine config ---

export interface SadhanaEngineConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
  aiProvider: 'gemini' | 'claude' | 'ollama';
  aiApiKey?: string;
  aiBaseUrl?: string; // for ollama: 'http://localhost:11434'
  enableOfflineQueue: boolean;
  enablePushNotifications: boolean;
  debug: boolean;
}

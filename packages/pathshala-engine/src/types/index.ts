// ============================================================
// @sangam/pathshala-engine — Shared Types
// ============================================================

import type { SupabaseClient } from '@supabase/supabase-js';

export interface PathshalaEngineConfig {
  supabaseUrl:     string;
  supabaseAnonKey: string;
  debug?:          boolean;
}

// ── Corpus ────────────────────────────────────────────────────────────────────

export type TextCategory =
  | 'shruti' | 'smriti' | 'itihasa' | 'purana' | 'darshana'
  | 'bhakti' | 'stotra' | 'doha' | 'pasuram' | 'agama' | 'tantra';

export type TraditionRegion = 'north' | 'south' | 'east' | 'west' | 'pan';

export interface ScriptureChunk {
  id:               string;
  text_id:          string;
  chapter:          number | null;
  verse:            number | null;
  sanskrit:         string | null;
  transliteration:  string | null;
  translation:      string | null;
  commentary:       string | null;
  tags:             string[];
  language:         string;
  script:           string;
  text_category:    TextCategory;
  tradition_region: TraditionRegion | null;
}

export interface ScriptureTranslation {
  id:              string;
  chunk_id:        string;
  language:        string;
  script:          string;
  translation:     string;
  transliteration: string | null;
  translator:      string | null;
  is_ai_generated: boolean;
  verified:        boolean;
}

export interface CorpusFilter {
  text_id?:          string;
  language?:         string;
  text_category?:    TextCategory | TextCategory[];
  tradition_region?: TraditionRegion;
  tags?:             string[];
  chapter?:          number;
}

// ── Paths & Enrollment ────────────────────────────────────────────────────────

export interface PathshalaPath {
  id:              string;
  slug:            string;
  title:           string;
  subtitle:        string | null;
  description:     string | null;
  language:        string;
  tradition:       string | null;
  difficulty:      'beginner' | 'intermediate' | 'advanced';
  text_category:   TextCategory;
  total_chunks:    number;
  estimated_weeks: number;
  cover_emoji:     string;
  cover_color:     string;
  is_active:       boolean;
}

export interface PathshalaEnrollment {
  id:                  string;
  user_id:             string;
  path_id:             string;
  enrolled_at:         string;
  current_position:    number;
  completed_at:        string | null;
  paused:              boolean;
  language_pref:       string;
  daily_target_chunks: number;
  last_activity_at:    string | null;
}

export interface EnrollResult {
  enrollment:  PathshalaEnrollment;
  isNew:       boolean;
  path:        PathshalaPath;
}

export interface AdvanceResult {
  status:       'advanced' | 'completed' | 'already_complete';
  position:     number;
  total_chunks: number;
  pct_complete: number;
}

// ── Progress ──────────────────────────────────────────────────────────────────

export interface LearningProgress {
  id:                  string;
  user_id:             string;
  chunk_id:            string;
  path_id:             string | null;
  read_at:             string;
  read_count:          number;
  comprehension_score: number | null;
  memorization_level:  number;
  recitation_score:    number | null;
  notes:               string | null;
}

export interface TodayLesson {
  enrollment_id:    string;
  path_id:          string;
  path_title:       string;
  cover_emoji:      string;
  current_position: number;
  chunk_id:         string;
  week_number:      number;
  day_number:       number;
  text_id:          string;
  chapter:          number | null;
  verse:            number | null;
  original_text:    string | null;
  default_translation: string | null;
  language:         string;
  script:           string;
  transliteration:  string | null;
  times_read:       number;
  best_recitation:  number;
  certified:        boolean | null;
}

// ── Shruti (Recitation) ───────────────────────────────────────────────────────

export interface RecordingUploadOptions {
  chunkId:       string;
  audioBlob:     Blob;
  language:      string;
  expectedText:  string;
  enrollmentId?: string;
}

export interface RecordingUploadResult {
  recordingId: string;
  audioPath:   string;
}

export interface RecitationScore {
  uccharan: number | null;
  sandhi:   number | null;
  visarga:  number | null;
  laya:     number | null;
  svara:    number | null;
  fluency:  number | null;
  overall:  number;
}

export interface RecitationCorrection {
  word:     string;
  said:     string;
  rule:     string;
  severity: 'critical' | 'moderate' | 'minor';
}

export interface RecitationResult {
  recording_id:  string;
  transcript:    string;
  scores:        RecitationScore;
  feedback:      string;
  corrections:   RecitationCorrection[];
  word_accuracy: number;
  total_words:   number;
  review_id:     string | null;
  scored_at:     string;
}

export interface VerseMastery {
  user_id:          string;
  chunk_id:         string;
  best_ai_score:    number | null;
  best_guru_score:  number | null;
  attempt_count:    number;
  last_attempt_at:  string | null;
  certified:        boolean;
  certified_by:     string | null;
  certified_at:     string | null;
  memorization_sm2: number;
  comprehension:    number;
  is_fully_mastered: boolean;
}

// ── AI Explanation ────────────────────────────────────────────────────────────

export interface ExplanationResult {
  chunk_id:        string;
  text_id:         string;
  chapter:         number | null;
  verse:           number | null;
  original:        string | null;
  transliteration: string | null;
  translation:     string | null;
  tradition:       string;
  teacher:         string;
  explanation: {
    word_by_word:        string;
    meaning:             string;
    commentary:          string;
    daily_application:   string;
    sankalpa_connection: string | null;
    contemplation:       string;
    related_text:        string;
  };
  panchang:      { tithi: string; paksha: string; vaara: string };
  generated_at:  string;
}

export interface CommentaryResult extends Omit<ExplanationResult, 'tradition' | 'teacher' | 'explanation'> {
  commentary_mode: true;
  commentaries: {
    advaita:        { teacher: string; school: string; commentary: string };
    vishishtadvaita:{ teacher: string; school: string; commentary: string };
    dvaita:         { teacher: string; school: string; commentary: string };
  };
}

// ── Shloka of the Day ─────────────────────────────────────────────────────────

export interface ShlokaOfDay {
  chunk_id:        string;
  text_id:         string;
  chapter:         number | null;
  verse:           number | null;
  original:        string | null;
  transliteration: string | null;
  translation:     string | null;
  text_category:   TextCategory;
  language:        string;
  reflection:      string;
  panchang: {
    tithi:       string;
    paksha:      string;
    vaara:       string;
    is_ekadashi: boolean;
    is_purnima:  boolean;
    special_day: string | null;
  };
  source:              'enrollment' | 'special_day' | 'tradition' | 'fallback';
  enrollment_context:  { path_id: string; position: number } | null;
  generated_at:        string;
  cached:              boolean;
}

// ── Badges ────────────────────────────────────────────────────────────────────

export type BadgeCategory = 'learning' | 'recitation' | 'community' | 'streak' | 'mastery';

export interface PathshalaBadge {
  id:          string;
  slug:        string;
  title:       string;
  emoji:       string;
  description: string;
  category:    BadgeCategory;
  criteria:    Record<string, unknown>;
}

export interface UserBadge {
  id:        string;
  user_id:   string;
  badge_id:  string;
  earned_at: string;
  context:   Record<string, unknown>;
  badge:     PathshalaBadge;
}

// ── Study Circles ─────────────────────────────────────────────────────────────

export interface StudyCircle {
  id:                     string;
  kul_id:                 string;
  path_id:                string;
  created_by:             string;
  title:                  string | null;
  description:            string | null;
  started_at:             string;
  target_completion_date: string | null;
  chunks_per_week:        number;
  is_active:              boolean;
}

export interface CircleMember {
  id:               string;
  circle_id:        string;
  user_id:          string;
  joined_at:        string;
  current_position: number;
  last_activity_at: string | null;
}

export interface CircleLeaderboardEntry {
  circle_id:        string;
  kul_id:           string;
  path_id:          string;
  path_title:       string;
  total_chunks:     number;
  user_id:          string;
  current_position: number;
  last_activity_at: string | null;
  pct_complete:     number;
  rank:             number;
}

// ── Supported languages ───────────────────────────────────────────────────────

export interface LanguageConfig {
  code:        string;   // ISO 639 code
  name:        string;   // English name
  nativeName:  string;   // Name in own script
  script:      string;
  rtl:         boolean;
  scoringDimensions: string[];
}

// ── Re-export config type ─────────────────────────────────────────────────────

export type { SupabaseClient };

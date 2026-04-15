// ============================================================
// @sangam/pathshala-engine — Public API
//
// Usage in Sangam app:
//
//   import { createPathshalaEngine } from '@sangam/pathshala-engine';
//
//   const pathshala = createPathshalaEngine({
//     supabaseUrl:     process.env.NEXT_PUBLIC_SUPABASE_URL,
//     supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     debug:           process.env.NODE_ENV === 'development',
//   });
//
//   // Enroll in a path
//   await pathshala.enrollment.enroll(userId, pathId);
//
//   // Get today's lesson
//   const lesson = await pathshala.enrollment.getTodayLessons(userId);
//
//   // Get today's shloka
//   const shloka = await pathshala.shlokaOfDay.getOrFetch(userId);
//
//   // Explain a verse (AI teacher)
//   const explanation = await pathshala.explain.explain(chunkId, userId);
//
//   // Record and score a recitation
//   const result = await pathshala.shruti.uploadAndScore(userId, {
//     chunkId, audioBlob, language: 'sa', expectedText: verse.sanskrit,
//   });
//
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

import { Corpus }             from './core/corpus';
import { Enrollment }         from './core/enrollment';
import { Progress }           from './core/progress';
import { ShrutiEngine }       from './ai/shruti';
import { ExplainEngine }      from './ai/explain';
import { ShlokaOfDayEngine }  from './ai/shloka-of-day';
import { StudyCircleManager } from './community/study-circle';
import { BadgeManager }       from './content/badges';

import type { PathshalaEngineConfig } from './types';

// ── Engine interface ──────────────────────────────────────────────────────────

export interface PathshalaEngine {
  // Corpus — browse scripture library
  corpus:       Corpus;

  // Learning paths — enrollment and progress
  enrollment:   Enrollment;
  progress:     Progress;

  // AI features
  shruti:       ShrutiEngine;        // voice recitation scoring
  explain:      ExplainEngine;       // AI teacher
  shlokaOfDay:  ShlokaOfDayEngine;   // personalised daily verse

  // Community
  studyCircle:  StudyCircleManager;  // kul group reading

  // Gamification
  badges:       BadgeManager;

  // Raw client
  supabase:     SupabaseClient;
}

// ── Factory ───────────────────────────────────────────────────────────────────

export function createPathshalaEngine(config: PathshalaEngineConfig): PathshalaEngine {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  return {
    corpus:       new Corpus(supabase, config),
    enrollment:   new Enrollment(supabase, config),
    progress:     new Progress(supabase, config),
    shruti:       new ShrutiEngine(supabase, config),
    explain:      new ExplainEngine(supabase, config),
    shlokaOfDay:  new ShlokaOfDayEngine(supabase, config),
    studyCircle:  new StudyCircleManager(supabase, config),
    badges:       new BadgeManager(supabase, config),
    supabase,
  };
}

// ── Re-export everything ──────────────────────────────────────────────────────

export type { PathshalaEngineConfig } from './types';

// Classes
export { Corpus }             from './core/corpus';
export { Enrollment }         from './core/enrollment';
export { Progress }           from './core/progress';
export { ShrutiEngine }       from './ai/shruti';
export { ExplainEngine }      from './ai/explain';
export { ShlokaOfDayEngine }  from './ai/shloka-of-day';
export { StudyCircleManager } from './community/study-circle';
export { BadgeManager }       from './content/badges';

// Types
export type {
  // Corpus
  ScriptureChunk, ScriptureTranslation, CorpusFilter,
  TextCategory, TraditionRegion,

  // Paths & enrollment
  PathshalaPath, PathshalaEnrollment,
  EnrollResult, AdvanceResult, TodayLesson,

  // Progress
  LearningProgress, VerseMastery,

  // Shruti
  RecordingUploadOptions, RecordingUploadResult,
  RecitationScore, RecitationCorrection, RecitationResult,

  // AI
  ExplanationResult, CommentaryResult, ShlokaOfDay,

  // Badges
  PathshalaBadge, UserBadge, BadgeCategory,

  // Community
  StudyCircle, CircleMember, CircleLeaderboardEntry,

  // i18n
  LanguageConfig,
} from './types';

// Language utilities
export {
  SUPPORTED_LANGUAGES,
  LANGUAGE_MAP,
  DEVANAGARI_LANGUAGES,
  VEDIC_SVARA_LANGUAGES,
  getLanguage,
  getLanguageName,
  getScoringDimensions,
} from './i18n/languages';

// React hook + components (import from pathshala-engine/components to keep React out of non-React bundles)
export { useRecitation } from './hooks/useRecitation';
export type { UseRecitationOptions, UseRecitationReturn, RecitationState, RecorderStatus } from './hooks/useRecitation';
export { RecitationRecorder, RecitationScoreCard } from './components/RecitationRecorder';

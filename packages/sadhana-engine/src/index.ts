// ============================================================
// @sangam/sadhana-engine — Public API
// 
// Usage in Sangam app (when ready to integrate):
//
//   import { createSadhanaEngine } from '@sangam/sadhana-engine';
//
//   const engine = createSadhanaEngine({
//     supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
//     supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
//     aiProvider: 'gemini',
//     enableOfflineQueue: true,
//     enablePushNotifications: false,
//     debug: process.env.NODE_ENV === 'development',
//   });
//
//   // Track events
//   engine.tracker.trackJapaSession({ ... });
//
//   // Check streaks
//   const streak = await engine.streaks.getCurrentStreak(userId);
//
// ============================================================

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { SadhanaTracker } from './core/tracker';
import { StreakTracker } from './core/streaks';
import { ProfileComputer } from './core/profile';
import { PanchangCalculator } from './content/panchang';
import { TextLibrary } from './content/text-library';
import { SyncManager } from './utils/sync';
import { ScriptureSearch } from './ai/scripture-search';
import { PersonalisationEngine } from './ai/personalise';
import { NudgeEngine } from './ai/nudge';
import { MantraLibrary } from './content/mantra-library';
import { KulIntelligence } from './community/kul-intelligence';
import { NityaKarma } from './core/nitya-karma';
import { MemorizationEngine } from './ai/memorization';
import { TirthaLibrary } from './content/tirtha-library';
import { SanskarGuide } from './content/sanskar-guide';
import { PracticePlan } from './ai/practice-plan';
import { SankalpaManager } from './community/sankalpa';
import { MandaliManager } from './community/mandali';
import type { SadhanaEngineConfig } from './types';

export interface SadhanaEngine {
  // Phase 1 — Core
  tracker: SadhanaTracker;
  streaks: StreakTracker;
  profile: ProfileComputer;
  panchang: PanchangCalculator;
  texts: TextLibrary;
  sync: SyncManager;
  supabase: SupabaseClient;
  setUser: (userId: string) => void;

  // Phase 2 — Intelligence
  search: ScriptureSearch;
  personalise: PersonalisationEngine;
  nudge: NudgeEngine;
  mantras: MantraLibrary;

  // Phase 3 — Community Intelligence
  kul: KulIntelligence;

  // Phase 4 — Complete Feature Set
  nityaKarma: NityaKarma;
  memorize: MemorizationEngine;
  tirthas: TirthaLibrary;
  sanskars: SanskarGuide;

  // Phase 4 — Sadhana Planning & Community
  practicePlan: PracticePlan;
  sankalpa: SankalpaManager;
  mandali: MandaliManager;
}

export function createSadhanaEngine(config: SadhanaEngineConfig): SadhanaEngine {
  const supabase = createClient(config.supabaseUrl, config.supabaseAnonKey);

  // Phase 1
  const tracker = new SadhanaTracker(supabase, config.debug);
  const streaks = new StreakTracker(supabase);
  const profile = new ProfileComputer(supabase);
  const panchang = new PanchangCalculator();
  const texts = new TextLibrary(supabase);
  const syncManager = new SyncManager(supabase);

  // Phase 2 — AI modules
  const search = new ScriptureSearch(supabase, config);
  const personalise = new PersonalisationEngine(supabase, config);
  const nudge = new NudgeEngine(supabase, config);
  const mantras = new MantraLibrary(supabase);

  // Phase 3 — Community Intelligence
  const kul = new KulIntelligence(supabase, config);

  // Phase 4 — Complete Feature Set
  const nityaKarma   = new NityaKarma(supabase, config);
  const memorize     = new MemorizationEngine(supabase, config);
  const tirthas      = new TirthaLibrary(supabase, config);
  const sanskars     = new SanskarGuide(supabase, config);
  const practicePlan = new PracticePlan(supabase, config);
  const sankalpa     = new SankalpaManager(supabase, config);
  const mandali      = new MandaliManager(supabase, config);

  // Auto-sync offline events when coming back online
  if (config.enableOfflineQueue && typeof window !== 'undefined') {
    syncManager.startAutoSync();
  }

  const setUser = (userId: string) => {
    tracker.setUser(userId);
  };

  return {
    tracker,
    streaks,
    profile,
    panchang,
    texts,
    sync: syncManager,
    supabase,
    setUser,
    search,
    personalise,
    nudge,
    mantras,
    kul,
    nityaKarma,
    memorize,
    tirthas,
    sanskars,
    practicePlan,
    sankalpa,
    mandali,
  };
}

// Re-export types
export type * from './types';

// Phase 1
export { SadhanaTracker } from './core/tracker';
export { StreakTracker } from './core/streaks';
export { ProfileComputer } from './core/profile';
export { PanchangCalculator } from './content/panchang';
export { TextLibrary, AVAILABLE_TEXTS } from './content/text-library';
export { SyncManager } from './utils/sync';
export { offlineQueue } from './utils/offline-queue';

// Phase 2
export { ScriptureSearch } from './ai/scripture-search';
export { PersonalisationEngine } from './ai/personalise';
export { NudgeEngine } from './ai/nudge';
export { MantraLibrary } from './content/mantra-library';
export type { TodayContent, PracticeStats } from './ai/personalise';
export type { AskScriptureResponse, AskScriptureOptions } from './ai/scripture-search';
export type { NudgeMessage } from './ai/nudge';
export type { MantraEntry, MantraFilter, MantraLevel } from './content/mantra-library';

// Phase 3
export { KulIntelligence } from './community/kul-intelligence';

// Phase 4
export { NityaKarma } from './core/nitya-karma';
export { MemorizationEngine } from './ai/memorization';
export { TirthaLibrary } from './content/tirtha-library';
export { SanskarGuide } from './content/sanskar-guide';
export type { NityaStep, NityaSequenceStep, NityaMorningSequence, NityaKarmaLog, NityaKarmaStreak } from './core/nitya-karma';
export type { QuizMode, MemorizationCard, QuizQuestion, ReviewResult, MemorizationStats } from './ai/memorization';
export { QUALITY_LABELS } from './ai/memorization';
export type { TirthaType, YatraContext, Tirtha, TirthaVisit, YatraGuide, YatraProgress, YatraPlan, TirthaFilter } from './content/tirtha-library';
export type { SanskarLifeStage, Sanskar, SanskarGuideResult, UserSanskar, GetGuideOptions, RecordSanskarOptions } from './content/sanskar-guide';
export type {
  KulRole,
  KulTaskType,
  KulTaskUrgency,
  KulTaskSuggestion,
  KulTaskResult,
  KulNudgeResult,
  KulWeeklySummary,
  KulMemberActivity,
  KulWeeklyStats,
  KulPendingTask,
  KulMemberProfile,
  SuggestTaskOptions,
  CreateTaskOptions,
  KulNudgeOptions,
  WeeklySummaryOptions,
} from './community/kul-intelligence';

// Practice plan, sankalpa & mandali
export { PracticePlan } from './ai/practice-plan';
export { SankalpaManager } from './community/sankalpa';
export { MandaliManager } from './community/mandali';
export type { PracticeFocus, DayPlan, WeeklyPlan, GetPlanOptions } from './ai/practice-plan';
export type { CreateSankalpaInput, SankalpaCheckin, SankalpaProgress, SankalpaCheckinResult } from './community/sankalpa';
export { SANKALPA_DURATIONS, PURASHCHARANA_TARGETS } from './community/sankalpa';
export type { SevaType } from './community/mandali';

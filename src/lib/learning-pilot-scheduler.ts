import type { SupabaseClient } from '@supabase/supabase-js';
import type { NotificationCandidateInsert } from '@/types/database';
import {
  produceDharmVeerCandidate,
  type DevoteeProfileForLearning,
} from './dharm-veer-candidate-producer';
import {
  produceQuizCandidate,
  type DevoteeProfileForQuiz,
} from './quiz-candidate-producer';
import {
  selectLearningEngagementType,
  type DevoteeLearningPreferences,
} from './learning-engagement-arbitration';
import {
  getCandidateTypePipelineMode,
  isCandidateResolverGloballyEnabled,
} from './notification-candidate-pipeline-mode';

export type UnifiedLearningProfile = DevoteeProfileForLearning &
  DevoteeProfileForQuiz &
  DevoteeLearningPreferences & {
    is_deleting?: boolean | null;
  };

export interface GenerateLearningCandidatesOptions {
  devotees: UnifiedLearningProfile[];
  dates: string[];
  dryRun?: boolean;
  forceIgnoreKillSwitch?: boolean;
  supabase?: SupabaseClient;
}

export interface LearningCandidateGenerationResult {
  ok: boolean;
  dryRun: boolean;
  skipped?: boolean;
  skipReason?: string;
  totalCandidates: number;
  dharmVeerCount: number;
  quizCount: number;
  candidates: NotificationCandidateInsert[];
  insertedCount: number;
}

/**
 * Generates learning engagement candidates for a cohort of devotees across a date range.
 * Applies learning slot arbitration, kill switches, and idempotent persistence.
 */
export async function generateLearningEngagementCandidates(
  options: GenerateLearningCandidatesOptions
): Promise<LearningCandidateGenerationResult> {
  const {
    devotees,
    dates,
    dryRun = false,
    forceIgnoreKillSwitch = false,
    supabase,
  } = options;

  const dharmVeerMode = getCandidateTypePipelineMode('dharm_veer');
  const quizMode = getCandidateTypePipelineMode('quiz');
  const resolverEnabled = isCandidateResolverGloballyEnabled();

  // If live run and kill switches active, fail closed
  if (!dryRun && !forceIgnoreKillSwitch) {
    if (!resolverEnabled) {
      return {
        ok: true,
        dryRun: false,
        skipped: true,
        skipReason: 'resolver_globally_disabled',
        totalCandidates: 0,
        dharmVeerCount: 0,
        quizCount: 0,
        candidates: [],
        insertedCount: 0,
      };
    }

    if (dharmVeerMode !== 'candidate' && quizMode !== 'candidate') {
      return {
        ok: true,
        dryRun: false,
        skipped: true,
        skipReason: 'learning_candidates_disabled_by_policy',
        totalCandidates: 0,
        dharmVeerCount: 0,
        quizCount: 0,
        candidates: [],
        insertedCount: 0,
      };
    }
  }

  const generatedCandidates: NotificationCandidateInsert[] = [];
  let dharmVeerCount = 0;
  let quizCount = 0;

  for (const devotee of devotees) {
    // Skip accounts pending deletion
    if (devotee.is_deleting === true) continue;

    for (const date of dates) {
      // 1. Arbitrate single learning slot
      const selectedType = selectLearningEngagementType(devotee.id, date, devotee);
      if (!selectedType) continue;

      // 2. Check per-type mode if live run
      if (!dryRun && !forceIgnoreKillSwitch) {
        if (selectedType === 'dharm_veer' && dharmVeerMode !== 'candidate') continue;
        if (selectedType === 'quiz' && quizMode !== 'candidate') continue;
      }

      // 3. Produce candidate
      let candidate: NotificationCandidateInsert | null = null;
      if (selectedType === 'dharm_veer') {
        candidate = produceDharmVeerCandidate(devotee, date);
        if (candidate) {
          generatedCandidates.push(candidate);
          dharmVeerCount++;
        }
      } else if (selectedType === 'quiz') {
        candidate = produceQuizCandidate(devotee, date);
        if (candidate) {
          generatedCandidates.push(candidate);
          quizCount++;
        }
      }
    }
  }

  let insertedCount = 0;

  // 4. Persist if live run and Supabase client provided
  if (!dryRun && supabase && generatedCandidates.length > 0) {
    const { data, error } = await supabase
      .from('notification_candidates')
      .upsert(generatedCandidates, {
        onConflict: 'user_id,event_type,event_id,event_instance,local_date,audience_variant',
        ignoreDuplicates: true,
      })
      .select('id');

    if (!error && Array.isArray(data)) {
      insertedCount = data.length;
    } else {
      insertedCount = generatedCandidates.length;
    }
  }

  return {
    ok: true,
    dryRun,
    totalCandidates: generatedCandidates.length,
    dharmVeerCount,
    quizCount,
    candidates: generatedCandidates,
    insertedCount,
  };
}

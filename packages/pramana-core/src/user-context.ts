/**
 * Policy classification for Pramana user-context fields.
 */
export enum UserContextPolicyClassification {
  PUBLIC_CORPUS = 'public_corpus',               // Always Allowed (scripture/commentaries)
  USER_PREFERENCE = 'user_preference',           // Allowed (Opt-in preferences like language/tradition)
  USER_BEHAVIOR_SUMMARY = 'user_behavior_summary', // Allowed (Safe aggregates/time of day/leaning indices)
  RESTRICTED_PRIVATE = 'restricted_private',     // Disallowed (Personal identification/private journals/gotra)
  NEVER_SEND = 'never_send',                     // Strictly Disallowed (Credentials/tokens/raw lat-long coordinates)
}

/**
 * Shared contract for User Preference Context (Allowed).
 */
export interface UserPreferenceContext {
  preferredLanguage?: string; // e.g. "en", "hi", "pa"
  preferredTradition?: string; // e.g. "Sikhi", "Sanatana Dharma", "Bhakti"
  themePreference?: 'light' | 'dark' | 'system';
  fontSizePreference?: 'small' | 'medium' | 'large';
}

/**
 * Shared contract for Safe User Behavior Summary Context (Allowed aggregates).
 */
export interface UserBehaviorSummaryContext {
  morningUser?: boolean;             // Active primarily in the morning (4 AM - 9 AM local)
  shortSessionPreference?: boolean;  // Prefers quick reads/short lessons
  bhaktiLeaningScore?: number;        // Index from 0.0 to 1.0 (devotional leaning)
  studyLeaningScore?: number;         // Index from 0.0 to 1.0 (philosophical study leaning)
  sessionCountLast7Days?: number;     // Safe session count aggregate
}

/**
 * Shared contract for Restricted Private Data (Disallowed for AI prompts).
 */
export interface RestrictedPrivateContext {
  fullName?: string;
  email?: string;
  phoneNumber?: string;
  locationName?: string;
  gotraOrLineage?: string;
  privateJournalEntriesCount?: number;
}

/**
 * Shared contract for Never-Send fields (Strictly Disallowed/Secrets).
 */
export interface NeverSendContext {
  passwords?: string;
  apiTokens?: string;
  sessionToken?: string;
  latitude?: number;
  longitude?: number;
}

/**
 * Complete, aggregated Raw User Context input signal object inside application workspace.
 */
export interface RawUserSignals {
  preferences: UserPreferenceContext;
  behaviorSummary: UserBehaviorSummaryContext;
  privateData: RestrictedPrivateContext;
  sensitiveNeverSend: NeverSendContext;
}

/**
 * Safe, policy-approved summary context generated for inclusion in AI prompts.
 */
export interface SafeUserSummaryContext {
  preferredLanguage: string;
  preferredTradition: string;
  sessionPreference: 'short' | 'detailed';
  timeOfDayPreference: 'morning' | 'evening' | 'flexible';
  leaningType: 'bhakti' | 'study' | 'balanced';
}

/**
 * Policy-approved summarizer that converts raw, un-redacted user signals
 * into a safe, non-invasive summary context for AI prompts.
 * Strictly ignores restricted private fields and credentials/secrets.
 */
export function summarizeUserSignals(signals: Partial<RawUserSignals>): SafeUserSummaryContext {
  const prefs = signals.preferences || {};
  const behavior = signals.behaviorSummary || {};

  // 1. Map preferred language (defaulting to English)
  const preferredLanguage = prefs.preferredLanguage || 'en';

  // 2. Map preferred tradition (defaulting to Sanatana Dharma)
  const preferredTradition = prefs.preferredTradition || 'Sanatana Dharma';

  // 3. Map session preferences based on behavior summary
  const sessionPreference = behavior.shortSessionPreference ? 'short' : 'detailed';

  // 4. Map time of day preference based on behavior summary
  const timeOfDayPreference = behavior.morningUser ? 'morning' : 'flexible';

  // 5. Map devotional vs study leaning based on behavioral scores
  let leaningType: 'bhakti' | 'study' | 'balanced' = 'balanced';
  const bhakti = behavior.bhaktiLeaningScore || 0.5;
  const study = behavior.studyLeaningScore || 0.5;

  if (Math.abs(bhakti - study) > 0.15) {
    leaningType = bhakti > study ? 'bhakti' : 'study';
  }

  return {
    preferredLanguage,
    preferredTradition,
    sessionPreference,
    timeOfDayPreference,
    leaningType,
  };
}

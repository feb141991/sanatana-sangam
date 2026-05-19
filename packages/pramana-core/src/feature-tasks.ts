export const PRAMANA_FEATURE_TASKS = {
  PATHSHALA_EXPLAIN: 'pathshala_explain',
  MEANING_GENERATE: 'meaning_generate',
} as const;

export type PramanaFeatureTask =
  (typeof PRAMANA_FEATURE_TASKS)[keyof typeof PRAMANA_FEATURE_TASKS];

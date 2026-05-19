export type ScoreValue = number | null;

export interface ScoreBreakdown {
  name: string;
  score: ScoreValue;
  weight?: number;
  passed?: boolean;
  notes?: string;
}

export interface ScoringSummary {
  caseId: string;
  runId: string;
  benchmark: string;
  score: ScoreValue;
  maxScore?: number;
  passed: boolean;
  breakdown?: ScoreBreakdown[];
  reasons?: string[];
  metadata?: Record<string, unknown>;
}

export interface BenchmarkRunSummary {
  benchmark: string;
  runId: string;
  totalCases: number;
  passedCases: number;
  failedCases: number;
  skippedCases?: number;
  averageScore?: number | null;
  summaries: ScoringSummary[];
  startedAt?: string;
  completedAt?: string;
}

export function summarizePassRate(summary: BenchmarkRunSummary): number {
  if (summary.totalCases === 0) {
    return 0;
  }

  return summary.passedCases / summary.totalCases;
}

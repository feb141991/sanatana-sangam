export type RegressionSuiteMode = "blocking" | "informational";

export interface RegressionSuiteCaseRef {
  caseId: string;
  required?: boolean;
  tags?: string[];
}

export interface RegressionBaseline {
  name: string;
  version: string;
  capturedAt?: string;
  metadata?: Record<string, unknown>;
}

export interface RegressionSuiteDefinition {
  id: string;
  title: string;
  mode: RegressionSuiteMode;
  benchmark: string;
  baseline?: RegressionBaseline;
  cases: RegressionSuiteCaseRef[];
  failureThreshold?: number;
  metadata?: Record<string, unknown>;
}

export function defineRegressionSuite(
  suite: RegressionSuiteDefinition,
): RegressionSuiteDefinition {
  return suite;
}

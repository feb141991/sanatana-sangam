export type EvalDomain =
  | "general"
  | "grounding"
  | "translation"
  | "regression";

export type EvalPriority = "smoke" | "standard" | "critical";

export interface EvalExpectation {
  key: string;
  description: string;
  required?: boolean;
  target?: number | string | boolean;
  tolerance?: number;
  metadata?: Record<string, string | number | boolean | null>;
}

export interface EvalCase<Input = unknown, Output = unknown> {
  id: string;
  title: string;
  instruction: string;
  domain: EvalDomain;
  priority: EvalPriority;
  input: Input;
  expectedOutput?: Output;
  expectations?: EvalExpectation[];
  tags?: string[];
  locale?: string;
  notes?: string;
  metadata?: Record<string, unknown>;
}

export interface EvalCaseCollection<Input = unknown, Output = unknown> {
  suiteId: string;
  version: string;
  cases: EvalCase<Input, Output>[];
}

export function defineEvalCase<Input, Output>(
  evalCase: EvalCase<Input, Output>,
): EvalCase<Input, Output> {
  return evalCase;
}

export function defineEvalCaseCollection<Input, Output>(
  collection: EvalCaseCollection<Input, Output>,
): EvalCaseCollection<Input, Output> {
  return collection;
}

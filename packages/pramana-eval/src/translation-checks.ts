export type TranslationVerdict = "pass" | "warning" | "fail";

export interface TranslationSegment {
  sourceText: string;
  translatedText: string;
  sourceLocale: string;
  targetLocale: string;
}

export interface TranslationCheckDimension {
  name: "accuracy" | "fluency" | "terminology" | "safety" | "style" | string;
  verdict: TranslationVerdict;
  score?: number;
  notes?: string;
}

export interface TranslationCheck {
  caseId: string;
  segment: TranslationSegment;
  overallVerdict: TranslationVerdict;
  dimensions: TranslationCheckDimension[];
  preservedTerms?: string[];
  metadata?: Record<string, unknown>;
}

export function defineTranslationCheck(check: TranslationCheck): TranslationCheck {
  return check;
}

export type GroundingVerdict = "grounded" | "partially-grounded" | "ungrounded";

export interface GroundingSourceReference {
  sourceId: string;
  excerpt?: string;
  uri?: string;
  startOffset?: number;
  endOffset?: number;
}

export interface GroundingClaim {
  id: string;
  statement: string;
  verdict: GroundingVerdict;
  supportingSources?: GroundingSourceReference[];
  notes?: string;
}

export interface GroundingCheck {
  caseId: string;
  responseText: string;
  claims: GroundingClaim[];
  overallVerdict: GroundingVerdict;
  citationCoverage?: number;
  metadata?: Record<string, unknown>;
}

export function defineGroundingCheck(check: GroundingCheck): GroundingCheck {
  return check;
}

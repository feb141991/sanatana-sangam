/**
 * Ranking metrics for scripts/eval_retrieval_quality.ts.
 */
export type RetrievalOutcome = { rank: number | null };

/** 1-based rank of the first result that is one of the accepted ids, or null if none appears. */
export function rankOfFirstExpected(resultIds: string[], expectedIds: string[]): number | null {
  const index = resultIds.findIndex((id) => expectedIds.includes(id));
  return index === -1 ? null : index + 1;
}

/** hit@1/3/5 counts and mean reciprocal rank (misses contribute 0). */
export function summariseRetrieval(outcomes: RetrievalOutcome[]) {
  const total = outcomes.length;
  const hitAt = (k: number) => outcomes.filter((o) => o.rank !== null && o.rank <= k).length;
  const mrr = total ? outcomes.reduce((sum, o) => sum + (o.rank ? 1 / o.rank : 0), 0) / total : 0;
  return { cases: total, hit1: hitAt(1), hit3: hitAt(3), hit5: hitAt(5), mrr: Number(mrr.toFixed(3)) };
}

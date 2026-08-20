import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateOccurrencesWithEvaluator, type ReviewQueueItem } from './materialize';
import { CANONICAL_RULES } from './rules';

// Untyped for the same reason as fixtures/route.ts: this table is new and
// the hand-written Database type doesn't model it yet.
function adminSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
  );
}

// Deterministic given CANONICAL_RULES is a static JSON import parsed once
// per process -- changes only when rules.json itself changes, which is
// exactly when the persisted diagnostics cache below must self-invalidate.
let cachedRulesHash: string | null = null;
function rulesHash(): string {
  if (!cachedRulesHash) {
    cachedRulesHash = createHash('sha256').update(JSON.stringify(CANONICAL_RULES)).digest('hex');
  }
  return cachedRulesHash;
}

// Read-only convenience for the calendar-governance admin UI: what does the
// engine currently compute for a festival/year, so a human reviewer has a
// starting point before going to check a real Tier 1-4 publication -- this
// is NEVER written to golden_fixtures.expected and NEVER used to approve
// anything. A fixture's `expected` must stay an independently-sourced answer
// key; self-deriving it from the engine's own output is the exact failure
// this repo already hit once (see D11/D23 in
// docs/CALENDAR_ENGINE_ASSESSMENT.md -- fixtures "self-derived with
// fabricated ... provenance" had to be caught and reverted).
export interface EngineHint {
  civilDate: string | null;
  candidateDates: string[];
  publicationWithheld: boolean;
  error?: string;
}

type ResolvedOccurrence = ReturnType<typeof calculateOccurrencesWithEvaluator>['resolved'][number];

type YearOccurrences = {
  resolvedBySlug: Map<string, ResolvedOccurrence[]>;
  unresolvedBySlug: Map<string, ReviewQueueItem[]>;
};

function indexBySlug<T extends { slug: string }>(items: T[]): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const list = map.get(item.slug);
    if (list) list.push(item);
    else map.set(item.slug, [item]);
  }
  return map;
}

// In-process cache: fast path within one warm serverless instance.
const occurrencesByYear = new Map<number, YearOccurrences>();
// computeEngineHint is called once per fixture row with no await between
// calls (fixtures/route.ts awaits them all via Promise.all), so ~70+ rows
// sharing one year can request that year concurrently before the first
// resolves. Caching the in-flight Promise, not just the resolved value,
// means the second-through-Nth concurrent caller for the same year await
// the same computation instead of each starting (and DB-upserting) their
// own redundant copy.
const inFlightByYear = new Map<number, Promise<YearOccurrences>>();

// Computing a full year's occurrences is genuine ephemeris work across 365
// days x ~96 rules, plus per-EVALUATOR_RULES window search (~4-7s baseline,
// occasionally ~8-14s on a legacy-map fallback -- see engine.ts's
// enginePreference doc). A cold serverless instance paid this on the very
// first admin request that needed it, once per distinct year present in
// golden_fixtures (currently several), serially, blocking the request for
// many seconds. Persisting the result keyed by (year, rules_hash) means
// only the *first* request ever pays this, and the warm-diagnostics cron
// (src/app/api/cron/warm-calendar-governance-diagnostics) can pre-pay it on
// a schedule so no real admin request ever does.
//
// Uses calculateOccurrencesWithEvaluator -- the SAME function the real
// materialization pipeline uses to decide what actually gets published --
// rather than the raw per-rule diagnostic. The raw diagnostic reflects only
// the baseline masa-engine candidate, which for evaluator-covered rules
// (e.g. diwali) is documented as "never the final answer": the evaluator
// re-searches a +/-N-day window and frequently corrects it by a day or
// more. Using the raw diagnostic here produced false "engine and citation
// disagree" warnings on fixtures that were actually correct (diwali,
// bandhi-chhor-divas, guru-nanak-gurpurab all confirmed to genuinely
// disagree with the raw diagnostic while exactly matching the real
// evaluator-resolved production date) -- found 2026-08-20 while reviewing
// live fixture data.
async function occurrencesForYear(year: number): Promise<YearOccurrences> {
  const inMemory = occurrencesByYear.get(year);
  if (inMemory) return inMemory;

  const inFlight = inFlightByYear.get(year);
  if (inFlight) return inFlight;

  const promise = (async () => {
    const hash = rulesHash();
    const supabase = adminSupabase();

    const { data: cached } = await supabase
      .from('calendar_governance_diagnostics_cache')
      .select('diagnostics')
      .eq('year', year)
      .eq('rules_hash', hash)
      .maybeSingle();

    let resolved: ResolvedOccurrence[];
    let unresolved: ReviewQueueItem[];
    if (cached?.diagnostics) {
      const parsed = cached.diagnostics as { resolved: ResolvedOccurrence[]; unresolved: ReviewQueueItem[] };
      resolved = parsed.resolved;
      unresolved = parsed.unresolved;
    } else {
      const result = calculateOccurrencesWithEvaluator(year);
      resolved = result.resolved;
      unresolved = result.unresolved;

      // Best-effort write-back -- a failed insert just means the next cold
      // instance recomputes too, not a correctness issue, so it isn't
      // awaited into the request's critical path beyond this fire-and-forget.
      supabase
        .from('calendar_governance_diagnostics_cache')
        .upsert({ year, rules_hash: hash, diagnostics: { resolved, unresolved }, computed_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error(`[fixture-engine-hint] Failed to persist diagnostics cache for ${year}:`, error.message);
        });
    }

    const yearOccurrences: YearOccurrences = {
      resolvedBySlug: indexBySlug(resolved),
      unresolvedBySlug: indexBySlug(unresolved),
    };
    occurrencesByYear.set(year, yearOccurrences);
    return yearOccurrences;
  })();

  inFlightByYear.set(year, promise);
  try {
    return await promise;
  } finally {
    inFlightByYear.delete(year);
  }
}

// Called by the warm-diagnostics cron to pre-pay the computation ahead of
// any real admin request. Same path as occurrencesForYear -- a cron run
// after rules.json changes will recompute and refresh the persisted cache
// exactly once, same as an ordinary cache miss would.
export async function warmDiagnosticsForYear(year: number): Promise<void> {
  await occurrencesForYear(year);
}

const knownSlugs = new Set(CANONICAL_RULES.map((rule) => rule.slug));

// Picks the item matching `qualifier` out of a same-slug list. Evaluator-
// assigned variant_key values (e.g. 'standard' for a single-variant rule)
// don't always literally equal the rule-table qualifier convention
// (rule.variant_key ?? rule.sampradaya, often null for single-variant
// rules) -- so a single-item list is used directly regardless of its
// variant_key string, and only a genuinely multi-variant list (e.g.
// krishna-janmashtami's smarta/vaishnava split, where variantId does match
// the qualifier convention) gets disambiguated by qualifier, falling back
// to the primary variant if the qualifier doesn't match any of them.
function pickByQualifier<T extends { variant_key?: string; is_primary_variant?: boolean }>(
  items: T[],
  qualifier: string | null,
): T | null {
  if (items.length === 0) return null;
  if (items.length === 1) return items[0];
  if (qualifier) {
    const exact = items.find((item) => item.variant_key === qualifier);
    if (exact) return exact;
  }
  return items.find((item) => item.is_primary_variant) ?? items[0];
}

export async function computeEngineHint(festivalId: string, year: number, variantKey?: string | null): Promise<EngineHint> {
  const qualifier = variantKey?.trim() || null;

  if (!knownSlugs.has(festivalId)) {
    return {
      civilDate: null,
      candidateDates: [],
      publicationWithheld: false,
      error: `No rule found for slug "${festivalId}"`,
    };
  }

  // Real variant disambiguation happens in pickByQualifier below, against
  // the occurrence's own variant_key -- which for an evaluator-covered rule
  // is EVALUATOR_RULES' variantId (e.g. krishna-janmashtami's 'smarta'/
  // 'vaishnava', matching golden_fixtures.profile.tradition exactly), and
  // for a baseline-only rule is rules.json's own variant_key/sampradaya
  // (e.g. yogini-ekadashi's 'smarta'/'vaishnava_vidhava'). A prior version
  // of this function pre-validated the qualifier against rules.json's
  // variant_key/sampradaya unconditionally, which silently broke every
  // krishna-janmashtami lookup: EVALUATOR_RULES declares 'smarta'/
  // 'vaishnava' for it, but rules.json's own sampradaya field for the same
  // two rows is 'smarta_nishita'/'gaudiya_iskcon' -- a different naming
  // convention nobody had reconciled. Trusting the occurrence data's own
  // variant_key here instead of re-deriving it from rules.json avoids that
  // whole class of mismatch.
  const { resolvedBySlug, unresolvedBySlug } = await occurrencesForYear(year);

  const resolved = pickByQualifier(resolvedBySlug.get(festivalId) ?? [], qualifier);
  if (resolved) {
    return {
      civilDate: resolved.date,
      candidateDates: [resolved.date],
      publicationWithheld: false,
    };
  }

  const unresolved = pickByQualifier(unresolvedBySlug.get(festivalId) ?? [], qualifier);
  if (unresolved) {
    return {
      civilDate: null,
      candidateDates: unresolved.candidate_dates,
      publicationWithheld: true,
      error: unresolved.reasoning,
    };
  }

  return { civilDate: null, candidateDates: [], publicationWithheld: false, error: 'No engine occurrence for this rule/year' };
}

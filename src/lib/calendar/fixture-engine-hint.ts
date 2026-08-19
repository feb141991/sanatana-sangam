import { createHash } from 'node:crypto';
import { createClient } from '@supabase/supabase-js';
import { calculateObservanceCandidateDiagnosticsForYear, ruleIdentityKey, type ObservanceCandidateDiagnostic } from './engine';
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

// In-process cache: fast path within one warm serverless instance. Keyed by
// ruleKey (not the raw diagnostic array) so computeEngineHint's per-row
// lookup is O(1) instead of an O(rules) Array.find, run once per fixture row.
const diagnosticsByYear = new Map<number, Map<string, ObservanceCandidateDiagnostic>>();
// computeEngineHint is called once per fixture row with no await between
// calls (fixtures/route.ts awaits them all via Promise.all), so ~70+ rows
// sharing one year can request that year concurrently before the first
// resolves. Caching the in-flight Promise, not just the resolved value,
// means the second-through-Nth concurrent caller for the same year await
// the same computation instead of each starting (and DB-upserting) their
// own redundant copy.
const inFlightByYear = new Map<number, Promise<Map<string, ObservanceCandidateDiagnostic>>>();

// Computing a full year's diagnostics is genuine ephemeris work across 365
// days x ~96 rules (~4-7s, occasionally ~8-14s on a legacy-map fallback --
// see engine.ts's enginePreference doc). A cold serverless instance paid
// this on the very first admin request that needed it, once per distinct
// year present in golden_fixtures (currently 3), serially, blocking the
// request for 12-21s. Persisting the result keyed by (year, rules_hash)
// means only the *first* request ever pays this, and the warm-diagnostics
// cron (src/app/api/cron/warm-calendar-governance-diagnostics) can pre-pay
// it on a schedule so no real admin request ever does.
async function diagnosticsForYear(year: number): Promise<Map<string, ObservanceCandidateDiagnostic>> {
  const inMemory = diagnosticsByYear.get(year);
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

    let list: ObservanceCandidateDiagnostic[];
    if (cached?.diagnostics) {
      list = cached.diagnostics as ObservanceCandidateDiagnostic[];
    } else {
      // 'corrected' -- this admin surface is for sourcing/reviewing the NEW
      // engine's output against citations, not for reproducing what legacy
      // currently ships (that's integrity.ts's job, against production data).
      // Falls back to legacy per-rule only when the corrected path produced
      // zero candidates for that rule (see engine.ts's enginePreference doc).
      list = calculateObservanceCandidateDiagnosticsForYear(year, undefined, 'corrected');

      // Best-effort write-back -- a failed insert just means the next cold
      // instance recomputes too, not a correctness issue, so it isn't
      // awaited into the request's critical path beyond this fire-and-forget.
      supabase
        .from('calendar_governance_diagnostics_cache')
        .upsert({ year, rules_hash: hash, diagnostics: list, computed_at: new Date().toISOString() })
        .then(({ error }) => {
          if (error) console.error(`[fixture-engine-hint] Failed to persist diagnostics cache for ${year}:`, error.message);
        });
    }

    const byRuleKey = new Map(list.map((d) => [d.ruleKey, d]));
    diagnosticsByYear.set(year, byRuleKey);
    return byRuleKey;
  })();

  inFlightByYear.set(year, promise);
  try {
    return await promise;
  } finally {
    inFlightByYear.delete(year);
  }
}

// Called by the warm-diagnostics cron to pre-pay the computation ahead of
// any real admin request. Same path as diagnosticsForYear -- a cron run
// after rules.json changes will recompute and refresh the persisted cache
// exactly once, same as an ordinary cache miss would.
export async function warmDiagnosticsForYear(year: number): Promise<void> {
  await diagnosticsForYear(year);
}

const rulesIndexCache = new Map<string, typeof CANONICAL_RULES>();
function rulesFor(festivalId: string, qualifier: string | null) {
  const key = `${festivalId}::${qualifier ?? ''}`;
  let matches = rulesIndexCache.get(key);
  if (!matches) {
    matches = CANONICAL_RULES.filter((rule) => {
      if (rule.slug !== festivalId) return false;
      const ruleQualifier = rule.variant_key ?? rule.sampradaya ?? null;
      return qualifier ? ruleQualifier === qualifier : ruleQualifier === null;
    });
    rulesIndexCache.set(key, matches);
  }
  return matches;
}

export async function computeEngineHint(festivalId: string, year: number, variantKey?: string | null): Promise<EngineHint> {
  const qualifier = variantKey?.trim() || null;
  // golden_fixtures.profile.tradition carries a real variant qualifier for
  // multi-variant rules (e.g. yogini-ekadashi's smarta/vaishnava_vidhava
  // split) but is just a generic default ("smarta", "unspecified") for the
  // majority of single-variant rules that have no variant_key/sampradaya at
  // all -- so a qualifier that matches nothing is retried unqualified rather
  // than treated as an error.
  let matches = rulesFor(festivalId, qualifier);
  if (matches.length === 0 && qualifier) {
    matches = rulesFor(festivalId, null);
  }

  if (matches.length !== 1) {
    return {
      civilDate: null,
      candidateDates: [],
      publicationWithheld: false,
      error: `Expected exactly one rule for ${festivalId}${qualifier ? ` (${qualifier})` : ''}; found ${matches.length}`,
    };
  }

  const ruleKey = ruleIdentityKey(matches[0]);
  const diagnostic = (await diagnosticsForYear(year)).get(ruleKey);

  if (!diagnostic) {
    return { civilDate: null, candidateDates: [], publicationWithheld: false, error: 'No engine diagnostic for this rule/year' };
  }

  return {
    civilDate: diagnostic.selectedDate,
    candidateDates: diagnostic.candidateDates,
    publicationWithheld: diagnostic.publicationWithheld,
  };
}

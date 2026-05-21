import { calculateObservancesForYear, RULE_ENGINE_VERSION } from './engine';

type MaterializeOccurrenceRow = {
  id: string;
  definition_id: string;
  year: number;
  date: string;
  manual_date_override?: string | null;
  locked_for_regeneration?: boolean | null;
  final_date_source?: string | null;
};

type MaterializeMode = 'dry_run' | 'commit';

export type MaterializeYearSummary = {
  calculated: number;
  insertable: number;
  inserted: number;
  updated: number;
  skippedLocked: number;
  skippedManual: number;
  skippedProtected: number;
  missingDefinition: number;
};

export type MaterializeResult = {
  mode: MaterializeMode;
  years: number[];
  totalInserted: number;
  totalUpdated: number;
  summary: Record<number, MaterializeYearSummary>;
};

function makeYearSummary(): MaterializeYearSummary {
  return {
    calculated: 0,
    insertable: 0,
    inserted: 0,
    updated: 0,
    skippedLocked: 0,
    skippedManual: 0,
    skippedProtected: 0,
    missingDefinition: 0,
  };
}

function canUpdateGeneratedRow(row: MaterializeOccurrenceRow): boolean {
  const source = row.final_date_source ?? 'legacy_seed';
  return source === 'calculation_engine' || source === 'calculation_engine_reviewed';
}

export async function materializeOccurrencesForYears({
  supabase,
  targetYears,
  calculatedBy,
  commit,
}: {
  supabase: any;
  targetYears: number[];
  calculatedBy: string;
  commit: boolean;
}): Promise<MaterializeResult> {
  const { data: definitions, error: defsError } = await supabase
    .from('observance_definitions')
    .select('id, slug')
    .eq('active', true);

  if (defsError) throw defsError;

  const definitionMap = new Map<string, string>();
  for (const def of definitions ?? []) {
    definitionMap.set(def.slug, def.id);
  }

  const { data: existingRows, error: existingError } = await supabase
    .from('observance_occurrences')
    .select('id, definition_id, year, date, manual_date_override, locked_for_regeneration, final_date_source')
    .in('year', targetYears);

  if (existingError) throw existingError;

  const existingByDefinitionYear = new Map<string, MaterializeOccurrenceRow>();
  for (const row of existingRows ?? []) {
    existingByDefinitionYear.set(`${row.definition_id}:${row.year}`, row);
  }

  const summary: Record<number, MaterializeYearSummary> = {};
  let totalInserted = 0;
  let totalUpdated = 0;

  for (const year of targetYears) {
    summary[year] = makeYearSummary();
    const calculated = calculateObservancesForYear(year);
    summary[year].calculated = calculated.length;

    const toInsert: any[] = [];
    const toUpdate: Array<{ id: string; patch: Record<string, unknown> }> = [];

    for (const occ of calculated) {
      const definitionId = definitionMap.get(occ.slug);
      if (!definitionId) {
        summary[year].missingDefinition += 1;
        continue;
      }

      const existing = existingByDefinitionYear.get(`${definitionId}:${occ.year}`);
      if (!existing) {
        summary[year].insertable += 1;
        toInsert.push({
          definition_id: definitionId,
          year: occ.year,
          date: occ.date,
          calculation_version: RULE_ENGINE_VERSION,
          calculated_by: calculatedBy,
          final_date_source: 'calculation_engine',
          audit_status: 'not_run',
          verification_status: 'not_checked',
          source_provenance: {
            source_name: 'calculation_engine',
            source_kind: 'curated',
          },
        });
        continue;
      }

      if (existing.locked_for_regeneration) {
        summary[year].skippedLocked += 1;
        continue;
      }

      if (existing.manual_date_override) {
        summary[year].skippedManual += 1;
        continue;
      }

      if (!canUpdateGeneratedRow(existing)) {
        summary[year].skippedProtected += 1;
        continue;
      }

      if (existing.date !== occ.date) {
        toUpdate.push({
          id: existing.id,
          patch: {
            date: occ.date,
            calculation_version: RULE_ENGINE_VERSION,
            calculated_by: calculatedBy,
            final_date_source: 'calculation_engine',
            audit_status: 'not_run',
            audit_failure_reason: null,
            last_audited_at: null,
            audit_retry_count: 0,
            verification_status: 'not_checked',
            verification_note: null,
            suggested_date: null,
            verification_confidence: null,
            verification_run_at: null,
            source_provenance: {
              source_name: 'calculation_engine',
              source_kind: 'curated',
            },
          },
        });
      }
    }

    if (!commit) {
      summary[year].inserted = 0;
      summary[year].updated = 0;
      continue;
    }

    if (toInsert.length > 0) {
      const { data: inserted, error: insertError } = await supabase
        .from('observance_occurrences')
        .insert(toInsert)
        .select('id');
      if (insertError) throw insertError;
      summary[year].inserted = inserted?.length ?? 0;
      totalInserted += summary[year].inserted;
    }

    for (const item of toUpdate) {
      const { error: updateError } = await supabase
        .from('observance_occurrences')
        .update(item.patch)
        .eq('id', item.id);
      if (updateError) throw updateError;
      summary[year].updated += 1;
      totalUpdated += 1;
    }
  }

  return {
    mode: commit ? 'commit' : 'dry_run',
    years: targetYears,
    totalInserted,
    totalUpdated,
    summary,
  };
}

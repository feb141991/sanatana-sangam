import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import { isApprovedPitruConclusion, PITRU_PAKSHA_APPROVAL_MARKER, PITRU_PAKSHA_APPROVAL_REF } from './pitru-paksha-publication';
import { filterWithheldJoinedRows } from './withheld';
const row = {
  date:'2026-10-10',occurrence_date:'2026-10-10',year:2026,calendar_profile:'legacy-ujjain',
  spiritual_tradition:null,variant_key:'legacy-default',computed_latitude:23.1765,computed_longitude:75.7885,
  computed_timezone:'Asia/Kolkata',manual_date_override:null,review_status:'reviewed',verification_status:'verified',
  audit_status:'completed',publication_status:'published',final_date_source:'calculation_engine',
  source_refs:[{sourceName:'Regional range corroboration',tier:3}],diagnostics:['approved_pitru_journey_20260930013837'],
  source_provenance:{[PITRU_PAKSHA_APPROVAL_MARKER]:{review_ref:PITRU_PAKSHA_APPROVAL_REF}},
  observance_definitions:{slug:'mahalaya-amavasya'},
};
describe('exact Pitru conclusion publication approval',()=> {
  it('reads the same persisted approval identity the migration writes',()=> {
    const sql=readFileSync('supabase/migrations/20260930013837_publish_approved_pitru_paksha_2026.sql','utf8');
    expect(sql).toContain(PITRU_PAKSHA_APPROVAL_MARKER);expect(sql).toContain(PITRU_PAKSHA_APPROVAL_REF);
    expect(filterWithheldJoinedRows([row])).toEqual([row]);
  });
  it.each([
    {year:2027},{calendar_profile:'north_indian_purnimanta'},{computed_timezone:'Europe/London'},
    {computed_latitude:51.5074},{computed_longitude:0},{spiritual_tradition:'gaudiya'},
    {variant_key:'other'},{date:'2026-10-09'},{occurrence_date:'2026-10-09'},
    {publication_status:'withheld_disputed'},{review_status:'needs_review'},
    {verification_status:'not_checked'},{audit_status:'failed'},{source_provenance:{}},
    {source_refs:[]},{diagnostics:[]},{manual_date_override:'2026-10-10'},
    {final_date_source:'fallback'},
  ])('does not override the deferred rule when %j changes',patch=> {
    const candidate={...row,...patch};
    expect(isApprovedPitruConclusion('mahalaya-amavasya',candidate)).toBe(false);
    expect(filterWithheldJoinedRows([candidate])).toHaveLength(0);
  });
  it('does not promote a different festival',()=>expect(isApprovedPitruConclusion('other',row)).toBe(false));
});

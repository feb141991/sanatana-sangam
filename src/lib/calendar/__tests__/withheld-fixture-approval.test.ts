import { describe, expect, it } from 'vitest';
import { filterWithheldJoinedRows } from '../withheld';

const approvedRow = {
  date: '2026-07-10',
  variant_key: 'smarta',
  spiritual_tradition: 'smarta',
  review_status: 'reviewed',
  verification_status: 'verified',
  audit_status: 'completed',
  publication_status: 'published',
  batch_family_complete: true,
  fixture_approval_complete: true,
  calculated_by: 'approved-golden-pilot-v1',
  final_date_source: 'calculation_engine_reviewed',
  source_provenance: {
    caseId: 'yogini-ekadashi__2026__ujjain_india__north_indian_purnimanta__smarta',
  },
  diagnostics: ['fixture_scoped_approval'],
  source_refs: [{ sourceName: 'Rashtriya Panchang', tier: 1 }],
  observance_definitions: { slug: 'yogini-ekadashi' },
};

describe('fixture-scoped publication exception', () => {
  it('retains the exact approved Yogini fixture while its general rule remains withheld', () => {
    expect(filterWithheldJoinedRows([approvedRow])).toHaveLength(1);
  });

  it.each([
    ['writer identity', { calculated_by: 'cron_job' }],
    ['Tier-1 evidence', { source_refs: [{ sourceName: 'Unknown', tier: 5 }] }],
    ['review status', { review_status: 'needs_review' }],
    ['complete batch family', { batch_family_complete: false }],
    ['fixture provenance', { source_provenance: {} }],
    ['current database approval', { fixture_approval_complete: false }],
    ['fixture diagnostic', { diagnostics: [] }],
  ])('fails closed when %s is absent', (_label, patch) => {
    expect(filterWithheldJoinedRows([{ ...approvedRow, ...patch }])).toHaveLength(0);
  });
});

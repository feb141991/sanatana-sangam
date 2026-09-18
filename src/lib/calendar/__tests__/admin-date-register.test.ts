import { describe, expect, it } from 'vitest';
import { assessAdminDate, fixtureCaseId, isValidHoldReason, type AdminDateRow } from '../admin-date-register';

const base: AdminDateRow = {
  id: '11111111-1111-4111-8111-111111111111',
  definition_id: '22222222-2222-4222-8222-222222222222',
  year: 2026,
  date: '2026-11-08',
  occurrence_date: '2026-11-08',
  calendar_profile: 'legacy-ujjain',
  spiritual_tradition: null,
  variant_key: null,
  computed_latitude: 23.1765,
  computed_longitude: 75.7885,
  computed_timezone: 'Asia/Kolkata',
  publication_status: 'published',
  review_status: 'reviewed',
  verification_status: 'verified',
  audit_status: 'completed',
  final_date_source: 'calculation_engine_reviewed',
  calculated_by: 'engine',
  source_provenance: { caseId: 'diwali-2026-ujjain' },
  source_refs: null,
  rule_version: '1.0.0',
  astronomy_version: '1.0.0',
  day_boundary_version: '1.0.0',
  manual_date_override: null,
  locked_for_regeneration: false,
  reviewed_at: '2026-08-20T00:00:00Z',
  review_notes: null,
  verification_note: null,
  batch_id: null,
  batch_family_complete: true,
  fixture_approval_complete: false,
  observance_definitions: { slug: 'diwali', display_name: 'Diwali', tradition: 'hindu', kind: 'major', active: true },
};

describe('admin canonical date register', () => {
  it('distinguishes stored verified flags from held and incomplete review', () => {
    expect(assessAdminDate(base).register_status).toBe('verified_published');
    expect(assessAdminDate(base).passes_core_app_gates).toBe(true);
    expect(assessAdminDate({ ...base, publication_status: 'withheld_disputed' }).register_status).toBe('held');
    expect(assessAdminDate({ ...base, verification_status: 'manual_review' }).register_status).toBe('published_needs_review');
  });

  it('never marks held, fallback, or incomplete batches as passing core app gates', () => {
    expect(assessAdminDate({ ...base, publication_status: 'withheld_disputed' }).passes_core_app_gates).toBe(false);
    expect(assessAdminDate({ ...base, final_date_source: 'fallback' }).passes_core_app_gates).toBe(false);
    expect(assessAdminDate({ ...base, batch_family_complete: false }).passes_core_app_gates).toBe(false);
  });

  it('extracts linked fixture identity only from structured provenance', () => {
    expect(fixtureCaseId(base.source_provenance)).toBe('diwali-2026-ujjain');
    expect(fixtureCaseId('diwali-2026-ujjain')).toBeNull();
    expect(fixtureCaseId({ caseId: 12 })).toBeNull();
  });

  it('requires a substantive bounded hold reason', () => {
    expect(isValidHoldReason('too short')).toBe(false);
    expect(isValidHoldReason('Official source conflict needs review')).toBe(true);
    expect(isValidHoldReason('x'.repeat(1001))).toBe(false);
  });
});

import { APPROVED_FIXTURE_WRITER } from './approved-fixture-governance';
import { filterWithheldJoinedRows } from './withheld';

export type AdminDateRow = {
  id: string;
  definition_id: string;
  year: number;
  date: string;
  occurrence_date: string;
  calendar_profile: string | null;
  spiritual_tradition: string | null;
  variant_key: string | null;
  computed_latitude: number | null;
  computed_longitude: number | null;
  computed_timezone: string | null;
  publication_status: 'published' | 'withheld_disputed';
  review_status: string | null;
  verification_status: string | null;
  audit_status: string | null;
  final_date_source: string | null;
  calculated_by: string | null;
  source_provenance: unknown;
  source_refs: unknown;
  rule_version: string | null;
  astronomy_version: string | null;
  day_boundary_version: string | null;
  manual_date_override: string | null;
  locked_for_regeneration: boolean;
  reviewed_at: string | null;
  review_notes: string | null;
  verification_note: string | null;
  batch_id: string | null;
  batch_family_complete?: boolean;
  fixture_approval_complete?: boolean;
  observance_definitions: { slug: string; display_name: string; tradition: string; kind: string; active: boolean } | null;
};

export type AdminDateAssessment = AdminDateRow & {
  register_status: 'held' | 'verified_published' | 'published_needs_review';
  passes_core_app_gates: boolean;
  fixture_case_id: string | null;
};

export function fixtureCaseId(provenance: unknown): string | null {
  if (!provenance || typeof provenance !== 'object' || Array.isArray(provenance)) return null;
  const value = (provenance as Record<string, unknown>).caseId;
  return typeof value === 'string' && value.length > 0 ? value : null;
}

export function assessAdminDate(row: AdminDateRow): AdminDateAssessment {
  const verified = row.review_status === 'reviewed'
    && row.verification_status === 'verified'
    && row.audit_status === 'completed';
  const registerStatus: AdminDateAssessment['register_status'] = row.publication_status !== 'published'
    ? 'held'
    : verified ? 'verified_published' : 'published_needs_review';
  const passesCoreAppGates = registerStatus === 'verified_published'
    && row.observance_definitions?.active === true
    && row.final_date_source !== 'fallback'
    && row.batch_family_complete === true
    && (row.calculated_by !== APPROVED_FIXTURE_WRITER || row.fixture_approval_complete === true)
    && filterWithheldJoinedRows([row]).length === 1;
  return {
    ...row,
    register_status: registerStatus,
    passes_core_app_gates: passesCoreAppGates,
    fixture_case_id: fixtureCaseId(row.source_provenance),
  };
}

export function isValidHoldReason(value: unknown): value is string {
  return typeof value === 'string' && value.trim().length >= 12 && value.trim().length <= 1000;
}

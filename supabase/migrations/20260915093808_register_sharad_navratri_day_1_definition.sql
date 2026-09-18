-- Add the missing Sharad Navratri series anchor definition and contain any
-- already-published, unapproved 2026 Ujjain Day 1 row. No occurrence is
-- created or published by this migration; the scoped writer remains a
-- separate, review-gated operation.
-- RLS/privileges/types: no table, policy, grant, or column changes; existing
-- observance_definitions access controls and generated types remain unchanged.
-- Rollback guidance: before any occurrence/content links exist, delete only
-- this exact slug after checking dependents. Once linked, supersede the row
-- additively rather than deleting it (FK cascades may remove editorial data).
begin;

insert into public.observance_definitions (
  slug, display_name, kind, tradition, calendar_rule_type,
  verification_type, route_kind, route_slug, emoji, active,
  is_shared, guarantee_level, description
) values (
  'navratri-day-1-shailaputri',
  'Navratri Day 1 — Shailaputri',
  'major', 'hindu', 'lunar_tithi_span',
  'lunar_tithi', 'vrat', 'sharad-navratri', '🪔', true,
  false, 'manual_review_required',
  'First day of Sharad Navratri (Ghatasthapana), worship of Goddess Shailaputri.'
)
on conflict (slug) do nothing;

-- A previous/manual row with this slug may exist by deployment time. In that
-- case refuse to treat unlike metadata as a successful idempotent run.
do $$
begin
  if not exists (
    select 1 from public.observance_definitions
    where slug = 'navratri-day-1-shailaputri'
      and display_name = 'Navratri Day 1 — Shailaputri'
      and kind = 'major'
      and tradition = 'hindu'
      and calendar_rule_type = 'lunar_tithi_span'
      and verification_type = 'lunar_tithi'
      and route_kind = 'vrat'
      and route_slug = 'sharad-navratri'
      and active = true
      and is_shared = false
      and guarantee_level = 'manual_review_required'
  ) then
    raise exception 'Navratri Day 1 definition metadata differs from the canonical series contract';
  end if;
end $$;

-- A parallel/manual backfill may already have inserted the row under the
-- table's historical DEFAULT 'published'. Withhold only the unreviewed 2026
-- canonical Ujjain identity. Never demote a genuinely reviewed, verified,
-- audited row, and never touch a different location/profile/variant.
update public.observance_occurrences o
set publication_status = 'withheld_disputed',
    review_status = 'needs_review',
    verification_note = coalesce(
      o.verification_note,
      'Withheld pending named human review; no calendar dispute is asserted.'
    ),
    updated_at = now()
from public.observance_definitions d
where o.definition_id = d.id
  and d.slug = 'navratri-day-1-shailaputri'
  and o.year = 2026
  and o.calendar_profile = 'legacy-ujjain'
  and o.spiritual_tradition is null
  and o.variant_key = 'legacy-default'
  and o.computed_latitude = 23.1765
  and o.computed_longitude = 75.7885
  and o.computed_timezone = 'Asia/Kolkata'
  and o.publication_status = 'published'
  and (
    o.review_status is distinct from 'reviewed'
    or o.verification_status is distinct from 'verified'
    or o.audit_status is distinct from 'completed'
  );

commit;

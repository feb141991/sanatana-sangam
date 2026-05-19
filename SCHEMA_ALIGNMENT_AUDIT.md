# Schema Alignment Audit

Last updated: 2026-05-19

## Current posture

The app is functional, but schema truth is still distributed across:
- Supabase migrations
- `src/types/database.ts`
- assumptions inside route code
- legacy columns kept for backward compatibility

## Known moving areas

### Profiles

Live/legacy mixture currently includes:
- `is_pro`
- `pro_activated_at`
- `pro_note`
- notification preference flags
- newer entitlement foundation fields are being introduced

Risk:
- route code may check `is_pro` while later billing code writes `subscription_status`

### Notifications

The notifications table is flexible enough for current use, but notification type semantics have drifted in route code before.

Risk:
- routes inventing ad hoc `type` values without shared normalization

### Panchang / Jyotish

These engines have grown quickly and should remain contract-led. UI should consume normalized outputs rather than internal engine-specific shapes.

### Pathshala

Content/source legitimacy is governed partly in code and partly in policy docs.

Risk:
- route copy overclaiming in-app corpus completeness relative to source policy

## Immediate recommendations

1. Treat migrations as the primary source of truth.
2. Keep `src/types/database.ts` updated in the same batch as every schema change.
3. Move entitlement checks to one shared helper.
4. Avoid route-specific notification type inventions.
5. Prefer additive migrations over reinterpreting legacy columns silently.

## This pass

This pass introduces:
- `migration-v62-nitya-reminder-preference.sql`
- `migration-v63-entitlement-foundation.sql`
- shared entitlement resolver in `src/lib/entitlements.ts`

## Still pending

- migrate route/server gating from raw `is_pro` checks to shared entitlement checks
- align admin/reporting surfaces to the same entitlement model
- decide deprecation path for `is_pro` once billing provider integration lands

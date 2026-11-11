# SGPC Production Stamp Plan (Not Executed)

This is a reviewed preparation plan only. No SQL in this document or the
companion script has been run.

## Pre-flight required by AGENTS section 4

1. Export a read-only pre-image of every Sikh occurrence row: id, slug, year,
   profile, location, tradition, variant, date, manual override, publication,
   review, verification, audit and lock fields.
2. Derive expected dates only from the committed edition files and the reviewed
   slug map. Produce counts by slug/year and a human-readable diff.
3. Run the plan against a shadow/branch database and review the generated SQL.
4. Confirm the exact applied migration state, lock/review exceptions, rollback
   file, and deployment order with Pt Prince. No `supabase db push`.

## Additive stamp

`scripts/prepare-sgpc-558-stamp.mjs` accepts the operator's read-only extract
and emits guarded SQL. A row is stampable only when
`manual_date_override ?? date` equals the printed Samvat 558 date and falls in
2026-03-14 through 2027-03-13. The update adds:

```json
{"calendar_provenance":{"provenance":"sgpc_edition","edition":558}}
```

The manually corrected Guru Gobind Singh row
`3b934013-188d-4221-ab66-49a054cb265d` is included when its effective date is
2027-01-15. The predicate requires the pre-image date and existing provenance
shape, so a changed row aborts rather than being overwritten.

## Stale rows

Rows outside a covering edition or whose effective date differs from the
printed date are listed by the generated plan. They are not stamped. After the
code deploy, the approved follow-up is a guarded update to
`publication_status = 'withheld_disputed'` for those exact ids, preserving the
pre-image publication status/date/override predicate. Locked or reviewed rows
must be listed separately and require Pt Prince's explicit approval; no delete
is proposed.

Rollback for an additive stamp is another guarded update that removes only the
exact `{provenance:'sgpc_edition', edition:558}` object from the rows whose
pre-image stamp was recorded. The operator must retain the pre-image export and
the generated plan as the rollback input. The stale-row hold rollback restores
`publication_status` only where the current value is `withheld_disputed` and
the pre-image hash matches.

## Deploy order

1. Review the pre-image and generated stamp/hold counts.
2. Apply the additive provenance stamp only after approval.
3. Deploy the fail-closed route and consumer guards.
4. Verify public responses and admin visibility.
5. Withhold stale rows in a separate approved operation.

No production write, migration, or deployment was performed by this change.

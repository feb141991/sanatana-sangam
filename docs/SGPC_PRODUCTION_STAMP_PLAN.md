# SGPC Production Stamp Plan (Not Executed)

This is the close-out record and future cleanup plan. The Samvat 558 provenance
stamp was applied to production on 2026-11-11 by Claude with Pt Prince's
approval. No work in this checkout performed a production write.

## Pre-flight required by AGENTS section 4

1. Export a read-only pre-image of every Sikh occurrence row: id, slug, year,
   profile, location, tradition, variant, date, manual override, publication,
   review, verification, audit and lock fields.
2. Derive expected dates only from the committed edition files and the reviewed
   slug map. Produce counts by slug/year and a human-readable diff.
3. Run the plan against a shadow/branch database and review the generated SQL.
4. Confirm the exact applied migration state, lock/review exceptions, rollback
   file, and deployment order with Pt Prince. No `supabase db push`.

## Applied stamp

The production stamp covered 131 published rows: Baisakhi, Guru Arjan Dev,
Bandhi Chhor Divas, Guru Nanak Gurpurab and Guru Tegh Bahadur Martyrdom (26
each), plus one Guru Gobind Singh row, including
`3b934013-188d-4221-ab66-49a054cb265d` at 2027-01-15. The rollback removes only
the `calendar_provenance` key. The production stamp was verified; this document
does not re-run it.

The applied predicate was: `manual_date_override ?? date` equals the printed
Samvat 558 date and falls in 2026-03-14 through 2027-03-13. The value added was:

```json
{"calendar_provenance":{"provenance":"sgpc_edition","edition":558}}
```

The manually corrected Guru Gobind Singh row
`3b934013-188d-4221-ab66-49a054cb265d` is included when its effective date is
2027-01-15. The predicate requires the pre-image date and existing provenance
shape, so a changed row aborts rather than being overwritten.

## Delete plan for stale rows

There are 193 unstamped Sikh rows outside a covering edition or whose effective
date differs from the printed date: 113 published and 80 withheld, spanning
2025-2031. This count excludes Lohri and the legacy
`sahibzade-shaheedi-diwas` cultural convention. They must be deleted only after
the SGPC-only code is deployed, using the RLS-locked backup table
`observance_occurrences_sikh_removed_20261111` and a pre-image guard. This is a
delete decision, not a withhold decision.

The earlier `prepare-sgpc-558-stamp.mjs` and its generated withhold SQL are
superseded and removed from the working tree. The approved rollback is the
production stamp rollback plus restoration from the locked backup table for any
deleted rows. The backup must retain every deleted row's full pre-image.

## Deploy order

1. Additive stamp first (already completed in production).
2. Deploy the SGPC-only code and provenance-based eligibility guards.
3. Materialize missing 558 rows: elder Sahibzade, younger Sahibzade, and Guru Ravidas 2027-02-20.
4. Verify public responses and admin visibility.
5. Back up and delete the 193 stale rows in a separate approved operation.

Any future delete or restoration requires Pt Prince's explicit approval and a
reviewed pre-image/rollback run. No production write, migration, or deployment
was performed by this checkout.

# Compliance Decision Gates

Engineering must not convert the following unresolved legal/product choices
into silent defaults. `src/lib/compliance/policy-config.ts` is the machine-
readable source of truth and deliberately keeps each decision unapproved.

## Religious-profile consent

| Decision | Status |
|---|---|
| Covered special-category fields | Proposed; approval pending |
| Purpose and receipt version | Pending |
| Generic experience after decline | Pending product approval |
| Existing-record treatment | Pending legal/product approval; no fake backfill |
| Withdrawal deletion/retention rule | Pending; no destructive job enabled |

Until approved, new server-side enforcement must not claim valid consent from
the legacy `consent_religious_data` boolean. That boolean is not a versioned
receipt and its historical default was `true`.

## Age and birth-data policy

Inventory: authenticated onboarding/profile DOB, guest and authenticated
Jyotish chart calculations, saved birth profiles, Kul family-member dates and
places, and Sanskar suggestions. On 2026-08-25 the founder approved a product
policy that keeps account creation available, states that Shoonaya is not
directed to children under 13, and asks users under 18 to continue with a
parent or guardian involved. Versioned guidance is displayed at active DOB
entry surfaces and is reflected in Terms and Privacy copy. This is a soft
guidance policy, not verified parental consent, and legal review of target-
market obligations, chart-subject handling, legacy records and enforcement
remains pending. The current API behavior must not be described as fully age-
compliant until that review is complete.

## Legal acceptance

The published Terms and Privacy pages exist, but no approved immutable version
identifiers, acceptance wording or reacceptance rule have been supplied. An
append-only receipt migration and signup gate must not be enabled until those
values are approved. No historical acceptance may be backfilled.

## Retention

Retention periods remain counsel/product decisions. The registry in
`docs/DATA_LIFECYCLE_REGISTRY.json` records storage and deletion ownership but
uses `null` for every unapproved period. No production cleanup is authorized.

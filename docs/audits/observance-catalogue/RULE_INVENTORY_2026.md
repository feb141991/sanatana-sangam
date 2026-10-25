# Festival and Vrat Rule Inventory (2026)

Generated from `packages/dharma-rules/src/festivals/rules.json`, `series.json`, the calendar engine, and the read-only catalogue audit at `docs/audits/observance-catalogue/2026.json`.

> Engine counts below use the Ujjain reference location. They describe calculated instances only; they are not independent date verification, human ratification, or publication approval.

## Clean totals

- **117 parent rules** across 115 slugs. The 2 repeated slug(s) are intentional, separately-qualified variants: krishna-janmashtami (2 separately-qualified rule variants); yogini-ekadashi (2 separately-qualified rule variants).
- **7 observance series** with 61 series-child entries. 79 unique child slugs are represented across series and rule sub-observances; child rows are not extra parent rules.
- Kinds: major 71; regional 15; vrat 31.
- Rule launch states: deferred 47; included 70.
- Rule families: lunar_tithi 59; lunar_tithi_recurring 6; lunar_tithi_span 4; nakshatra_based 1; regional_calendar 6; relative_to_other_observance 34; solar_fixed 3; solar_sankranti 2; weekday_recurring 2.
- Shared lunar slots flagged by `validate:rules`: 8. These are review flags, not duplicate findings.
- Exact duplicate published occurrence identities: 0. The key includes definition, year, calendar profile, civil date, variant and calculation location.
- Production audit: 138 active definitions; 78 engine-resolved, 46 deferred, 13 series children, 0 definitions with no rule or series entry; 46 deferred definitions have stored published rows, of which 1 pass the current read-time gate.

## Repeating observances

A repeated date is expected for these recurrence rules. Keep one rule and multiple yearly instances; do not create a new rule or delete an instance just because it shares a festival/vrat family name.

| Rule | Kind | Status | Family | Unique resolved dates in target year |
|---|---|---|---|---|
| `ekadashi` | vrat | included | lunar_tithi_recurring | 2026: 23 |
| `pradosh-vrat` | vrat | included | lunar_tithi_recurring | 2026: 23 |
| `purnima-vrat` | vrat | included | lunar_tithi_recurring | 2026: 12 |
| `amavasya-vrat` | vrat | included | lunar_tithi_recurring | 2026: 12 |
| `vinayaka-chaturthi` | vrat | deferred | lunar_tithi_recurring | 2026: 0 |
| `sankashti-chaturthi` | vrat | deferred | lunar_tithi_recurring | 2026: 0 |
| `shravan-somvar` | vrat | deferred | weekday_recurring | 2026: 0 |
| `mangala-gauri-vrat` | vrat | deferred | weekday_recurring | 2026: 0 |

## Shared lunar slots to review

The rule validator warns when different slugs point at the same month/tithi/month-system slot. Some are legitimate co-occurrences or regional names; this list is not an instruction to delete or merge rules. Verify convention and source before changing any.

| Slot | Rules sharing it |
|---|---|
| Chaitra / 1 / amanta | `gudi-padwa`, `chaitra-navratri-begins`, `ugadi` |
| Vaishakha / 3 / amanta | `akshaya-tritiya`, `akshaya-tritiya-jain` |
| Jyeshtha / 30 / purnimanta | `shani-jayanti`, `vat-savitri-amavasya` |
| Ashadha / 15 / amanta | `guru-purnima`, `asalha-puja` |
| Shravana / 15 / amanta | `raksha-bandhan`, `ullambana-ancestor-day` |
| Margashirsha / 11 / amanta | `gita-jayanti`, `vaikunta-ekadashi` |
| Magha / 15 / amanta | `guru-ravidas-jayanti`, `magha-puja` |
| Bhadrapada / 5 / amanta | `samvatsari-paryushana-ends`, `das-lakshana-dharma-begins` |

The known Gita Jayanti / Vaikuntha Ekadashi overlap is a sourcing question explicitly flagged in `scripts/validate-rules.ts`; do not resolve it by choosing a date from code inspection alone.

## All parent rules

| Rule | Kind | Tradition | Status | Rule family | Convention / anchor | Evidence recorded | Unique resolved dates in target year |
|---|---|---|---|---|---|---|---|
| `makar-sankranti` | major | hindu | included | solar_sankranti | solar ingress 9 | review note | 2026: 1 |
| `vasant-panchami` | major | hindu | deferred | lunar_tithi | Magha, amanta, tithi 5 | review note | 2026: 0 |
| `maha-shivaratri` | major | hindu | included | lunar_tithi | Magha, amanta, tithi 28 | citation, review note | 2026: 1 |
| `holi` | major | hindu | included | lunar_tithi | Phalguna, amanta, tithi 15 | review note | 2026: 1 |
| `gudi-padwa` | major | hindu | deferred | lunar_tithi | Chaitra, amanta, tithi 1 | review note | 2026: 0 |
| `chaitra-navratri-begins` | major | hindu | included | lunar_tithi_span | Chaitra, amanta, tithi 1, span 1,2,3,4,5,6,7,8,9 | review note | 2026: 1 |
| `ugadi` | major | hindu | deferred | lunar_tithi | Chaitra, amanta, tithi 1 | none recorded | 2026: 0 |
| `ram-navami` | major | hindu | included | lunar_tithi | Chaitra, amanta, tithi 9 | review note | 2026: 1 |
| `hanuman-jayanti` | major | hindu | deferred | lunar_tithi | Chaitra, amanta, tithi 15 | none recorded | 2026: 0 |
| `akshaya-tritiya` | major | hindu | deferred | lunar_tithi | Vaishakha, amanta, tithi 3 | review note | 2026: 0 |
| `narasimha-jayanti` | regional | hindu | deferred | lunar_tithi | Vaishakha, amanta, tithi 14 | none recorded | 2026: 0 |
| `shani-jayanti` | major | hindu | deferred | lunar_tithi | Jyeshtha, purnimanta, tithi 30 | none recorded | 2026: 0 |
| `vat-savitri-amavasya` | vrat | hindu | deferred | lunar_tithi | Jyeshtha, purnimanta, tithi 30 | none recorded | 2026: 0 |
| `vat-savitri-purnima` | vrat | hindu | deferred | lunar_tithi | Jyeshtha, amanta, tithi 15 | none recorded | 2026: 0 |
| `jagannath-rath-yatra` | major | hindu | deferred | lunar_tithi | Ashadha, amanta, tithi 2 | none recorded | 2026: 0 |
| `gupt-navratri-ashadha-begins` | regional | hindu | deferred | lunar_tithi_span | Ashadha, amanta, tithi 1, span 1,2,3,4,5,6,7,8,9 | review note | 2026: 0 |
| `guru-purnima` | major | all | included | lunar_tithi | Ashadha, amanta, tithi 15 | review note | 2026: 1 |
| `nag-panchami` | regional | hindu | deferred | lunar_tithi | Shravana, amanta, tithi 5 | none recorded | 2026: 0 |
| `raksha-bandhan` | major | hindu | included | lunar_tithi | Shravana, amanta, tithi 15 | review note | 2026: 1 |
| `krishna-janmashtami::smarta_nishita` | major | hindu | included | lunar_tithi | Shravana, amanta, tithi 23 | citation, review note | 2026: 1 (all variants combined) |
| `krishna-janmashtami::gaudiya_iskcon` | major | hindu | included | lunar_tithi | Shravana, amanta, tithi 23 | citation, review note | 2026: 1 (all variants combined) |
| `ganesh-chaturthi` | major | hindu | included | lunar_tithi | Bhadrapada, amanta, tithi 4 | review note | 2026: 1 |
| `radha-ashtami` | major | hindu | included | lunar_tithi | Bhadrapada, amanta, tithi 8 | review note | 2026: 1 |
| `ganeshotsav-day-2` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +1d | none recorded | 2026: 1 |
| `ganeshotsav-day-3` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +2d | none recorded | 2026: 1 |
| `ganeshotsav-day-4` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +3d | none recorded | 2026: 1 |
| `ganeshotsav-day-5` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +4d | none recorded | 2026: 1 |
| `ganeshotsav-day-6` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +5d | none recorded | 2026: 1 |
| `ganeshotsav-day-7` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +6d | none recorded | 2026: 1 |
| `ganeshotsav-day-8` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +7d | none recorded | 2026: 1 |
| `ganeshotsav-day-9` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +8d | none recorded | 2026: 1 |
| `ganeshotsav-day-10` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +9d | none recorded | 2026: 1 |
| `anant-chaturdashi-ganesh-visarjan` | major | hindu | included | relative_to_other_observance | base ganesh-chaturthi +10d | review note | 2026: 1 |
| `onam` | regional | hindu | deferred | nakshatra_based | Shravana, amanta | review note | 2026: 0 |
| `hartalika-teej` | vrat | hindu | deferred | lunar_tithi | Bhadrapada, amanta, tithi 3 | none recorded | 2026: 0 |
| `mahalaya-amavasya` | vrat | hindu | deferred | relative_to_other_observance | base navratri-begins -1d | none recorded | 2026: 0 |
| `navratri-begins` | major | hindu | included | lunar_tithi_span | Ashwin, amanta, span 1,2,3,4,5,6,7,8,9,10 | review note | 2026: 1 |
| `chintpurni-mata-chaitra-navratri` | regional | hindu | deferred | relative_to_other_observance | base chaitra-navratri-begins 0d | none recorded | 2026: 0 |
| `chintpurni-mata-sharad-navratri` | regional | hindu | deferred | relative_to_other_observance | base navratri-begins 0d | none recorded | 2026: 0 |
| `karva-chauth` | vrat | hindu | included | lunar_tithi | Kartika, purnimanta, tithi 19 | citation, review note | 2026: 1 |
| `dhanteras` | major | hindu | included | relative_to_other_observance | base diwali -2d | none recorded | 2026: 1 |
| `diwali` | major | all | included | lunar_tithi | Kartika, purnimanta, tithi 29 | citation, review note | 2026: 1 |
| `naraka-chaturdashi` | major | hindu | included | lunar_tithi | Kartika, purnimanta | citation, review note | 2026: 1 |
| `govardhan-puja` | major | hindu | included | relative_to_other_observance | base diwali +1d | none recorded | 2026: 1 |
| `bhai-dooj` | major | hindu | included | relative_to_other_observance | base diwali +2d | none recorded | 2026: 1 |
| `chhath-puja` | regional | hindu | included | lunar_tithi | Kartika, amanta, tithi 6 | review note | 2026: 1 |
| `chhath-nahay-khay` | regional | hindu | included | relative_to_other_observance | base chhath-puja -2d | none recorded | 2026: 1 |
| `chhath-kharna` | regional | hindu | included | relative_to_other_observance | base chhath-puja -1d | none recorded | 2026: 1 |
| `chhath-usha-arghya` | regional | hindu | included | relative_to_other_observance | base chhath-puja +1d | none recorded | 2026: 1 |
| `kartik-purnima` | vrat | hindu | deferred | relative_to_other_observance | base diwali +16d | none recorded | 2026: 0 |
| `vivah-panchami` | regional | hindu | deferred | lunar_tithi | Margashirsha, amanta, tithi 5 | none recorded | 2026: 0 |
| `gita-jayanti` | major | hindu | deferred | lunar_tithi | Margashirsha, amanta, tithi 11 | none recorded | 2026: 0 |
| `vaikunta-ekadashi` | major | hindu | deferred | lunar_tithi | Margashirsha, amanta, tithi 11 | none recorded | 2026: 0 |
| `kamada-ekadashi` | vrat | hindu | included | lunar_tithi | Chaitra, amanta, tithi 11 | none recorded | 2026: 1 |
| `nirjala-ekadashi` | vrat | hindu | included | lunar_tithi | Jyeshtha, amanta, tithi 11 | none recorded | 2026: 1 |
| `devshayani-ekadashi` | vrat | hindu | included | lunar_tithi | Ashadha, amanta, tithi 11 | none recorded | 2026: 1 |
| `shravana-putrada-ekadashi` | vrat | hindu | included | lunar_tithi | Shravana, amanta, tithi 11 | none recorded | 2026: 1 |
| `parivartini-ekadashi` | vrat | hindu | included | lunar_tithi | Bhadrapada, amanta, tithi 11 | none recorded | 2026: 1 |
| `devutthana-ekadashi` | vrat | hindu | included | lunar_tithi | Kartika, amanta, tithi 11 | none recorded | 2026: 1 |
| `amalaki-ekadashi` | vrat | hindu | included | lunar_tithi | Phalguna, amanta, tithi 11 | none recorded | 2026: 1 |
| `papmochani-ekadashi` | vrat | hindu | included | lunar_tithi | Chaitra, amanta, tithi 26 | none recorded | 2026: 1 |
| `apara-ekadashi` | vrat | hindu | included | lunar_tithi | Jyeshtha, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `kamika-ekadashi` | vrat | hindu | included | lunar_tithi | Shravana, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `aja-ekadashi` | vrat | hindu | included | lunar_tithi | Bhadrapada, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `rama-ekadashi` | vrat | hindu | included | lunar_tithi | Kartika, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `utpanna-ekadashi` | vrat | hindu | included | lunar_tithi | Margashirsha, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `saphala-ekadashi` | vrat | hindu | included | lunar_tithi | Pausha, purnimanta, tithi 26 | citation, review note | 2026: 0 |
| `vijaya-ekadashi` | vrat | hindu | included | lunar_tithi | Phalguna, purnimanta, tithi 26 | citation, review note | 2026: 1 |
| `gupt-navratri-magha-begins` | regional | hindu | deferred | lunar_tithi_span | Magha, amanta, tithi 1, span 1,2,3,4,5,6,7,8,9 | review note | 2026: 0 |
| `guru-gobind-singh-gurpurab` | major | sikh | included | regional_calendar | see rule fields | review note | 2026: 1 |
| `lohri` | major | sikh | included | relative_to_other_observance | base makar-sankranti -1d | none recorded | 2026: 1 |
| `guru-ravidas-jayanti` | major | sikh | included | lunar_tithi | Magha, amanta, tithi 15 | review note | 2026: 1 |
| `holla-mohalla` | major | sikh | included | relative_to_other_observance | base holi +1d | none recorded | 2026: 1 |
| `baisakhi` | major | sikh | included | solar_sankranti | solar ingress 0 | review note | 2026: 1 |
| `guru-amar-das-gurpurab` | regional | sikh | deferred | regional_calendar | see rule fields | review note | 2026: 0 |
| `guru-arjan-dev-martyrdom` | major | sikh | included | regional_calendar | see rule fields | review note | 2026: 1 |
| `guru-har-krishan-gurpurab` | regional | sikh | deferred | regional_calendar | see rule fields | review note | 2026: 0 |
| `guru-ram-das-gurpurab` | regional | sikh | deferred | regional_calendar | see rule fields | review note | 2026: 0 |
| `bandhi-chhor-divas` | major | sikh | included | relative_to_other_observance | base diwali 0d | none recorded | 2026: 1 |
| `guru-nanak-gurpurab` | major | sikh | included | relative_to_other_observance | base diwali +16d | none recorded | 2026: 1 |
| `guru-tegh-bahadur-martyrdom` | major | sikh | included | regional_calendar | see rule fields | review note | 2026: 1 |
| `sahibzade-shaheedi-diwas` | major | sikh | included | solar_fixed | solar 12/26 | none recorded | 2026: 1 |
| `parinirvana-day` | major | buddhist | deferred | solar_fixed | solar 2/15 | none recorded | 2026: 0 |
| `losar-tibetan-new-year` | major | buddhist | deferred | lunar_tithi | Phalguna, amanta, tithi 1 | none recorded | 2026: 0 |
| `magha-puja` | major | buddhist | deferred | lunar_tithi | Magha, amanta, tithi 15 | none recorded | 2026: 0 |
| `vesak-buddha-purnima` | major | buddhist | deferred | lunar_tithi | Vaishakha, amanta, tithi 15 | none recorded | 2026: 0 |
| `asalha-puja` | major | buddhist | deferred | lunar_tithi | Ashadha, amanta, tithi 15 | none recorded | 2026: 0 |
| `vassa-begins-rains-retreat` | major | buddhist | deferred | lunar_tithi | Ashadha, amanta, tithi 16 | review note | 2026: 0 |
| `ullambana-ancestor-day` | major | buddhist | deferred | lunar_tithi | Shravana, amanta, tithi 15 | none recorded | 2026: 0 |
| `pavarana-end-of-vassa` | major | buddhist | deferred | lunar_tithi | Ashwin, amanta, tithi 15 | none recorded | 2026: 0 |
| `kathina` | major | buddhist | deferred | lunar_tithi | Ashwin, amanta, tithi 16 | review note | 2026: 0 |
| `sangha-day-loy-krathong` | major | buddhist | deferred | relative_to_other_observance | base diwali +16d | none recorded | 2026: 0 |
| `bodhi-day` | major | buddhist | deferred | solar_fixed | solar 12/8 | none recorded | 2026: 0 |
| `mahavir-jayanti` | major | jain | included | lunar_tithi | Chaitra, amanta, tithi 13 | review note | 2026: 1 |
| `akshaya-tritiya-jain` | major | jain | deferred | lunar_tithi | Vaishakha, amanta, tithi 3 | none recorded | 2026: 0 |
| `paryushana-parva-begins` | major | jain | included | lunar_tithi | Shravana, amanta, tithi 27 | review note | 2026: 1 |
| `paryushana-day-2` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +1d | review note | 2026: 1 |
| `paryushana-day-3` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +2d | review note | 2026: 1 |
| `paryushana-day-4` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +3d | review note | 2026: 1 |
| `paryushana-day-5` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +4d | review note | 2026: 1 |
| `paryushana-day-6` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +5d | review note | 2026: 1 |
| `paryushana-day-7` | major | jain | included | relative_to_other_observance | base paryushana-parva-begins +6d | review note | 2026: 1 |
| `samvatsari-paryushana-ends` | major | jain | included | lunar_tithi | Bhadrapada, amanta, tithi 5 | review note | 2026: 1 |
| `das-lakshana-dharma-begins` | major | jain | deferred | lunar_tithi | Bhadrapada, amanta, tithi 5 | none recorded | 2026: 0 |
| `jain-new-year-pratipada` | major | jain | deferred | relative_to_other_observance | base diwali +1d | none recorded | 2026: 0 |
| `jain-diwali-nirvana-ladnun` | major | jain | deferred | relative_to_other_observance | base diwali 0d | none recorded | 2026: 0 |
| `kartik-purnima-jain` | major | jain | deferred | relative_to_other_observance | base diwali +16d | none recorded | 2026: 0 |
| `ekadashi` | vrat | hindu | included | lunar_tithi_recurring | see rule fields | none recorded | 2026: 23 |
| `pradosh-vrat` | vrat | hindu | included | lunar_tithi_recurring | see rule fields | none recorded | 2026: 23 |
| `purnima-vrat` | vrat | hindu | included | lunar_tithi_recurring | see rule fields | none recorded | 2026: 12 |
| `amavasya-vrat` | vrat | hindu | included | lunar_tithi_recurring | see rule fields | none recorded | 2026: 12 |
| `vinayaka-chaturthi` | vrat | hindu | deferred | lunar_tithi_recurring | see rule fields | none recorded | 2026: 0 |
| `sankashti-chaturthi` | vrat | hindu | deferred | lunar_tithi_recurring | see rule fields | none recorded | 2026: 0 |
| `shravan-somvar` | vrat | hindu | deferred | weekday_recurring | Shravana, amanta | none recorded | 2026: 0 |
| `mangala-gauri-vrat` | vrat | hindu | deferred | weekday_recurring | Shravana, amanta | none recorded | 2026: 0 |
| `yogini-ekadashi::smarta` | vrat | hindu | deferred | lunar_tithi | Ashadha, purnimanta, tithi 26 | citation, review note | 2026: 0 (all variants combined) |
| `yogini-ekadashi::vaishnava_vidhava` | vrat | hindu | deferred | lunar_tithi | Ashadha, purnimanta, tithi 26 | citation, review note | 2026: 0 (all variants combined) |

## Production cleanup queue

### Deferred rule, but published occurrence rows exist

**46 active definitions** have rows stored as published while their matching rule is deferred. The production read audit applies the exact calendar API gate: 1 of those rows pass it; the rest are withheld at read time. This is storage cleanup/reconciliation work, not proof that every stored row should be deleted. Check occurrence-level fixture approvals, profile, variant, and provenance before changing any row.

| Slug | Stored rows | Read-visible | Withheld | Distinct civil dates | Target-year dates and row counts |
|---|---:|---:|---:|---:|---|
| akshaya-tritiya | 1 | 0 | 1 | 1 | 2026-04-20 (1 rows) |
| akshaya-tritiya-jain | 1 | 0 | 1 | 1 | 2026-04-20 (1 rows) |
| asalha-puja | 1 | 0 | 1 | 1 | 2026-07-29 (1 rows) |
| bodhi-day | 1 | 0 | 1 | 1 | 2026-12-08 (1 rows) |
| chintpurni-mata-chaitra-navratri | 1 | 0 | 1 | 1 | 2026-03-20 (1 rows) |
| chintpurni-mata-sharad-navratri | 1 | 0 | 1 | 1 | 2026-10-11 (1 rows) |
| das-lakshana-dharma-begins | 1 | 0 | 1 | 1 | 2026-09-16 (1 rows) |
| gita-jayanti | 1 | 0 | 1 | 1 | 2026-12-20 (1 rows) |
| gudi-padwa | 1 | 0 | 1 | 1 | 2026-03-20 (1 rows) |
| gupt-navratri-ashadha-begins | 1 | 0 | 1 | 1 | 2026-07-15 (1 rows) |
| gupt-navratri-magha-begins | 1 | 0 | 1 | 1 | 2026-01-19 (1 rows) |
| guru-amar-das-gurpurab | 1 | 0 | 1 | 1 | 2026-05-23 (1 rows) |
| guru-har-krishan-gurpurab | 1 | 0 | 1 | 1 | 2026-07-23 (1 rows) |
| guru-ram-das-gurpurab | 1 | 0 | 1 | 1 | 2026-10-09 (1 rows) |
| hanuman-jayanti | 1 | 0 | 1 | 1 | 2026-04-02 (1 rows) |
| hartalika-teej | 1 | 0 | 1 | 1 | 2026-09-13 (1 rows) |
| jagannath-rath-yatra | 1 | 0 | 1 | 1 | 2026-07-16 (1 rows) |
| jain-diwali-nirvana-ladnun | 1 | 0 | 1 | 1 | 2026-11-08 (1 rows) |
| jain-new-year-pratipada | 1 | 0 | 1 | 1 | 2026-11-09 (1 rows) |
| kartik-purnima | 1 | 0 | 1 | 1 | 2026-11-24 (1 rows) |
| kartik-purnima-jain | 1 | 0 | 1 | 1 | 2026-11-24 (1 rows) |
| kathina | 1 | 0 | 1 | 1 | 2026-10-26 (1 rows) |
| losar-tibetan-new-year | 1 | 0 | 1 | 1 | 2026-02-18 (1 rows) |
| magha-puja | 1 | 0 | 1 | 1 | 2026-03-03 (1 rows) |
| mahalaya-amavasya | 1 | 1 | 0 | 1 | 2026-10-10 (1 rows) |
| mangala-gauri-vrat | 4 | 0 | 4 | 4 | 2026-07-21 (1 rows), 2026-07-28 (1 rows), 2026-08-04 (1 rows), 2026-08-11 (1 rows) |
| nag-panchami | 1 | 0 | 1 | 1 | 2026-08-17 (1 rows) |
| narasimha-jayanti | 1 | 0 | 1 | 1 | 2026-04-30 (1 rows) |
| onam | 1 | 0 | 1 | 1 | 2026-08-26 (1 rows) |
| parinirvana-day | 1 | 0 | 1 | 1 | 2026-02-15 (1 rows) |
| pavarana-end-of-vassa | 1 | 0 | 1 | 1 | 2026-10-25 (1 rows) |
| sangha-day-loy-krathong | 1 | 0 | 1 | 1 | 2026-11-24 (1 rows) |
| sankashti-chaturthi | 12 | 0 | 12 | 12 | 2026-01-07 (1 rows), 2026-02-05 (1 rows), 2026-03-07 (1 rows), 2026-04-06 (1 rows), 2026-05-05 (1 rows), 2026-06-04 (1 rows), 2026-07-04 (1 rows), 2026-08-02 (1 rows), 2026-09-01 (1 rows), 2026-09-30 (1 rows), 2026-11-28 (1 rows), 2026-12-27 (1 rows) |
| shani-jayanti | 1 | 0 | 1 | 1 | 2026-05-16 (1 rows) |
| shravan-somvar | 3 | 0 | 3 | 3 | 2026-07-20 (1 rows), 2026-07-27 (1 rows), 2026-08-03 (1 rows) |
| ugadi | 1 | 0 | 1 | 1 | 2026-03-20 (1 rows) |
| ullambana-ancestor-day | 1 | 0 | 1 | 1 | 2026-08-27 (1 rows) |
| vaikunta-ekadashi | 1 | 0 | 1 | 1 | 2026-12-20 (1 rows) |
| vasant-panchami | 1 | 0 | 1 | 1 | 2026-01-23 (1 rows) |
| vassa-begins-rains-retreat | 1 | 0 | 1 | 1 | 2026-07-30 (1 rows) |
| vat-savitri-amavasya | 1 | 0 | 1 | 1 | 2026-05-16 (1 rows) |
| vat-savitri-purnima | 1 | 0 | 1 | 1 | 2026-05-31 (1 rows) |
| vesak-buddha-purnima | 1 | 0 | 1 | 1 | 2026-05-31 (1 rows) |
| vinayaka-chaturthi | 11 | 0 | 11 | 11 | 2026-01-22 (1 rows), 2026-02-21 (1 rows), 2026-03-22 (1 rows), 2026-04-21 (1 rows), 2026-05-20 (1 rows), 2026-06-18 (1 rows), 2026-07-17 (1 rows), 2026-08-16 (1 rows), 2026-10-14 (1 rows), 2026-11-13 (1 rows), 2026-12-13 (1 rows) |
| vivah-panchami | 1 | 0 | 1 | 1 | 2026-12-14 (1 rows) |
| yogini-ekadashi | 2 | 0 | 2 | 2 | 2026-07-10 (1 rows), 2026-07-11 (1 rows) |

Series-only active definitions are listed separately in the production audit as `series_child`; they are intentionally not reported as missing rules.

## How to read this inventory

- **Rule** is a rule slug plus its variant qualifier when present. Same-slug variants are distinct calendar readings, not duplicate noise.
- **Unique resolved dates** count distinct civil dates from the production catalogue audit for the target year, in its default Ujjain context. Same-day variant results are counted once in this inventory. A count of 0 does not by itself mean the rule is wrong; deferred rules intentionally produce none. Same-slug variants share the combined slug count.
- **Evidence recorded** is a field-presence check only. It does not claim that a source was independently checked or that a human review happened.
- **Production cleanup queue** identifies status/data inconsistencies for human review. Do not bulk-delete or publish rows based on this generated report alone.

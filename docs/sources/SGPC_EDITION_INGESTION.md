# Manual SGPC Nanakshahi Edition Procedure

This is the yearly, human-controlled procedure for adding an SGPC Nanakshahi
edition. It is data-only: no date is calculated, inferred, or published by the
ingestion step. The edition remains non-final until the printed rows and month
starts are confirmed by a named reviewer.

## 1. Obtain and record the source

Use the SGPC Nanakshahi calendar page:

- https://sgpc.net/nanakshahi-calendar/
- Save the PDF outside the repository while working.
- Record the direct PDF URL, byte size, SHA-256, download date, edition number,
  and printed March-to-March coverage.
- Do not commit the PDF or OCR model.

Record whether the PDF is text-backed or image-only. For a text PDF, inspect
the layout with `pdftotext -bbox`. For an image-only PDF, render with
`pdftoppm` and OCR with Tesseract's Punjabi `pan.traineddata` model.

The model is available from the official tessdata repository:
https://github.com/tesseract-ocr/tessdata_best/raw/main/pan.traineddata

Record its byte size and SHA-256 in the review sheet. The model is temporary;
never add it to Git.

## 2. Read the edition manually

From the printed calendar grid, transcribe all 12 month starts and the edition
range. From every sidebar, transcribe every printed row, including range dates
such as `21-22 Assu`. Preserve the printed name and page/section locator.

Assign categories only from the printed colour and the legend chips:
`gurpurab`, `itihasik`, `bhagat_sahiban`, or `sarkari_holiday`. Record the
legend RGB and sampled row RGB used for each assignment. If colour is not
readable, use `unknown`; do not guess.

Map names to application slugs through
`docs/sources/sgpc-nanakshahi-slug-map.json`. New or unmapped entries are
review blockers and must be listed for a decision. A printed entry may remain
unmapped; it must not be silently dropped.

## 3. Cross-check the facts

For each row, verify that its printed month/day reproduces the Gregorian date
from that edition's month-start table. Check range dates by checking both
endpoints. Check that all 12 months are present and that month starts are in
order. Record every mismatch in the review sheet.

Use the repository's optional validator only after the facts have been
manually extracted:

```bash
node scripts/sources/ingest-sgpc-edition.mjs \
  --pdf /path/to/Calender-Nanakshahi-<samvat>.pdf \
  --facts /path/to/extracted-facts.json \
  --out docs/sources/sgpc-nanakshahi-<samvat>-sidebar.json \
  --review-sheet docs/sources/sgpc-nanakshahi-<samvat>-sidebar.REVIEW.md
```

`ingest-sgpc-edition.mjs` is intentionally not being developed into an
extractor. It is an optional validator/serializer for already-extracted facts;
the PDF reading, OCR alignment, colour sampling, and mapping decisions remain
manual evidence work.

## 4. Human confirmation

The reviewer must inspect the PDF/crops and confirm month starts, names,
categories, mappings, and every unmapped/new entry. This is a review receipt,
not council ratification. After explicit confirmation, set
`read_by_human: true`, `reviewed_by`, and `reviewed_at` on the edition and every
row. Do not change a row's category or name during confirmation without
resetting its review flag.

## 5. Register and verify

Place the confirmed edition JSON in `docs/sources/`. The edition registry loads
all files named `sgpc-nanakshahi-<samvat>-sidebar.json`, derives coverage from
the file, and selects an edition by date. Adding a future edition is therefore
a data-only change.

Run the existing checks:

```bash
npx vitest run scripts/sources/ingest-sgpc-edition.test.mjs \
  src/lib/calendar/calendar-provenance.test.ts \
  src/lib/calendar/sikh-sgpc-only-engine.test.ts
npx tsx scripts/validate-rules.ts
git diff --check
```

These tests check range-date parsing, month-start/printed-date validation,
slug mapping, edition selection by date, final versus non-final provenance,
cultural exemptions, production-shaped Sikh rows, the no-hardcoded-edition
guard, and SGPC-only engine cardinality. The admin reminder turns `ok` only
when the latest loaded edition ends more than 60 days from today's date.

## Yearly checklist

- [ ] PDF URL, size, SHA-256, download date and edition range recorded.
- [ ] Text/image mode recorded; OCR model details recorded when used.
- [ ] All 12 month starts transcribed from the grid.
- [ ] Every sidebar row transcribed, including range dates.
- [ ] Printed colour sampled against the legend; unreadable colours are unknown.
- [ ] Every row mapped or listed as unmapped/new.
- [ ] Month-start versus printed-date cross-check passes.
- [ ] Review sheet inspected by a named human.
- [ ] `read_by_human` stamp added only after explicit confirmation.
- [ ] Edition JSON registered and tests pass.
- [ ] Admin edition reminder reports `ok`.

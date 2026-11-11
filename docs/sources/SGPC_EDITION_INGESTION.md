# SGPC Edition Ingestion

`ingest-sgpc-edition.mjs` is a data-only ingestion tool. It never marks an
edition reviewed automatically and never writes to a database.

## Dependencies

- Text PDF: `pdftotext` with `-bbox`.
- Image-only PDF: `pdftoppm`, Tesseract and Punjabi `pan.traineddata`.
- Download the model from the official Tesseract `tessdata_best` repository:
  `https://github.com/tesseract-ocr/tessdata_best/raw/main/pan.traineddata`.
  Record `wc -c pan.traineddata` and `sha256sum pan.traineddata` in the review
  sheet for the run. The model is temporary and must not be committed.

The tool accepts extracted facts because PDF layout, OCR alignment and text
colour are evidence-review steps, not safe guesses. Each row must include its
printed day/month, name, category and colour evidence; range dates such as
`21-22 Assu` are preserved. Month starts are required for all 12 months and
are cross-checked against every row before output.

## Run

```bash
node scripts/sources/ingest-sgpc-edition.mjs \
  --pdf /path/to/Calender-Nanakshahi-559.pdf \
  --facts /path/to/extracted-facts.json \
  --out docs/sources/sgpc-nanakshahi-559-sidebar.json \
  --review-sheet docs/sources/sgpc-nanakshahi-559-sidebar.REVIEW.md
```

The output includes the source checksum, extraction mode, 12 month starts,
every sidebar row, per-row colour evidence, slug mapping decisions, and
`read_by_human: false` everywhere. It also writes a review sheet listing all
rows and unmapped/new entries.

After Pt Prince explicitly confirms the sheet, set review metadata with:

```bash
node scripts/sources/ingest-sgpc-edition.mjs --confirm \
  --out docs/sources/sgpc-nanakshahi-559-sidebar.json \
  --reviewer 'Pt Prince Sharma' --date 2027-03-01
```

The human must still inspect the PDF/crops, confirm month starts, categories,
names, mappings and unmapped entries. A checksum and OCR result are evidence,
not council ratification.

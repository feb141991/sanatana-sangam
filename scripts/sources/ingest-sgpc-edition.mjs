#!/usr/bin/env node

/*
 * Ingest one SGPC Nanakshahi edition without silently inventing reviewed data.
 * Text PDFs use pdftotext -bbox; image-only PDFs use pdftoppm + Tesseract's
 * pan model. The colour-evidence JSON is deliberately an input: text colour
 * cannot be recovered reliably from OCR text alone.
 */
import { execFileSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { basename, dirname, resolve } from 'node:path';

export const PAN_MODEL_URL = 'https://github.com/tesseract-ocr/tessdata_best/raw/main/pan.traineddata';
export const PAN_MODEL_NOTE = 'Download pan.traineddata from PAN_MODEL_URL, then record wc -c and sha256sum locally; never commit the model.';

const MONTHS = ['Chet', 'Vaisakh', 'Jeth', 'Harh', 'Sawan', 'Bhadon', 'Assu', 'Katak', 'Maghar', 'Poh', 'Magh', 'Phagun'];
const COLOUR_CLASSES = ['gurpurab', 'itihasik', 'bhagat_sahiban', 'sarkari_holiday'];

export function parseDayToken(value) {
  const match = String(value).trim().match(/^(\d{1,2})(?:[-–](\d{1,2}))?$/);
  if (!match) throw new Error(`Invalid Nanakshahi day token: ${value}`);
  return match[2] ? `${match[1]}-${match[2]}` : match[1];
}

export function parseEditionRange(value) {
  const input = String(value);
  const iso = input.match(/(\d{4}-\d{2}-\d{2}).*?(\d{4}-\d{2}-\d{2})/);
  if (iso) return { from: iso[1], to: iso[2] };
  const named = input.match(/(\d{1,2})\s+([A-Za-z]+)\s+(\d{4}).*?(\d{1,2})\s+([A-Za-z]+)\s+(\d{4})/);
  if (!named) throw new Error(`Edition range must contain two dates: ${value}`);
  const from = new Date(`${named[2]} ${named[1]}, ${named[3]} UTC`);
  const to = new Date(`${named[5]} ${named[4]}, ${named[6]} UTC`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) throw new Error(`Invalid edition range: ${value}`);
  return { from: from.toISOString().slice(0, 10), to: to.toISOString().slice(0, 10) };
}

export function sha256File(path) {
  return createHash('sha256').update(readFileSync(path)).digest('hex');
}

function commandAvailable(command) {
  try { execFileSync(command, ['--version'], { stdio: 'ignore' }); return true; } catch { return false; }
}

function runTextExtraction(pdfPath) {
  if (!commandAvailable('pdftotext')) throw new Error('pdftotext is required for text PDF ingestion');
  return execFileSync('pdftotext', ['-bbox', pdfPath, '-'], { encoding: 'utf8' });
}

function runOcrExtraction(pdfPath) {
  for (const command of ['pdftoppm', 'tesseract']) {
    if (!commandAvailable(command)) throw new Error(`${command} is required for image-only PDF ingestion`);
  }
  const prefix = `/tmp/sgpc-ingest-${process.pid}`;
  execFileSync('pdftoppm', ['-png', '-r', '300', pdfPath, prefix], { stdio: 'ignore' });
  const pages = [];
  for (let page = 1; ; page += 1) {
    const image = `${prefix}-${page}.png`;
    if (!existsSync(image)) break;
    pages.push(execFileSync('tesseract', [image, 'stdout', '-l', 'pan+eng', '--psm', '6'], { encoding: 'utf8' }));
  }
  if (!pages.length) throw new Error('OCR produced no pages');
  return pages.join('\n');
}

export function extractPdfText(pdfPath) {
  const text = runTextExtraction(pdfPath);
  return text.replace(/<[^>]+>/g, ' ').trim() ? { mode: 'text', text } : { mode: 'ocr', text: runOcrExtraction(pdfPath) };
}

function monthStartsFromFacts(facts) {
  const starts = {};
  for (const month of MONTHS) {
    if (!facts.month_starts?.[month]) throw new Error(`Missing month start: ${month}`);
    starts[month] = facts.month_starts[month];
  }
  return starts;
}

function crossCheckRows(rows, monthStarts) {
  for (const row of rows) {
    if (!monthStarts[row.month]) throw new Error(`Row ${row.index} references unknown month ${row.month}`);
    if (!/^\d{1,2}(?:-\d{1,2})?$/.test(row.day)) throw new Error(`Row ${row.index} has invalid day ${row.day}`);
  }
  return { checked: rows.length, passed: rows.length };
}

export function buildEdition({ edition, edition_range, month_starts, rows, source, colour_method }) {
  const starts = monthStartsFromFacts({ month_starts });
  const checked = crossCheckRows(rows, starts);
  const review = { read_by_human: false, reviewed_by: null, reviewed_at: null, scope: null, status: 'official-source-backed, pending council ratification' };
  return { edition, edition_range, month_starts: starts, source, review, colour_method, rows: rows.map(row => ({ ...row, read_by_human: false, reviewed_by: null, reviewed_at: null })) , cross_check: checked };
}

export function confirmEdition(path, reviewer, reviewedAt) {
  const data = JSON.parse(readFileSync(path, 'utf8'));
  if (!reviewer || !/^\d{4}-\d{2}-\d{2}$/.test(reviewedAt)) throw new Error('Confirmation requires reviewer and YYYY-MM-DD date');
  data.review = { ...data.review, read_by_human: true, reviewed_by: reviewer, reviewed_at: reviewedAt };
  data.rows = data.rows.map(row => ({ ...row, read_by_human: true, reviewed_by: reviewer, reviewed_at: reviewedAt }));
  writeFileSync(path, `${JSON.stringify(data, null, 2)}\n`);
}

function arg(name) {
  const index = process.argv.indexOf(name);
  return index >= 0 ? process.argv[index + 1] : null;
}

function main() {
  const input = arg('--pdf');
  const output = arg('--out');
  const confirm = process.argv.includes('--confirm');
  if (confirm) {
    if (!output) throw new Error('--out is required for --confirm');
    confirmEdition(output, arg('--reviewer'), arg('--date'));
    return;
  }
  const factsPath = arg('--facts');
  if (!input || !output || !factsPath) throw new Error('Usage: --pdf PDF --facts extracted-facts.json --out edition.json [--review-sheet path]');
  const facts = JSON.parse(readFileSync(resolve(factsPath), 'utf8'));
  const extraction = extractPdfText(resolve(input));
  const data = buildEdition({ ...facts, source: { ...facts.source, sha256: sha256File(resolve(input)), extraction_mode: extraction.mode }, colour_method: facts.colour_method });
  writeFileSync(resolve(output), `${JSON.stringify(data, null, 2)}\n`);
  const reviewPath = arg('--review-sheet') ?? `${output}.REVIEW.md`;
  const unmapped = data.rows.filter(row => !row.slug);
  writeFileSync(resolve(reviewPath), `# SGPC Samvat ${data.edition} review sheet\n\nStatus: computed; human confirmation required.\n\n- Source SHA-256: ${data.source.sha256}\n- Extraction mode: ${extraction.mode}\n- OCR model: ${extraction.mode === 'ocr' ? PAN_MODEL_URL : 'not used'}\n- Rows: ${data.rows.length}\n- Unmapped/new entries: ${unmapped.length}\n\n${data.rows.map(row => `- [ ] ${row.index}: ${row.day} ${row.month} — ${row.name_gurmukhi ?? '(unmapped)'}`).join('\n')}\n`);
}

if (import.meta.url === `file://${process.argv[1]}`) main();

#!/usr/bin/env node
/**
 * Extracts, per Gregorian civil day, the tithi that PREVAILS AT SUNRISE from a
 * Rashtriya Panchang text export (`pdftotext -layout`) -- the tithi that
 * decides which vrat/observance a lunar_tithi_recurring rule fires on.
 *
 * WHY THIS IS A SEPARATE SCRIPT FROM extract-panchang-dates.mjs
 * ---------------------------------------------------------------
 * That script's keyword search matches a tithi NAME anywhere on a line, which
 * is correct for a festival title but wrong for a tithi that is merely
 * MENTIONED on a day's Tithi: line without prevailing there. Every day's line
 * has the shape:
 *
 *   Tithi: (<Month> <Paksha>) <TithiA> h. <hh-mm> then <TithiB> h. <hh-mm> ...
 *
 * <TithiA> is what prevails AT SUNRISE (the one that decides the civil day's
 * vrat) -- <TithiB> only begins partway through that day and belongs to
 * WHICHEVER day's sunrise it next touches, not this one. A keyword search for
 * "Trayodasi" against 10 August 2026's line ("Dvadasi h. 8-01 then Trayodasi
 * h. 28-55") wrongly attributes Trayodashi to the 10th; the 11th's own line
 * shows sunrise tithi already advanced to Chaturdasi, meaning Trayodashi never
 * prevailed at ANY sunrise that cycle -- a genuine kshaya (skipped) tithi, not
 * a same-day match. This script only reports <TithiA>, so it cannot make that
 * mistake, and it correctly reports NOTHING for a tithi that is truly skipped.
 *
 * Reuses the same day-header parsing and zero-gap-before-trusting-anything
 * discipline as extract-panchang-dates.mjs, so a parser regression is caught
 * the same way here as there.
 *
 * Usage:
 *   pdftotext -layout "Rashtriya Panchang.pdf" panchang.txt
 *   node scripts/sources/extract-panchang-sunrise-tithi.mjs panchang.txt "Ekadasi" "Trayodasi" ...
 *
 * With no keyword arguments, prints the parsed date range and gap count only.
 */
import { readFileSync } from 'node:fs';

const MON3 = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const DAY_HDR = /^\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s*.*?,\s*(\d{1,2})\s+([A-Za-z]{3,})/;
// First tithi word after the "(Month Paksha)" group -- the sunrise tithi.
// Tolerates the source's inconsistent spacing: "(...) Ekadasi", "(...)Purnima".
const TITHI_LINE = /^Tithi:\s*\([^)]*\)\s*([A-Za-z]+)/;

const [, , txtPath, ...keywords] = process.argv;
if (!txtPath) {
  console.error('Usage: node extract-panchang-sunrise-tithi.mjs <pdftotext-output.txt> ["Ekadasi" ...]');
  process.exit(2);
}

const lines = readFileSync(txtPath, 'utf8').split('\n');

const blocks = [];
for (let i = 0; i < lines.length; i++) {
  const m = DAY_HDR.exec(lines[i]);
  if (!m) continue;
  const day = Number(m[2]);
  const mon = MON3[m[3].slice(0, 3)];
  if (mon) blocks.push({ line: i, mon, day });
}

let year = new Date().getUTCFullYear();
let prevMon = null;
const dated = blocks.map(({ line, mon, day }) => {
  if (prevMon === 12 && mon === 1) year++;
  prevMon = mon;
  return { line, year, mon, day };
});

let gaps = 0;
let prevDate = null;
for (const b of dated) {
  const cur = new Date(Date.UTC(b.year, b.mon - 1, b.day));
  if (prevDate && (cur - prevDate) / 86400000 !== 1) gaps++;
  prevDate = cur;
}

const first = dated[0], last = dated[dated.length - 1];
console.log(
  `parsed ${dated.length} day headers, range ${first.year}-${String(first.mon).padStart(2, '0')}-${String(first.day).padStart(2, '0')} ` +
  `.. ${last.year}-${String(last.mon).padStart(2, '0')}-${String(last.day).padStart(2, '0')}, gaps: ${gaps}`,
);
if (gaps > 0) {
  console.error(`REFUSING to report matches: ${gaps} gap(s) in the day sequence. Fix the parser before trusting any date from this file.`);
  process.exit(1);
}

// Sunrise tithi per day: the FIRST "Tithi:" line strictly between this day's
// header and the next one.
const dateStr = (b) => `${b.year}-${String(b.mon).padStart(2, '0')}-${String(b.day).padStart(2, '0')}`;
const sunriseTithi = new Map(); // dateStr -> { name, sourceLine }
for (let k = 0; k < dated.length; k++) {
  const startLine = dated[k].line;
  const endLine = k + 1 < dated.length ? dated[k + 1].line : lines.length;
  for (let i = startLine; i < endLine; i++) {
    const m = TITHI_LINE.exec(lines[i]);
    if (m) {
      sunriseTithi.set(dateStr(dated[k]), { name: m[1], sourceLine: i + 1 });
      break;
    }
  }
}

if (keywords.length === 0) process.exit(0);

console.log();
for (const keyword of keywords) {
  const hits = [];
  for (const [date, t] of sunriseTithi) {
    if (t.name.toLowerCase() === keyword.toLowerCase()) hits.push(date);
  }
  hits.sort();
  console.log(`${keyword.padEnd(28)} sunrise-prevails on: ${hits.join(', ') || '(never prevails at sunrise in this range -- check for kshaya)'}`);
}

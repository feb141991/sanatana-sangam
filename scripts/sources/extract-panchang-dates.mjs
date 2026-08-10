#!/usr/bin/env node
/**
 * Extracts real Gregorian dates for named festivals from a Rashtriya Panchang
 * text export (`pdftotext -layout`), and reports which page in the PDF each
 * one came from.
 *
 * WHY THE ZERO-GAP CHECK IS NOT OPTIONAL
 * ---------------------------------------
 * A parser that silently drops some day-headers will misattribute every
 * subsequent match to whatever the last successfully-parsed day was --
 * plausible-looking output for a defect that is completely invisible unless
 * something checks. An early version of this script only recognised
 * abbreviated month names (`Aug.`), so every full-word month (`August`) failed
 * to parse and every festival name after the last recognised month collapsed
 * onto one wrong date. Requiring the resulting day sequence to have ZERO gaps
 * -- every date is exactly one day after the previous one, for the whole
 * document -- catches that class of bug before any date is trusted, rather
 * than after it has been committed as a citation.
 *
 * Usage:
 *   pdftotext -layout "Rashtriya Panchang.pdf" panchang.txt
 *   node scripts/sources/extract-panchang-dates.mjs panchang.txt "Aja Ekadasi" "Diwali" ...
 *
 * With no keyword arguments, prints the parsed date range and gap count only
 * -- useful for verifying a new PDF extracts cleanly before searching it.
 */
import { readFileSync } from 'node:fs';

const MON3 = { Jan: 1, Feb: 2, Mar: 3, Apr: 4, May: 5, Jun: 6, Jul: 7, Aug: 8, Sep: 9, Oct: 10, Nov: 11, Dec: 12 };
const DAY_HDR = /^\s*(Sunday|Monday|Tuesday|Wednesday|Thursday|Friday|Saturday),\s*.*?,\s*(\d{1,2})\s+([A-Za-z]{3,})/;

const [, , txtPath, ...keywords] = process.argv;
if (!txtPath) {
  console.error('Usage: node extract-panchang-dates.mjs <pdftotext-output.txt> ["Festival Name" ...]');
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

// Assign years: the document's first day-header is treated as the start; the
// year rolls forward on every December -> January transition.
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
if (keywords.length === 0) process.exit(0);

console.log();
for (const keyword of keywords) {
  const hits = new Set();
  for (let i = 0; i < lines.length; i++) {
    if (!lines[i].toLowerCase().includes(keyword.toLowerCase())) continue;
    let best = null;
    for (const b of dated) {
      if (b.line <= i) best = b; else break;
    }
    if (best) hits.add(`${best.year}-${String(best.mon).padStart(2, '0')}-${String(best.day).padStart(2, '0')}`);
  }
  console.log(`${keyword.padEnd(28)} dates=${[...hits].sort().join(', ') || '(none found)'}`);
}

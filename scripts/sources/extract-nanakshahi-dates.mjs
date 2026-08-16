#!/usr/bin/env node
// Positional extraction of Gurpurab dates from the official SGPC
// Nanakshahi-558 (2026-27) calendar PDF, using real word bounding-box
// coordinates instead of pdftotext's linearized -layout heuristic.
//
// Why not -layout: it demonstrably misorders cells in this grid --
// spot-checking Vaisakh's day 31 against it paired the wrong Gregorian
// month entirely, because -layout's row-reconstruction heuristic breaks
// down when multiple month-blocks sit side by side. `pdftotext -bbox`
// instead, which gives each word's true (x, y) position, is reliable: in
// the sidebar holiday list specifically, every festival name and its date
// genuinely share one y-value -- pdftotext's line-wrapping in plain-text
// mode was the only reason they ever looked separated.
//
// Usage:
//   pdftotext -bbox Calender_2026.pdf calender.bbox.xml
//   node extract-nanakshahi-dates.mjs calender.bbox.xml
//
// The Nanakshahi month-start-date table (used to convert "DD month" into a
// Gregorian date) is NOT re-derived here -- it was extracted via the same
// coordinate technique but as a handful of one-off "day 1" cell lookups,
// not a repeating pattern worth generalizing. See
// docs/sources/sgpc-nanakshahi-558.manifest.md for the verified table and
// the two independent public-date cross-checks that confirmed it.

import { readFileSync } from 'node:fs';

const MONTHS = new Set(['cyq', 'vYswK', 'jyT', 'hwV', 'swvx', 'BwdoN', "A`sU", 'k`qk', 'm`Gr', 'poh', 'mwG', 'P`gx']);
const DATE_RE = /^\d{1,2}$/;
const SIDEBAR_X_MIN = 995;

function parseWords(xml) {
  const pages = [];
  let current = null;
  const pageRe = /<page /g;
  const wordRe = /<word xMin="([\d.]+)" yMin="([\d.]+)" xMax="[\d.]+" yMax="[\d.]+">([^<]+)<\/word>/g;
  for (const pageXml of xml.split(/<page /).slice(1)) {
    const words = [];
    let m;
    wordRe.lastIndex = 0;
    while ((m = wordRe.exec(pageXml))) {
      words.push({ x: parseFloat(m[1]), y: parseFloat(m[2]), text: m[3] });
    }
    pages.push(words);
  }
  return pages;
}

function extractSidebarList(xmlPath) {
  const xml = readFileSync(xmlPath, 'utf8');
  const pages = parseWords(xml);
  const entries = [];
  for (const words of pages) {
    const sidebar = words.filter((w) => w.x > SIDEBAR_X_MIN);
    const rows = new Map();
    for (const w of sidebar) {
      const key = Math.round(w.y * 10) / 10;
      if (!rows.has(key)) rows.set(key, []);
      rows.get(key).push(w);
    }
    const sortedKeys = [...rows.keys()].sort((a, b) => a - b);
    for (const key of sortedKeys) {
      const rowWords = rows.get(key).sort((a, b) => a.x - b.x);
      const texts = rowWords.map((w) => w.text);
      const last = texts[texts.length - 1];
      const secondLast = texts[texts.length - 2];
      if (texts.length >= 2 && DATE_RE.test(secondLast) && MONTHS.has(last)) {
        const name = texts.slice(0, -2).join(' ').trim();
        if (name) entries.push({ date: `${secondLast} ${last}`, name });
      }
    }
  }
  return entries;
}

const xmlPath = process.argv[2] ?? 'calender.bbox.xml';
for (const { date, name } of extractSidebarList(xmlPath)) {
  console.log(`${date.padStart(8)}  ${name}`);
}

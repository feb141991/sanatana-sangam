/**
 * Defines the launch subset and marks everything else deferred.
 *
 * The readiness assessment's conclusion: the catalogue is already broad enough,
 * so stop adding rules, pick a subset, source-verify its dates, and suppress the
 * rest. This script is that decision written down as data.
 *
 * TWO SEPARATE REASONS A RULE MAY NOT PUBLISH
 * -------------------------------------------
 *   derivability   — CAN we compute it at all? (Kathina: no calendar can.)
 *   launch_status  — DO we ship it now? (Everything else: capable, not chosen.)
 *
 * Kept as distinct fields on purpose. Collapsing them would lose the difference
 * between "we cannot know this" and "we know it but are not ready to stand
 * behind it", which are very different conversations with a reviewer.
 *
 * DEPENDENCY CLOSURE
 * ------------------
 * `relative_to_other_observance` rules resolve against a base slug. A launch
 * rule whose base is deferred produces NOTHING — silently, because the base
 * simply yields no occurrence to offset from. So the launch set is closed over
 * its dependencies, and every addition made that way is printed rather than
 * absorbed quietly.
 *
 * Run: npm run launch:apply
 */
import { readFileSync, writeFileSync } from 'node:fs';

const RULES = 'packages/dharma-rules/src/festivals/rules.json';
const SCHEMA = 'packages/dharma-rules/src/festivals/rules.schema.json';

/**
 * The launch set, from the readiness assessment's 15 categories.
 *
 * "Major Sikh Gurpurabs" is read as the Sikh rules already marked
 * `kind: 'major'` in the data. That is a line the repo already drew, rather than
 * a religious judgement made here — engineering does not decide which gurpurabs
 * are major (AGENTS.md rule 10).
 */
const LAUNCH: Record<string, string[]> = {
  // The generic fortnightly rules, plus the 24-name cycle. The named ekadashis
  // are what people actually observe by name -- Nirjala, Devshayani, Kamika --
  // and their bilingual content already exists in src/lib/vrat-data.ts.
  //
  // IMPORTANT: 15 of the 16 named rules CANNOT resolve on the legacy path. Their
  // legacy month name differs between years (nirjala: Vaishakha in 2026, Chaitra
  // in 2027; apara's legacy TITHI differs, 27 vs 26), because the legacy engine
  // names months from the Sun's rashi, which drifts against the lunation. No
  // single legacy name exists to give them. See scripts/derive-legacy-masa.ts.
  //
  // They are in the launch set as a recorded decision; they publish nothing
  // until USE_CORRECTED_MASA flips. That is the blocker, not this list.
  'Ekadashi & Pradosh':        [
    'ekadashi', 'pradosh-vrat',
    'kamada-ekadashi', 'nirjala-ekadashi', 'devshayani-ekadashi',
    'shravana-putrada-ekadashi', 'parivartini-ekadashi', 'devutthana-ekadashi',
    'amalaki-ekadashi', 'papmochani-ekadashi', 'apara-ekadashi',
    'yogini-ekadashi', 'kamika-ekadashi', 'aja-ekadashi', 'rama-ekadashi',
    'utpanna-ekadashi', 'saphala-ekadashi', 'vijaya-ekadashi',
  ],
  'Amavasya & Purnima':        ['amavasya-vrat', 'purnima-vrat'],
  'Maha Shivaratri':           ['maha-shivaratri'],
  'Holi':                      ['holi'],
  'Ram Navami':                ['ram-navami'],
  'Janmashtami variants':      ['krishna-janmashtami'],
  'Ganesh Chaturthi':          ['ganesh-chaturthi'],
  'Navratri / Dussehra':       ['navratri-begins', 'dussehra'],
  'Karva Chauth':              ['karva-chauth'],
  'Diwali cluster':            ['diwali', 'dhanteras', 'govardhan-puja', 'bhai-dooj'],
  'Guru Purnima':              ['guru-purnima'],
  'Raksha Bandhan':            ['raksha-bandhan'],
  'Major Sikh Gurpurabs':      [], // filled from kind==='major' below
  'Mahavir Jayanti':           ['mahavir-jayanti'],
  'Paryushana / Samvatsari':   ['paryushana-parva-begins', 'samvatsari-paryushana-ends'],
};

interface Rule {
  slug: string;
  tradition?: string;
  kind?: string;
  rule_family?: string;
  relative_base_slug?: string;
  derivability?: string;
  launch_status?: string;
  [k: string]: unknown;
}

const rules: Rule[] = JSON.parse(readFileSync(RULES, 'utf8'));
const bySlug = new Map<string, Rule>();
for (const r of rules) if (!bySlug.has(r.slug)) bySlug.set(r.slug, r);

LAUNCH['Major Sikh Gurpurabs'] = [
  ...new Set(rules.filter(r => r.tradition === 'sikh' && r.kind === 'major').map(r => r.slug)),
];

const included = new Set<string>(Object.values(LAUNCH).flat());

// Verify every named slug exists before anything else — a typo here would
// silently suppress a festival we meant to ship.
const unknown = [...included].filter(s => !bySlug.has(s));
if (unknown.length) {
  console.error(`Unknown slugs in the launch set: ${unknown.join(', ')}`);
  process.exit(1);
}

// ── dependency closure ───────────────────────────────────────────────────────
const pulledIn: Array<{ slug: string; because: string }> = [];
let changed = true;
while (changed) {
  changed = false;
  for (const slug of [...included]) {
    const base = bySlug.get(slug)?.relative_base_slug;
    if (base && !included.has(base)) {
      included.add(base);
      pulledIn.push({ slug: base, because: slug });
      changed = true;
    }
  }
}

// ── apply ────────────────────────────────────────────────────────────────────
let inc = 0;
let def = 0;
for (const r of rules) {
  if (included.has(r.slug)) {
    r.launch_status = 'included';
    inc++;
  } else {
    r.launch_status = 'deferred';
    def++;
  }
}
writeFileSync(RULES, JSON.stringify(rules, null, 2) + '\n', 'utf8');

// ── schema ───────────────────────────────────────────────────────────────────
const schema = JSON.parse(readFileSync(SCHEMA, 'utf8'));
const props = schema.properties ?? schema.items.properties;
props.launch_status = {
  type: 'string',
  enum: ['included', 'deferred'],
  description:
    'Whether this observance ships in the launch set. Distinct from `derivability`: ' +
    'deferred means capable but not chosen, where a non-computed derivability means ' +
    'not knowable at all. Both suppress publication; only one is a scheduling decision.',
};
writeFileSync(SCHEMA, JSON.stringify(schema, null, 2) + '\n', 'utf8');

// ── report ───────────────────────────────────────────────────────────────────
console.log('\nLAUNCH SET\n');
for (const [cat, slugs] of Object.entries(LAUNCH)) {
  console.log(`  ${cat}`);
  for (const s of slugs) console.log(`      ${s}`);
}

if (pulledIn.length) {
  console.log('\nPULLED IN BY DEPENDENCY (relative rules need their base)\n');
  for (const p of pulledIn) console.log(`      ${p.slug.padEnd(28)} required by ${p.because}`);
}

console.log(`\n  included ${inc} rule rows   deferred ${def} rule rows`);
console.log(`  (${included.size} distinct slugs included)\n`);

const deferredSlugs = [...new Set(rules.filter(r => r.launch_status === 'deferred').map(r => r.slug))];
console.log('DEFERRED\n');
for (const s of deferredSlugs) {
  const r = bySlug.get(s)!;
  const why = r.derivability && r.derivability !== 'computed' ? ` [${r.derivability}]` : '';
  console.log(`      ${s}${why}`);
}
console.log();

import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { WEB_CONSENT_VERSION, defaultWebConsent, parseWebConsent } from './web-consent';

test('defaults every optional category off', () => {
  assert.deepEqual(defaultWebConsent(), {
    version: WEB_CONSENT_VERSION,
    analytics: false,
    advertising: false,
    decidedAt: '',
  });
});

test('rejects missing, malformed and stale receipts', () => {
  assert.equal(parseWebConsent(null), null);
  assert.equal(parseWebConsent('{'), null);
  assert.equal(parseWebConsent(JSON.stringify({ version: 'old', analytics: true, advertising: true, decidedAt: 'now' })), null);
  assert.equal(parseWebConsent(JSON.stringify({ version: WEB_CONSENT_VERSION, analytics: true, advertising: true })), null);
});

test('accepts only a complete current-version receipt', () => {
  const receipt = { version: WEB_CONSENT_VERSION, analytics: true, advertising: false, decidedAt: '2026-08-24T00:00:00.000Z' };
  assert.deepEqual(parseWebConsent(JSON.stringify(receipt)), receipt);
});

test('root layout does not inject optional vendor scripts directly', () => {
  const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /googletagmanager\.com|pagead2\.googlesyndication\.com|OneSignalSDK/);
  assert.doesNotMatch(layout, /<Analytics\b|<SpeedInsights\b/);
  assert.match(layout, /<WebConsentManager/);
});

// ── Withdrawing consent really removes the vendor cookies ─────────────────────

import { clearVendorState, type WebConsentPreferences } from './web-consent';

function prefs(analytics: boolean, advertising: boolean): WebConsentPreferences {
  return { version: WEB_CONSENT_VERSION, analytics, advertising, decidedAt: '2026-10-15T00:00:00.000Z' };
}

/** Runs clearVendorState with a fake browser and returns the cookie names it expired. */
function expiredCookies(previous: WebConsentPreferences, next: WebConsentPreferences, existing = ''): string[] {
  const writes: string[] = [];
  const g = globalThis as unknown as { window?: unknown; document?: unknown };
  const saved = { window: g.window, document: g.document };
  g.window = { location: { hostname: 'www.shoonaya.com' } };
  g.document = {
    set cookie(value: string) {
      writes.push(value);
    },
    get cookie() {
      return existing;
    },
  };
  try {
    clearVendorState(previous, next);
  } finally {
    g.window = saved.window;
    g.document = saved.document;
  }
  return [...new Set(writes.filter((w) => /Max-Age=0/.test(w)).map((w) => w.split('=')[0]))];
}

test('withdrawing analytics expires the Google Analytics cookies', () => {
  assert.deepEqual(expiredCookies(prefs(true, false), prefs(false, false)).sort(), ['_ga', '_gat', '_gid']);
});

test('withdrawing advertising expires the advertising cookies', () => {
  assert.deepEqual(expiredCookies(prefs(false, true), prefs(false, false)).sort(), ['__eoi', '__gads', '__gpi', 'google_ama_config']);
});

test('withdrawing analytics also expires the GA4 measurement cookie, whose name carries the measurement id', () => {
  const jar = '_ga=GA1.1.1; _ga_ABC123XYZ=GS2.1.s1; _gat_gtag_G_ABC123XYZ=1; sb-session=keep; theme=dark';
  assert.deepEqual(
    expiredCookies(prefs(true, false), prefs(false, false), jar).sort(),
    ['_ga', '_ga_ABC123XYZ', '_gat', '_gat_gtag_G_ABC123XYZ', '_gid'].sort(),
  );
});

test('it never touches a cookie that is not a vendor cookie, however similar the name', () => {
  const jar = 'sb-access-token=a; gadget=b; _gallery=c; my_ga_pref=d';
  const expired = expiredCookies(prefs(true, true), prefs(false, false), jar);
  for (const keep of ['sb-access-token', 'gadget', '_gallery', 'my_ga_pref']) assert.equal(expired.includes(keep), false, keep);
});

test('keeping a category on, or it never having been on, clears nothing', () => {
  assert.deepEqual(expiredCookies(prefs(true, true), prefs(true, true)), []);
  assert.deepEqual(expiredCookies(prefs(false, false), prefs(false, false)), []);
  assert.deepEqual(expiredCookies(prefs(false, false), prefs(true, true)), []);
});

// ── The banner: choices take effect only when they are saved ──────────────────

const banner = readFileSync(join(process.cwd(), 'src/components/privacy/WebConsentManager.tsx'), 'utf8')
  .replace(/\/\*[\s\S]*?\*\//g, '')
  .replace(/(^|[^:])\/\/.*$/gm, '$1');

test('vendor scripts load only from the SAVED choice, never from boxes still being ticked', () => {
  const scriptBlocks = banner.match(/\{[a-z.]+analytics\s*&&[\s\S]*?:\s*null\}|\{[a-z.]+advertising\s*&&[\s\S]*?:\s*null\}/g) ?? [];
  assert.ok(scriptBlocks.length >= 2, 'expected the analytics and advertising script gates');
  for (const block of scriptBlocks) assert.match(block, /^\{saved\./, `gate must read the saved choice: ${block.slice(0, 40)}`);
  assert.doesNotMatch(banner, /\{(draft|preferences)\.(analytics|advertising)\s*&&/);
});

test('ticking a box changes a draft, not the saved choice', () => {
  assert.match(banner, /onChange=\{[^}]*setDraft\(/);
  assert.doesNotMatch(banner, /onChange=\{[^}]*setSaved\(/);
});

test('saving clears vendor state against the choice that was in force, not the half-edited one', () => {
  assert.match(banner, /clearVendorState\(saved,\s*next\)/);
});

test('the first-layer buttons carry equal visual weight: refusing is as prominent as accepting', () => {
  const buttons = banner.split('<button').slice(1);
  const styleOf = (label: string) => buttons.find((b) => b.includes(`>${label}`))?.match(/className=\{([^}]+)\}/)?.[1];
  const keepOff = styleOf('Keep both off');
  const allow = styleOf('Allow analytics');
  const choose = styleOf('Choose settings');
  assert.ok(keepOff && allow && choose, 'expected to find all three first-layer buttons');
  assert.equal(allow, keepOff, 'Allow must not look different from Keep both off');
  assert.equal(choose, keepOff);
  assert.doesNotMatch(banner, /bg-\[#9a641e\]/, 'no button may be singled out with the accent fill');
});

test('it does not claim to be modal when it is not', () => {
  assert.doesNotMatch(banner, /aria-modal/);
  assert.match(banner, /role="dialog"/);
  assert.match(banner, /aria-labelledby=/);
});

test('it neither shows nor loads anything on the admin console', () => {
  assert.match(banner, /usePathname\(\)/);
  assert.match(banner, /startsWith\('\/admin'\)/);
});

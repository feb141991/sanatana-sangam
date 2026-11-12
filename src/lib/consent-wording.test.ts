import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

// The consent ledger records which wording a person saw by version and SHA-256, taken from the database's own registry
// (supabase/migrations/20261112140000_consent_evidence_ledger.sql). These hashes are pinned here AND in the Native app's
// __tests__/consent-wording.test.ts, where each is checked against the text actually shown on screen. If someone edits a screen's wording
// without registering a new version, the Native test fails; if someone edits the registry, this one does. The two lists must stay equal.
const PINNED: Record<string, string> = {
  'religious_data/onboarding': 'd90e70dc7413861fd217ecb876e8bcde81eb7148c57bcd041cb54ef885312e4e',
  'religious_data/settings': '85e994ba01910febea4aa4f935277cae3be41039d407af343cb980346a7725a8',
  'activity_personalization/settings': 'd9efd5b95b51d1e81d22c57e425296f4dd118b4f13503ad12e66c44bbe276030',
  'product_analytics/settings': 'da84fe1733c30d792a80c2a2baef43f3bdeb053a7e7667d4974b17ecd49fd09d',
  'notification_taps/settings': '3f6d241a589a965640fca586f39f6277ca9f374d560adca9af7de4efee5fee6e',
  'notification_taps/onboarding': '68ec3a52eaa1ae51c6ccabe15d19dd7c0ca43c1df7cafb1059553c50f1c0e2b6',
  'notification_taps/inbox_card': '8e982d410ace5221657076d0fe6778786977f0a87007f3b5e7217962dd6e6ca1',
};

const migration = readFileSync(join(process.cwd(), 'supabase/migrations/20261112140000_consent_evidence_ledger.sql'), 'utf8');
const seeds = [...migration.matchAll(/\('(\w+)', '(\w+)', '([\d-]+)', \$w\$([\s\S]*?)\$w\$\)/g)].map((m) => ({
  id: `${m[1]}/${m[2]}`,
  version: m[3],
  hash: createHash('sha256').update(m[4], 'utf8').digest('hex'),
}));

describe('consent wording registry', () => {
  it('registers exactly the wordings the apps show', () => {
    expect(seeds.map((seed) => seed.id).sort()).toEqual(Object.keys(PINNED).sort());
  });

  it('hashes every registered wording to the value pinned in both repositories', () => {
    for (const seed of seeds) expect(seed.hash, seed.id).toBe(PINNED[seed.id]);
  });

  it('registers every wording under one version', () => {
    expect(new Set(seeds.map((seed) => seed.version))).toEqual(new Set(['2026-11-12']));
  });
});

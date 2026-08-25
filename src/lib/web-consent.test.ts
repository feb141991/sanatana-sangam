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
    push: false,
    decidedAt: '',
  });
});

test('rejects missing, malformed and stale receipts', () => {
  assert.equal(parseWebConsent(null), null);
  assert.equal(parseWebConsent('{'), null);
  assert.equal(parseWebConsent(JSON.stringify({ version: 'old', analytics: true, advertising: true, push: true, decidedAt: 'now' })), null);
  assert.equal(parseWebConsent(JSON.stringify({ version: WEB_CONSENT_VERSION, analytics: true, advertising: true, push: true })), null);
});

test('accepts only a complete current-version receipt', () => {
  const receipt = { version: WEB_CONSENT_VERSION, analytics: true, advertising: false, push: true, decidedAt: '2026-08-24T00:00:00.000Z' };
  assert.deepEqual(parseWebConsent(JSON.stringify(receipt)), receipt);
});

test('root layout does not inject optional vendor scripts directly', () => {
  const layout = readFileSync(join(process.cwd(), 'src/app/layout.tsx'), 'utf8');
  assert.doesNotMatch(layout, /googletagmanager\.com|pagead2\.googlesyndication\.com|OneSignalSDK/);
  assert.doesNotMatch(layout, /<Analytics\b|<SpeedInsights\b/);
  assert.match(layout, /<WebConsentManager/);
});

import assert from 'node:assert/strict';
import test from 'node:test';
import { parseClientErrorPayload, redactClientErrorText } from './client-error-contract';

const validPayload = {
  source: 'react_home',
  errorName: 'TypeError',
  message: 'Cannot read properties of null',
  stack: 'TypeError: Cannot read properties of null\n at Home (https://www.shoonaya.com/_next/a.js?x=1:2:3)',
  componentStack: ' at HomeDashboard',
  route: '/home?private=value',
  browserFamily: 'Safari',
  osFamily: 'macOS',
  clientReleaseSha: 'abc123',
  clientDeploymentUrl: 'shoonaya-example.vercel.app',
  serviceWorkerController: 'https://www.shoonaya.com/OneSignalSDKWorker.js?cache=old',
  online: true,
  anonymousSessionNonce: 'random-tab-value',
};

test('accepts and normalizes a valid client error report', () => {
  const parsed = parseClientErrorPayload(validPayload);
  assert.ok(parsed);
  assert.equal(parsed.route, '/home');
  assert.equal(parsed.serviceWorkerController, '/OneSignalSDKWorker.js');
  assert.match(parsed.stack || '', /\?\[REDACTED\]/);
});

test('rejects unknown sources and missing required fields', () => {
  assert.equal(parseClientErrorPayload({ ...validPayload, source: 'invented' }), null);
  assert.equal(parseClientErrorPayload({ ...validPayload, message: '' }), null);
});

test('redacts credentials and personal identifiers', () => {
  const value = redactClientErrorText(
    'Bearer secret.value name@example.com 123e4567-e89b-12d3-a456-426614174000 51.507351,-0.127758',
  );
  assert.doesNotMatch(value, /secret\.value|name@example\.com|123e4567|51\.507351/);
  assert.match(value, /\[REDACTED\]|\[EMAIL\]|\[UUID\]|\[COORDINATES\]/);
});

test('bounds oversized fields', () => {
  const parsed = parseClientErrorPayload({ ...validPayload, stack: 'x'.repeat(20_000) });
  assert.equal(parsed?.stack?.length, 12_000);
});

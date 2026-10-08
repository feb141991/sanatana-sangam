import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { NextRequest } from 'next/server';

import { GET } from './route';

const policyEnvironmentKeys = [
  'NATIVE_APP_LATEST_VERSION',
  'NATIVE_APP_MIN_SUPPORTED_VERSION',
  'NATIVE_APP_LATEST_BUILD_IOS', // retired: still cleaned up so a leftover value cannot leak between tests
  'NATIVE_APP_LATEST_BUILD_ANDROID',
  'NATIVE_APP_FORCE_UPDATE',
  'NATIVE_APP_RELEASE_NOTES',
  'NATIVE_APP_STORE_URL_IOS',
  'NATIVE_APP_STORE_URL_ANDROID',
] as const;

const previousEnvironment = new Map<string, string | undefined>();

function setCompletePolicyEnvironment() {
  process.env.NATIVE_APP_LATEST_VERSION = '1.2.0';
  process.env.NATIVE_APP_MIN_SUPPORTED_VERSION = '1.0.0';
  process.env.NATIVE_APP_FORCE_UPDATE = 'false';
  process.env.NATIVE_APP_RELEASE_NOTES = 'Improved sacred calendar reliability.';
  process.env.NATIVE_APP_STORE_URL_IOS = 'https://apps.apple.com/app/shoonaya/id6793055966';
  process.env.NATIVE_APP_STORE_URL_ANDROID = 'https://play.google.com/store/apps/details?id=com.shoonaya.app';
}

describe('GET /api/native/app-version', () => {
  beforeEach(() => {
    previousEnvironment.clear();
    for (const key of policyEnvironmentKeys) {
      previousEnvironment.set(key, process.env[key]);
      delete process.env[key];
    }
  });

  afterEach(() => {
    for (const key of policyEnvironmentKeys) {
      const previous = previousEnvironment.get(key);
      if (previous === undefined) delete process.env[key];
      else process.env[key] = previous;
    }
  });

  it('rejects unsupported or missing platform values', async () => {
    const missing = await GET(new NextRequest('https://shoonaya.com/api/native/app-version'));
    const invalid = await GET(new NextRequest('https://shoonaya.com/api/native/app-version?platform=web'));

    expect(missing.status).toBe(400);
    expect(invalid.status).toBe(400);
    expect(missing.headers.get('cache-control')).toBe('no-store');
  });

  it('returns the version policy and store links, and never a build number', async () => {
    setCompletePolicyEnvironment();
    const ios = await GET(new NextRequest('https://shoonaya.com/api/native/app-version?platform=ios'));
    const android = await GET(new NextRequest('https://shoonaya.com/api/native/app-version?platform=android'));
    const iosBody = await ios.json();
    const androidBody = await android.json();

    expect(ios.status).toBe(200);
    expect(iosBody).not.toHaveProperty('latestBuildNumber');
    expect(iosBody.storeUrls.ios).toBe('https://apps.apple.com/app/shoonaya/id6793055966');
    expect(android.status).toBe(200);
    expect(androidBody).not.toHaveProperty('latestBuildNumber');
    expect(androidBody.storeUrls.android).toBe('https://play.google.com/store/apps/details?id=com.shoonaya.app');
    expect(ios.headers.get('cache-control')).toContain('s-maxage=60');
  });

  it('ignores leftover retired build-number variables, valid or malformed, instead of serving or rejecting on them', async () => {
    setCompletePolicyEnvironment();
    for (const leftover of ['15', '15.1', 'abc']) {
      process.env.NATIVE_APP_LATEST_BUILD_IOS = leftover;
      process.env.NATIVE_APP_LATEST_BUILD_ANDROID = leftover;
      for (const platform of ['ios', 'android']) {
        const response = await GET(new NextRequest(`https://shoonaya.com/api/native/app-version?platform=${platform}`));
        expect(response.status, `${platform} with leftover ${leftover}`).toBe(200);
        expect(await response.json()).not.toHaveProperty('latestBuildNumber');
      }
    }
  });

  it('fails closed when the policy is incomplete or malformed', async () => {
    const missing = await GET(new NextRequest('https://shoonaya.com/api/native/app-version?platform=ios'));
    setCompletePolicyEnvironment();
    process.env.NATIVE_APP_MIN_SUPPORTED_VERSION = '2.0.0';
    const invalidRange = await GET(new NextRequest('https://shoonaya.com/api/native/app-version?platform=ios'));

    expect(missing.status).toBe(503);
    expect((await missing.json()).code).toBe('UPDATE_POLICY_UNAVAILABLE');
    expect(invalidRange.status).toBe(503);
  });
});

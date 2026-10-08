import { describe, expect, it } from 'vitest';

import { resolveNativeAppVersionPolicy } from './native-app-version-policy';

const validEnvironment = {
  NATIVE_APP_LATEST_VERSION: '1.2.0',
  NATIVE_APP_MIN_SUPPORTED_VERSION: '1.0.0',
  NATIVE_APP_FORCE_UPDATE: 'false',
  NATIVE_APP_RELEASE_NOTES: 'Release notes',
  NATIVE_APP_STORE_URL_IOS: 'https://apps.apple.com/app/shoonaya/id6793055966',
  NATIVE_APP_STORE_URL_ANDROID: 'https://play.google.com/store/apps/details?id=com.shoonaya.app',
};

describe('native app version policy configuration', () => {
  it('returns the version policy and validated public store destinations for both stores', () => {
    const result = resolveNativeAppVersionPolicy(validEnvironment);

    expect(result.ok && result.policy).toEqual({
      latestVersion: '1.2.0',
      minSupportedVersion: '1.0.0',
      forceUpdate: false,
      storeUrls: {
        ios: validEnvironment.NATIVE_APP_STORE_URL_IOS,
        android: validEnvironment.NATIVE_APP_STORE_URL_ANDROID,
      },
      releaseNotes: 'Release notes',
    });
  });

  it('rejects malformed versions and a minimum above the latest version', () => {
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_LATEST_VERSION: '1.2.bad',
    }).ok).toBe(false);
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_MIN_SUPPORTED_VERSION: '2.0.0',
    }).ok).toBe(false);
  });

  it('rejects non-store URLs and invalid force-update values', () => {
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_STORE_URL_IOS: 'https://example.com/fake-store',
    }).ok).toBe(false);
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_FORCE_UPDATE: 'yes',
    }).ok).toBe(false);
  });

  it('ignores the retired NATIVE_APP_LATEST_BUILD_* variables, whatever they hold, so leftover config cannot change or break the policy', () => {
    const baseline = resolveNativeAppVersionPolicy(validEnvironment);
    for (const value of ['15', '0', '15.1', 'abc', '']) {
      const result = resolveNativeAppVersionPolicy({
        ...validEnvironment,
        NATIVE_APP_LATEST_BUILD_IOS: value,
        NATIVE_APP_LATEST_BUILD_ANDROID: value,
      });
      expect(result, `retired build variables set to ${JSON.stringify(value)}`).toEqual(baseline);
      expect(result.ok && 'latestBuildNumber' in result.policy).toBe(false);
    }
  });
});

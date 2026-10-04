import { describe, expect, it } from 'vitest';

import { resolveNativeAppVersionPolicy } from './native-app-version-policy';

const validEnvironment = {
  NATIVE_APP_LATEST_VERSION: '1.2.0',
  NATIVE_APP_MIN_SUPPORTED_VERSION: '1.0.0',
  NATIVE_APP_LATEST_BUILD_IOS: '12',
  NATIVE_APP_LATEST_BUILD_ANDROID: '15',
  NATIVE_APP_FORCE_UPDATE: 'false',
  NATIVE_APP_RELEASE_NOTES: 'Release notes',
  NATIVE_APP_STORE_URL_IOS: 'https://apps.apple.com/app/shoonaya/id6793055966',
  NATIVE_APP_STORE_URL_ANDROID: 'https://play.google.com/store/apps/details?id=com.shoonaya.app',
};

describe('native app version policy configuration', () => {
  it('returns the selected platform build and validated public store destinations', () => {
    const ios = resolveNativeAppVersionPolicy(validEnvironment, 'ios');
    const android = resolveNativeAppVersionPolicy(validEnvironment, 'android');

    expect(ios.ok && ios.policy.latestBuildNumber).toBe(12);
    expect(android.ok && android.policy.latestBuildNumber).toBe(15);
    expect(ios.ok && ios.policy.storeUrls.ios).toBe(validEnvironment.NATIVE_APP_STORE_URL_IOS);
  });

  it('rejects malformed versions and a minimum above the latest version', () => {
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_LATEST_VERSION: '1.2.bad',
    }, 'ios').ok).toBe(false);
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_MIN_SUPPORTED_VERSION: '2.0.0',
    }, 'ios').ok).toBe(false);
  });

  it('rejects non-store URLs and invalid force-update values', () => {
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_STORE_URL_IOS: 'https://example.com/fake-store',
    }, 'ios').ok).toBe(false);
    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_FORCE_UPDATE: 'yes',
    }, 'android').ok).toBe(false);
  });

  it('allows omitted platform build numbers but rejects malformed configured builds', () => {
    const withoutBuild: Record<string, string | undefined> = { ...validEnvironment };
    delete withoutBuild.NATIVE_APP_LATEST_BUILD_IOS;
    const result = resolveNativeAppVersionPolicy(withoutBuild, 'ios');
    expect(result.ok && result.policy.latestBuildNumber).toBeUndefined();

    expect(resolveNativeAppVersionPolicy({
      ...validEnvironment,
      NATIVE_APP_LATEST_BUILD_ANDROID: '15.1',
    }, 'android').ok).toBe(false);
  });
});

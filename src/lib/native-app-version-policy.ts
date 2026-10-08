export type NativeStorePlatform = 'android' | 'ios';

export type NativeAppVersionPolicy = {
  latestVersion: string;
  minSupportedVersion: string;
  forceUpdate: boolean;
  storeUrls: { android: string; ios: string };
  releaseNotes: string;
};

type PolicyResult =
  | { ok: true; policy: NativeAppVersionPolicy }
  | { ok: false; reason: string };

function parseStableVersion(value: string | undefined): [string, string, string] | null {
  if (!value || !/^(0|[1-9]\d*)\.(0|[1-9]\d*)\.(0|[1-9]\d*)$/.test(value)) return null;
  return value.split('.') as [string, string, string];
}

function compareVersionParts(left: string[], right: string[]): number {
  for (let index = 0; index < 3; index += 1) {
    if (left[index].length !== right[index].length) {
      return left[index].length > right[index].length ? 1 : -1;
    }
    if (left[index] !== right[index]) return left[index] > right[index] ? 1 : -1;
  }
  return 0;
}

function parseStoreUrl(value: string | undefined, platform: NativeStorePlatform): string | null {
  if (!value || value.length > 500) return null;
  try {
    const url = new URL(value);
    const validHost = platform === 'ios'
      ? url.hostname === 'apps.apple.com' && /\/app\/shoonaya\/id6793055966$/.test(url.pathname)
      : url.hostname === 'play.google.com' &&
        url.pathname === '/store/apps/details' &&
        url.searchParams.get('id') === 'com.shoonaya.app';
    return url.protocol === 'https:' && !url.username && !url.password && validHost ? url.toString() : null;
  } catch {
    return null;
  }
}

/**
 * Resolves and validates the public app-version contract from server config.
 *
 * Build numbers are deliberately NOT part of this contract. Every store build of
 * a release shares one version and differs only by an auto-incremented build
 * number, and nothing automatic tells the server which build is live, so a
 * build-number field needed a manual env change after every release and silently
 * did nothing when forgotten. Routine builds reach users through Google Play and
 * the App Store's own update notice; this policy only nudges or forces a
 * deliberate VERSION change. The retired NATIVE_APP_LATEST_BUILD_IOS/ANDROID
 * variables are ignored, whatever their value, so leftover config cannot break it.
 */
export function resolveNativeAppVersionPolicy(env: Record<string, string | undefined>): PolicyResult {
  const latestVersionValue = env.NATIVE_APP_LATEST_VERSION;
  const minSupportedVersionValue = env.NATIVE_APP_MIN_SUPPORTED_VERSION;
  const latestVersion = parseStableVersion(latestVersionValue);
  const minSupportedVersion = parseStableVersion(minSupportedVersionValue);
  const androidStoreUrl = parseStoreUrl(env.NATIVE_APP_STORE_URL_ANDROID, 'android');
  const iosStoreUrl = parseStoreUrl(env.NATIVE_APP_STORE_URL_IOS, 'ios');

  if (!latestVersionValue || !minSupportedVersionValue || !latestVersion || !minSupportedVersion) {
    return { ok: false, reason: 'App version policy needs valid latest and minimum versions.' };
  }
  if (compareVersionParts(minSupportedVersion, latestVersion) > 0) {
    return { ok: false, reason: 'Minimum supported version cannot exceed latest version.' };
  }
  if (!androidStoreUrl || !iosStoreUrl) {
    return { ok: false, reason: 'App store URLs are missing or invalid.' };
  }

  const forceValue = env.NATIVE_APP_FORCE_UPDATE;
  if (forceValue !== undefined && forceValue !== 'true' && forceValue !== 'false') {
    return { ok: false, reason: 'Force-update policy must be true or false.' };
  }
  const releaseNotes = env.NATIVE_APP_RELEASE_NOTES ?? '';
  if (releaseNotes.length > 2000) {
    return { ok: false, reason: 'Release notes exceed the 2000-character limit.' };
  }

  return {
    ok: true,
    policy: {
      latestVersion: latestVersionValue,
      minSupportedVersion: minSupportedVersionValue,
      forceUpdate: forceValue === 'true',
      storeUrls: { android: androidStoreUrl, ios: iosStoreUrl },
      releaseNotes,
    },
  };
}

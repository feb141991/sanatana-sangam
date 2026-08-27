export type ReleaseIdentity = {
  sha: string;
  deploymentUrl: string | null;
  appVersion: string;
  buildTime: string;
};

function nullableBuildValue(value: string | undefined): string | null {
  return value && value !== 'local' ? value : null;
}

export const CLIENT_RELEASE_IDENTITY: ReleaseIdentity = {
  sha: process.env.NEXT_PUBLIC_RELEASE_SHA || 'local',
  deploymentUrl: nullableBuildValue(process.env.NEXT_PUBLIC_DEPLOYMENT_URL),
  appVersion: process.env.NEXT_PUBLIC_APP_VERSION || '0.0.0',
  buildTime: process.env.NEXT_PUBLIC_BUILD_TIME || 'unknown',
};

export function serverReleaseIdentity() {
  return {
    sha: process.env.VERCEL_GIT_COMMIT_SHA || process.env.NEXT_PUBLIC_RELEASE_SHA || 'local',
    deploymentUrl: process.env.VERCEL_URL || process.env.NEXT_PUBLIC_DEPLOYMENT_URL || null,
  };
}

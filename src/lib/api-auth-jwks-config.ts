/**
 * Pinned public JWKS for the production Supabase project. This is public key
 * material, used only to avoid a per-isolate JWKS fetch for the current key.
 *
 * Unknown `kid` values still use supabase-js's dynamic JWKS fetch. If a key
 * must be revoked before its tokens expire, deploy with
 * `SUPABASE_AUTH_JWKS_MODE=remote` so the pinned key is no longer trusted.
 */
const KNOWN_PROJECT_JWKS = {
  keys: [
    {
      alg: 'ES256',
      crv: 'P-256',
      ext: true,
      key_ops: ['verify'],
      kid: 'e26cc168-f537-4df4-9f93-36a04a17c7dc',
      kty: 'EC',
      use: 'sig',
      x: 'gbCv9Pxxtwm24dfwtFbY1jRXF_U7S_H4j2KZmfoRCHk',
      y: 'bLxFTNpHQ4NGMqDJ8rvQ3agzNT6DiUT9wpmb-O1uAb8',
    },
  ],
};

const KNOWN_PROJECT_HOST = 'mnbwodcswxoojndytngu.supabase.co';

/**
 * Return the pinned set only for the exact production project and unless an
 * operator has selected remote-only verification for a key-rotation/revocation
 * deployment. Invalid mode values fail closed to dynamic JWKS verification.
 */
export function getPinnedProjectJwksOptions(
  projectUrl: string,
  mode = process.env.SUPABASE_AUTH_JWKS_MODE,
): { jwks: typeof KNOWN_PROJECT_JWKS } | undefined {
  if (mode !== undefined && mode !== '' && mode !== 'pinned') return undefined;

  try {
    const url = new URL(projectUrl);
    if (url.protocol !== 'https:' || url.hostname !== KNOWN_PROJECT_HOST) return undefined;
    return { jwks: KNOWN_PROJECT_JWKS };
  } catch {
    return undefined;
  }
}

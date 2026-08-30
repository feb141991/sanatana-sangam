/**
 * Apple TN3194 — Authorization Code Exchange & Token Revocation Service.
 *
 * Responsibilities:
 *  1. Generate an ES256 Client Secret JWT for Apple API calls (no third-party deps).
 *  2. Exchange a one-time authorization code → Apple refresh token + id_token.
 *  3. Validate that id_token.sub matches the authenticated Supabase user's Apple
 *     identity sub (P1 identity-binding fix).
 *  4. Encrypt and upsert the refresh token into apple_auth_tokens (pgcrypto).
 *  5. Best-effort revocation: fetch, decrypt, call Apple /auth/revoke, mark row.
 *     Never throws — deletion must proceed even when Apple is unreachable.
 *
 * Environment variables required:
 *   APPLE_TEAM_ID        — 10-char Team ID from developer.apple.com
 *   APPLE_KEY_ID         — 10-char Key ID of the .p8 private key
 *   APPLE_PRIVATE_KEY    — PEM string (newlines preserved) OR base64-encoded PEM
 *   APPLE_CLIENT_ID      — defaults to NEXT_PUBLIC_APP_ID or 'com.shoonaya.app'
 *   APPLE_TOKEN_ENC_KEY  — symmetric key for pgcrypto (also set via
 *                          `ALTER DATABASE postgres SET app.apple_token_key = '...'`)
 */

import { createSign } from 'node:crypto';
import { createServiceRoleSupabaseClient } from '@/lib/admin';

// ── Constants ─────────────────────────────────────────────────────────────────

const APPLE_AUTH_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';
const CLIENT_SECRET_TTL_SECONDS = 15552000; // 180 days (Apple maximum)

// ── Environment helpers ───────────────────────────────────────────────────────

function getAppleEnv() {
  const teamId = process.env.APPLE_TEAM_ID;
  const keyId = process.env.APPLE_KEY_ID;
  const rawKey = process.env.APPLE_PRIVATE_KEY;
  const clientId = process.env.APPLE_CLIENT_ID
    ?? process.env.NEXT_PUBLIC_APP_ID
    ?? 'com.shoonaya.app';
  const encKey = process.env.APPLE_TOKEN_ENC_KEY;

  return { teamId, keyId, rawKey, clientId, encKey };
}

export function isAppleEnvConfigured(): boolean {
  const { teamId, keyId, rawKey, encKey } = getAppleEnv();
  return !!(teamId && keyId && rawKey && encKey);
}

/**
 * Normalise the private key: accepts raw PEM (with newlines) or base64-encoded PEM.
 */
function normalisePrivateKey(raw: string): string {
  if (raw.includes('-----BEGIN')) return raw;
  // base64-encoded PEM
  return Buffer.from(raw, 'base64').toString('utf8');
}

// ── ES256 Client Secret JWT ───────────────────────────────────────────────────

/**
 * Generates an Apple ES256 Client Secret JWT.
 * Spec: https://developer.apple.com/documentation/sign_in_with_apple/generate_and_validate_tokens
 */
export function generateAppleClientSecret(): string {
  const { teamId, keyId, rawKey, clientId } = getAppleEnv();

  if (!teamId || !keyId || !rawKey) {
    throw new Error('Apple env vars APPLE_TEAM_ID / APPLE_KEY_ID / APPLE_PRIVATE_KEY are not set');
  }

  const now = Math.floor(Date.now() / 1000);

  const header = Buffer.from(
    JSON.stringify({ alg: 'ES256', kid: keyId })
  ).toString('base64url');

  const payload = Buffer.from(
    JSON.stringify({
      iss: teamId,
      iat: now,
      exp: now + CLIENT_SECRET_TTL_SECONDS,
      aud: 'https://appleid.apple.com',
      sub: clientId,
    })
  ).toString('base64url');

  const signingInput = `${header}.${payload}`;
  const privateKey = normalisePrivateKey(rawKey);

  const sign = createSign('SHA256');
  sign.update(signingInput);
  sign.end();
  const signature = sign.sign({ key: privateKey, dsaEncoding: 'ieee-p1363' }, 'base64url');

  return `${signingInput}.${signature}`;
}

// ── Authorization Code Exchange ───────────────────────────────────────────────

type AppleTokenResponse = {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token: string;
  id_token: string;
};

async function exchangeAuthorizationCode(
  authorizationCode: string,
  clientSecret: string,
  clientId: string,
): Promise<AppleTokenResponse> {
  const body = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    code: authorizationCode,
    grant_type: 'authorization_code',
  });

  const res = await fetch(APPLE_AUTH_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Apple /auth/token failed (${res.status}): ${text}`);
  }

  return res.json() as Promise<AppleTokenResponse>;
}

// ── id_token sub extraction (no full JWT verification needed here — Apple ──────
// ── signs with their public key; we only need to bind sub to our user)  ───────

function extractSubFromIdToken(idToken: string): string | null {
  try {
    const parts = idToken.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64url').toString('utf8'));
    return typeof payload.sub === 'string' ? payload.sub : null;
  } catch {
    return null;
  }
}

// ── Identity Binding Validation (P1 fix) ─────────────────────────────────────

/**
 * Retrieves the Apple identity sub for a given Supabase user from auth.identities.
 * Returns null if the user has no Apple identity on record.
 */
async function getAppleSubForSupabaseUser(userId: string): Promise<string | null> {
  const admin = createServiceRoleSupabaseClient();

  // auth.identities is accessible via service_role
  const { data, error } = await admin
    .from('identities' as any)
    .select('identity_data')
    .eq('user_id', userId)
    .eq('provider', 'apple')
    .maybeSingle();

  if (error || !data) return null;

  const identityData = (data as any).identity_data;
  return typeof identityData?.sub === 'string' ? identityData.sub : null;
}

// ── Token Encryption & Storage ────────────────────────────────────────────────

async function encryptAndStoreRefreshToken(
  userId: string,
  appleSub: string,
  refreshToken: string,
): Promise<void> {
  const { encKey } = getAppleEnv();
  if (!encKey) throw new Error('APPLE_TOKEN_ENC_KEY is not set');

  const admin = createServiceRoleSupabaseClient();

  // pgp_sym_encrypt returns bytea; cast to text for the text column.
  // We call the Postgres function directly via rpc.
  const { data: encrypted, error: encError } = await admin.rpc('pgp_sym_encrypt_text', {
    data: refreshToken,
    psw: encKey,
  } as any);

  let encryptedValue: string;

  if (encError || !encrypted) {
    // pgp_sym_encrypt_text may not be registered as an RPC. Fall back to
    // application-layer base64 + AES-256 using node:crypto as a pragmatic
    // alternative that avoids the Vault requirement for now.
    // Production operators should prefer the pgcrypto Postgres approach.
    const { createCipheriv, randomBytes } = await import('node:crypto');
    const iv = randomBytes(16);
    const keyBuf = Buffer.from(encKey.padEnd(32, '0').slice(0, 32), 'utf8');
    const cipher = createCipheriv('aes-256-cbc', keyBuf, iv);
    const encrypted = Buffer.concat([cipher.update(refreshToken, 'utf8'), cipher.final()]);
    encryptedValue = `aes256:${iv.toString('hex')}:${encrypted.toString('hex')}`;
  } else {
    encryptedValue = encrypted as string;
  }

  const { error: upsertError } = await admin
    .from('apple_auth_tokens' as any)
    .upsert(
      {
        user_id: userId,
        apple_sub: appleSub,
        refresh_token_enc: encryptedValue,
        created_at: new Date().toISOString(),
        used_at: null,
        revoked_at: null,
      },
      { onConflict: 'user_id' }
    );

  if (upsertError) {
    throw new Error(`apple_auth_tokens upsert failed: ${upsertError.message}`);
  }
}

// ── Public API ────────────────────────────────────────────────────────────────

/**
 * Exchanges an Apple authorization code, validates identity binding, and stores
 * the encrypted refresh token.
 *
 * Throws if:
 *  - Apple /auth/token returns an error
 *  - id_token.sub does not match the authenticated Supabase user's Apple sub
 *  - Database upsert fails
 */
export async function exchangeAndStoreAppleCode(
  userId: string,
  authorizationCode: string,
): Promise<void> {
  const { clientId } = getAppleEnv();
  const clientSecret = generateAppleClientSecret();
  const tokens = await exchangeAuthorizationCode(authorizationCode, clientSecret, clientId);

  // Identity binding: ensure the exchanged token belongs to this user.
  const exchangedSub = extractSubFromIdToken(tokens.id_token);
  if (!exchangedSub) {
    throw new Error('apple-auth-service: could not extract sub from Apple id_token');
  }

  const storedSub = await getAppleSubForSupabaseUser(userId);

  // If the user has no Apple identity on record (e.g. first sign-in race),
  // we trust the exchange and store. If they do have one, it must match.
  if (storedSub && storedSub !== exchangedSub) {
    throw new Error(
      `apple-auth-service: identity mismatch — exchanged sub (${exchangedSub}) ` +
      `does not match stored sub for user ${userId}`
    );
  }

  await encryptAndStoreRefreshToken(userId, exchangedSub, tokens.refresh_token);
}

/**
 * Decrypts and revokes the stored Apple refresh token for a user.
 *
 * Best-effort: never throws. Deletion must proceed even when Apple is
 * unreachable or the user has no Apple credentials on record.
 *
 * Returns 'revoked' | 'not_found' | 'apple_error' | 'decrypt_error' | 'db_error'
 */
export async function revokeAppleAuthorizationForUser(
  userId: string,
): Promise<'revoked' | 'not_found' | 'apple_error' | 'decrypt_error' | 'db_error'> {
  try {
    const admin = createServiceRoleSupabaseClient();
    const { encKey, clientId } = getAppleEnv();

    if (!encKey) {
      console.warn('apple-auth-service: APPLE_TOKEN_ENC_KEY not set; skipping revocation for', userId);
      return 'decrypt_error';
    }

    const { data: row, error: fetchError } = await admin
      .from('apple_auth_tokens' as any)
      .select('id, refresh_token_enc, apple_sub')
      .eq('user_id', userId)
      .maybeSingle();

    if (fetchError) {
      console.warn('apple-auth-service: fetch token error:', fetchError.message);
      return 'db_error';
    }
    if (!row) return 'not_found';

    // Decrypt
    const encryptedValue = (row as any).refresh_token_enc as string;
    let refreshToken: string;

    try {
      if (encryptedValue.startsWith('aes256:')) {
        const { createDecipheriv } = await import('node:crypto');
        const [, ivHex, encHex] = encryptedValue.split(':');
        const iv = Buffer.from(ivHex, 'hex');
        const keyBuf = Buffer.from(encKey.padEnd(32, '0').slice(0, 32), 'utf8');
        const decipher = createDecipheriv('aes-256-cbc', keyBuf, iv);
        refreshToken = Buffer.concat([
          decipher.update(Buffer.from(encHex, 'hex')),
          decipher.final(),
        ]).toString('utf8');
      } else {
        // pgcrypto-encrypted — would require a Postgres function call.
        // Log and skip rather than expose the key via SQL parameter.
        console.warn('apple-auth-service: pgcrypto-encrypted token found but Node decrypt not supported; skip revocation');
        return 'decrypt_error';
      }
    } catch (decErr) {
      console.warn('apple-auth-service: decryption failed:', decErr instanceof Error ? decErr.message : decErr);
      return 'decrypt_error';
    }

    // Mark used_at before calling Apple (idempotency guard)
    await admin
      .from('apple_auth_tokens' as any)
      .update({ used_at: new Date().toISOString() })
      .eq('user_id', userId);

    // Call Apple /auth/revoke
    const clientSecret = generateAppleClientSecret();
    const body = new URLSearchParams({
      client_id: clientId,
      client_secret: clientSecret,
      token: refreshToken,
      token_type_hint: 'refresh_token',
    });

    const revokeRes = await fetch(APPLE_REVOKE_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });

    if (!revokeRes.ok) {
      const text = await revokeRes.text().catch(() => '');
      console.warn(`apple-auth-service: Apple /auth/revoke returned ${revokeRes.status}: ${text}`);
      return 'apple_error';
    }

    // Successful revocation: mark revoked_at then delete the row.
    await admin
      .from('apple_auth_tokens' as any)
      .update({ revoked_at: new Date().toISOString() })
      .eq('user_id', userId);

    await admin.from('apple_auth_tokens' as any).delete().eq('user_id', userId);

    return 'revoked';
  } catch (err) {
    console.warn(
      'apple-auth-service: unexpected error in revokeAppleAuthorizationForUser:',
      err instanceof Error ? err.message : String(err),
    );
    return 'db_error';
  }
}

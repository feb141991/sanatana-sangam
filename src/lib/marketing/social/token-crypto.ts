/**
 * Marketing Studio social-publishing credential encryption.
 *
 * One tested path for both encrypt and decrypt -- deliberately NOT modeled
 * on src/lib/apple-auth-service.ts, which has a confirmed live mismatch:
 * it writes via pgp_sym_encrypt (Postgres/pgcrypto) but its decrypt path
 * only handles its own "aes256:"-prefixed Node-side fallback format and
 * explicitly skips anything pgcrypto-encrypted, meaning tokens written via
 * its primary path can never be read back. See the approved Marketing
 * Studio social pipeline plan, section 4.
 *
 * AES-256-GCM: authenticated encryption, not CBC -- its auth tag detects
 * tampering/corruption that CBC alone cannot. Key material is versioned via
 * SOCIAL_TOKEN_ENC_KEY_V<n> env vars so a future rotation can still decrypt
 * old rows under their original key while new encryptions use the current
 * one (see reencryptSocialToken and the rotation procedure below).
 */
import { randomBytes, createCipheriv, createDecipheriv } from 'node:crypto';

const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH_BYTES = 12; // 96-bit nonce, the NIST SP 800-38D recommendation for GCM
const KEY_LENGTH_BYTES = 32; // AES-256

export type EncryptedToken = {
  keyVersion: number;
  /** Self-describing: v<version>:<iv_base64>:<ciphertext_base64>:<authTag_base64> */
  encoded: string;
};

function readKey(version: number): Buffer {
  const envVar = `SOCIAL_TOKEN_ENC_KEY_V${version}`;
  const raw = process.env[envVar];
  if (!raw) {
    throw new Error(`${envVar} is not set`);
  }
  const key = Buffer.from(raw, 'base64');
  if (key.length !== KEY_LENGTH_BYTES) {
    throw new Error(
      `${envVar} must decode to exactly ${KEY_LENGTH_BYTES} bytes (base64-encoded), got ${key.length}`
    );
  }
  return key;
}

export function currentSocialTokenKeyVersion(): number {
  const raw = process.env.SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION;
  const version = raw ? Number(raw) : 1;
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION must be a positive integer');
  }
  return version;
}

export function isSocialTokenEncryptionConfigured(): boolean {
  try {
    readKey(currentSocialTokenKeyVersion());
    return true;
  } catch {
    return false;
  }
}

/**
 * Encrypts plaintext under the CURRENT key version. `keyVersion` is
 * returned separately from `encoded` because callers persist it in its own
 * DB column (social_platform_accounts.key_version) for operational
 * querying ("which rows still need re-encryption after a rotation") --
 * the encoded string's own embedded version is what decryption actually
 * trusts; the column is redundant, queryable metadata, not the source of
 * truth.
 */
export function encryptSocialToken(plaintext: string): EncryptedToken {
  const version = currentSocialTokenKeyVersion();
  const key = readKey(version);
  const iv = randomBytes(IV_LENGTH_BYTES);
  const cipher = createCipheriv(ALGORITHM, key, iv);
  const ciphertext = Buffer.concat([cipher.update(plaintext, 'utf8'), cipher.final()]);
  const authTag = cipher.getAuthTag();

  const encoded = `v${version}:${iv.toString('base64')}:${ciphertext.toString('base64')}:${authTag.toString('base64')}`;
  return { keyVersion: version, encoded };
}

/**
 * Decrypts a token produced by encryptSocialToken. The key version used is
 * always the one embedded in `encoded` (self-describing). If
 * `expectedKeyVersion` is passed (typically the DB column's value), it
 * must match the embedded version, or this throws instead of silently
 * decrypting under a mismatched assumption -- catches the row and the
 * ciphertext disagreeing about which key was used.
 */
export function decryptSocialToken(encoded: string, expectedKeyVersion?: number): string {
  const parts = encoded.split(':');
  if (parts.length !== 4 || !parts[0].startsWith('v')) {
    throw new Error('decryptSocialToken: malformed encoded value');
  }
  const [versionPart, ivPart, ciphertextPart, authTagPart] = parts;
  const version = Number(versionPart.slice(1));
  if (!Number.isInteger(version) || version < 1) {
    throw new Error('decryptSocialToken: malformed key version');
  }
  if (expectedKeyVersion !== undefined && expectedKeyVersion !== version) {
    throw new Error(
      `decryptSocialToken: expected key version ${expectedKeyVersion}, encoded value carries ${version}`
    );
  }

  const key = readKey(version);
  const iv = Buffer.from(ivPart, 'base64');
  const ciphertext = Buffer.from(ciphertextPart, 'base64');
  const authTag = Buffer.from(authTagPart, 'base64');
  if (iv.length !== IV_LENGTH_BYTES) {
    throw new Error('decryptSocialToken: malformed IV length');
  }

  const decipher = createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(authTag);
  const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]);
  return plaintext.toString('utf8');
}

/**
 * Documented rotation procedure (not automated in Phase 1, per the plan):
 *
 *   1. Generate a new 32-byte key: `openssl rand -base64 32`.
 *   2. Set it as SOCIAL_TOKEN_ENC_KEY_V<n+1> alongside the existing
 *      SOCIAL_TOKEN_ENC_KEY_V<n> (do not remove the old one yet).
 *   3. Deploy with SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION still pointing at
 *      the OLD version -- this step only makes the new key available for
 *      decryption if referenced explicitly, it does not yet activate it.
 *   4. Run a one-off script over every social_platform_accounts row calling
 *      reencryptSocialToken(row.access_token_enc, row.key_version) (and
 *      the same for refresh_token_enc where non-null), writing the
 *      returned encoded value and key_version back to that row.
 *   5. Once every row's key_version equals n+1, flip
 *      SOCIAL_TOKEN_ENC_KEY_CURRENT_VERSION to n+1 and deploy again.
 *   6. Retire SOCIAL_TOKEN_ENC_KEY_V<n> only after confirming no row still
 *      references it.
 *
 * reencryptSocialToken decrypts under the OLD version and re-encrypts
 * under whatever the CURRENT version is at call time -- it does not
 * assume the current version is the target of rotation, since step 3
 * above deliberately keeps them different until step 5.
 */
export function reencryptSocialToken(encoded: string, expectedOldKeyVersion: number): EncryptedToken {
  const plaintext = decryptSocialToken(encoded, expectedOldKeyVersion);
  return encryptSocialToken(plaintext);
}

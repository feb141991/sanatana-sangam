import { createHash, randomBytes, randomInt, timingSafeEqual } from 'node:crypto';

/**
 * A support ticket is read or answered only with its access code (or by its signed-in owner). A ticket number is a display reference and
 * an e-mail address is public knowledge: neither is a credential. Origin: 2026-11-19 review of the first help-desk build, where any
 * `?email=` value opened any guest ticket and the 4-character suffix came from Math.random().
 */

const TICKET_CODE_ALPHABET = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ';
export const TICKET_NUMBER_PATTERN = /^TKT-\d{6}-[A-Z0-9]{6}$/;
export const ACCESS_CODE_PATTERN = /^[A-Za-z0-9_-]{32,64}$/;

export function generateTicketNumber(now: Date = new Date()): string {
  const year = now.getUTCFullYear();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  let code = '';
  for (let i = 0; i < 6; i++) code += TICKET_CODE_ALPHABET[randomInt(TICKET_CODE_ALPHABET.length)];
  return `TKT-${year}${month}-${code}`;
}

/** 24 random bytes (192 bits), URL-safe. Shown to the seeker once and never stored. */
export function generateAccessCode(): string {
  return randomBytes(24).toString('base64url');
}

export function hashAccessCode(code: string): string {
  return createHash('sha256').update(code).digest('hex');
}

export function accessCodeMatches(code: string | null | undefined, storedHash: string | null | undefined): boolean {
  if (!code || !storedHash || !ACCESS_CODE_PATTERN.test(code)) return false;
  const a = Buffer.from(hashAccessCode(code), 'hex');
  const b = Buffer.from(storedHash, 'hex');
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Keeps a free-text admin search from changing a PostgREST `.or()` filter (commas, parentheses and wildcards are structure there). */
export function sanitizeSearchTerm(raw: string): string {
  return raw.replace(/[,()%*\\:"']/g, ' ').replace(/\s+/g, ' ').trim().slice(0, 100);
}

/** Only the keys the help desk reads, each bounded, so stored metadata has a fixed shape and size. */
export function boundClientMetadata(value: unknown): Record<string, string> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return {};
  const out: Record<string, string> = {};
  for (const [key, v] of Object.entries(value as Record<string, unknown>).slice(0, 12)) {
    if (/^[A-Za-z][A-Za-z0-9_]{0,31}$/.test(key) && (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean')) {
      out[key] = String(v).slice(0, 120);
    }
  }
  return out;
}

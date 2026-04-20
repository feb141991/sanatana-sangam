// ─── Admin Session Auth ───────────────────────────────────────────────────────
// Completely independent from Supabase. Uses HMAC-SHA256 signed cookies.
// Runs in both Edge Runtime (middleware) and Node.js (API routes) via Web Crypto.
//
// Required environment variables (set in Vercel → Settings → Environment):
//   ADMIN_USERNAME — the admin login username
//   ADMIN_PASSWORD — the admin login password
//   ADMIN_SECRET   — random 32+ char string used to sign cookies
//                    generate with: openssl rand -hex 32

export const ADMIN_COOKIE = 'sangam_admin_session';
export const SESSION_DURATION_S = 60 * 60 * 8; // 8 hours

// ── Helpers ───────────────────────────────────────────────────────────────────

function secret(): Uint8Array {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('[admin-auth] ADMIN_SECRET env var is not configured');
  return new TextEncoder().encode(s);
}

async function hmacKey(usage: KeyUsage[]): Promise<CryptoKey> {
  const raw = secret();
  // Slice to a plain ArrayBuffer so TypeScript's stricter generics are satisfied
  // across both Edge Runtime and Node.js targets.
  const buf = raw.buffer.slice(raw.byteOffset, raw.byteOffset + raw.byteLength) as ArrayBuffer;
  return crypto.subtle.importKey('raw', buf, { name: 'HMAC', hash: 'SHA-256' }, false, usage);
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf)).map(b => b.toString(16).padStart(2, '0')).join('');
}

function hexToBuf(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  return new Uint8Array(pairs.map(b => parseInt(b, 16)));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createAdminToken(username: string): Promise<string> {
  const payload = btoa(JSON.stringify({
    sub: username,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_S * 1000,
  }));
  const key = await hmacKey(['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(payload));
  return `${payload}.${bufToHex(sig)}`;
}

export async function verifyAdminToken(token: string): Promise<{ username: string } | null> {
  if (!token) return null;
  const dotIdx = token.lastIndexOf('.');
  if (dotIdx < 0) return null;
  const b64 = token.slice(0, dotIdx);
  const hex = token.slice(dotIdx + 1);

  try {
    const key = await hmacKey(['verify']);
    const valid = await crypto.subtle.verify(
      'HMAC', key, hexToBuf(hex), new TextEncoder().encode(b64)
    );
    if (!valid) return null;

    const payload = JSON.parse(atob(b64));
    if (!payload.exp || Date.now() > payload.exp) return null;
    return { username: payload.sub };
  } catch {
    return null;
  }
}

export function adminCookieHeader(token: string, maxAge = SESSION_DURATION_S): string {
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${ADMIN_COOKIE}=${token}; HttpOnly${secure}; SameSite=Strict; Path=/; Max-Age=${maxAge}`;
}

export function adminClearCookieHeader(): string {
  return `${ADMIN_COOKIE}=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0`;
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envUser || !envPass) return false;
  return username === envUser && password === envPass;
}

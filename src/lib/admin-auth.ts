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

/** TextEncoder().encode() returns Uint8Array<ArrayBufferLike> in TS 5.x.
 *  Web Crypto APIs require ArrayBuffer (not ArrayBufferLike).
 *  This helper always returns a plain ArrayBuffer. */
function toArrayBuffer(u8: Uint8Array): ArrayBuffer {
  return u8.buffer.slice(u8.byteOffset, u8.byteOffset + u8.byteLength) as ArrayBuffer;
}

function encode(s: string): ArrayBuffer {
  return toArrayBuffer(new TextEncoder().encode(s));
}

function secretBuf(): ArrayBuffer {
  const s = process.env.ADMIN_SECRET;
  if (!s) throw new Error('[admin-auth] ADMIN_SECRET env var is not configured');
  return encode(s);
}

async function hmacKey(usage: KeyUsage[]): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw', secretBuf(), { name: 'HMAC', hash: 'SHA-256' }, false, usage,
  );
}

function bufToHex(buf: ArrayBuffer): string {
  return Array.from(new Uint8Array(buf))
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

function hexToArrayBuffer(hex: string): ArrayBuffer {
  const pairs = hex.match(/.{1,2}/g) ?? [];
  return toArrayBuffer(new Uint8Array(pairs.map(b => parseInt(b, 16))));
}

// ── Public API ────────────────────────────────────────────────────────────────

export async function createAdminToken(username: string): Promise<string> {
  const payload = btoa(JSON.stringify({
    sub: username,
    iat: Date.now(),
    exp: Date.now() + SESSION_DURATION_S * 1000,
  }));
  const key = await hmacKey(['sign']);
  const sig = await crypto.subtle.sign('HMAC', key, encode(payload));
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
      'HMAC', key, hexToArrayBuffer(hex), encode(b64),
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

/**
 * Constant-time string comparison using Node crypto.
 * Prevents timing attacks that could leak username/password length.
 * - Always compares equal-length buffers (pads shorter to max length).
 * - Also verifies exact length equality to reject padding attacks.
 */
function safeStrEqual(a: string, b: string): boolean {
  // Use Node's crypto for timingSafeEqual — this file only runs in Node runtime
  const { timingSafeEqual } = require('crypto') as typeof import('crypto'); // Node-only, runs in API routes not Edge
  const maxLen = Math.max(Buffer.byteLength(a, 'utf8'), Buffer.byteLength(b, 'utf8'));
  const bufA   = Buffer.alloc(maxLen);
  const bufB   = Buffer.alloc(maxLen);
  bufA.write(a, 'utf8');
  bufB.write(b, 'utf8');
  // timingSafeEqual result AND length equality (defeats padding attacks)
  return timingSafeEqual(bufA, bufB) && a.length === b.length;
}

export function checkAdminCredentials(username: string, password: string): boolean {
  const envUser = process.env.ADMIN_USERNAME;
  const envPass = process.env.ADMIN_PASSWORD;
  if (!envUser || !envPass) return false;
  return safeStrEqual(username, envUser) && safeStrEqual(password, envPass);
}

import { NextRequest, NextResponse } from 'next/server';

/**
 * @deprecated Use verifyAdminCookieAuth (async, HMAC-verified) instead.
 * Kept only for reference — all admin API routes now use verifyAdminCookieAuth.
 */
export function checkAdminAuth(req: NextRequest): NextResponse | null {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 });
  }
  const authHeader = req.headers.get('x-admin-secret');
  const cookieSecret = req.cookies.get('admin_secret')?.value;
  if (authHeader !== secret && cookieSecret !== secret) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null; // auth passed
}

/**
 * Drop-in async replacement for checkAdminAuth.
 * Verifies the sangam_admin_session HMAC-SHA256 cookie — the same check
 * the middleware performs on all /admin/* and /api/admin/* routes.
 * Returns a NextResponse on failure, null on success.
 */
export async function verifyAdminCookieAuth(req: NextRequest): Promise<NextResponse | null> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value ?? '';
  const result = await verifyAdminToken(token);
  if (!result) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
  return null;
}

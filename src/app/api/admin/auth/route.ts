import { NextRequest, NextResponse } from 'next/server';
import {
  checkAdminCredentials,
  createAdminToken,
  adminCookieHeader,
  adminClearCookieHeader,
} from '@/lib/admin-auth';

// POST /api/admin/auth — verify credentials and set session cookie
export async function POST(req: NextRequest) {
  let body: { username?: string; password?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { username = '', password = '' } = body;

  if (!checkAdminCredentials(username, password)) {
    // Constant-time-ish delay to slow brute force
    await new Promise(r => setTimeout(r, 300 + Math.random() * 200));
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const token = await createAdminToken(username);
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', adminCookieHeader(token));
  return res;
}

// DELETE /api/admin/auth — clear session cookie (logout)
export async function DELETE() {
  const res = NextResponse.json({ ok: true });
  res.headers.set('Set-Cookie', adminClearCookieHeader());
  return res;
}

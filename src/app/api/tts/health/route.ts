import { NextResponse } from 'next/server';

// Force Node.js runtime — matches the main TTS route
export const runtime = 'nodejs';

// GET /api/tts/health
// Diagnostic endpoint — checks whether the Google service account credentials
// are present and correctly formed WITHOUT making a live Google API call.
// Call this from the browser or curl to diagnose TTS setup issues in Vercel.
//
// Responds:
//   200  { ok: true,  checks: [...] }         — all checks passed
//   500  { ok: false, checks: [...], error }  — one or more checks failed

interface Check {
  name:   string;
  passed: boolean;
  detail: string;
}

export async function GET() {
  const checks: Check[] = [];

  // ── 1. GOOGLE_SERVICE_ACCOUNT_EMAIL ─────────────────────────────────────────
  const email = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL ?? '';
  checks.push({
    name:   'GOOGLE_SERVICE_ACCOUNT_EMAIL',
    passed: email.length > 0 && email.includes('@'),
    detail: email.length > 0
      ? `Set — ${email.slice(0, 6)}…${email.slice(-20)}` // partial reveal
      : 'NOT SET — add to Vercel → Settings → Environment Variables',
  });

  // ── 2. GOOGLE_SERVICE_ACCOUNT_KEY present ───────────────────────────────────
  const rawKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY ?? '';
  checks.push({
    name:   'GOOGLE_SERVICE_ACCOUNT_KEY (present)',
    passed: rawKey.length > 0,
    detail: rawKey.length > 0
      ? `Set — ${rawKey.length} chars`
      : 'NOT SET — add the private key to Vercel env vars',
  });

  // ── 3. Private key has correct PEM headers ───────────────────────────────────
  // Accept both literal \n (escaped, common in Vercel UI) and real newlines
  const key = rawKey.replace(/\\n/g, '\n');
  const hasBeginHeader = key.includes('-----BEGIN RSA PRIVATE KEY-----') ||
                         key.includes('-----BEGIN PRIVATE KEY-----');
  const hasEndHeader   = key.includes('-----END RSA PRIVATE KEY-----') ||
                         key.includes('-----END PRIVATE KEY-----');
  checks.push({
    name:   'GOOGLE_SERVICE_ACCOUNT_KEY (PEM headers)',
    passed: hasBeginHeader && hasEndHeader,
    detail: hasBeginHeader && hasEndHeader
      ? 'BEGIN and END markers found — key looks well-formed'
      : !rawKey
        ? 'Key not set — cannot check headers'
        : `Missing PEM markers. Ensure you copied the full JSON private_key value. BEGIN=${hasBeginHeader} END=${hasEndHeader}`,
  });

  // ── 4. Key length sanity check (RSA-2048 PEM is ~1700 chars after decode) ───
  const keyBody = key
    .replace(/-----BEGIN [A-Z ]+-----/, '')
    .replace(/-----END [A-Z ]+-----/, '')
    .replace(/\s/g, '');
  const keyBodyLen = keyBody.length;
  checks.push({
    name:   'GOOGLE_SERVICE_ACCOUNT_KEY (length)',
    passed: keyBodyLen > 500,
    detail: keyBodyLen > 500
      ? `Key body is ${keyBodyLen} chars — looks complete`
      : keyBodyLen === 0
        ? 'Key body is empty — key was not set or has no content'
        : `Key body is only ${keyBodyLen} chars — may be truncated (should be ~1700+)`,
  });

  // ── 5. GEMINI_API_KEY ────────────────────────────────────────────────────────
  const geminiKey = process.env.GEMINI_API_KEY ?? '';
  checks.push({
    name:   'GEMINI_API_KEY',
    passed: geminiKey.length > 10,
    detail: geminiKey.length > 10
      ? `Set — ${geminiKey.slice(0, 4)}…${geminiKey.slice(-4)} (${geminiKey.length} chars)`
      : 'NOT SET — AI features will use fallback content',
  });

  const allPassed = checks.every(c => c.passed);

  return NextResponse.json(
    {
      ok:        allPassed,
      timestamp: new Date().toISOString(),
      checks,
      note: allPassed
        ? 'All checks passed. If TTS is still failing, the issue is likely with Google Cloud API access (service account not granted Cloud TTS API, or API not enabled in the GCP project).'
        : 'Some checks failed. Fix the issues above in Vercel → Settings → Environment Variables, then redeploy.',
    },
    { status: allPassed ? 200 : 500 }
  );
}

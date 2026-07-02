import { NextResponse } from 'next/server';

type Bucket = {
  count: number;
  resetAt: number;
};

const buckets = new Map<string, Bucket>();
const MAX_RATE_LIMIT_BUCKETS = 5000;

function clientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  return forwarded || req.headers.get('x-real-ip') || 'unknown';
}

function pruneBuckets(now: number) {
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) {
      buckets.delete(key);
    }
  }

  while (buckets.size >= MAX_RATE_LIMIT_BUCKETS) {
    const oldestKey = buckets.keys().next().value;
    if (!oldestKey) break;
    buckets.delete(oldestKey);
  }
}

export function rejectLargeRequest(req: Request, maxBytes: number) {
  const rawLength = req.headers.get('content-length');
  if (!rawLength) return null;

  const length = Number(rawLength);
  if (!Number.isFinite(length) || length < 0) {
    return NextResponse.json({ error: 'Invalid content length' }, { status: 400 });
  }

  if (length > maxBytes) {
    return NextResponse.json({ error: 'Request body too large' }, { status: 413 });
  }

  return null;
}

export function rateLimitByIp(
  req: Request,
  options: { keyPrefix: string; limit: number; windowMs: number },
) {
  const now = Date.now();
  const key = `${options.keyPrefix}:${clientIp(req)}`;
  const bucket = buckets.get(key);

  if (!bucket || bucket.resetAt <= now) {
    pruneBuckets(now);
    buckets.set(key, { count: 1, resetAt: now + options.windowMs });
    return null;
  }

  bucket.count += 1;
  if (bucket.count > options.limit) {
    const retryAfter = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
    return NextResponse.json(
      { error: 'Too many requests' },
      { status: 429, headers: { 'Retry-After': String(retryAfter) } },
    );
  }

  return null;
}

export function truncateString(value: string, maxLength: number): string {
  return value.length > maxLength ? value.slice(0, maxLength) : value;
}

export function asBoundedString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') return null;
  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) return null;
  return trimmed;
}

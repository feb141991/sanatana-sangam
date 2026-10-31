import { NextRequest, NextResponse } from 'next/server';

import { getApiAuthFailureResponse, getApiUser } from '@/lib/api-auth';
import { checkDurableRateLimit, rejectLargeRequest } from '@/lib/api-security';
import { findSanskaraAction, mapSanskaraError, queryToInput } from '@/lib/native-sanskara';
import { createAdminClient } from '@/lib/supabase-admin';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

type RouteContext = { params: Promise<{ action: string }> };

// Every Sanskara response is about one person's private records: never cached anywhere.
const PRIVATE = { 'Cache-Control': 'private, no-store' } as const;
const MAX_BODY_BYTES = 8_192;
// Per signed-in user, per minute. Reads are cheap list calls; writes are rarer and each is a transaction.
const READ_LIMIT = 120;
const WRITE_LIMIT = 30;

function respond(body: unknown, status: number, extra?: Record<string, string>) {
  return NextResponse.json(body, { status, headers: { ...PRIVATE, ...extra } });
}

async function handle(request: NextRequest, context: RouteContext, method: 'GET' | 'POST') {
  const { action: name } = await context.params;
  const action = findSanskaraAction(name);
  if (!action) return respond({ error: 'Unknown request', code: 'sanskara_unknown_action' }, 404);
  if (action.method !== method) {
    return respond({ error: 'That request uses a different method', code: 'sanskara_wrong_method' }, 405, { Allow: action.method });
  }

  if (method === 'POST') {
    const tooLarge = rejectLargeRequest(request, MAX_BODY_BYTES);
    if (tooLarge) return tooLarge;
  }

  const auth = await getApiUser(request);
  if (!auth.user || !auth.supabase) return getApiAuthFailureResponse(auth.error);

  const rateLimited = await checkDurableRateLimit(
    `sanskara:${method === 'GET' ? 'read' : 'write'}:user:${auth.user.id}`,
    method === 'GET' ? READ_LIMIT : WRITE_LIMIT,
    60_000,
    createAdminClient(),
  );
  if (rateLimited) return rateLimited;

  let input: Record<string, unknown>;
  if (method === 'GET') {
    input = queryToInput(request.nextUrl.searchParams);
  } else {
    const body: unknown = await request.json().catch(() => null);
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return respond({ error: 'The request body must be a JSON object', code: 'sanskara_invalid_body' }, 400);
    }
    input = body as Record<string, unknown>;
  }

  const parsed = action.parse(input);
  if (!parsed.ok) {
    return respond({ error: 'That request could not be accepted. Please check it and try again.', code: 'sanskara_invalid_input', field: parsed.field }, 400);
  }

  // The caller's own client: RLS and auth.uid() apply, and the database functions do the authorising.
  const { data, error } = await auth.supabase.rpc(action.rpc as never, parsed.args as never);
  if (error) {
    const failure = mapSanskaraError(error);
    // The code and our own reason only: never the message, parameters, or anything that names a person.
    console.warn('[native-sanskara] refused', { action: name, status: failure.status, code: failure.code, requestId: request.headers.get('x-request-id') });
    return respond({ error: failure.error, code: failure.code }, failure.status);
  }
  return respond(data ?? null, 200);
}

export async function GET(request: NextRequest, context: RouteContext) {
  return handle(request, context, 'GET');
}

export async function POST(request: NextRequest, context: RouteContext) {
  return handle(request, context, 'POST');
}

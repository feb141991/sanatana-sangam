import { createClient, type User } from '@supabase/supabase-js';
import type { NextRequest } from 'next/server';

import { createServerSupabaseClient } from '@/lib/supabase-server';
import type { Database } from '@/types/database';

type ApiUserResult =
  | { user: User; error: null }
  | { user: null; error: Error };

function getBearerToken(req: NextRequest) {
  const header = req.headers.get('authorization');
  const match = header?.match(/^Bearer\s+(.+)$/i);
  return match?.[1] ?? null;
}

export async function getApiUser(req: NextRequest): Promise<ApiUserResult> {
  const cookieClient = await createServerSupabaseClient();
  const cookieResult = await cookieClient.auth.getUser();

  if (cookieResult.data.user) {
    return { user: cookieResult.data.user, error: null };
  }

  const token = getBearerToken(req);
  if (!token) {
    return {
      user: null,
      error: cookieResult.error ?? new Error('Unauthorized'),
    };
  }

  const bearerClient = createClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
      global: {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      },
    }
  );

  const bearerResult = await bearerClient.auth.getUser();
  if (!bearerResult.data.user) {
    return {
      user: null,
      error: bearerResult.error ?? new Error('Unauthorized'),
    };
  }

  return { user: bearerResult.data.user, error: null };
}

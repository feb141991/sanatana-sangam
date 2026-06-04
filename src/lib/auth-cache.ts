import { cache } from 'react';
import { createServerSupabaseClient } from './supabase-server';

/**
 * Cached auth user lookup — deduplicates the JWT validation round-trip
 * when layout.tsx and a child page both call supabase.auth.getUser()
 * within the same server render. React's cache() ensures only one
 * network call is made per request regardless of how many Server
 * Components import this.
 */
export const getAuthUser = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  return user;
});

/**
 * Cached auth + profile lookup for pages that need both.
 * Returns { user, profile, supabase } so callers can run additional
 * queries on the same already-authenticated client.
 */
export const getAuthUserAndProfile = cache(async () => {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { user: null, profile: null, supabase };
  const { data: profile } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();
  return { user, profile, supabase };
});

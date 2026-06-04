// Root page — served via beforeFiles rewrite in next.config.js (/ → /landing.html)
// so the URL stays shoonaya.com with no /landing.html visible.
// Logged-in users are caught by middleware before this renders.
// This is a safety fallback only.
import { redirect } from 'next/navigation';
import { createServerSupabaseClient } from '@/lib/supabase-server';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (user) redirect('/home');
  // Rewrite should have handled this — fallback
  redirect('/landing.html');
}

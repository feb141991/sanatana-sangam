import { createServerSupabaseClient } from '@/lib/supabase-server';
import { redirect } from 'next/navigation';
import LandingPage from './LandingPage';

export default async function RootPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Logged-in users go straight to the home dashboard
  if (user) {
    redirect('/home');
  }

  return <LandingPage />;
}

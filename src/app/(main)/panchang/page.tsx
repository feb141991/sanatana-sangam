import { createServerSupabaseClient } from '@/lib/supabase-server';
import PanchangClient from './PanchangClient';

export default async function PanchangPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let lat       = 28.6139; // Default: New Delhi
  let lon       = 77.2090;
  let city      = '';
  let tradition = 'hindu';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, neighbourhood, tradition')
      .eq('id', user.id)
      .single();
    if (profile?.latitude)  lat       = profile.latitude;
    if (profile?.longitude) lon       = profile.longitude;
    if (profile?.city)      city      = profile.neighbourhood ?? profile.city;
    if (profile?.tradition) tradition = profile.tradition;
  }

  return <PanchangClient lat={lat} lon={lon} city={city} tradition={tradition} />;
}

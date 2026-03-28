import { createServerSupabaseClient } from '@/lib/supabase-server';
import PanchangClient from './PanchangClient';

export default async function PanchangPage() {
  const supabase = await createServerSupabaseClient();
  const { data: { user } } = await supabase.auth.getUser();

  let lat = 28.6139; // Default: New Delhi
  let lon = 77.2090;
  let city = '';

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('latitude, longitude, city, neighbourhood')
      .eq('id', user.id)
      .single();
    if (profile?.latitude)  lat  = profile.latitude;
    if (profile?.longitude) lon  = profile.longitude;
    if (profile?.city)      city = profile.neighbourhood ?? profile.city;
  }

  return <PanchangClient lat={lat} lon={lon} city={city} />;
}

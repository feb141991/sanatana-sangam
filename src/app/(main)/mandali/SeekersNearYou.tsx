import { useEffect, useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase';
import { getInitials } from '@/lib/utils';

type Profile = {
  id: string;
  full_name?: string;
  username?: string;
  avatar_url?: string;
  tradition?: string;
  city?: string;
};

type Props = {
  userId: string;
  profile: Profile | null;
};

export default function SeekersNearYou({ userId, profile }: Props) {
  const [nearby, setNearby] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchNearby() {
      if (!profile?.city) return;
      setLoading(true);
      const supabase = createClient();
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name, username, avatar_url, tradition, city')
        .eq('city', profile.city)
        .neq('id', userId)
        .limit(10);
      if (!error && data) setNearby(data as Profile[]);
      setLoading(false);
    }
    fetchNearby();
  }, [profile?.city, userId]);

  if (!profile?.city) return null;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-4 mt-6" style={{ background: 'var(--brand-primary-soft)' }}>
      <h3 className="font-display font-bold text-lg mb-3" style={{ color: 'var(--text-cream)' }}>Seekers Near You</h3>
      {loading ? (
        <p className="text-sm theme-dim">Loading...</p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {nearby.map(p => (
            <div key={p.id} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-brand-primary to-brand-accent text-xs font-bold flex items-center justify-center" style={{ color: 'var(--divine-text)' }}>
                {p.avatar_url ? (
                  <Image src={p.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                ) : (
                  getInitials(p.full_name || p.username || '?')
                )}
              </div>
              <span className="text-sm" style={{ color: 'var(--brand-ink)' }}>{p.full_name || p.username}</span>
            </div>
          ))}
          {nearby.length === 0 && <p className="text-sm theme-dim">No nearby seekers yet.</p>}
        </div>
      )}
    </div>
  );
}

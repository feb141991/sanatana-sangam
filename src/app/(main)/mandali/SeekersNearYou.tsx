import { useEffect, useState } from 'react';
import Image from 'next/image';
import { getInitials } from '@/lib/utils';

type NearbyProfile = {
  id: string;
  username: string;
  avatar_url: string | null;
  distanceLabel: string;
};

type Props = {
  userId: string;
  profile: { city?: string | null; latitude?: number | null; longitude?: number | null } | null;
};

export default function SeekersNearYou({ userId, profile }: Props) {
  const [nearby, setNearby] = useState<NearbyProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let active = true;
    async function fetchNearby() {
      setLoading(true);
      try {
        const response = await fetch('/api/mandali/nearby');
        const payload = response.ok ? await response.json() as { seekers: NearbyProfile[] } : { seekers: [] };
        if (active) setNearby(payload.seekers);
      } finally {
        if (active) setLoading(false);
      }
    }
    if (profile?.latitude != null || profile?.city) void fetchNearby();
    return () => { active = false; };
  }, [profile?.latitude, profile?.longitude, profile?.city, userId]);

  if (profile?.latitude == null && !profile?.city) return null;

  return (
    <div className="glass-panel rounded-2xl border border-white/10 p-4 mt-6" style={{ background: 'var(--brand-primary-soft)' }}>
      <h3 className="font-display font-bold text-lg mb-3" style={{ color: 'var(--text-cream)' }}>Seekers Near You</h3>
      {loading ? (
        <p className="text-sm theme-dim">Looking for nearby seekers…</p>
      ) : nearby.length === 0 ? (
        <p className="text-sm" style={{ color: 'var(--brand-muted)' }}>
          No seekers found nearby yet. They will appear here as your local Sangam grows.
        </p>
      ) : (
        <div className="flex flex-wrap gap-3">
          {nearby.map((seeker) => (
            <div key={seeker.id} className="flex items-center gap-2">
              <div className="relative w-8 h-8 rounded-full overflow-hidden bg-gradient-to-r from-brand-primary to-brand-accent text-xs font-bold flex items-center justify-center" style={{ color: 'var(--divine-text)' }}>
                {seeker.avatar_url ? (
                  <Image src={seeker.avatar_url} alt="" fill sizes="32px" className="object-cover" />
                ) : getInitials(seeker.username)}
              </div>
              <div>
                <span className="text-sm block" style={{ color: 'var(--brand-ink)' }}>{seeker.username}</span>
                <span className="text-[10px]" style={{ color: 'var(--brand-muted)' }}>{seeker.distanceLabel}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

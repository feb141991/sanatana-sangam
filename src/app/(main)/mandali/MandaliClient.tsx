'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Calendar, MessageSquare, Plus, MapPin, Globe, Heart, HelpCircle, Megaphone, Search, X, UserPlus, ChevronDown, CornerDownRight } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import ContentSafetyMenu from '@/components/safety/ContentSafetyMenu';
import { formatRelativeTime, getInitials, ISHTA_DEVATAS } from '@/lib/utils';
import { useLocation } from '@/lib/LocationContext';
import type { Profile, PostWithAuthor, PostCommentWithAuthor, EventRsvp } from '@/types/database';
import { AsyncStateCard, EmptyState } from '@/components/ui';
import { useMandaliMutations, useMandaliQuery } from '@/hooks/useMandali';

type MemberRow = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'ishta_devata' | 'spiritual_level' | 'city' | 'seva_score'>;

type Props = {
  profile:      (Profile & { mandalis?: { name: string; city: string; country: string; member_count: number } | null }) | null;
  posts:        PostWithAuthor[];
  comments:     PostCommentWithAuthor[];
  rsvps:        EventRsvp[];
  members:      MemberRow[];
  userId:       string;
  /** Posts from other Mandalis shown when local Mandali has < 5 members */
  blendedPosts?: PostWithAuthor[];
};

type RsvpStatus = 'going' | 'interested' | 'not_going';

const POST_TYPES = [
  { value: 'update',       label: 'Update',       icon: '💬' },
  { value: 'event',        label: 'Event',        icon: '🎉' },
  { value: 'question',     label: 'Question',     icon: '🙋' },
  { value: 'announcement', label: 'Announcement', icon: '📢' },
];

const typeIcon: Record<string, React.ReactNode> = {
  update:       <Heart size={13} className="theme-muted" />,
  event:        <Calendar size={13} className="theme-muted" />,
  question:     <HelpCircle size={13} className="theme-muted" />,
  announcement: <Megaphone size={13} className="theme-muted" />,
};

// ─── Find Sanatani Search Modal ──────────────────────────────────
type SearchResult = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'tradition' | 'city' | 'country' | 'sampradaya' | 'spiritual_level'>;

function FindSanataniModal({ userId, onClose }: { userId: string; onClose: () => void }) {
  const supabase = createClient();
  const [query,   setQuery]   = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  async function doSearch() {
    if (!query.trim()) return;
    setLoading(true);
    setSearched(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name, username, avatar_url, tradition, city, country, sampradaya, spiritual_level')
      .or(`full_name.ilike.%${query.trim()}%,username.ilike.%${query.trim()}%`)
      .neq('id', userId)
      .limit(20);
    setResults((data as SearchResult[]) ?? []);
    setLoading(false);
  }

  const TRADITION_EMOJI: Record<string, string> = {
    hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲', other: '✨',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="w-full surface-sheet rounded-t-3xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-white/8">
          <div>
            <h2 className="font-display font-bold theme-ink">Find Sanatani</h2>
            <p className="text-xs theme-dim mt-0.5">Search by name or username</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-white/[0.06] flex items-center justify-center">
            <X size={16} className="theme-dim" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-white/8">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 theme-dim" />
              <input type="text" placeholder="Search name or @username…"
                value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="surface-input pl-9 pr-4 py-2.5 outline-none text-sm" />
            </div>
            <button onClick={doSearch} disabled={loading || !query.trim()}
              className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          {loading && (
            <div className="text-center py-8 theme-dim text-sm">Searching…</div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-8 theme-dim">
              <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No one found — try a different name</p>
            </div>
          )}
          {!loading && !searched && (
            <div className="text-center py-8 theme-dim text-sm">
              Type a name above to find fellow Sanatani 🙏
            </div>
          )}
          {results.map(user => (
            <div key={user.id}
              className="surface-soft-card rounded-2xl p-3 flex items-center gap-3">
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
                style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
                {user.avatar_url
                  ? <Image src={user.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                  : getInitials(user.full_name || user.username || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm theme-ink truncate">
                  {user.full_name || user.username}
                  {user.tradition && (
                    <span className="ml-1.5 text-xs">{TRADITION_EMOJI[user.tradition] ?? '🙏'}</span>
                  )}
                </p>
                <p className="text-xs theme-dim truncate">
                  {user.username && `@${user.username}`}
                  {user.city && ` · ${user.city}`}
                  {user.spiritual_level && ` · ${user.spiritual_level}`}
                </p>
              </div>
              <button
                onClick={() => { toast('Wider Sangam connections open after launch polish.', { icon: '🙏' }); }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition"
                style={{ border: '1px solid rgba(212, 166, 70, 0.18)', color: 'var(--text-cream)', background: 'rgba(40, 40, 37, 0.92)' }}>
                Connect
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── City data ───────────────────────────────────────────────────
const CITIES: Array<{ city: string; country: string; region: string; flag: string }> = [
  // ── India ──
  { city: 'Mumbai',            country: 'India', region: 'Maharashtra',    flag: '🇮🇳' },
  { city: 'Delhi',             country: 'India', region: 'Delhi',          flag: '🇮🇳' },
  { city: 'Bengaluru',         country: 'India', region: 'Karnataka',      flag: '🇮🇳' },
  { city: 'Hyderabad',         country: 'India', region: 'Telangana',      flag: '🇮🇳' },
  { city: 'Ahmedabad',         country: 'India', region: 'Gujarat',        flag: '🇮🇳' },
  { city: 'Chennai',           country: 'India', region: 'Tamil Nadu',     flag: '🇮🇳' },
  { city: 'Kolkata',           country: 'India', region: 'West Bengal',    flag: '🇮🇳' },
  { city: 'Surat',             country: 'India', region: 'Gujarat',        flag: '🇮🇳' },
  { city: 'Pune',              country: 'India', region: 'Maharashtra',    flag: '🇮🇳' },
  { city: 'Jaipur',            country: 'India', region: 'Rajasthan',      flag: '🇮🇳' },
  { city: 'Lucknow',           country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Kanpur',            country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Nagpur',            country: 'India', region: 'Maharashtra',    flag: '🇮🇳' },
  { city: 'Indore',            country: 'India', region: 'Madhya Pradesh', flag: '🇮🇳' },
  { city: 'Patna',             country: 'India', region: 'Bihar',          flag: '🇮🇳' },
  { city: 'Bhopal',            country: 'India', region: 'Madhya Pradesh', flag: '🇮🇳' },
  { city: 'Varanasi',          country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Agra',              country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Mathura',           country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Vrindavan',         country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Allahabad',         country: 'India', region: 'Uttar Pradesh',  flag: '🇮🇳' },
  { city: 'Haridwar',          country: 'India', region: 'Uttarakhand',    flag: '🇮🇳' },
  { city: 'Rishikesh',         country: 'India', region: 'Uttarakhand',    flag: '🇮🇳' },
  { city: 'Amritsar',          country: 'India', region: 'Punjab',         flag: '🇮🇳' },
  { city: 'Chandigarh',        country: 'India', region: 'Punjab',         flag: '🇮🇳' },
  { city: 'Kochi',             country: 'India', region: 'Kerala',         flag: '🇮🇳' },
  { city: 'Thiruvananthapuram',country: 'India', region: 'Kerala',         flag: '🇮🇳' },
  { city: 'Coimbatore',        country: 'India', region: 'Tamil Nadu',     flag: '🇮🇳' },
  { city: 'Visakhapatnam',     country: 'India', region: 'Andhra Pradesh', flag: '🇮🇳' },
  { city: 'Tirupati',          country: 'India', region: 'Andhra Pradesh', flag: '🇮🇳' },
  { city: 'Navi Mumbai',       country: 'India', region: 'Maharashtra',    flag: '🇮🇳' },
  { city: 'Thane',             country: 'India', region: 'Maharashtra',    flag: '🇮🇳' },
  // ── United Kingdom ──
  { city: 'London',            country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Birmingham',        country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Leicester',         country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Manchester',        country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Leeds',             country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Bradford',          country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Coventry',          country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Wolverhampton',     country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Luton',             country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Bristol',           country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Nottingham',        country: 'United Kingdom', region: 'England',  flag: '🇬🇧' },
  { city: 'Glasgow',           country: 'United Kingdom', region: 'Scotland', flag: '🇬🇧' },
  { city: 'Edinburgh',         country: 'United Kingdom', region: 'Scotland', flag: '🇬🇧' },
  // ── United States ──
  { city: 'New York',          country: 'United States', region: 'New York',       flag: '🇺🇸' },
  { city: 'Los Angeles',       country: 'United States', region: 'California',     flag: '🇺🇸' },
  { city: 'Chicago',           country: 'United States', region: 'Illinois',       flag: '🇺🇸' },
  { city: 'Houston',           country: 'United States', region: 'Texas',          flag: '🇺🇸' },
  { city: 'San Francisco',     country: 'United States', region: 'California',     flag: '🇺🇸' },
  { city: 'San Jose',          country: 'United States', region: 'California',     flag: '🇺🇸' },
  { city: 'Seattle',           country: 'United States', region: 'Washington',     flag: '🇺🇸' },
  { city: 'Dallas',            country: 'United States', region: 'Texas',          flag: '🇺🇸' },
  { city: 'Atlanta',           country: 'United States', region: 'Georgia',        flag: '🇺🇸' },
  { city: 'Boston',            country: 'United States', region: 'Massachusetts',  flag: '🇺🇸' },
  { city: 'Washington DC',     country: 'United States', region: 'DC',             flag: '🇺🇸' },
  { city: 'Austin',            country: 'United States', region: 'Texas',          flag: '🇺🇸' },
  { city: 'Philadelphia',      country: 'United States', region: 'Pennsylvania',   flag: '🇺🇸' },
  { city: 'Phoenix',           country: 'United States', region: 'Arizona',        flag: '🇺🇸' },
  { city: 'Edison',            country: 'United States', region: 'New Jersey',     flag: '🇺🇸' },
  { city: 'Fremont',           country: 'United States', region: 'California',     flag: '🇺🇸' },
  // ── Canada ──
  { city: 'Toronto',           country: 'Canada', region: 'Ontario',          flag: '🇨🇦' },
  { city: 'Mississauga',       country: 'Canada', region: 'Ontario',          flag: '🇨🇦' },
  { city: 'Brampton',          country: 'Canada', region: 'Ontario',          flag: '🇨🇦' },
  { city: 'Vancouver',         country: 'Canada', region: 'British Columbia', flag: '🇨🇦' },
  { city: 'Surrey',            country: 'Canada', region: 'British Columbia', flag: '🇨🇦' },
  { city: 'Calgary',           country: 'Canada', region: 'Alberta',          flag: '🇨🇦' },
  { city: 'Edmonton',          country: 'Canada', region: 'Alberta',          flag: '🇨🇦' },
  { city: 'Montreal',          country: 'Canada', region: 'Quebec',           flag: '🇨🇦' },
  { city: 'Ottawa',            country: 'Canada', region: 'Ontario',          flag: '🇨🇦' },
  // ── Australia ──
  { city: 'Sydney',            country: 'Australia', region: 'New South Wales',      flag: '🇦🇺' },
  { city: 'Melbourne',         country: 'Australia', region: 'Victoria',             flag: '🇦🇺' },
  { city: 'Brisbane',          country: 'Australia', region: 'Queensland',           flag: '🇦🇺' },
  { city: 'Perth',             country: 'Australia', region: 'Western Australia',    flag: '🇦🇺' },
  { city: 'Adelaide',          country: 'Australia', region: 'South Australia',      flag: '🇦🇺' },
  // ── UAE ──
  { city: 'Dubai',             country: 'UAE', region: 'Dubai',    flag: '🇦🇪' },
  { city: 'Abu Dhabi',         country: 'UAE', region: 'Abu Dhabi',flag: '🇦🇪' },
  { city: 'Sharjah',           country: 'UAE', region: 'Sharjah',  flag: '🇦🇪' },
  // ── Other ──
  { city: 'Singapore',         country: 'Singapore',           region: '',             flag: '🇸🇬' },
  { city: 'Auckland',          country: 'New Zealand',         region: 'Auckland',     flag: '🇳🇿' },
  { city: 'Johannesburg',      country: 'South Africa',        region: 'Gauteng',      flag: '🇿🇦' },
  { city: 'Durban',            country: 'South Africa',        region: 'KwaZulu-Natal',flag: '🇿🇦' },
  { city: 'Kuala Lumpur',      country: 'Malaysia',            region: 'Kuala Lumpur', flag: '🇲🇾' },
  { city: 'Port Louis',        country: 'Mauritius',           region: '',             flag: '🇲🇺' },
  { city: 'Port of Spain',     country: 'Trinidad & Tobago',   region: '',             flag: '🇹🇹' },
  { city: 'Amsterdam',         country: 'Netherlands',         region: 'North Holland', flag: '🇳🇱' },
  { city: 'Frankfurt',         country: 'Germany',             region: 'Hesse',        flag: '🇩🇪' },
  { city: 'Zurich',            country: 'Switzerland',         region: '',             flag: '🇨🇭' },
];

// ─── City Picker ─────────────────────────────────────────────────
function CityPicker({ value, onChange }: {
  value: { city: string; country: string } | null;
  onChange: (v: { city: string; country: string }) => void;
}) {
  const [query,     setQuery]     = useState(value ? `${value.city}, ${value.country}` : '');
  const [open,      setOpen]      = useState(false);
  const [filtered,  setFiltered]  = useState(CITIES.slice(0, 20));
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query.toLowerCase().trim();
    if (!q) { setFiltered(CITIES.slice(0, 20)); return; }
    setFiltered(
      CITIES.filter(c =>
        c.city.toLowerCase().includes(q) ||
        c.country.toLowerCase().includes(q) ||
        c.region.toLowerCase().includes(q)
      ).slice(0, 15)
    );
  }, [query]);

  // Close on outside click
  useEffect(() => {
    function handle(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handle);
    return () => document.removeEventListener('mousedown', handle);
  }, []);

  function select(c: typeof CITIES[0]) {
    onChange({ city: c.city, country: c.country });
    setQuery(`${c.city}, ${c.country}`);
    setOpen(false);
  }

  return (
    <div ref={ref} className="relative">
      <div className="relative">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          placeholder="Search your city (e.g. Manchester, London…)"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 outline-none text-sm"
          style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }}
        />
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={`${c.city}-${c.country}`}
              onMouseDown={() => select(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--brand-primary-soft)]"
            >
              <span className="text-base flex-shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900">{c.city}</p>
                <p className="text-xs text-gray-400 truncate">{c.region ? `${c.region}, ` : ''}{c.country}</p>
              </div>
            </button>
          ))}
          {/* Custom city option */}
          {query.trim() && !CITIES.some(c => c.city.toLowerCase() === query.toLowerCase().split(',')[0].trim()) && (
            <button
              onMouseDown={() => {
                const parts = query.split(',');
                onChange({ city: parts[0].trim(), country: parts[1]?.trim() || '' });
                setOpen(false);
              }}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-t border-gray-100 transition hover:bg-[var(--brand-primary-soft)]"
            >
              <span className="text-base">🌍</span>
              <div>
                <p className="text-sm font-medium" style={{ color: 'var(--brand-primary-strong)' }}>Use &ldquo;{query}&rdquo;</p>
                <p className="text-xs text-gray-400">Custom city</p>
              </div>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── No-Mandali Prompt ────────────────────────────────────────────
function NoMandaliPrompt({ userId }: { userId: string }) {
  const { city: liveCity, country: liveCountry } = useLocation();
  const mandaliMutations = useMandaliMutations(userId);

  const [locating,  setLocating]  = useState(false);
  const [detected,  setDetected]  = useState<{ city: string; country: string } | null>(null);
  const [geoError,  setGeoError]  = useState('');

  // If LocationContext already has a city (from saved profile GPS), pre-fill it
  useEffect(() => {
    if (liveCity && !detected) {
      setDetected({ city: liveCity, country: liveCountry ?? '' });
    }
  }, [detected, liveCity, liveCountry]);

  function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.'); return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res  = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json`
          );
          const data = await res.json();
          const city    = data.address?.city || data.address?.town || data.address?.village || '';
          const country = data.address?.country ?? '';
          if (city) {
            setDetected({ city, country });
          } else {
            setGeoError('Could not detect your city. Please try again.');
          }
        } catch {
          setGeoError('Location lookup failed. Please try again.');
        } finally {
          setLocating(false);
        }
      },
      () => {
        setGeoError('Location permission denied. Please allow location access and try again.');
        setLocating(false);
      },
      { timeout: 10000 }
    );
  }

  async function joinMandali() {
    if (!detected?.city || !detected?.country) {
      toast.error('Please detect your location first');
      return;
    }
    try {
      await mandaliMutations.joinMandali.mutateAsync({
        city: detected.city,
        country: detected.country,
      });
      toast.success('Mandali found! Welcome 🙏');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not join your Mandali right now.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 fade-in">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: 'var(--brand-primary-soft)' }}>🏡</div>
      <div>
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Find Your Mandali</h2>
        <p className="text-gray-500 max-w-sm text-sm">
          We&rsquo;ll place you in your city&rsquo;s Sanatani Mandali — Wembley, Brampton, Andheri, or wherever you are. We&rsquo;ll create one if it doesn&rsquo;t exist yet.
        </p>
      </div>

      <div className="glass-panel rounded-2xl border border-white/70 shadow-card p-5 w-full max-w-sm space-y-3">

        {/* Detected city display */}
        {detected ? (
          <div className="flex items-center gap-2 px-3 py-3 rounded-xl border" style={{ background: 'var(--brand-primary-soft)', borderColor: 'rgba(200, 127, 146, 0.18)' }}>
            <MapPin size={14} className="flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary-strong)' }}>{detected.city}</p>
              {detected.country && <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>{detected.country}</p>}
            </div>
            <button onClick={() => setDetected(null)}
              className="text-xs text-gray-400 hover:text-gray-600">
              <X size={14} />
            </button>
          </div>
        ) : (
          <button
            onClick={detectLocation}
            disabled={locating}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed font-medium text-sm transition disabled:opacity-60 hover:bg-[var(--brand-primary-soft)]"
            style={{ borderColor: 'rgba(200, 127, 146, 0.3)', color: 'var(--brand-primary-strong)' }}
          >
            {locating ? (
              <>
                <span className="w-4 h-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--brand-primary-strong)', borderTopColor: 'transparent' }} />
                Detecting location…
              </>
            ) : (
              <>
                <MapPin size={16} />
                Detect My Location
              </>
            )}
          </button>
        )}

        {geoError && <p className="text-xs text-red-500 text-center">{geoError}</p>}

        <button onClick={joinMandali} disabled={mandaliMutations.joinMandali.isPending || !detected}
          className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          {mandaliMutations.joinMandali.isPending ? 'Finding your Mandali…' : 'Join My Mandali 🙏'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Globe size={12} />
        <span>City-level groups only — your exact location is never shared</span>
      </div>
    </div>
  );
}

// ─── Members Tab ────────────────────────────────────────────────
function MembersTab({ members, userId }: { members: MemberRow[]; userId: string }) {
  if (members.length === 0) {
    return (
      <EmptyState
        icon="👥"
        title="No members yet"
        description="Your local Mandali has not surfaced any members here yet."
      />
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m, idx) => {
        const devata = ISHTA_DEVATAS.find((d) => d.value === m.ishta_devata);
        const isMe = m.id === userId;
        return (
          <div key={m.id}
            className="bg-white rounded-2xl border p-3 flex items-center gap-3"
            style={{ borderColor: isMe ? 'rgba(200, 127, 146, 0.32)' : '#f1f0f2' }}>
            {/* Rank */}
            <div className="w-5 text-center text-xs font-bold text-gray-300">
              {idx + 1}
            </div>
            {/* Avatar */}
            <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0 overflow-hidden"
              style={{ background: isMe ? 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' : 'linear-gradient(135deg, var(--brand-primary), var(--brand-accent))' }}>
              {m.avatar_url
                ? <Image src={m.avatar_url} alt="" fill sizes="40px" className="object-cover" />
                : getInitials(m.full_name || m.username || '?')
              }
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {m.full_name || m.username}
                  {isMe && <span className="ml-1 text-[10px] font-medium" style={{ color: 'var(--brand-primary-strong)' }}>(you)</span>}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {devata?.emoji} {devata?.label ?? 'Sanatani'} · {m.spiritual_level ?? 'Seeker'}
              </p>
            </div>
            {/* Seva Score */}
            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: 'var(--brand-primary-strong)' }}>{m.seva_score ?? 0}</div>
              <div className="text-[10px] text-gray-400">seva</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Events Tab ─────────────────────────────────────────────────
function EventRsvpBar({
  postId,
  rsvps,
  userId,
  onRsvp,
}: {
  postId: string;
  rsvps: EventRsvp[];
  userId: string;
  onRsvp: (postId: string, status: RsvpStatus) => void;
}) {
  const counts = {
    going: rsvps.filter((item) => item.status === 'going').length,
    interested: rsvps.filter((item) => item.status === 'interested').length,
    not_going: rsvps.filter((item) => item.status === 'not_going').length,
  };
  const myStatus = rsvps.find((item) => item.user_id === userId)?.status ?? null;

  return (
    <div className="mt-3 space-y-2">
      <div className="flex flex-wrap gap-2">
        {[
          { value: 'going', label: 'Going', count: counts.going },
          { value: 'interested', label: 'Interested', count: counts.interested },
          { value: 'not_going', label: 'Can’t make it', count: counts.not_going },
        ].map((item) => (
          <button
            key={item.value}
            onClick={() => onRsvp(postId, item.value as RsvpStatus)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition ${
              myStatus === item.value
                ? 'text-white'
                : 'border border-[rgba(200,127,146,0.25)] bg-white text-gray-600'
            }`}
            style={myStatus === item.value ? { background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' } : undefined}
          >
            {item.label}
            {item.count > 0 ? ` · ${item.count}` : ''}
          </button>
        ))}
      </div>
    </div>
  );
}

function EventsTab({ posts, rsvps, userId, onRsvp }: { posts: PostWithAuthor[]; rsvps: EventRsvp[]; userId: string; onRsvp: (postId: string, status: RsvpStatus) => void; }) {
  const events = posts.filter((p) => p.type === 'event');
  if (events.length === 0) {
    return (
      <EmptyState
        icon="📅"
        title="No upcoming events"
        description="Create the first Mandali event to gather people around a real local moment."
      />
    );
  }

  return (
    <div className="space-y-3">
      {events.map((post) => (
        <div key={post.id} className="bg-white rounded-2xl border border-blue-100 p-4">
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-xl flex-shrink-0">🎉</div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900 leading-snug">{post.content}</p>
              {post.event_date && (
                <p className="text-xs text-blue-600 mt-1 font-medium">
                  📅 {new Date(post.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                </p>
              )}
              {post.event_location && (
                <p className="text-xs text-gray-500 mt-0.5">📍 {post.event_location}</p>
              )}
              <p className="text-xs text-gray-400 mt-1">
                {post.profiles?.full_name ?? post.profiles?.username} · {formatRelativeTime(post.created_at)}
              </p>
              <EventRsvpBar
                postId={post.id}
                rsvps={rsvps.filter((item) => item.post_id === post.id)}
                userId={userId}
                onRsvp={onRsvp}
              />
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vichaar Tab (Posts Feed) ────────────────────────────────────
function VichaarTab({ posts, userId, comments, onAddComment, onToggleUpvote, upvoted, onCompose, showCompose, setShowCompose, onHideContent, onHideAuthor, allowCompose = true }: {
  posts: PostWithAuthor[];
  userId: string;
  comments: PostCommentWithAuthor[];
  onAddComment: (postId: string, body: string, parentId?: string | null) => Promise<void>;
  onToggleUpvote: (id: string) => void;
  upvoted: Set<string>;
  onCompose: (payload: {
    postType: 'update' | 'event' | 'question' | 'announcement';
    content: string;
    eventDate: string;
    eventLoc: string;
  }) => Promise<boolean>;
  showCompose: boolean;
  setShowCompose: (v: boolean) => void;
  onHideContent: (contentId: string) => void;
  onHideAuthor: (authorId: string) => void;
  allowCompose?: boolean;
}) {
  const [postType,   setPostType]   = useState<'update' | 'event' | 'question' | 'announcement'>('update');
  const [content,    setContent]    = useState('');
  const [eventDate,  setEventDate]  = useState('');
  const [eventLoc,   setEventLoc]   = useState('');
  const [submitting, setSubmitting] = useState(false);

  const nonEvents = posts.filter((p) => p.type !== 'event');

  async function handleComposePost() {
    setSubmitting(true);
    const didPost = await onCompose({
      postType,
      content,
      eventDate,
      eventLoc,
    });
    setSubmitting(false);

    if (didPost) {
      setContent('');
      setEventDate('');
      setEventLoc('');
      setPostType('update');
      setShowCompose(false);
    }
  }

  return (
    <div className="space-y-3">
      {allowCompose && (
        <button
          onClick={() => setShowCompose(!showCompose)}
          className="w-full bg-white border border-dashed rounded-2xl p-3 flex items-center gap-3 text-gray-400 transition"
          style={{ borderColor: 'rgba(200, 127, 146, 0.3)' }}
        >
          <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'var(--brand-primary-soft)' }}>
            <Plus size={15} style={{ color: 'var(--brand-primary-strong)' }} />
          </div>
          <span className="text-sm">Share with your Mandali…</span>
        </button>
      )}

      {allowCompose && showCompose && (
        <ComposePanel
          postType={postType} setPostType={setPostType}
          content={content} setContent={setContent}
          eventDate={eventDate} setEventDate={setEventDate}
          eventLoc={eventLoc} setEventLoc={setEventLoc}
          submitting={submitting}
          onClose={() => setShowCompose(false)}
          onPost={handleComposePost}
        />
      )}

      {nonEvents.length === 0 && !showCompose && (
        <EmptyState
          icon="💬"
          title="No posts yet"
          description="Start the first conversation in this Mandali and give people a reason to respond."
        />
      )}

      {nonEvents.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          userId={userId}
          comments={comments.filter((comment) => comment.post_id === post.id)}
          onAddComment={onAddComment}
          upvoted={upvoted}
          onUpvote={onToggleUpvote}
          onHideContent={onHideContent}
          onHideAuthor={onHideAuthor}
        />
      ))}
    </div>
  );
}

function ComposePanel({ postType, setPostType, content, setContent, eventDate, setEventDate, eventLoc, setEventLoc, submitting, onClose, onPost }: any) {
  return (
    <div className="glass-panel rounded-2xl border border-white/70 p-4 shadow-card space-y-3 fade-in">
      <div className="flex gap-2 flex-wrap">
        {POST_TYPES.map((t) => (
          <button key={t.value} onClick={() => setPostType(t.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              postType === t.value
                ? ''
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}
            style={postType === t.value ? { background: 'var(--brand-primary-soft)', color: 'var(--brand-primary-strong)', border: '1px solid rgba(200, 127, 146, 0.3)' } : undefined}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <textarea placeholder={postType === 'event' ? 'Describe your event…' : 'Share with your Mandali…'}
        value={content} onChange={(e) => setContent(e.target.value)} rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 outline-none resize-none text-sm"
        style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }} />
      {postType === 'event' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm"
            style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }} />
          <input type="text" placeholder="Location" value={eventLoc} onChange={(e) => setEventLoc(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm"
            style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
        <button onClick={onPost} disabled={submitting || !content.trim()}
          className="px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          {submitting ? 'Posting…' : 'Post 🙏'}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, userId, comments, onAddComment, upvoted, onUpvote, onHideContent, onHideAuthor }: {
  post: PostWithAuthor;
  userId: string;
  comments: PostCommentWithAuthor[];
  onAddComment: (postId: string, body: string, parentId?: string | null) => Promise<void>;
  upvoted: Set<string>;
  onUpvote: (id: string) => void;
  onHideContent: (contentId: string) => void;
  onHideAuthor: (authorId: string) => void;
}) {
  const author = post.profiles;
  const isUpvoted = upvoted.has(post.id);
  const [showComments, setShowComments] = useState(false);
  const [commentBody, setCommentBody] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyBody, setReplyBody] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const rootComments = comments.filter((comment) => !comment.parent_id);
  const replyMap = comments.reduce<Record<string, PostCommentWithAuthor[]>>((acc, comment) => {
    if (comment.parent_id) {
      acc[comment.parent_id] = [...(acc[comment.parent_id] ?? []), comment];
    }
    return acc;
  }, {});

  async function submitComment(body: string, parentId?: string | null) {
    if (!body.trim()) return;
    setSubmitting(true);
    await onAddComment(post.id, body, parentId ?? null);
    setSubmitting(false);
    setCommentBody('');
    setReplyBody('');
    setReplyTo(null);
    setShowComments(true);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0" style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          {getInitials((author?.full_name || author?.username) ?? '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {author?.full_name ?? author?.username}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</span>
            <div className="ml-auto flex items-center gap-1">
              <span>{typeIcon[post.type]}</span>
              <ContentSafetyMenu
                userId={userId}
                authorId={post.author_id}
                contentId={post.id}
                contentType="mandali_post"
                onHideContent={onHideContent}
                onHideAuthor={onHideAuthor}
              />
            </div>
          </div>
          <p className="text-sm text-gray-700 leading-relaxed">{post.content}</p>
          {post.event_date && (
            <div className="mt-2 px-3 py-2 bg-blue-50 rounded-xl text-xs text-blue-700">
              📅 {new Date(post.event_date).toLocaleDateString('en-IN', { weekday: 'short', day: 'numeric', month: 'short' })}
              {post.event_location && ` · 📍 ${post.event_location}`}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2">
            <button onClick={() => onUpvote(post.id)}
              className={`flex items-center gap-1 text-xs transition ${isUpvoted ? 'text-rose-500' : 'text-gray-400 hover:text-rose-400'}`}>
              <Heart size={13} fill={isUpvoted ? 'currentColor' : 'none'} />
              {post.upvotes > 0 && <span>{post.upvotes}</span>}
            </button>
            <button
              onClick={() => setShowComments((current) => !current)}
              className="flex items-center gap-1 text-xs text-gray-400 hover:text-gray-600 transition"
            >
              <MessageSquare size={13} />
              <span>{post.comment_count > 0 ? post.comment_count : 'Comment'}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-3 rounded-2xl bg-[var(--brand-primary-soft)]/60 px-3 py-3">
              <div className="space-y-2">
                {rootComments.length === 0 ? (
                  <p className="text-xs text-gray-500">No comments yet.</p>
                ) : (
                  rootComments.map((comment) => (
                    <div key={comment.id} className="space-y-2 rounded-2xl bg-white/80 px-3 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                          {comment.profiles?.avatar_url ? (
                            <Image src={comment.profiles.avatar_url} alt="" width={28} height={28} className="h-7 w-7 object-cover" />
                          ) : (
                            getInitials(comment.profiles?.full_name || comment.profiles?.username || '?')
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-gray-400">
                            <span className="font-medium text-gray-800">{comment.profiles?.full_name ?? comment.profiles?.username}</span>
                            <span>{formatRelativeTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-gray-700 mt-1 leading-relaxed">{comment.body}</p>
                          <button
                            onClick={() => {
                              setReplyTo((current) => current === comment.id ? null : comment.id);
                              setReplyBody('');
                            }}
                            className="mt-2 inline-flex items-center gap-1 text-[11px] font-medium text-[color:var(--brand-primary-strong)]"
                          >
                            <CornerDownRight size={11} />
                            Reply
                          </button>
                        </div>
                      </div>

                      {(replyMap[comment.id] ?? []).length > 0 && (
                        <div className="space-y-2 pl-9">
                          {(replyMap[comment.id] ?? []).map((reply) => (
                            <div key={reply.id} className="rounded-xl bg-[var(--brand-primary-soft)]/55 px-3 py-2.5">
                              <div className="flex items-center gap-2 text-[11px] text-gray-400">
                                <span className="font-medium text-gray-800">{reply.profiles?.full_name ?? reply.profiles?.username}</span>
                                <span>{formatRelativeTime(reply.created_at)}</span>
                              </div>
                              <p className="text-sm text-gray-700 mt-1 leading-relaxed">{reply.body}</p>
                            </div>
                          ))}
                        </div>
                      )}

                      {replyTo === comment.id && (
                        <div className="pl-9 space-y-2">
                          <textarea
                            value={replyBody}
                            onChange={(event) => setReplyBody(event.target.value)}
                            rows={2}
                            placeholder="Reply gently…"
                            className="w-full rounded-xl border border-[rgba(200,127,146,0.2)] bg-white px-3 py-2 text-sm outline-none"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setReplyTo(null)} className="text-xs text-gray-500">Cancel</button>
                            <button
                              onClick={() => submitComment(replyBody, comment.id)}
                              disabled={submitting || !replyBody.trim()}
                              className="rounded-full px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50"
                              style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}
                            >
                              Reply
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>

              <div className="space-y-2">
                <textarea
                  value={commentBody}
                  onChange={(event) => setCommentBody(event.target.value)}
                  rows={2}
                  placeholder="Add a comment…"
                  className="w-full rounded-xl border border-[rgba(200,127,146,0.2)] bg-white px-3 py-2 text-sm outline-none"
                />
                <div className="flex justify-end">
                  <button
                    onClick={() => submitComment(commentBody)}
                    disabled={submitting || !commentBody.trim()}
                    className="rounded-full px-4 py-2 text-xs font-semibold text-white disabled:opacity-50"
                    style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}
                  >
                    Comment
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function MandaliClient({ profile, posts: initialPosts, comments: initialComments, rsvps: initialRsvps, members, userId, blendedPosts = [] }: Props) {
  const mandaliQuery = useMandaliQuery(userId, {
    profile,
    posts: initialPosts,
    comments: initialComments,
    rsvps: initialRsvps,
    members,
    blendedPosts,
  });
  const mandaliMutations = useMandaliMutations(userId);
  const data = mandaliQuery.data ?? {
    profile,
    posts: initialPosts,
    comments: initialComments,
    rsvps: initialRsvps,
    members,
    blendedPosts,
  };
  const initialEventCount = initialPosts.filter((post) => post.type === 'event').length;
  const initialVichaarCount = initialPosts.filter((post) => post.type !== 'event').length;

  const [activeTab,       setActiveTab]       = useState<'members' | 'events' | 'vichaar'>(
    initialVichaarCount > 0 ? 'vichaar' : initialEventCount > 0 ? 'events' : 'members'
  );
  const [showSearch,      setShowSearch]      = useState(false);
  const [showCompose,     setShowCompose]     = useState(false);
  const [showMandaliMenu, setShowMandaliMenu] = useState(false);
  const [upvoted,     setUpvoted]     = useState<Set<string>>(new Set());
  const [hiddenContentIds, setHiddenContentIds] = useState<Set<string>>(new Set());
  const [hiddenAuthorIds, setHiddenAuthorIds] = useState<Set<string>>(new Set());

  if (mandaliQuery.isPending && !mandaliQuery.data) {
    return (
      <AsyncStateCard
        state="loading"
        title="Loading your Mandali"
        description="Pulling your local Sangam, posts, members, and events into one place."
      />
    );
  }

  if (mandaliQuery.isError && !mandaliQuery.data) {
    return (
      <AsyncStateCard
        state="error"
        title="Mandali could not load"
        description="The local Sangam feed did not come through. Try refreshing in a moment."
      />
    );
  }

  const liveProfile = data.profile;
  const posts = data.posts.filter((post) => !hiddenContentIds.has(post.id) && !hiddenAuthorIds.has(post.author_id));
  const widerPosts = data.blendedPosts.filter((post) => !hiddenContentIds.has(post.id) && !hiddenAuthorIds.has(post.author_id));
  const comments = data.comments.filter((comment) => !hiddenContentIds.has(comment.post_id) && !hiddenAuthorIds.has(comment.author_id));
  const rsvps = data.rsvps.filter((item) => !hiddenContentIds.has(item.post_id) && !hiddenAuthorIds.has(item.user_id));
  const visibleMembers = data.members.filter((member) => !hiddenAuthorIds.has(member.id));

  if (!liveProfile?.city || !liveProfile?.mandali_id) {
    return <NoMandaliPrompt userId={userId} />;
  }

  const mandali    = liveProfile?.mandalis;
  const eventCount = posts.filter((p) => p.type === 'event').length;
  const vichaarCount = posts.filter((p) => p.type !== 'event').length;
  const neighbourhoodLabel = (liveProfile as any)?.neighbourhood
    ? `${(liveProfile as any).neighbourhood} Mandali`
    : mandali?.name ?? 'Your Mandali';
  const placeLabel = (liveProfile as any)?.neighbourhood
    ? `${(liveProfile as any).neighbourhood}, ${mandali?.city ?? liveProfile?.city ?? ''}`
    : mandali
      ? `${mandali.city}, ${mandali.country}`
      : liveProfile?.city ?? '';
  const primaryMandaliAction =
    eventCount > 0
      ? {
          label: 'See upcoming events',
          hint: `${eventCount} local event${eventCount === 1 ? '' : 's'} waiting`,
          onClick: () => setActiveTab('events' as const),
          icon: <Calendar size={16} className="text-gray-500" />,
        }
      : vichaarCount > 0
        ? {
            label: 'Join today’s Vichaar',
            hint: `${vichaarCount} local conversation${vichaarCount === 1 ? '' : 's'}`,
            onClick: () => setActiveTab('vichaar' as const),
            icon: <MessageSquare size={16} className="text-gray-500" />,
          }
        : {
            label: 'Meet your Mandali',
            hint: `${visibleMembers.length} member${visibleMembers.length === 1 ? '' : 's'} nearby`,
            onClick: () => setActiveTab('members' as const),
            icon: <Users size={16} className="text-gray-500" />,
          };

  function hideContentFromView(contentId: string) {
    setHiddenContentIds((current) => new Set(current).add(contentId));
  }

  function hideAuthorFromView(authorId: string) {
    setHiddenAuthorIds((current) => new Set(current).add(authorId));
  }

  async function submitPost(payload: {
    postType: 'update' | 'event' | 'question' | 'announcement';
    content: string;
    eventDate: string;
    eventLoc: string;
  }) {
    if (!payload.content.trim()) { toast.error('Write something first'); return false; }
    if (!liveProfile?.mandali_id) { toast.error('You are not in a Mandali yet'); return false; }
    try {
      await mandaliMutations.submitPost.mutateAsync({
        mandaliId: liveProfile.mandali_id,
        content: payload.content,
        postType: payload.postType,
        eventDate: payload.eventDate,
        eventLoc: payload.eventLoc,
      });
      toast.success('Posted! 🙏');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not post right now.');
      return false;
    }
    return true;
  }

  async function leaveMandali() {
    if (!confirm('Leave your current Mandali? You can re-join any time by detecting your location again.')) return;
    try {
      await mandaliMutations.leaveMandali.mutateAsync();
      toast.success('You have left the Mandali');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not leave the Mandali.');
    }
  }

  async function toggleUpvote(postId: string) {
    try {
      const isUpvoted = upvoted.has(postId);
      const nextState = await mandaliMutations.toggleUpvote.mutateAsync({ postId, isUpvoted });
      setUpvoted((current) => {
        const next = new Set(current);
        if (nextState) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch (error: any) {
      toast.error(error.message ?? 'Could not update the upvote right now.');
    }
  }

  async function addComment(postId: string, body: string, parentId?: string | null) {
    const content = body.trim();
    if (!content) {
      toast.error('Write something first');
      return;
    }

    try {
      await mandaliMutations.addComment.mutateAsync({ postId, body: content, parentId });
      toast.success(parentId ? 'Reply posted' : 'Comment posted');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not post the comment.');
    }
  }

  async function updateRsvp(postId: string, status: RsvpStatus) {
    try {
      await mandaliMutations.updateRsvp.mutateAsync({ postId, status });
      toast.success(status === 'going' ? 'You are in' : status === 'interested' ? 'Marked interested' : 'RSVP updated');
    } catch (error: any) {
      toast.error(error.message ?? 'Could not update the RSVP.');
    }
  }

  const tabs = [
    { key: 'members', label: 'Members', count: visibleMembers.length },
    { key: 'events',  label: 'Events',  count: eventCount },
    { key: 'vichaar', label: 'Vichaar', count: posts.filter(p => p.type !== 'event').length },
  ] as const;

  return (
    <div className="space-y-4 fade-in">

      {/* ── Mandali Header ── */}
      <div className="surface-soft-card decorative-orbit rounded-[1.8rem] p-5">
        <div className="flex items-start justify-between">
          <div>
            <div className="mb-1 flex items-center gap-2">
              <Users size={16} className="theme-muted" />
              <span className="type-card-heading">
                {neighbourhoodLabel}
              </span>
            </div>
            <div className="type-body flex items-center gap-1">
              <MapPin size={12} className="theme-dim" />
              <span>{placeLabel}</span>
            </div>
            <p className="type-body mt-3 hidden max-w-xl sm:block">
              Your local Sangam should feel like a warm room, not a feed. Start with the one thing that matters right now, then move deeper.
            </p>
            <p className="type-body mt-3 sm:hidden">
              Start with one local step.
            </p>
          </div>
          <div className="text-right">
            <div className="type-metric">{visibleMembers.length}</div>
            <div className="type-card-label">members</div>
          </div>
        </div>
        {/* Action row */}
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border border-white/8 bg-white/[0.04] px-3 py-2 text-xs font-medium theme-ink transition hover:bg-white/[0.06]">
            <Search size={13} /> Find Sanatani
          </button>

          {/* Mandali options menu */}
          <div className="relative">
            <button
              onClick={() => setShowMandaliMenu(m => !m)}
              className="flex h-8 w-8 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] theme-ink transition hover:bg-white/[0.06]"
              title="Mandali options"
            >
              ⋯
            </button>
            {showMandaliMenu && (
              <div className="absolute right-0 top-10 z-50 w-52 overflow-hidden rounded-2xl border border-white/8 bg-[color:var(--surface-raised)] shadow-xl"
                onClick={() => setShowMandaliMenu(false)}>
                <button
                  onClick={async () => {
                    // Clear mandali_id → redirect to join flow
                    await mandaliMutations.leaveMandali.mutateAsync();
                  }}
                  className="w-full border-b border-white/6 px-4 py-3 text-left text-sm theme-ink transition hover:bg-white/[0.04] flex items-center gap-3">
                  <MapPin size={14} className="theme-dim" />
                  Change my Mandali
                </button>
                <button
                  onClick={leaveMandali}
                  disabled={mandaliMutations.leaveMandali.isPending}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left text-sm text-red-400 transition hover:bg-red-500/10 disabled:opacity-50">
                  <X size={14} />
                  {mandaliMutations.leaveMandali.isPending ? 'Leaving…' : 'Leave this Mandali'}
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.25fr_0.95fr]">
        <button
          type="button"
          onClick={primaryMandaliAction.onClick}
          className="glass-panel rounded-[1.7rem] p-4 text-left transition hover:bg-white/[0.06] decorative-orbit"
        >
          <p className="type-card-label">Start here</p>
          <div className="flex items-start justify-between gap-3 mt-3">
            <div>
              <p className="type-card-heading">{primaryMandaliAction.label}</p>
              <p className="type-body mt-1">{primaryMandaliAction.hint}</p>
            </div>
            <div className="clay-icon-well flex-shrink-0">{primaryMandaliAction.icon}</div>
          </div>
        </button>

        <div className="hidden sm:block glass-panel rounded-[1.7rem] p-4">
          <p className="type-card-label">Local pulse</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Members', value: visibleMembers.length },
              { label: 'Events', value: eventCount },
              { label: 'Vichaar', value: vichaarCount },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.1rem] bg-white/[0.04] border border-white/8 px-3 py-3 text-center">
                <p className="type-metric">{item.value}</p>
                <p className="type-card-label mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSearch && <FindSanataniModal userId={userId} onClose={() => setShowSearch(false)} />}

      {/* ── Tabs ── */}
      <div className="surface-tabbar flex rounded-2xl p-1">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 rounded-xl py-2 type-body transition-all ${
              activeTab === key
                ? 'surface-tab-active'
                : 'text-[color:var(--text-dim)] hover:text-[color:var(--text-muted-warm)]'
            }`}
            style={activeTab === key ? { color: 'var(--text-cream)' } : undefined}
          >
            {label}
            {count > 0 && (
              <span className="ml-1 text-xs" style={activeTab === key ? { color: 'var(--text-dim)' } : undefined}>
                ({count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'members' && (
        <MembersTab members={visibleMembers} userId={userId} />
      )}
      {activeTab === 'events' && (
        <EventsTab posts={posts} rsvps={rsvps} userId={userId} onRsvp={updateRsvp} />
      )}
      {activeTab === 'vichaar' && (
        <>
          <VichaarTab
            posts={posts}
            userId={userId}
            comments={comments}
            onAddComment={addComment}
            onToggleUpvote={toggleUpvote}
            upvoted={upvoted}
            onCompose={submitPost}
            showCompose={showCompose}
            setShowCompose={setShowCompose}
            onHideContent={hideContentFromView}
            onHideAuthor={hideAuthorFromView}
          />
          {/* "Don't feel alone" — blended Sangam posts when local Mandali is small */}
          {widerPosts.length > 0 && (
            <div className="space-y-3 mt-2">
              <div className="flex items-center gap-2">
                <div className="flex-1 h-px" style={{ background: 'rgba(200, 127, 146, 0.18)' }} />
                <span className="text-xs theme-dim font-medium px-2">
                  🌸 Wisdom from the wider Sangam
                </span>
                <div className="flex-1 h-px" style={{ background: 'rgba(200, 127, 146, 0.18)' }} />
              </div>
              <p className="text-[11px] theme-dim text-center -mt-1">
                Your Mandali is growing — here are voices from our broader community
              </p>
              <VichaarTab
                posts={widerPosts}
                userId={userId}
                comments={comments}
                onAddComment={addComment}
                onToggleUpvote={toggleUpvote}
                upvoted={upvoted}
                onCompose={submitPost}
                showCompose={false}
                setShowCompose={() => {}}
                onHideContent={hideContentFromView}
                onHideAuthor={hideAuthorFromView}
                allowCompose={false}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
}

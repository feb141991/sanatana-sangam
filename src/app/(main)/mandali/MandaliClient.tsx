'use client';

import Image from 'next/image';
import dynamic from 'next/dynamic';
import { useState, useEffect, useRef } from 'react';
import { createPortal } from 'react-dom';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Calendar, MessageSquare, Plus, MapPin, Globe, Heart, HelpCircle, Megaphone, Search, X, UserPlus, ChevronDown, ChevronLeft, ChevronRight, CornerDownRight, MoreHorizontal, Navigation } from 'lucide-react';
import Link from 'next/link';
import { useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase';
import { queryKeys } from '@/lib/query-keys';
import ContentSafetyMenu from '@/components/safety/ContentSafetyMenu';
import { formatRelativeTime, getInitials } from '@/lib/utils';
import { useLocation } from '@/lib/LocationContext';
import type { Profile, PostWithAuthor, PostCommentWithAuthor, EventRsvp } from '@/types/database';
import { AsyncStateCard, EmptyState } from '@/components/ui';
import type { MandaliProfile } from '@/lib/api/mandali';
import { useMandaliMutations, useMandaliQuery } from '@/hooks/useMandali';
import { usePremium } from '@/hooks/usePremium';
import { useZenithSensory } from '@/contexts/ZenithSensoryContext';
import SeekersNearYou from './SeekersNearYou';
import { Shimmer } from '@/components/ui/Shimmer';
type MemberRow = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'ishta_devata' | 'spiritual_level' | 'city' | 'country' | 'seva_score'>;

type Props = {
  profile:      MandaliProfile;
  posts:        PostWithAuthor[];
  comments:     PostCommentWithAuthor[];
  rsvps:        EventRsvp[];
  members:      MemberRow[];
  userId:       string;
  /** Posts from other Mandalis shown when local Mandali has < 5 members */
  blendedPosts?: PostWithAuthor[];
  userTradition?: string | null;
};

type NearbyTab = 'feed' | 'events' | 'members';

/** Pre-filled compose state used by the welcome card and event bootstrapping */
type ComposePreset = {
  postType: 'update' | 'event';
  content: string;
  eventDate?: string;
  eventLoc?: string;
};

type RsvpStatus = 'going' | 'interested' | 'not_going';

const MandaliMembers = dynamic(() => import('./MandaliMembers'), {
  ssr: false,
  loading: () => (
    <div className="space-y-2">
      <Shimmer className="h-16 rounded-2xl" />
      <Shimmer className="h-16 rounded-2xl" />
      <Shimmer className="h-16 rounded-2xl" />
    </div>
  ),
});

const MandaliEvents = dynamic(() => import('./MandaliEvents'), {
  ssr: false,
  loading: () => (
    <div className="space-y-3">
      <Shimmer className="h-20 rounded-2xl" />
      <Shimmer className="h-20 rounded-2xl" />
      <Shimmer className="h-20 rounded-2xl" />
    </div>
  ),
});

type PostType = 'update' | 'event' | 'question' | 'announcement';

const POST_TYPES: Array<{ value: PostType; label: string; icon: string }> = [
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
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b"
          style={{ borderBottomColor: 'var(--card-border)' }}>
          <div>
            <h2 className="font-display font-bold theme-ink">Find Sanatani</h2>
            <p className="text-xs theme-dim mt-0.5">Search by name or username</p>
          </div>
          <button onClick={onClose}
            className="w-11 h-11 rounded-full bg-[var(--surface-soft)] flex items-center justify-center">
            <X size={16} className="theme-dim" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b"
          style={{ borderBottomColor: 'var(--card-border)' }}>
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
              <div className="relative w-10 h-10 rounded-full flex items-center justify-center text-[var(--divine-text)] dark:text-white text-sm font-bold flex-shrink-0 overflow-hidden"
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
                onClick={() => { toast('Wider Sangam connections will open in a future update.', { icon: '🙏' }); }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full transition"
                style={{ border: '1px solid rgba(212, 166, 70, 0.18)', color: 'var(--text-cream)', background: 'var(--card-bg)' }}>
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
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
        <input
          type="text"
          placeholder="Search your city (e.g. Manchester, London…)"
          aria-label="Search your city"
          value={query}
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          className="surface-input pl-9 pr-8 py-3 outline-none text-sm"
        />
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-[color:var(--brand-muted)]" />
      </div>

      {/* Dropdown must also render when only the custom-city row applies,
          otherwise unlisted cities have no way in. */}
      {open && (filtered.length > 0 || query.trim() !== '') && (
        <div className="absolute z-50 w-full mt-1 rounded-2xl border shadow-lg max-h-56 overflow-y-auto"
          style={{ borderColor: 'var(--card-border)', background: 'var(--card-bg)' }}>
          {filtered.map(c => (
            <button
              key={`${c.city}-${c.country}`}
              onMouseDown={(e) => e.preventDefault()}
              onClick={() => select(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition hover:bg-[var(--brand-primary-soft)]"
            >
              <span className="text-base flex-shrink-0">{c.flag}</span>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-[color:var(--brand-ink)]">{c.city}</p>
                <p className="text-xs text-[color:var(--brand-muted)] truncate">{c.region ? `${c.region}, ` : ''}{c.country}</p>
              </div>
            </button>
          ))}
          {/* Custom city option — needs "City, Country" so the join has a country */}
          {query.trim() && !CITIES.some(c => c.city.toLowerCase() === query.toLowerCase().split(',')[0].trim()) && (
            query.split(',')[1]?.trim() ? (
              <button
                onMouseDown={(e) => e.preventDefault()}
                onClick={() => {
                  const parts = query.split(',');
                  onChange({ city: parts[0].trim(), country: parts[1].trim() });
                  setOpen(false);
                }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-left border-t transition hover:bg-[var(--brand-primary-soft)]"
                style={{ borderTopColor: 'var(--card-border)' }}
              >
                <span className="text-base">🌍</span>
                <div>
                  <p className="text-sm font-medium" style={{ color: 'var(--brand-primary-strong)' }}>Use &ldquo;{query}&rdquo;</p>
                  <p className="text-xs text-[color:var(--brand-muted)]">Custom city</p>
                </div>
              </button>
            ) : (
              <div className="w-full flex items-center gap-3 px-4 py-2.5 border-t"
                style={{ borderTopColor: 'var(--card-border)' }}>
                <span className="text-base">🌍</span>
                <p className="text-xs text-[color:var(--brand-muted)]">
                  Type as City, Country — e.g. {query.trim()}, India
                </p>
              </div>
            )
          )}
        </div>
      )}
    </div>
  );
}

// ─── Geo helper (mirrors SeekersNearYou) ─────────────────────────
function haversineKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) *
    Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

type NearbyMandali = {
  id: string;
  name: string;
  city: string;
  country: string;
  member_count: number;
  latitude: number | null;
  longitude: number | null;
  distanceKm?: number;
};

// ─── No-Mandali Prompt ────────────────────────────────────────────
function NoMandaliPrompt({ userId }: { userId: string }) {
  const { city: liveCity, country: liveCountry } = useLocation();
  const mandaliMutations = useMandaliMutations(userId);
  const queryClient = useQueryClient();
  const supabase = createClient();

  const [locating,       setLocating]       = useState(false);
  const [detected,       setDetected]       = useState<{ city: string; country: string; lat?: number; lon?: number } | null>(null);
  const [geoError,       setGeoError]       = useState('');
  const [nearbyMandalis, setNearbyMandalis] = useState<NearbyMandali[]>([]);
  const [loadingNearby,  setLoadingNearby]  = useState(false);
  const [joiningId,      setJoiningId]      = useState<string | null>(null);

  // If LocationContext already has a city, pre-fill it — once. Without the
  // ref guard, clearing the chip re-triggers this effect and the X becomes
  // a no-op, locking users out of GPS retry and the manual picker.
  const prefilledFromContext = useRef(false);
  useEffect(() => {
    if (liveCity && !detected && !prefilledFromContext.current) {
      prefilledFromContext.current = true;
      setDetected({ city: liveCity, country: liveCountry ?? '' });
    }
  }, [detected, liveCity, liveCountry]);

  // Fetch nearby mandalis whenever we have a lat/lon
  useEffect(() => {
    async function fetchNearby(lat: number, lon: number) {
      setLoadingNearby(true);
      const LAT_DELTA = 120 / 111;
      const LON_DELTA = 120 / 85;
      const { data } = await supabase
        .from('mandalis')
        .select('id, name, city, country, member_count, latitude, longitude')
        .gte('latitude', lat - LAT_DELTA)
        .lte('latitude', lat + LAT_DELTA)
        .gte('longitude', lon - LON_DELTA)
        .lte('longitude', lon + LON_DELTA)
        .limit(20);

      if (data) {
        const withDist: NearbyMandali[] = (data as NearbyMandali[])
          .map((m) =>
            m.latitude != null && m.longitude != null
              ? { ...m, distanceKm: haversineKm(lat, lon, m.latitude, m.longitude) }
              : m
          )
          .filter((m) => (m.distanceKm ?? 0) <= 120)
          .sort((a, b) => (a.distanceKm ?? 0) - (b.distanceKm ?? 0));
        setNearbyMandalis(withDist);
      }
      setLoadingNearby(false);
    }

    if (detected?.lat != null && detected?.lon != null) {
      fetchNearby(detected.lat, detected.lon);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [detected?.lat, detected?.lon]);

  async function detectLocation() {
    if (!navigator.geolocation) {
      setGeoError('Geolocation is not supported by your browser.'); return;
    }
    setLocating(true);
    setGeoError('');
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          // The proxy handles the Nominatim request (with User-Agent and English language)
          // so we don't expose exact coordinates to third parties directly from the client.
          const res  = await fetch(
            `/api/mandali/reverse-geocode?lat=${lat}&lon=${lon}`
          );
          if (!res.ok) throw new Error('Reverse geocoding failed');
          
          const data = await res.json();
          const city    = data.city || '';
          const country = data.country || '';
          
          if (city) {
            setDetected({ city, country, lat, lon });
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

  async function joinExistingMandali(mandaliId: string) {
    setJoiningId(mandaliId);
    try {
      const res = await fetch('/api/mandali/join', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ mandali_id: mandaliId }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Join failed');
      // Join-by-id doesn't set city; backfill it so the page recognises the
      // membership (the no-mandali view checks profile.city too). The Slice 0
      // trigger never reassigns when mandali_id is already set.
      if (detected?.city) {
        await supabase
          .from('profiles')
          .update({ city: detected.city, country: detected.country })
          .eq('id', userId);
      }
      toast.success('Joined mandali! Welcome 🙏');
      await queryClient.invalidateQueries({ queryKey: queryKeys.mandali.byUser(userId) });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to join mandali');
    } finally {
      setJoiningId(null);
    }
  }

  async function joinMyMandali() {
    if (!detected?.city || !detected?.country) {
      toast.error('Detect or choose your city first');
      return;
    }
    try {
      await mandaliMutations.joinMandali.mutateAsync({
        city: detected.city,
        country: detected.country,
        lat: detected.lat,
        lon: detected.lon,
      });
      toast.success('Mandali found! Welcome 🙏');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not join your Mandali right now.');
    }
  }

  return (
    <div className="flex flex-col items-center justify-center py-4 px-4 text-center space-y-5 fade-in">
      {/* The onboarding hero above this prompt owns the headline; this card
          owns the action. No duplicate hero so the GPS button stays in view. */}
      <p className="text-[color:var(--brand-muted)] max-w-sm text-sm">
        We&rsquo;ll place you in your city&rsquo;s Sanatani Mandali — Wembley, Brampton, Andheri, or wherever you are. If your city is new, your Mandali opens quietly when you join.
      </p>

      <div className="glass-panel rounded-2xl border shadow-card p-5 w-full max-w-sm space-y-3" style={{ borderColor: 'var(--card-border)' }}>

        {/* Location detection */}
        {detected ? (
          <div className="flex items-center gap-2 px-3 py-3 rounded-xl border" style={{ background: 'var(--brand-primary-soft)', borderColor: 'rgba(200, 127, 146, 0.18)' }}>
            <MapPin size={14} className="flex-shrink-0" style={{ color: 'var(--brand-primary)' }} />
            <div className="flex-1 text-left">
              <p className="text-sm font-semibold" style={{ color: 'var(--brand-primary-strong)' }}>{detected.city}</p>
              {detected.country && <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>{detected.country}</p>}
            </div>
            <button onClick={() => { setDetected(null); setNearbyMandalis([]); }}
              aria-label="Clear detected city"
              className="flex items-center justify-center min-w-[44px] min-h-[44px] -m-3 text-[color:var(--brand-muted)]">
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
                <Navigation size={16} />
                Detect My Location
              </>
            )}
          </button>
        )}

        {/* Manual city fallback — same join path as GPS */}
        {!detected && (
          <>
            <div className="flex items-center gap-2">
              <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
              <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>or choose your city</span>
              <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
            </div>
            <CityPicker
              value={null}
              onChange={(v) => { setDetected({ city: v.city, country: v.country }); setGeoError(''); }}
            />
          </>
        )}

        {geoError && <p className="text-xs text-red-500 text-center">{geoError}</p>}

        {/* Nearby mandalis list — shown when location is detected */}
        {detected && (
          <div className="space-y-2">
            {loadingNearby ? (
              <p className="text-xs text-center py-2" style={{ color: 'var(--brand-muted)' }}>Finding nearby mandalis…</p>
            ) : nearbyMandalis.length > 0 ? (
              <>
                <p className="text-xs font-semibold uppercase tracking-wide text-left" style={{ color: 'var(--brand-muted)' }}>
                  Mandalis near you
                </p>
                {nearbyMandalis.slice(0, 5).map((m) => (
                  <div key={m.id} className="flex items-center justify-between gap-3 px-3 py-3 rounded-xl border" style={{ borderColor: 'rgba(200,127,146,0.16)', background: 'var(--surface-soft)' }}>
                    <div className="flex-1 text-left">
                      <p className="text-sm font-semibold" style={{ color: 'var(--text-cream)' }}>{m.name || `${m.city} Mandali`}</p>
                      <p className="text-xs" style={{ color: 'var(--brand-muted)' }}>
                        {m.city}{m.distanceKm != null ? ` · ${Math.round(m.distanceKm)} km away` : ''} · {m.member_count} members
                      </p>
                    </div>
                    <button
                      onClick={() => joinExistingMandali(m.id)}
                      disabled={joiningId === m.id}
                      className="flex-shrink-0 px-4 py-2.5 min-h-[44px] text-sm font-semibold rounded-full disabled:opacity-50 transition"
                      style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))', color: 'white' }}
                    >
                      {joiningId === m.id ? 'Joining…' : 'Join'}
                    </button>
                  </div>
                ))}
                <p className="text-[11px] text-center pt-1" style={{ color: 'var(--brand-muted)' }}>
                  Or join your city&apos;s own Mandali below
                </p>
              </>
            ) : null}
          </div>
        )}

        <button onClick={joinMyMandali} disabled={mandaliMutations.joinMandali.isPending || !detected?.city || !detected?.country}
          className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          {mandaliMutations.joinMandali.isPending
            ? 'Finding your Mandali…'
            : detected?.city ? `Join ${detected.city} Mandali` : 'Join My Mandali'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-[color:var(--brand-muted)]">
        <Globe size={12} />
        <span>Your location is used to find your city&apos;s Mandali and nearby sacred places. Only your city and country are saved — never your exact coordinates.</span>
      </div>
    </div>
  );
}

// ─── Living Empty State (small/new Mandalis) ─────────────────────
// Every action is real: open the composer pre-filled for local Mandali activity.
function MandaliWelcome({ isFirstMember, cityLabel, onIntroduce, onStartGathering }: {
  isFirstMember: boolean;
  cityLabel: string;
  onIntroduce: () => void;
  onStartGathering: () => void;
}) {
  const actions = [
    {
      icon: <MessageSquare size={16} className="theme-muted" />,
      label: 'Introduce yourself',
      hint: 'A short hello sets the tone for everyone after you',
      onClick: onIntroduce,
    },
    {
      icon: <Calendar size={16} className="theme-muted" />,
      label: 'Start the first local gathering',
      hint: 'A simple satsang, japa circle, or temple visit',
      onClick: onStartGathering,
    },
  ];

  return (
    <div className="clay-card rounded-[1.8rem] p-5 space-y-4 fade-in">
      <div>
        <p className="type-card-heading">
          {isFirstMember
            ? <>You&apos;re the first member in {cityLabel}</>
            : <>It&apos;s quiet in {cityLabel} right now</>}
        </p>
        <p className="type-body mt-1">
          {isFirstMember
            ? 'Others nearby will find their way here as they join. Set the tone with a first hello.'
            : 'Someone has to go first — it may as well be you.'}
        </p>
      </div>
      <div className="space-y-2">
        {actions.map((a) => (
          <button
            key={a.label}
            onClick={a.onClick}
            className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-left text-sm theme-ink transition hover:bg-[var(--surface-soft)]"
            style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
          >
            <div className="clay-icon-well flex-shrink-0">{a.icon}</div>
            <div>
              <p className="font-medium">{a.label}</p>
              <p className="text-xs theme-dim mt-0.5">{a.hint}</p>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─── Reflections Tab (Neighborhood Shared Contemplation) ─────────
function VichaarTab({ posts, userId, comments, onAddComment, onToggleUpvote, upvoted, onCompose, showCompose, setShowCompose, onHideContent, onHideAuthor, allowCompose = true, isPro = false, composePreset = null, hideEmpty = false }: {
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
  onHideAuthor: (authorId: string, mode?: 'mute' | 'block') => void;
  allowCompose?: boolean;
  isPro?: boolean;
  /** Pre-fills the composer (welcome-card actions); new object re-applies */
  composePreset?: ComposePreset | null;
  /** Suppress the inline EmptyState when a richer empty state renders above */
  hideEmpty?: boolean;
}) {
  const [postType,   setPostType]   = useState<'update' | 'event' | 'question' | 'announcement'>('update');
  const [content,    setContent]    = useState('');
  const [eventDate,  setEventDate]  = useState('');
  const [eventLoc,   setEventLoc]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (composePreset) {
      setPostType(composePreset.postType);
      setContent(composePreset.content);
      setEventDate(composePreset.eventDate ?? '');
      setEventLoc(composePreset.eventLoc ?? '');
    }
  }, [composePreset]);

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
          className="w-full glass-panel border border-dashed rounded-2xl p-3 flex items-center gap-3 text-[color:var(--brand-muted)] transition"
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
          isPro={isPro}
          textareaRef={textareaRef}
        />
      )}

      {nonEvents.length === 0 && !showCompose && !hideEmpty && (
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

// ── Dharmic emoji palette for compose bar ────────────────────────
const QUICK_EMOJIS = [
  '🙏', '🕉️', '🪔', '🌸', '✨', '❤️', '🌿', '🌊', '☬', '☸️',
  '😊', '🤗', '💛', '🌼', '🏵️', '📿', '📖', '🌙', '⭐', '🔥',
  '👍', '🙌', '💪', '✅', '❓', '💡', '🤝', '🌺', '😇', '🤲',
];

function ComposePanel({ postType, setPostType, content, setContent, eventDate, setEventDate, eventLoc, setEventLoc, submitting, onClose, onPost, isPro, textareaRef }: {
  postType: PostType;
  setPostType: (t: PostType) => void;
  content: string;
  setContent: React.Dispatch<React.SetStateAction<string>>;
  eventDate: string;
  setEventDate: (v: string) => void;
  eventLoc: string;
  setEventLoc: (v: string) => void;
  submitting: boolean;
  onClose: () => void;
  onPost: () => void;
  isPro: boolean;
  textareaRef: React.RefObject<HTMLTextAreaElement>;
}) {
  function insertEmoji(emoji: string) {
    const el = textareaRef.current;
    if (!el) {
      setContent((prev) => prev + emoji);
      return;
    }
    const start = el.selectionStart ?? el.value.length;
    const end = el.selectionEnd ?? el.value.length;
    const newVal = el.value.slice(0, start) + emoji + el.value.slice(end);
    setContent(newVal);
    requestAnimationFrame(() => {
      el.selectionStart = el.selectionEnd = start + emoji.length;
      el.focus();
    });
  }

  return (
    <div className="glass-panel rounded-2xl border p-4 shadow-card space-y-3 fade-in" style={{ borderColor: 'var(--card-border)' }}>
      {/* Post type selector */}
      <div className="flex gap-2 flex-wrap">
        {POST_TYPES.map((t) => {
          const isProOnly = t.value === 'announcement';
          const locked = isProOnly && !isPro;
          return (
            <button key={t.value}
              onClick={() => locked
                ? toast('Announcement posts are a Shoonaya Pro feature 🔒', { icon: '✦' })
                : setPostType(t.value)}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
                postType === t.value
                  ? ''
                  : 'bg-[var(--surface-soft)] text-[color:var(--brand-muted)] border'
              } ${locked ? 'opacity-60' : ''}`}
              style={postType === t.value ? { background: 'var(--brand-primary-soft)', color: 'var(--brand-primary-strong)', border: '1px solid rgba(200, 127, 146, 0.3)' } : { borderColor: 'var(--card-border)' }}>
              {t.icon} {t.label}{locked && ' 🔒'}
            </button>
          );
        })}
      </div>

      {/* Textarea */}
      <textarea
        ref={textareaRef}
        placeholder={postType === 'event' ? 'Describe your event…' : 'Share with your Mandali…'}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        rows={3}
        className="w-full px-4 py-3 rounded-xl border outline-none resize-none text-sm"
        style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }}
      />

      {/* Emoji row */}
      <div className="overflow-x-auto no-scrollbar -mx-1 px-1">
        <div className="flex gap-0.5 py-0.5">
          {QUICK_EMOJIS.map(emoji => (
            <button
              key={emoji}
              type="button"
              onClick={() => insertEmoji(emoji)}
              className="text-[1.25rem] leading-none p-1.5 rounded-xl hover:bg-[var(--card-bg)] flex-shrink-0 transition active:scale-90"
              title={emoji}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      {postType === 'event' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="px-3 py-2 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }} />
          <input type="text" placeholder="Location" value={eventLoc} onChange={(e) => setEventLoc(e.target.value)}
            className="px-3 py-2 rounded-xl border outline-none text-sm"
            style={{ borderColor: 'rgba(200, 127, 146, 0.18)' }} />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-[color:var(--brand-muted)]">Cancel</button>
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
  onHideAuthor: (authorId: string, mode?: 'mute' | 'block') => void;
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
    <div className="clay-card rounded-2xl p-4">
      <div className="flex items-start gap-3">
        {/* Avatar — show real image when available */}
        <div className="relative w-9 h-9 rounded-full flex-shrink-0 overflow-hidden flex items-center justify-center text-white text-xs font-bold"
          style={{ background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
          {author?.avatar_url
            ? <Image src={author.avatar_url} alt={author.full_name ?? ''} fill sizes="36px" className="object-cover" />
            : getInitials((author?.full_name || author?.username) ?? '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm theme-ink">
              {author?.full_name ?? author?.username}
            </span>
            <span className="theme-dim opacity-30">·</span>
            <span className="text-xs theme-muted">{formatRelativeTime(post.created_at)}</span>
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
          <p className="text-sm theme-ink leading-relaxed">{post.content}</p>
          {post.event_date && (
            <div className="mt-2 px-3 py-2 rounded-xl theme-dim text-xs"
              style={{ background: 'rgba(197,160,89,0.07)', border: '1px solid rgba(197,160,89,0.15)' }}>
              📅 {new Date(post.event_date).toLocaleDateString('en', { weekday: 'short', day: 'numeric', month: 'short' })}
              {post.event_location && ` · 📍 ${post.event_location}`}
            </div>
          )}
          <div className="flex items-center gap-4 mt-2.5">
            <button onClick={() => onUpvote(post.id)}
              className={`flex items-center gap-1.5 text-xs transition ${isUpvoted ? 'text-rose-500' : 'theme-muted hover:text-rose-400'}`}>
              <Heart size={13} fill={isUpvoted ? 'currentColor' : 'none'} />
              {post.upvotes > 0 && <span className="font-medium">{post.upvotes}</span>}
            </button>
            <button
              onClick={() => setShowComments((current) => !current)}
              className="flex items-center gap-1.5 text-xs theme-muted hover:theme-ink transition"
            >
              <MessageSquare size={13} />
              <span>{post.comment_count > 0 ? post.comment_count : 'Comment'}</span>
            </button>
          </div>

          {showComments && (
            <div className="mt-3 space-y-3 rounded-2xl bg-[var(--brand-primary-soft)]/60 px-3 py-3">
              <div className="space-y-2">
                {rootComments.length === 0 ? (
                  <p className="text-xs text-[color:var(--brand-muted)]">No comments yet.</p>
                ) : (
                  rootComments.map((comment) => (
                    <div key={comment.id} className="space-y-2 rounded-2xl bg-[var(--surface-soft)] px-3 py-3">
                      <div className="flex items-start gap-2">
                        <div className="w-7 h-7 rounded-full bg-[var(--brand-primary)] text-white text-[10px] font-bold flex items-center justify-center overflow-hidden flex-shrink-0">
                          {comment.profiles?.avatar_url ? (
                            <Image src={comment.profiles.avatar_url} alt="" width={28} height={28} className="h-7 w-7 object-cover" />
                          ) : (
                            getInitials(comment.profiles?.full_name || comment.profiles?.username || '?')
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 text-xs text-[color:var(--brand-muted)]">
                            <span className="font-medium text-[color:var(--brand-ink)]">{comment.profiles?.full_name ?? comment.profiles?.username}</span>
                            <span>{formatRelativeTime(comment.created_at)}</span>
                          </div>
                          <p className="text-sm text-[color:var(--brand-ink)] mt-1 leading-relaxed">{comment.body}</p>
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
                              <div className="flex items-center gap-2 text-[11px] text-[color:var(--brand-muted)]">
                                <span className="font-medium text-[color:var(--brand-ink)]">{reply.profiles?.full_name ?? reply.profiles?.username}</span>
                                <span>{formatRelativeTime(reply.created_at)}</span>
                              </div>
                              <p className="text-sm text-[color:var(--brand-ink)] mt-1 leading-relaxed">{reply.body}</p>
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
                            className="w-full rounded-xl border border-[rgba(200,127,146,0.2)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--brand-ink)] outline-none placeholder:text-[color:var(--brand-muted)]"
                          />
                          <div className="flex justify-end gap-2">
                            <button onClick={() => setReplyTo(null)} className="text-xs text-[color:var(--brand-muted)]">Cancel</button>
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
                  className="w-full rounded-xl border border-[rgba(200,127,146,0.2)] bg-[var(--surface-soft)] px-3 py-2 text-sm text-[color:var(--brand-ink)] outline-none placeholder:text-[color:var(--brand-muted)]"
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
export default function MandaliClient({ profile, posts: initialPosts, comments: initialComments, rsvps: initialRsvps, members, userId, blendedPosts = [], userTradition }: Props) {
  const isPro = usePremium();
  const router = useRouter();
  const { playHaptic } = useZenithSensory();
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

  // Empty mandalis land on the feed so the living empty state (welcome
  // card) is the first thing a new member sees — not their own member row.
  const [nearbyTab,  setNearbyTab]  = useState<NearbyTab>(
    initialVichaarCount === 0 && initialEventCount > 0 ? 'events' : 'feed'
  );
  const switchNearbyTab = (t: NearbyTab) => { setNearbyTab(t); playHaptic('light'); };

  const [showSearch,      setShowSearch]      = useState(false);
  const [showCompose,     setShowCompose]     = useState(false);
  const [composePreset,   setComposePreset]   = useState<ComposePreset | null>(null);
  const [showMandaliMenu, setShowMandaliMenu] = useState(false);
  const [portalTarget,    setPortalTarget]    = useState<Element | null>(null);
  const [upvoted,     setUpvoted]     = useState<Set<string>>(new Set());

  useEffect(() => { setPortalTarget(document.body); }, []);
  const [hiddenContentIds, setHiddenContentIds] = useState<Set<string>>(new Set());
  const [hiddenAuthorIds, setHiddenAuthorIds] = useState<Set<string>>(new Set());

  if (mandaliQuery.isPending && !mandaliQuery.data) {
    return (
      <AsyncStateCard
        state="loading"
        tradition={userTradition}
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

  // No local Mandali yet — show a rich onboarding hero + the join flow.
  if (!liveProfile?.city || !liveProfile?.mandali_id) {
    return (
      <div className="space-y-5 fade-in">

        {/* ── Onboarding hero ─────────────────────────────────────── */}
        <div className="clay-card rounded-[1.8rem] p-5 space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
              style={{ background: 'var(--brand-primary-soft)', border: '1px solid var(--card-border)' }}>
              🕉️
            </div>
            <div>
              <h2 style={{ fontFamily: 'var(--font-serif)', fontSize: 'var(--type-hero)', fontWeight: 700, color: 'var(--text-cream)', lineHeight: 1.2 }}>
                Your local Sangam awaits
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-dim)' }}>
                Join your city&apos;s Sanatani circle — share, connect, practise together
              </p>
            </div>
          </div>

          {/* What a Mandali gives you */}
          <div className="grid grid-cols-3 gap-2">
            {[
              { icon: '📅', label: 'Local Events'   },
              { icon: '👥', label: 'Nearby Seekers' },
              { icon: '💬', label: 'City Feed'      },
            ].map(v => (
              <div key={v.label} className="rounded-2xl p-3 text-center"
                style={{ background: 'var(--surface-soft)', border: '1px solid var(--card-border)' }}>
                <div className="text-xl mb-1">{v.icon}</div>
                <p className="text-xs font-semibold leading-tight" style={{ color: 'var(--text-cream)' }}>{v.label}</p>
              </div>
            ))}
          </div>

          {/* Trust signals */}
          <div className="flex items-center gap-3 pt-1">
            <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
            <p className="text-[11px] font-medium" style={{ color: 'var(--text-dim)' }}>
              🌏 Sanatani Mandalis are opening across the world
            </p>
            <div className="flex-1 h-px" style={{ background: 'var(--card-border)' }} />
          </div>
        </div>

        {/* ── Join flow — always visible ──────────────────────────── */}
        <NoMandaliPrompt userId={userId} />

      </div>
    );
  }

  const mandali    = liveProfile?.mandalis;
  const eventCount = posts.filter((p) => p.type === 'event').length;
  const vichaarCount = posts.filter((p) => p.type !== 'event').length;
  // Community identity comes from the mandali (canonical city). The user's
  // profile may legitimately keep a different suburb/city — alias merging
  // (Slice 0) routes e.g. Salford members into Manchester Mandali.
  const mandaliTitle = mandali?.name ?? (mandali?.city ? `${mandali.city} Mandali` : 'Your Mandali');
  const placeLabel = mandali
    ? `${mandali.city}, ${mandali.country}`
    : liveProfile?.city ?? '';
  const primaryMandaliAction =
    eventCount > 0
      ? {
          label: 'See upcoming events',
          hint: `${eventCount} local event${eventCount === 1 ? '' : 's'} waiting`,
          onClick: () => { switchNearbyTab('events'); },
          icon: <Calendar size={16} className="text-[color:var(--brand-muted)]" />,
        }
      : vichaarCount > 0
        ? {
            label: "Join today's Reflections",
            hint: `${vichaarCount} local conversation${vichaarCount === 1 ? '' : 's'}`,
            onClick: () => { switchNearbyTab('feed'); },
            icon: <MessageSquare size={16} className="text-[color:var(--brand-muted)]" />,
          }
        : visibleMembers.length > 1
          ? {
              label: 'Meet your Mandali',
              hint: `${visibleMembers.length} members nearby`,
              onClick: () => { switchNearbyTab('members'); },
              icon: <Users size={16} className="text-[color:var(--brand-muted)]" />,
            }
          : {
              label: 'Say the first hello',
              hint: 'Be the first voice in your Mandali',
              onClick: () => { switchNearbyTab('feed'); },
              icon: <MessageSquare size={16} className="text-[color:var(--brand-muted)]" />,
            };

  // Welcome-card actions: open the composer pre-filled. A fresh preset
  // object each call re-applies even if tapped twice.
  function startIntroPost() {
    setComposePreset({
      postType: 'update',
      content: `Namaste 🙏 I'm new to the ${mandali?.city ?? 'local'} Mandali. A little about me and my practice: `,
    });
    setNearbyTab('feed');
    setShowCompose(true);
  }

  function startFirstGathering() {
    setComposePreset({
      postType: 'event',
      content: `First ${mandali?.city ?? 'local'} satsang — bhajan, chai, and a short katha. All traditions and newcomers welcome 🙏`,
    });
    setNearbyTab('feed');
    setShowCompose(true);
  }

  // Events-tab bootstrapping: template (or blank event) opens the composer
  // in the feed tab; after posting, submitPost returns the user to Events.
  function startEventCompose(template: { content: string; eventDate?: string; eventLoc?: string }) {
    setComposePreset({
      postType: 'event',
      content: template.content,
      eventDate: template.eventDate,
      eventLoc: template.eventLoc,
    });
    setNearbyTab('feed');
    setShowCompose(true);
  }

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
    if (payload.postType === 'event' && !payload.eventDate) {
      toast.error('Add a date and time so people can come');
      return false;
    }
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
      // Events don't show in the Reflections feed — land the author on the
      // Events tab so their first gathering doesn't appear to vanish.
      if (payload.postType === 'event') setNearbyTab('events');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post right now.');
      return false;
    }
    return true;
  }

  async function leaveMandali() {
    if (!confirm('Leave your current Mandali? You can re-join any time by detecting your location again.')) return;
    try {
      await mandaliMutations.leaveMandali.mutateAsync();
      toast.success('You have left the Mandali');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not leave the Mandali.');
    }
  }

  async function toggleUpvote(postId: string) {
    try {
      const isCurrentlyUpvoted = upvoted.has(postId);
      const nextState = await mandaliMutations.toggleUpvote.mutateAsync({ postId, isUpvoted: isCurrentlyUpvoted });
      playHaptic('light');
      setUpvoted((current) => {
        const next = new Set(current);
        if (nextState) {
          next.add(postId);
        } else {
          next.delete(postId);
        }
        return next;
      });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the upvote right now.');
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
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not post the comment.');
    }
  }

  async function updateRsvp(postId: string, status: RsvpStatus) {
    try {
      await mandaliMutations.updateRsvp.mutateAsync({ postId, status });
      toast.success(status === 'going' ? 'You are in' : status === 'interested' ? 'Marked interested' : 'RSVP updated');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Could not update the RSVP.');
    }
  }

  const nearbyTabs: Array<{ key: NearbyTab; label: string; icon: string; count: number }> = [
    { key: 'feed',    label: 'Reflections', icon: '💬', count: posts.filter(p => p.type !== 'event').length },
    { key: 'events',  label: 'Events',  icon: '📅', count: eventCount },
    { key: 'members', label: 'Members', icon: '👥', count: visibleMembers.length },
  ];

  return (
    <div className="space-y-4 fade-in pt-4">

      {/* ── Mandali Header ── */}
      <div className="surface-soft-card decorative-orbit rounded-[1.8rem] p-5">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3 flex-1 min-w-0">
            <button
              onClick={() => router.back()}
              className="flex-shrink-0 w-9 h-9 rounded-full flex items-center justify-center mt-0.5"
              style={{ background: 'rgba(197, 160, 89,0.10)', border: '1px solid rgba(197, 160, 89,0.20)' }}
              aria-label="Go back">
              <ChevronLeft size={18} style={{ color: 'rgba(197, 160, 89,0.80)' }} />
            </button>
            <div className="flex-1 min-w-0">
            <div className="mb-1 flex items-center gap-2">
              <Users size={16} className="theme-muted" />
              <span className="type-card-heading">
                {mandaliTitle}
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
            {/* Member avatar stack */}
            {visibleMembers.length > 0 && (
              <div className="flex items-center gap-2 mt-3">
                <div className="flex -space-x-2">
                  {visibleMembers.slice(0, 6).map((m) => (
                    <div key={m.id}
                      className="relative w-7 h-7 rounded-full overflow-hidden flex-shrink-0 flex items-center justify-center text-[11px] font-bold text-white"
                      style={{ border: '2px solid var(--surface-soft)', background: 'linear-gradient(135deg, var(--brand-primary-strong), var(--brand-primary))' }}>
                      {m.avatar_url
                        ? <Image src={m.avatar_url} alt="" fill sizes="28px" className="object-cover" />
                        : getInitials(m.full_name || m.username || '?')}
                    </div>
                  ))}
                </div>
                {visibleMembers.length > 6 && (
                  <span className="text-[11px]" style={{ color: 'var(--text-dim)' }}>+{visibleMembers.length - 6} more</span>
                )}
              </div>
            )}
            </div>
          </div>
          <div className="text-right flex-shrink-0">
            <div className="type-metric">{visibleMembers.length}</div>
            <div className="type-card-label">members</div>
          </div>
        </div>
        {/* Action row */}
        <div className="mt-3 flex items-center gap-2">
          <button onClick={() => setShowSearch(true)}
            className="flex-1 flex items-center justify-center gap-2 rounded-xl border bg-[var(--surface-soft)] px-3 py-2 text-xs font-medium theme-ink transition hover:bg-[var(--surface-soft)]"
            style={{ borderColor: 'var(--card-border)' }}>
            <Search size={13} /> Find Sanatani
          </button>

          {/* Mandali options menu — opens as a portal bottom sheet to escape overflow:hidden parent */}
          <button
            onClick={() => setShowMandaliMenu(true)}
            className="flex h-8 w-8 items-center justify-center rounded-xl border bg-[var(--surface-soft)] theme-ink transition hover:bg-[var(--surface-soft)]"
            style={{ borderColor: 'var(--card-border)' }}
            title="Mandali options"
          >
            <MoreHorizontal size={16} />
          </button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-[1.25fr_0.95fr]">
        <button
          type="button"
          onClick={primaryMandaliAction.onClick}
          className="glass-panel rounded-[1.7rem] p-4 text-left transition hover:bg-[var(--surface-soft)] decorative-orbit"
        >
          <div className="flex items-center justify-between">
            <p className="type-card-label">Start here</p>
            <ChevronRight size={14} className="theme-muted" />
          </div>
          <div className="flex items-start justify-between gap-3 mt-3">
            <div>
              <p className="type-card-heading">{primaryMandaliAction.label}</p>
              <p className="type-body mt-1">{primaryMandaliAction.hint}</p>
            </div>
            <div className="clay-icon-well flex-shrink-0">{primaryMandaliAction.icon}</div>
          </div>
        </button>

        <div className="glass-panel rounded-[1.7rem] p-4">
          <p className="type-card-label">Local pulse</p>
          <div className="grid grid-cols-3 gap-2 mt-3">
            {[
              { label: 'Members', value: visibleMembers.length },
              { label: 'Events', value: eventCount },
              { label: 'Vichaar', value: vichaarCount },
            ].map((item) => (
              <div key={item.label} className="rounded-[1.1rem] bg-[var(--surface-soft)] border px-3 py-3 text-center" style={{ borderColor: 'var(--card-border)' }}>
                <p className="type-metric">{item.value}</p>
                <p className="type-card-label mt-1">{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {showSearch && <FindSanataniModal userId={userId} onClose={() => setShowSearch(false)} />}

      {/* Mandali options bottom sheet — portal so it escapes decorative-orbit overflow:hidden */}
      {showMandaliMenu && portalTarget && createPortal(
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-[2px]"
            style={{ zIndex: 9990 }}
            onClick={() => setShowMandaliMenu(false)}
          />
          {/* Sheet */}
          <div
            className="fixed inset-x-0 bottom-0 rounded-t-[2rem] p-5 space-y-2"
            style={{
              zIndex: 9991,
              background: 'linear-gradient(180deg, rgba(28,26,22,0.99) 0%, rgba(22,20,17,0.99) 100%)',
              border: '1px solid rgba(197, 160, 89,0.14)',
              borderBottom: 'none',
              paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 20px)',
            }}
          >
            {/* Handle */}
            <div className="flex justify-center mb-3">
              <div className="w-10 h-1 rounded-full" style={{ background: 'rgba(197, 160, 89,0.25)' }} />
            </div>
            <p className="text-xs font-semibold theme-dim uppercase tracking-widest px-1 pb-2">Mandali options</p>
            <button
              onClick={async () => {
                setShowMandaliMenu(false);
                await mandaliMutations.leaveMandali.mutateAsync();
              }}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm theme-ink transition hover:bg-[var(--surface-soft)]"
              style={{ border: '1px solid var(--card-border)', background: 'var(--card-bg)' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(197, 160, 89,0.1)' }}>
                <MapPin size={15} style={{ color: 'var(--brand-primary)' }} />
              </div>
              <div className="text-left">
                <p className="font-medium">Change my Mandali</p>
                <p className="text-xs theme-dim mt-0.5">Detect a new location</p>
              </div>
            </button>
            <button
              onClick={async () => {
                setShowMandaliMenu(false);
                await leaveMandali();
              }}
              disabled={mandaliMutations.leaveMandali.isPending}
              className="w-full flex items-center gap-3 rounded-2xl px-4 py-3.5 text-sm transition disabled:opacity-50 hover:bg-red-500/10 text-red-400"
              style={{ border: '1px solid rgba(255,80,80,0.15)', background: 'rgba(255,80,80,0.04)' }}
            >
              <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(255,80,80,0.1)' }}>
                <X size={15} />
              </div>
              <div className="text-left">
                <p className="font-medium">{mandaliMutations.leaveMandali.isPending ? 'Leaving…' : 'Leave this Mandali'}</p>
                <p className="text-xs opacity-70 mt-0.5">You can re-join anytime</p>
              </div>
            </button>
          </div>
        </>,
        portalTarget
      )}

      {/* Nearby sub-tabs */}
          <div className="surface-tabbar flex rounded-2xl p-1 gap-0.5">
            {nearbyTabs.map(({ key, label, icon, count }) => (
              <button
                key={key}
                onClick={() => switchNearbyTab(key)}
                className={`flex-1 flex items-center justify-center gap-1 rounded-xl py-2 text-xs font-semibold transition-all ${
                  nearbyTab === key
                    ? 'surface-tab-active'
                    : 'text-[color:var(--text-dim)] hover:text-[color:var(--text-muted-warm)]'
                }`}
                style={nearbyTab === key ? { color: 'var(--text-cream)' } : undefined}
              >
                <span>{icon}</span>
                <span>{label}</span>
                {count > 0 && (
                  <span className="text-[10px] opacity-60">({count})</span>
                )}
              </button>
            ))}
          </div>

          {/* Nearby tab content */}
          {nearbyTab === 'members' && (
            <>
              <MandaliMembers members={visibleMembers} userId={userId} />
              <SeekersNearYou userId={userId} profile={liveProfile} />
            </>
          )}
          {nearbyTab === 'events' && (
            <MandaliEvents posts={posts} rsvps={rsvps} userId={userId} onRsvp={updateRsvp} onStartEvent={startEventCompose} />
          )}
          {nearbyTab === 'feed' && (
            <>
              {/* Living empty state — no local posts at all. Hidden while the
                  composer is open so a preset tap can't wipe typed content. */}
              {posts.length === 0 && !showCompose && (
                <MandaliWelcome
                  isFirstMember={data.members.length <= 1}
                  cityLabel={mandali?.city ?? 'your city'}
                  onIntroduce={startIntroPost}
                  onStartGathering={startFirstGathering}
                />
              )}
              <VichaarTab
                posts={posts}
                userId={userId}
                comments={comments}
                onAddComment={addComment}
                onToggleUpvote={toggleUpvote}
                upvoted={upvoted}
                onCompose={submitPost}
                showCompose={showCompose}
                setShowCompose={(v: boolean) => {
                  // Closing the composer (cancel or successful post) discards
                  // the welcome-card preset so it can't resurface stale text.
                  if (!v) setComposePreset(null);
                  setShowCompose(v);
                }}
                onHideContent={hideContentFromView}
                onHideAuthor={hideAuthorFromView}
                isPro={isPro}
                composePreset={composePreset}
                hideEmpty={posts.length === 0}
              />
              {/* "Don't feel alone" blended posts */}
              {widerPosts.length > 0 && (
                <div className="space-y-3 mt-2">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px" style={{ background: 'rgba(200,127,146,0.18)' }} />
                    <span className="text-xs theme-dim font-medium px-2">🌸 Wider Sangam</span>
                    <div className="flex-1 h-px" style={{ background: 'rgba(200,127,146,0.18)' }} />
                  </div>
                  <p className="text-[11px] theme-dim text-center -mt-1">
                    Your Mandali is growing — voices from our broader community
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
                    isPro={isPro}
                  />
                </div>
              )}
            </>
          )}
    </div>
  );
}

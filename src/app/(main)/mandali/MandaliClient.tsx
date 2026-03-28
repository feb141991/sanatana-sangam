'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { Users, Calendar, MessageSquare, Plus, MapPin, Globe, Heart, HelpCircle, Megaphone, Search, X, UserPlus, ChevronDown } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { formatRelativeTime, getInitials, ISHTA_DEVATAS } from '@/lib/utils';
import { useLocation } from '@/lib/LocationContext';
import type { Profile, PostWithAuthor } from '@/types/database';

type MemberRow = Pick<Profile, 'id' | 'full_name' | 'username' | 'avatar_url' | 'sampradaya' | 'ishta_devata' | 'spiritual_level' | 'city' | 'seva_score'>;

type Props = {
  profile:  (Profile & { mandalis?: { name: string; city: string; country: string; member_count: number } | null }) | null;
  posts:    PostWithAuthor[];
  members:  MemberRow[];
  userId:   string;
};

const POST_TYPES = [
  { value: 'update',       label: 'Update',       icon: '💬' },
  { value: 'event',        label: 'Event',        icon: '🎉' },
  { value: 'question',     label: 'Question',     icon: '🙋' },
  { value: 'announcement', label: 'Announcement', icon: '📢' },
];

const typeIcon: Record<string, React.ReactNode> = {
  update:       <Heart size={13} className="text-rose-500" />,
  event:        <Calendar size={13} className="text-blue-500" />,
  question:     <HelpCircle size={13} className="text-purple-500" />,
  announcement: <Megaphone size={13} className="text-amber-500" />,
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
      <div className="w-full bg-white rounded-t-3xl shadow-2xl max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <div>
            <h2 className="font-display font-bold text-gray-900">Find Sanatani</h2>
            <p className="text-xs text-gray-400 mt-0.5">Search by name or username</p>
          </div>
          <button onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
            <X size={16} className="text-gray-500" />
          </button>
        </div>

        {/* Search input */}
        <div className="px-5 py-3 border-b border-gray-100">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
              <input type="text" placeholder="Search name or @username…"
                value={query} onChange={e => setQuery(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && doSearch()}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
            </div>
            <button onClick={doSearch} disabled={loading || !query.trim()}
              className="px-4 py-2.5 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
              style={{ background: '#7B1A1A' }}>
              Search
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="overflow-y-auto flex-1 px-4 py-3 space-y-2 pb-8">
          {loading && (
            <div className="text-center py-8 text-gray-400 text-sm">Searching…</div>
          )}
          {!loading && searched && results.length === 0 && (
            <div className="text-center py-8 text-gray-400">
              <UserPlus size={32} className="mx-auto mb-2 opacity-30" />
              <p className="text-sm">No one found — try a different name</p>
            </div>
          )}
          {!loading && !searched && (
            <div className="text-center py-8 text-gray-300 text-sm">
              Type a name above to find fellow Sanatani 🙏
            </div>
          )}
          {results.map(user => (
            <div key={user.id}
              className="bg-white border border-gray-100 rounded-2xl p-3 flex items-center gap-3">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: 'linear-gradient(135deg, #ff7722, #d4a017)' }}>
                {user.avatar_url
                  ? <img src={user.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                  : getInitials(user.full_name || user.username || '?')}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-sm text-gray-900 truncate">
                  {user.full_name || user.username}
                  {user.tradition && (
                    <span className="ml-1.5 text-xs">{TRADITION_EMOJI[user.tradition] ?? '🙏'}</span>
                  )}
                </p>
                <p className="text-xs text-gray-400 truncate">
                  {user.username && `@${user.username}`}
                  {user.city && ` · ${user.city}`}
                  {user.spiritual_level && ` · ${user.spiritual_level}`}
                </p>
              </div>
              <button
                onClick={() => { toast.success('Satsang Connect coming soon 🙏'); }}
                className="flex-shrink-0 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#7B1A1A]/30 text-[#7B1A1A] hover:bg-[#7B1A1A]/5 transition">
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
          className="w-full pl-9 pr-8 py-3 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm"
        />
        <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400" />
      </div>

      {open && filtered.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white rounded-2xl border border-gray-200 shadow-lg max-h-56 overflow-y-auto">
          {filtered.map(c => (
            <button
              key={`${c.city}-${c.country}`}
              onMouseDown={() => select(c)}
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left transition"
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
              className="w-full flex items-center gap-3 px-4 py-2.5 hover:bg-orange-50 text-left border-t border-gray-100 transition"
            >
              <span className="text-base">🌍</span>
              <div>
                <p className="text-sm font-medium text-[#7B1A1A]">Use "{query}"</p>
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
  const supabase = createClient();
  const router   = useRouter();
  const { city: liveCity } = useLocation();

  const [selected, setSelected] = useState<{ city: string; country: string } | null>(null);
  const [saving,   setSaving]   = useState(false);

  // Auto-select from GPS city
  useEffect(() => {
    if (liveCity && !selected) {
      const match = CITIES.find(c => c.city.toLowerCase() === liveCity.toLowerCase());
      if (match) setSelected({ city: match.city, country: match.country });
    }
  }, [liveCity]);

  async function joinMandali() {
    if (!selected?.city || !selected?.country) {
      toast.error('Please select your city'); return;
    }
    setSaving(true);
    const { error } = await supabase
      .from('profiles')
      .update({ city: selected.city.trim(), country: selected.country.trim() })
      .eq('id', userId);
    if (error) { toast.error(error.message); setSaving(false); return; }
    toast.success('Mandali found! Welcome 🙏');
    router.refresh();
  }

  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center space-y-6 fade-in">
      <div className="w-20 h-20 rounded-full flex items-center justify-center text-4xl" style={{ background: '#7B1A1A15' }}>🏡</div>
      <div>
        <h2 className="font-display font-bold text-2xl text-gray-900 mb-2">Find Your Mandali</h2>
        <p className="text-gray-500 max-w-sm text-sm">
          Select your city to join your neighbourhood Sanatani community — Wembley Mandali, Brampton Mandali, Andheri Mandali and more.
        </p>
      </div>

      <div className="bg-white rounded-2xl border border-orange-100 shadow-card p-5 w-full max-w-sm space-y-3">
        <CityPicker
          value={selected}
          onChange={setSelected}
        />

        {selected && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-orange-50 border border-orange-100">
            <MapPin size={13} style={{ color: '#7B1A1A' }} />
            <span className="text-sm font-medium text-gray-800">{selected.city}</span>
            <span className="text-xs text-gray-400">{selected.country}</span>
          </div>
        )}

        <button onClick={joinMandali} disabled={saving || !selected}
          className="w-full py-3 text-white font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          style={{ background: '#7B1A1A' }}>
          {saving ? 'Finding your Mandali…' : 'Find My Mandali 🙏'}
        </button>
      </div>

      <div className="flex items-center gap-2 text-xs text-gray-400">
        <Globe size={12} />
        <span>80+ cities worldwide — we'll create a Mandali if one doesn't exist yet</span>
      </div>
    </div>
  );
}

// ─── Members Tab ────────────────────────────────────────────────
function MembersTab({ members, userId }: { members: MemberRow[]; userId: string }) {
  if (members.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Users size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No members found</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {members.map((m, idx) => {
        const devata = ISHTA_DEVATAS.find((d) => d.value === m.ishta_devata);
        const isMe = m.id === userId;
        return (
          <div key={m.id}
            className={`bg-white rounded-2xl border p-3 flex items-center gap-3 ${isMe ? 'border-[#7B1A1A]/30' : 'border-gray-100'}`}>
            {/* Rank */}
            <div className="w-5 text-center text-xs font-bold text-gray-300">
              {idx + 1}
            </div>
            {/* Avatar */}
            <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
              style={{ background: isMe ? '#7B1A1A' : 'linear-gradient(135deg, #ff7722, #d4a017)' }}>
              {m.avatar_url
                ? <img src={m.avatar_url} className="w-10 h-10 rounded-full object-cover" alt="" />
                : getInitials(m.full_name || m.username || '?')
              }
            </div>
            {/* Info */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5">
                <p className="font-semibold text-gray-900 text-sm truncate">
                  {m.full_name || m.username}
                  {isMe && <span className="ml-1 text-[10px] text-[#7B1A1A] font-medium">(you)</span>}
                </p>
              </div>
              <p className="text-xs text-gray-500 truncate">
                {devata?.emoji} {devata?.label ?? 'Sanatani'} · {m.spiritual_level ?? 'Seeker'}
              </p>
            </div>
            {/* Seva Score */}
            <div className="text-right">
              <div className="font-bold text-sm" style={{ color: '#7B1A1A' }}>{m.seva_score ?? 0}</div>
              <div className="text-[10px] text-gray-400">seva</div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ─── Events Tab ─────────────────────────────────────────────────
function EventsTab({ posts }: { posts: PostWithAuthor[] }) {
  const events = posts.filter((p) => p.type === 'event');
  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-400">
        <Calendar size={40} className="mx-auto mb-3 opacity-30" />
        <p className="text-sm">No upcoming events</p>
        <p className="text-xs mt-1">Post an event to get started!</p>
      </div>
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
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Vichaar Tab (Posts Feed) ────────────────────────────────────
function VichaarTab({ posts, userId, onToggleUpvote, upvoted, onCompose, showCompose, setShowCompose }: {
  posts: PostWithAuthor[];
  userId: string;
  onToggleUpvote: (id: string) => void;
  upvoted: Set<string>;
  onCompose: () => void;
  showCompose: boolean;
  setShowCompose: (v: boolean) => void;
}) {
  const [postType,   setPostType]   = useState<'update' | 'event' | 'question' | 'announcement'>('update');
  const [content,    setContent]    = useState('');
  const [eventDate,  setEventDate]  = useState('');
  const [eventLoc,   setEventLoc]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const supabase = createClient();

  const nonEvents = posts.filter((p) => p.type !== 'event');

  return (
    <div className="space-y-3">
      {/* Compose button */}
      <button
        onClick={() => setShowCompose(!showCompose)}
        className="w-full bg-white border border-dashed border-[#7B1A1A]/30 rounded-2xl p-3 flex items-center gap-3 text-gray-400 hover:border-[#7B1A1A]/50 hover:text-[#7B1A1A] transition"
      >
        <div className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: '#7B1A1A15' }}>
          <Plus size={15} style={{ color: '#7B1A1A' }} />
        </div>
        <span className="text-sm">Share with your Mandali…</span>
      </button>

      {showCompose && (
        <ComposePanel
          postType={postType} setPostType={setPostType}
          content={content} setContent={setContent}
          eventDate={eventDate} setEventDate={setEventDate}
          eventLoc={eventLoc} setEventLoc={setEventLoc}
          submitting={submitting} setSubmitting={setSubmitting}
          onClose={() => setShowCompose(false)}
          onPost={onCompose}
        />
      )}

      {nonEvents.length === 0 && !showCompose && (
        <div className="text-center py-12 text-gray-400">
          <MessageSquare size={40} className="mx-auto mb-3 opacity-30" />
          <p className="text-sm">No posts yet</p>
          <p className="text-xs mt-1">Be the first to share!</p>
        </div>
      )}

      {nonEvents.map((post) => (
        <PostCard key={post.id} post={post} userId={userId} upvoted={upvoted} onUpvote={onToggleUpvote} />
      ))}
    </div>
  );
}

function ComposePanel({ postType, setPostType, content, setContent, eventDate, setEventDate, eventLoc, setEventLoc, submitting, setSubmitting, onClose, onPost }: any) {
  return (
    <div className="bg-white rounded-2xl border border-orange-100 p-4 shadow-card space-y-3 fade-in">
      <div className="flex gap-2 flex-wrap">
        {POST_TYPES.map((t) => (
          <button key={t.value} onClick={() => setPostType(t.value)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition ${
              postType === t.value
                ? 'bg-[#7B1A1A]/10 text-[#7B1A1A] border border-[#7B1A1A]/30'
                : 'bg-gray-50 text-gray-500 border border-gray-200'
            }`}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>
      <textarea placeholder={postType === 'event' ? 'Describe your event…' : 'Share with your Mandali…'}
        value={content} onChange={(e) => setContent(e.target.value)} rows={3}
        className="w-full px-4 py-3 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm" />
      {postType === 'event' && (
        <div className="grid grid-cols-2 gap-3">
          <input type="datetime-local" value={eventDate} onChange={(e) => setEventDate(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm" />
          <input type="text" placeholder="Location" value={eventLoc} onChange={(e) => setEventLoc(e.target.value)}
            className="px-3 py-2 rounded-xl border border-gray-200 outline-none text-sm" />
        </div>
      )}
      <div className="flex justify-end gap-2">
        <button onClick={onClose} className="px-4 py-2 text-sm text-gray-500">Cancel</button>
        <button onClick={onPost} disabled={submitting || !content.trim()}
          className="px-5 py-2 text-white text-sm font-semibold rounded-xl hover:opacity-90 disabled:opacity-50 transition"
          style={{ background: '#7B1A1A' }}>
          {submitting ? 'Posting…' : 'Post 🙏'}
        </button>
      </div>
    </div>
  );
}

function PostCard({ post, userId, upvoted, onUpvote }: {
  post: PostWithAuthor; userId: string; upvoted: Set<string>; onUpvote: (id: string) => void;
}) {
  const author = post.profiles;
  const isUpvoted = upvoted.has(post.id);

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
          {getInitials((author?.full_name || author?.username) ?? '?')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-semibold text-sm text-gray-900">
              {author?.full_name ?? author?.username}
            </span>
            <span className="text-gray-300">·</span>
            <span className="text-xs text-gray-400">{formatRelativeTime(post.created_at)}</span>
            <span className="ml-auto">{typeIcon[post.type]}</span>
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
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────
export default function MandaliClient({ profile, posts: initialPosts, members, userId }: Props) {
  const router   = useRouter();
  const supabase = createClient();

  const [activeTab,    setActiveTab]   = useState<'members' | 'events' | 'vichaar'>('members');
  const [posts,        setPosts]       = useState(initialPosts);
  const [showSearch,   setShowSearch]  = useState(false);
  const [showCompose,  setShowCompose] = useState(false);
  const [postType,    setPostType]    = useState<'update' | 'event' | 'question' | 'announcement'>('update');
  const [content,     setContent]     = useState('');
  const [eventDate,   setEventDate]   = useState('');
  const [eventLoc,    setEventLoc]    = useState('');
  const [upvoted,     setUpvoted]     = useState<Set<string>>(new Set());

  if (!profile?.city || !profile?.mandali_id) {
    return <NoMandaliPrompt userId={userId} />;
  }

  const mandali    = profile?.mandalis;
  const eventCount = posts.filter((p) => p.type === 'event').length;

  async function submitPost() {
    if (!content.trim()) { toast.error('Write something first'); return; }
    if (!profile?.mandali_id) { toast.error('You are not in a Mandali yet'); return; }
    const { data, error } = await supabase
      .from('posts')
      .insert({
        author_id:      userId,
        mandali_id:     profile.mandali_id,
        content:        content.trim(),
        type:           postType,
        event_date:     eventDate || null,
        event_location: eventLoc  || null,
      })
      .select('*, profiles(full_name, username, avatar_url, sampradaya, spiritual_level)')
      .single();
    if (error) { toast.error(error.message); return; }
    setPosts([data as PostWithAuthor, ...posts]);
    setContent(''); setEventDate(''); setEventLoc(''); setShowCompose(false);
    toast.success('Posted! 🙏');
    router.refresh();
  }

  async function toggleUpvote(postId: string) {
    if (upvoted.has(postId)) {
      await supabase.from('post_upvotes').delete().match({ post_id: postId, user_id: userId });
      setUpvoted((s) => { const n = new Set(s); n.delete(postId); return n; });
      setPosts((p) => p.map((post) => post.id === postId ? { ...post, upvotes: post.upvotes - 1 } : post));
    } else {
      await supabase.from('post_upvotes').insert({ post_id: postId, user_id: userId });
      setUpvoted((s) => new Set([...s, postId]));
      setPosts((p) => p.map((post) => post.id === postId ? { ...post, upvotes: post.upvotes + 1 } : post));
    }
  }

  const tabs = [
    { key: 'members', label: 'Members', count: members.length },
    { key: 'events',  label: 'Events',  count: eventCount },
    { key: 'vichaar', label: 'Vichaar', count: posts.filter(p => p.type !== 'event').length },
  ] as const;

  return (
    <div className="space-y-4 fade-in">

      {/* ── Mandali Header ── */}
      <div className="rounded-2xl p-5 text-white" style={{ background: '#7B1A1A' }}>
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Users size={16} className="text-white/80" />
              <span className="font-display font-bold text-lg">
                {/* Show neighbourhood-level name if available */}
                {(profile as any)?.neighbourhood
                  ? `${(profile as any).neighbourhood} Mandali`
                  : mandali?.name ?? 'Your Mandali'}
              </span>
            </div>
            <div className="flex items-center gap-1 text-white/70 text-sm">
              <MapPin size={12} />
              <span>
                {(profile as any)?.neighbourhood
                  ? `${(profile as any).neighbourhood}, ${mandali?.city ?? profile?.city ?? ''}`
                  : mandali
                  ? `${mandali.city}, ${mandali.country}`
                  : profile?.city ?? ''}
              </span>
            </div>
          </div>
          <div className="text-right">
            <div className="font-bold text-2xl">{members.length}</div>
            <div className="text-white/60 text-xs">members</div>
          </div>
        </div>
        {/* Find Sanatani button */}
        <button onClick={() => setShowSearch(true)}
          className="mt-3 flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-medium transition w-full justify-center"
          style={{ background: 'rgba(255,255,255,0.15)', color: 'white' }}>
          <Search size={13} /> Find Sanatani
        </button>
      </div>

      {showSearch && <FindSanataniModal userId={userId} onClose={() => setShowSearch(false)} />}

      {/* ── Tabs ── */}
      <div className="flex bg-gray-100 rounded-2xl p-1">
        {tabs.map(({ key, label, count }) => (
          <button
            key={key}
            onClick={() => setActiveTab(key)}
            className={`flex-1 py-2 rounded-xl text-sm font-medium transition-all ${
              activeTab === key
                ? 'bg-white text-[#7B1A1A] shadow-sm font-semibold'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {label}
            {count > 0 && (
              <span className={`ml-1 text-xs ${activeTab === key ? 'text-[#7B1A1A]/60' : 'text-gray-400'}`}>
                ({count})
              </span>
            )}
          </button>
        ))}
      </div>

      {/* ── Tab Content ── */}
      {activeTab === 'members' && (
        <MembersTab members={members} userId={userId} />
      )}
      {activeTab === 'events' && (
        <EventsTab posts={posts} />
      )}
      {activeTab === 'vichaar' && (
        <VichaarTab
          posts={posts}
          userId={userId}
          onToggleUpvote={toggleUpvote}
          upvoted={upvoted}
          onCompose={submitPost}
          showCompose={showCompose}
          setShowCompose={setShowCompose}
        />
      )}
    </div>
  );
}

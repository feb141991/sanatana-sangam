'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { LogOut, Edit3, MapPin } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import { getInitials, ISHTA_DEVATAS, SAMPRADAYAS, SPIRITUAL_LEVELS, TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getIshtaDevataLabel, getSampradayaLabel } from '@/lib/utils';
import type { TraditionKey } from '@/lib/traditions';
import { useLocation } from '@/lib/LocationContext';
import { getPlayerId, getPermissionState } from '@/lib/onesignal';
import type { Profile } from '@/types/database';

const SEVA_LEVELS = [
  { min: 0,    max: 99,   label: 'Jigyasu',    emoji: '🌱' },
  { min: 100,  max: 299,  label: 'Sadhaka',    emoji: '🪷' },
  { min: 300,  max: 599,  label: 'Shishya',    emoji: '📿' },
  { min: 600,  max: 999,  label: 'Seva Dhari', emoji: '🙏' },
  { min: 1000, max: 1999, label: 'Mahatma',    emoji: '🕉️' },
  { min: 2000, max: 9999, label: 'Acharya',    emoji: '🔱' },
];

function getSevaBadge(score: number) {
  return SEVA_LEVELS.find((l) => score >= l.min && score <= l.max) ?? SEVA_LEVELS[0];
}

// ── Profile Completion ────────────────────────────────────────────────────────
const COMPLETION_FIELDS: { key: keyof Profile | string; label: string }[] = [
  { key: 'full_name',    label: 'Name'         },
  { key: 'bio',          label: 'Bio'          },
  { key: 'city',         label: 'City'         },
  { key: 'country',      label: 'Country'      },
  { key: 'tradition',    label: 'Tradition'    },
  { key: 'sampradaya',   label: 'Sampradaya'   },
  { key: 'ishta_devata', label: 'Ishta Devata' },
  { key: 'home_town',    label: 'Home Town'    },
];

function calcCompletion(profile: Profile | null): { pct: number; missing: string[] } {
  if (!profile) return { pct: 0, missing: COMPLETION_FIELDS.map(f => f.label) };
  const missing = COMPLETION_FIELDS
    .filter(f => !(profile as any)[f.key])
    .map(f => f.label);
  const pct = Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100);
  return { pct, missing };
}

// ── Seva Score Bar ────────────────────────────────────────────────────────────
function SevaScoreBar({ score }: { score: number }) {
  const badge     = getSevaBadge(score);
  const nextLevel = SEVA_LEVELS.find((l) => l.min > score);
  const pct = nextLevel
    ? Math.min(100, Math.round(((score - badge.min) / (nextLevel.min - badge.min)) * 100))
    : 100;

  return (
    <div className="bg-white rounded-2xl border border-gray-100 p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{badge.emoji}</span>
          <div>
            <p className="font-display font-bold text-gray-900 text-base">{badge.label}</p>
            <p className="text-xs text-gray-500">Seva Level</p>
          </div>
        </div>
        <div className="text-right">
          <p className="font-bold text-2xl" style={{ color: '#7B1A1A' }}>{score}</p>
          <p className="text-xs text-gray-400">seva points</p>
        </div>
      </div>
      <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #7B1A1A, #E8640A)' }} />
      </div>
      {nextLevel && (
        <p className="text-[11px] text-gray-400 mt-1.5 text-right">
          {nextLevel.min - score} pts to {nextLevel.label}
        </p>
      )}
    </div>
  );
}

// ── Profile Completion Bar ────────────────────────────────────────────────────
function CompletionBar({ profile, onEdit }: { profile: Profile | null; onEdit: () => void }) {
  const { pct, missing } = calcCompletion(profile);
  if (pct === 100) return null;

  return (
    <div className="bg-white rounded-2xl border border-blue-100 p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <p className="text-sm font-semibold text-gray-800">Profile {pct}% complete</p>
        </div>
        <button onClick={onEdit}
          className="text-xs font-semibold px-3 py-1 rounded-full text-white transition"
          style={{ background: '#7B1A1A' }}>
          Complete
        </button>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, #3b82f6, #7B1A1A)' }} />
      </div>
      {missing.length > 0 && (
        <p className="text-xs text-gray-400 mt-1.5">
          Add: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
        </p>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function ProfileClient({
  profile,
  threadCount,
  postCount,
  userId,
  userEmail,
}: {
  profile:     Profile | null;
  threadCount: number;
  postCount:   number;
  userId:      string;
  userEmail:   string;
}) {
  const router   = useRouter();
  const supabase = createClient();
  const [editing, setEditing] = useState(false);
  const [saving,  setSaving]  = useState(false);
  const [form, setForm] = useState({
    full_name:        profile?.full_name        ?? '',
    bio:              profile?.bio              ?? '',
    city:             profile?.city             ?? '',
    country:          profile?.country          ?? '',
    tradition:        (profile as any)?.tradition        ?? '',
    sampradaya:       profile?.sampradaya       ?? '',
    ishta_devata:     profile?.ishta_devata     ?? '',
    spiritual_level:  profile?.spiritual_level  ?? 'jigyasu',
    kul:              profile?.kul              ?? '',
    gotra:            profile?.gotra            ?? '',
    kul_devata:       (profile as any)?.kul_devata       ?? '',
    home_town:        (profile as any)?.home_town        ?? '',
    custom_greeting:  (profile as any)?.custom_greeting  ?? '',
  });

  const activeTradition = (form.tradition || 'hindu') as TraditionKey;
  const sampradayaOptions = SAMPRADAYAS_BY_TRADITION[activeTradition] ?? SAMPRADAYAS_BY_TRADITION['hindu'];
  const ishtaDevataOptions = ISHTA_DEVATAS_BY_TRADITION[activeTradition] ?? ISHTA_DEVATAS_BY_TRADITION['hindu'];
  const sampradayaLabel = getSampradayaLabel(form.tradition);
  const ishtaDevataLabel = getIshtaDevataLabel(form.tradition);

  const { coords, city: liveCity, country: liveCountry, countryCode: liveCountryCode } = useLocation();

  const devata    = ISHTA_DEVATAS.find((d) => d.value === profile?.ishta_devata);
  const sampr     = SAMPRADAYAS.find((s)  => s.value  === profile?.sampradaya);
  const initials  = getInitials(profile?.full_name ?? 'S');
  const sevaScore = profile?.seva_score ?? 0;
  const streak    = (profile as any)?.shloka_streak ?? 0;

  // Silently save coords + city + country + country_code when location resolves
  useEffect(() => {
    if (!coords || !userId) return;
    const isSame =
      profile?.latitude  && Math.abs(coords.lat - (profile.latitude  ?? 0)) < 0.05 &&
      profile?.longitude && Math.abs(coords.lon - (profile.longitude ?? 0)) < 0.05;
    if (isSame) return;

    const update: Record<string, any> = {
      latitude:  coords.lat,
      longitude: coords.lon,
    };
    if (liveCity        && !profile?.city)         update.city         = liveCity;
    if (liveCountry     && !profile?.country)      update.country      = liveCountry;
    if (liveCountryCode && !(profile as any)?.country_code)
                                                   update.country_code = liveCountryCode;
    supabase.from('profiles').update(update).eq('id', userId);
  }, [coords]);

  // Save OneSignal player ID when permission is granted
  useEffect(() => {
    if (!userId) return;
    if (getPermissionState() !== 'granted') return;
    if ((profile as any)?.onesignal_player_id) return; // already saved
    getPlayerId().then((id) => {
      if (id) supabase.from('profiles').update({ onesignal_player_id: id }).eq('id', userId);
    });
  }, [userId]);

  async function saveProfile() {
    setSaving(true);
    const { error } = await supabase.from('profiles').update(form).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated 🙏'); setEditing(false); router.refresh(); }
    setSaving(false);
  }

  async function signOut() {
    await supabase.auth.signOut();
    router.push('/');
    router.refresh();
  }

  const traditionLabel = TRADITIONS.find(t => t.value === (profile as any)?.tradition);
  const identityRows = [
    { label: 'Tradition',    value: traditionLabel ? `${traditionLabel.emoji} ${traditionLabel.label}` : null, emoji: null },
    { label: sampr ? getSampradayaLabel((profile as any)?.tradition) : 'Sampradaya', value: sampr?.label, emoji: '🏛️' },
    { label: devata ? getIshtaDevataLabel((profile as any)?.tradition) : 'Ishta Devata', value: devata ? `${devata.emoji} ${devata.label}` : null, emoji: null },
    { label: 'Gotra',        value: profile?.gotra,                                  emoji: '📿' },
    { label: 'Kul Devata',   value: (profile as any)?.kul_devata,                   emoji: '🪔' },
    { label: 'Home Town',    value: (profile as any)?.home_town,                    emoji: '🏡' },
  ].filter((r) => r.value);

  return (
    <div className="space-y-4 fade-in">

      {/* ── Profile Completion Bar ── */}
      <CompletionBar profile={profile} onEdit={() => setEditing(true)} />

      {/* ── Hero Card ── */}
      <div className="rounded-2xl text-white p-5" style={{ background: '#7B1A1A' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold">
              {initials}
            </div>
            <div>
              <h1 className="font-display font-bold text-xl text-white">{profile?.full_name}</h1>
              <p className="text-white/70 text-sm">@{profile?.username}</p>
              {(profile?.city || profile?.country) && (
                <p className="text-white/60 text-xs flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  {[profile?.city, profile?.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="p-2 rounded-xl bg-white/20 hover:bg-white/30 transition text-white">
            <Edit3 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <StatPill label="Threads" value={threadCount} />
          <StatPill label="Posts"   value={postCount}   />
          <StatPill label="Streak"  value={streak} suffix="🔥" />
        </div>
      </div>

      {/* ── Seva Score ── */}
      <SevaScoreBar score={sevaScore} />

      {/* ── Identity Rows ── */}
      {identityRows.length > 0 && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-3">Dharmic Identity</p>
          <div className="divide-y divide-gray-50">
            {identityRows.map(({ label, value, emoji }) => (
              <div key={label} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-gray-500">{emoji ? `${emoji} ` : ''}{label}</span>
                <span className="text-sm font-medium text-gray-800">{value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Bio ── */}
      {profile?.bio && (
        <div className="bg-white rounded-2xl border border-gray-100 p-4">
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider mb-2">About</p>
          <p className="text-sm text-gray-700 leading-relaxed">{profile.bio}</p>
        </div>
      )}

      {/* ── Edit Form ── */}
      {editing && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 fade-in">
          <h2 className="font-display font-semibold text-lg text-gray-900">Edit Profile</h2>

          {/* ── Tradition (first, adapts everything below) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Tradition</label>
            <div className="grid grid-cols-1 gap-2">
              {TRADITIONS.map((t) => (
                <button key={t.value} type="button"
                  onClick={() => setForm({ ...form, tradition: t.value, sampradaya: '', ishta_devata: '' })}
                  className={`text-left px-3 py-2.5 rounded-xl border text-sm transition flex items-center gap-3 ${
                    form.tradition === t.value
                      ? 'border-[#7B1A1A] bg-[#7B1A1A08] text-[#7B1A1A] font-medium'
                      : 'border-gray-200 text-gray-600 hover:border-[#7B1A1A]/30'
                  }`}>
                  <span className="text-xl">{t.emoji}</span>
                  <div>
                    <p className="font-medium leading-tight">{t.label}</p>
                    <p className="text-xs text-gray-400 leading-tight mt-0.5">{t.desc}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* ── Basic info ── */}
          {[
            { label: 'Full Name',  key: 'full_name',  placeholder: 'Your full name'    },
            { label: 'City',       key: 'city',       placeholder: 'Current city'      },
            { label: 'Country',    key: 'country',    placeholder: 'Country'           },
            { label: 'Home Town',  key: 'home_town',  placeholder: 'Where you are from'},
          ].map(({ label, key, placeholder }) => (
            <div key={key}>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
              <input type="text" placeholder={placeholder}
                value={(form as Record<string, string>)[key]}
                onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm"
              />
            </div>
          ))}

          {/* ── Sampradaya (adapts by tradition) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{sampradayaLabel}</label>
            <select value={form.sampradaya}
              onChange={(e) => setForm({ ...form, sampradaya: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm bg-white">
              <option value="">Select {sampradayaLabel.toLowerCase()}</option>
              {sampradayaOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
            </select>
          </div>

          {/* ── Ishta Devata (adapts by tradition) ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{ishtaDevataLabel}</label>
            <select value={form.ishta_devata}
              onChange={(e) => setForm({ ...form, ishta_devata: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm bg-white">
              <option value="">Select {ishtaDevataLabel.toLowerCase()}</option>
              {ishtaDevataOptions.map((d) => <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>)}
            </select>
          </div>

          {/* ── Hindu-specific fields ── */}
          {(activeTradition === 'hindu') && (
            <>
              {[
                { label: 'Gotra',      key: 'gotra',      placeholder: 'e.g. Kashyapa'     },
                { label: 'Kul Devata', key: 'kul_devata', placeholder: 'e.g. Shiva, Durga' },
                { label: 'Kul',        key: 'kul',        placeholder: 'Family lineage'    },
              ].map(({ label, key, placeholder }) => (
                <div key={key}>
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                  <input type="text" placeholder={placeholder}
                    value={(form as Record<string, string>)[key]}
                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm"
                  />
                </div>
              ))}
            </>
          )}

          {/* ── Custom greeting ── */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Greeting (optional)</label>
            <input type="text" placeholder="e.g. Waheguru Ji Ka Khalsa, Namo Buddhaya…"
              value={form.custom_greeting}
              onChange={(e) => setForm({ ...form, custom_greeting: e.target.value })}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none text-sm"
            />
            <p className="text-xs text-gray-400 mt-1">Overrides the auto greeting on your home screen</p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
            <textarea placeholder="Share a little about your spiritual journey…"
              value={form.bio}
              onChange={(e) => setForm({ ...form, bio: e.target.value })}
              rows={3}
              className="w-full px-4 py-2.5 rounded-xl border border-gray-200 focus:border-[#7B1A1A] outline-none resize-none text-sm"
            />
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEditing(false)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm">
              Cancel
            </button>
            <button onClick={saveProfile} disabled={saving}
              className="flex-1 py-3 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: '#7B1A1A' }}>
              {saving ? 'Saving…' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {/* ── Account ── */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-3">
        <div className="text-sm text-gray-500">
          Signed in as <span className="font-medium text-gray-700">{userEmail}</span>
        </div>
        <button onClick={signOut}
          className="flex items-center gap-2 text-sm text-red-500 hover:text-red-700 transition font-medium">
          <LogOut size={15} /> Sign out
        </button>
      </div>

    </div>
  );
}

function StatPill({ label, value, suffix }: { label: string; value: number; suffix?: string }) {
  return (
    <div className="bg-white/15 rounded-xl px-3 py-2 text-center">
      <p className="font-bold text-lg text-white">{value}{suffix}</p>
      <p className="text-white/60 text-[10px]">{label}</p>
    </div>
  );
}

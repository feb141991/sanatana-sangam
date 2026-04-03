'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { HiddenContentSummary, SafetyProfileSummary } from '@/lib/user-safety';
import { getInitials, ISHTA_DEVATAS, SAMPRADAYAS, SPIRITUAL_LEVELS, TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getIshtaDevataLabel, getSampradayaLabel } from '@/lib/utils';
import type { TraditionKey } from '@/lib/traditions';
import { useLocation } from '@/lib/LocationContext';
import { getPlayerId, getPermissionState, logoutFromOneSignal } from '@/lib/onesignal';
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
  blockedProfiles: initialBlockedProfiles,
  mutedProfiles: initialMutedProfiles,
  hiddenItems: initialHiddenItems,
}: {
  profile:     Profile | null;
  threadCount: number;
  postCount:   number;
  userId:      string;
  userEmail:   string;
  blockedProfiles: SafetyProfileSummary[];
  mutedProfiles: SafetyProfileSummary[];
  hiddenItems: HiddenContentSummary[];
}) {
  const router   = useRouter();
  const supabase = useRef(createClient()).current;
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);
  const [safetyBusyKey, setSafetyBusyKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((profile as any)?.avatar_url ?? null);
  const [blockedProfiles, setBlockedProfiles] = useState(initialBlockedProfiles);
  const [mutedProfiles, setMutedProfiles] = useState(initialMutedProfiles);
  const [hiddenItems, setHiddenItems] = useState(initialHiddenItems);
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
  const profileCountryCode = (profile as any)?.country_code ?? null;
  const onesignalPlayerId = (profile as any)?.onesignal_player_id ?? null;

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
    if (liveCountryCode && !profileCountryCode)
                                                   update.country_code = liveCountryCode;
    supabase.from('profiles').update(update).eq('id', userId);
  }, [coords, liveCity, liveCountry, liveCountryCode, profile?.latitude, profile?.longitude, profile?.city, profile?.country, profileCountryCode, supabase, userId]);

  // Save OneSignal player ID when permission is granted
  useEffect(() => {
    if (!userId) return;
    if (getPermissionState() !== 'granted') return;
    if (onesignalPlayerId) return; // already saved
    getPlayerId().then((id) => {
      if (id) supabase.from('profiles').update({ onesignal_player_id: id }).eq('id', userId);
    });
  }, [onesignalPlayerId, supabase, userId]);

  async function uploadAvatar(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) { toast.error('Photo must be under 2 MB'); return; }
    if (!file.type.startsWith('image/')) { toast.error('Please select an image file'); return; }

    setUploading(true);
    try {
      const ext  = file.name.split('.').pop() ?? 'jpg';
      const path = `${userId}/avatar.${ext}`;

      // Upload to a public avatars bucket so photos can render across the app.
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(path, file, { upsert: true, contentType: file.type });
      if (uploadError) throw uploadError;

      const { data: pubData } = supabase.storage.from('avatars').getPublicUrl(path);
      const publicUrl = pubData.publicUrl;
      const { error: dbError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', userId);
      if (dbError) throw dbError;

      setAvatarUrl(`${publicUrl}?t=${Date.now()}`);
      toast.success('Photo updated 🙏');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Upload failed');
    } finally {
      setUploading(false);
      // reset handled by the input's own state via key change if needed
    }
  }

  async function saveProfile() {
    setSaving(true);
    // tradition is locked at signup — never include it in updates
    const { tradition: _locked, ...formToSave } = form;
    const { error } = await supabase.from('profiles').update(formToSave).eq('id', userId);
    if (error) toast.error(error.message);
    else { toast.success('Profile updated 🙏'); setEditing(false); router.refresh(); }
    setSaving(false);
  }

  async function signOut() {
    try {
      await logoutFromOneSignal();
    } catch {
      // Never let push cleanup block the actual auth sign-out.
    }

    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error(error.message);
      return;
    }

    router.push('/');
    router.refresh();
  }

  async function sendTestNotification() {
    if (sendingTestNotification) return;

    setSendingTestNotification(true);
    try {
      const response = await fetch('/api/notifications/test', {
        method: 'POST',
      });
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        toast.error(data.error ?? 'Could not send a test notification.');
        return;
      }

      toast.success(
        data.push_targets > 0
          ? 'Test notification sent. Check your bell and browser.'
          : 'Test notification created. Check your bell first.'
      );
      router.refresh();
    } catch {
      toast.error('Could not reach the notification test service.');
    } finally {
      setSendingTestNotification(false);
    }
  }

  async function unblockProfile(profileId: string) {
    setSafetyBusyKey(`block:${profileId}`);
    const { error } = await supabase
      .from('user_blocked_profiles')
      .delete()
      .eq('blocker_id', userId)
      .eq('blocked_user_id', profileId);

    setSafetyBusyKey(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setBlockedProfiles((current) => current.filter((profile) => profile.id !== profileId));
    toast.success('User unblocked.');
  }

  async function unmuteProfile(profileId: string) {
    setSafetyBusyKey(`mute:${profileId}`);
    const { error } = await supabase
      .from('user_muted_profiles')
      .delete()
      .eq('muter_id', userId)
      .eq('muted_user_id', profileId);

    setSafetyBusyKey(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setMutedProfiles((current) => current.filter((profile) => profile.id !== profileId));
    toast.success('User unmuted.');
  }

  async function unhideContent(contentType: HiddenContentSummary['content_type'], contentId: string) {
    setSafetyBusyKey(`hide:${contentType}:${contentId}`);
    const { error } = await supabase
      .from('user_hidden_content')
      .delete()
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId);

    setSafetyBusyKey(null);

    if (error) {
      toast.error(error.message);
      return;
    }

    setHiddenItems((current) => current.filter((item) => !(item.content_type === contentType && item.content_id === contentId)));
    toast.success('Content restored to your feed.');
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
            {/* Avatar with upload — label approach works on iOS Safari */}
            <div className="relative">
              <div className="relative w-16 h-16 rounded-full bg-white/20 border-2 border-white/40 flex items-center justify-center text-white text-xl font-bold overflow-hidden">
                {avatarUrl
                  ? <Image src={avatarUrl} alt="avatar" fill sizes="64px" className="object-cover" />
                  : initials}
              </div>
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-white flex items-center justify-center shadow-md border border-gray-100 ${uploading ? 'opacity-60' : 'cursor-pointer'}`}
                title="Change photo"
              >
                {uploading
                  ? <span className="w-3 h-3 border-2 border-[#7B1A1A] border-t-transparent rounded-full animate-spin" />
                  : <Camera size={12} className="text-[#7B1A1A]" />}
              </label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                className="hidden"
                disabled={uploading}
                onChange={uploadAvatar}
              />
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

      <div className="bg-white rounded-2xl border border-gray-100 p-4 space-y-4">
        <div>
          <p className="text-xs text-gray-400 font-medium uppercase tracking-wider">Safety & Visibility</p>
          <p className="text-sm text-gray-600 mt-1">
            Manage the people and posts you have hidden, muted, or blocked.
          </p>
        </div>

        {blockedProfiles.length === 0 && mutedProfiles.length === 0 && hiddenItems.length === 0 ? (
          <p className="text-sm text-gray-500">
            Nothing is hidden right now. Safety actions from Mandali and Vichaar will appear here when you use them.
          </p>
        ) : (
          <div className="space-y-4">
            {blockedProfiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <ShieldBan size={15} className="text-red-500" />
                  Blocked people
                </div>
                {blockedProfiles.map((item) => {
                  const busy = safetyBusyKey === `block:${item.id}`;
                  return (
                    <SafetyProfileRow
                      key={`blocked-${item.id}`}
                      profile={item}
                      actionLabel={busy ? 'Updating…' : 'Unblock'}
                      disabled={busy}
                      onAction={() => unblockProfile(item.id)}
                    />
                  );
                })}
              </div>
            )}

            {mutedProfiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <BellOff size={15} className="text-[#7B1A1A]" />
                  Muted people
                </div>
                {mutedProfiles.map((item) => {
                  const busy = safetyBusyKey === `mute:${item.id}`;
                  return (
                    <SafetyProfileRow
                      key={`muted-${item.id}`}
                      profile={item}
                      actionLabel={busy ? 'Updating…' : 'Unmute'}
                      disabled={busy}
                      onAction={() => unmuteProfile(item.id)}
                    />
                  );
                })}
              </div>
            )}

            {hiddenItems.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold text-gray-800">
                  <EyeOff size={15} className="text-[#7B1A1A]" />
                  Hidden content
                </div>
                {hiddenItems.map((item) => {
                  const busy = safetyBusyKey === `hide:${item.content_type}:${item.content_id}`;
                  return (
                    <div key={`${item.content_type}:${item.content_id}`} className="rounded-2xl border border-gray-100 px-3 py-3 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-2xl bg-[#7B1A1A]/8 text-[#7B1A1A] flex items-center justify-center flex-shrink-0">
                        <EyeOff size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 truncate">{item.title}</p>
                        <p className="text-xs text-gray-500">{item.subtitle}</p>
                      </div>
                      <button
                        onClick={() => unhideContent(item.content_type, item.content_id)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-full border border-[#7B1A1A]/20 text-[#7B1A1A] text-xs font-semibold hover:bg-[#7B1A1A]/5 transition disabled:opacity-60"
                      >
                        {busy ? 'Updating…' : 'Unhide'}
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ── Edit Form ── */}
      {editing && (
        <div className="bg-white rounded-2xl border border-orange-100 p-5 space-y-4 fade-in">
          <h2 className="font-display font-semibold text-lg text-gray-900">Edit Profile</h2>

          {/* ── Tradition — locked at signup, not editable ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Tradition</label>
              <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock size={9} /> Set at signup
              </span>
            </div>
            {(() => {
              const t = TRADITIONS.find(t => t.value === form.tradition);
              return t ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-gray-50 border border-gray-200">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm text-gray-800">{t.label}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">No tradition set — contact support to update.</p>
              );
            })()}
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
        <button
          onClick={sendTestNotification}
          disabled={sendingTestNotification}
          className="glass-button-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-[#7B1A1A] font-medium disabled:opacity-60"
        >
          <span>🔔</span>
          <span>{sendingTestNotification ? 'Sending test notification…' : 'Send test notification'}</span>
        </button>
        <p className="text-xs text-gray-400">
          Use this to verify both the bell feed and browser push on your current device.
        </p>
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

function SafetyProfileRow({
  profile,
  actionLabel,
  disabled,
  onAction,
}: {
  profile: SafetyProfileSummary;
  actionLabel: string;
  disabled: boolean;
  onAction: () => void;
}) {
  const initials = getInitials(profile.full_name || profile.username || 'S');

  return (
    <div className="rounded-2xl border border-gray-100 px-3 py-3 flex items-center gap-3">
      <div className="relative w-10 h-10 rounded-full bg-gradient-sacred text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
        {profile.avatar_url
          ? <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900 truncate">{profile.full_name || profile.username}</p>
        <p className="text-xs text-gray-500 truncate">{profile.username ? `@${profile.username}` : 'Sanatana Sangam member'}</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="px-3 py-1.5 rounded-full border border-[#7B1A1A]/20 text-[#7B1A1A] text-xs font-semibold hover:bg-[#7B1A1A]/5 transition disabled:opacity-60"
      >
        {actionLabel}
      </button>
    </div>
  );
}

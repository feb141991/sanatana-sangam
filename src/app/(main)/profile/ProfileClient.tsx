'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan, X } from 'lucide-react';
import { createClient } from '@/lib/supabase';
import type { HiddenContentSummary, SafetyProfileSummary } from '@/lib/user-safety';
import { getInitials, ISHTA_DEVATAS, SAMPRADAYAS, SPIRITUAL_LEVELS, TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getIshtaDevataLabel, getSampradayaLabel } from '@/lib/utils';
import { APP_LANGUAGES, MEANING_LANGUAGE_OPTIONS, SCRIPTURE_SCRIPT_OPTIONS, getLanguageLabel } from '@/lib/language-preferences';
import type { TraditionKey } from '@/lib/traditions';
import { useLocation } from '@/lib/LocationContext';
import { getPlayerId, getPermissionState, logoutFromOneSignal } from '@/lib/onesignal';
import type { Profile } from '@/types/database';
import { MetricTile, SurfaceSection } from '@/components/ui';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/useProfile';
import type { ProfileUpdate } from '@/lib/api/profile';

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
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-2xl">{badge.emoji}</span>
          <div>
            <p className="type-card-heading">{badge.label}</p>
            <p className="type-card-label">Seva level</p>
          </div>
        </div>
        <div className="text-right">
          <p className="type-metric">{score}</p>
          <p className="type-micro">seva points</p>
        </div>
      </div>
      <div className="h-2.5 rounded-full overflow-hidden bg-white/10">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand-primary), var(--brand-secondary))' }} />
      </div>
      {nextLevel && (
        <p className="type-micro mt-1.5 text-right">
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
    <div className="glass-panel rounded-2xl p-4">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <span className="text-base">✨</span>
          <p className="type-card-heading">Profile {pct}% complete</p>
        </div>
        <button onClick={onEdit}
          className="type-chip rounded-full px-3 py-1 text-[#1c1c1a] transition"
          style={{ background: 'var(--brand-primary)' }}>
          Complete
        </button>
      </div>
      <div className="h-2 rounded-full overflow-hidden bg-white/10">
        <div className="h-full rounded-full transition-all"
          style={{ width: `${pct}%`, background: 'linear-gradient(90deg, var(--brand-secondary), var(--brand-primary))' }} />
      </div>
      {missing.length > 0 && (
        <p className="type-micro mt-1.5">
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
  const profileQuery = useProfileQuery(userId, profile);
  const updateProfileMutation = useUpdateProfileMutation(userId);
  const liveProfile = profileQuery.data ?? profile;
  const [editing,   setEditing]   = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [showNotificationAdvanced, setShowNotificationAdvanced] = useState(false);
  const [showNotificationDiagnostics, setShowNotificationDiagnostics] = useState(false);
  const [safetyBusyKey, setSafetyBusyKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((profile as any)?.avatar_url ?? null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [browserPushSubscriptionId, setBrowserPushSubscriptionId] = useState<string | null>(null);
  const [blockedProfiles, setBlockedProfiles] = useState(initialBlockedProfiles);
  const [mutedProfiles, setMutedProfiles] = useState(initialMutedProfiles);
  const [hiddenItems, setHiddenItems] = useState(initialHiddenItems);
  const [form, setForm] = useState({
    full_name:        liveProfile?.full_name        ?? '',
    bio:              liveProfile?.bio              ?? '',
    city:             liveProfile?.city             ?? '',
    country:          liveProfile?.country          ?? '',
    tradition:        (liveProfile as any)?.tradition        ?? '',
    sampradaya:       liveProfile?.sampradaya       ?? '',
    ishta_devata:     liveProfile?.ishta_devata     ?? '',
    spiritual_level:  liveProfile?.spiritual_level  ?? 'jigyasu',
    kul:              liveProfile?.kul              ?? '',
    gotra:            liveProfile?.gotra            ?? '',
    kul_devata:       (liveProfile as any)?.kul_devata       ?? '',
    home_town:        (liveProfile as any)?.home_town        ?? '',
    custom_greeting:  (liveProfile as any)?.custom_greeting  ?? '',
    app_language:     (liveProfile as any)?.app_language     ?? 'en',
    scripture_script: (liveProfile as any)?.scripture_script ?? 'original',
    show_transliteration: (liveProfile as any)?.show_transliteration ?? true,
    meaning_language: (liveProfile as any)?.meaning_language ?? 'en',
  });

  const activeTradition = (form.tradition || 'hindu') as TraditionKey;
  const sampradayaOptions = SAMPRADAYAS_BY_TRADITION[activeTradition] ?? SAMPRADAYAS_BY_TRADITION['hindu'];
  const ishtaDevataOptions = ISHTA_DEVATAS_BY_TRADITION[activeTradition] ?? ISHTA_DEVATAS_BY_TRADITION['hindu'];
  const sampradayaLabel = getSampradayaLabel(form.tradition);
  const ishtaDevataLabel = getIshtaDevataLabel(form.tradition);

  const { coords, city: liveCity, country: liveCountry, countryCode: liveCountryCode } = useLocation();

  const devata    = ISHTA_DEVATAS.find((d) => d.value === liveProfile?.ishta_devata);
  const sampr     = SAMPRADAYAS.find((s)  => s.value  === liveProfile?.sampradaya);
  const initials  = getInitials(liveProfile?.full_name ?? 'S');
  const sevaScore = liveProfile?.seva_score ?? 0;
  const streak    = (liveProfile as any)?.shloka_streak ?? 0;
  const profileCountryCode = (liveProfile as any)?.country_code ?? null;
  const profileTimezone = (liveProfile as any)?.timezone ?? null;
  const onesignalPlayerId = (liveProfile as any)?.onesignal_player_id ?? null;
  const [notificationPrefs, setNotificationPrefs] = useState({
    wants_festival_reminders: (liveProfile as any)?.wants_festival_reminders ?? true,
    wants_shloka_reminders: (liveProfile as any)?.wants_shloka_reminders ?? true,
    wants_community_notifications: (liveProfile as any)?.wants_community_notifications ?? true,
    wants_family_notifications: (liveProfile as any)?.wants_family_notifications ?? true,
    notification_quiet_hours_start: (liveProfile as any)?.notification_quiet_hours_start ?? 22,
    notification_quiet_hours_end: (liveProfile as any)?.notification_quiet_hours_end ?? 7,
  });

  // Silently save coords + city + country + country_code when location resolves
  useEffect(() => {
    if (!coords || !userId) return;
    const isSame =
      liveProfile?.latitude  && Math.abs(coords.lat - (liveProfile.latitude  ?? 0)) < 0.05 &&
      liveProfile?.longitude && Math.abs(coords.lon - (liveProfile.longitude ?? 0)) < 0.05;
    if (isSame) return;

    const update: Record<string, any> = {
      latitude:  coords.lat,
      longitude: coords.lon,
    };
    if (liveCity        && !liveProfile?.city)         update.city         = liveCity;
    if (liveCountry     && !liveProfile?.country)      update.country      = liveCountry;
    if (liveCountryCode && !profileCountryCode)
                                                   update.country_code = liveCountryCode;
    supabase.from('profiles').update(update).eq('id', userId);
  }, [coords, liveCity, liveCountry, liveCountryCode, liveProfile?.latitude, liveProfile?.longitude, liveProfile?.city, liveProfile?.country, profileCountryCode, supabase, userId]);

  // Save OneSignal player ID when permission is granted
  useEffect(() => {
    if (!userId) return;
    if (getPermissionState() !== 'granted') return;
    if (onesignalPlayerId) return; // already saved
    getPlayerId().then((id) => {
      if (id) supabase.from('profiles').update({ onesignal_player_id: id }).eq('id', userId);
    });
  }, [onesignalPlayerId, supabase, userId]);

  useEffect(() => {
    if (!userId || typeof window === 'undefined') return;
    const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (!browserTimeZone || browserTimeZone === profileTimezone) return;
    supabase.from('profiles').update({ timezone: browserTimeZone }).eq('id', userId);
  }, [profileTimezone, supabase, userId]);

  useEffect(() => {
    setBrowserPermission(getPermissionState());
    getPlayerId().then((id) => setBrowserPushSubscriptionId(id));
  }, []);

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
    try {
      await updateProfileMutation.mutateAsync(formToSave);
      toast.success('Profile updated 🙏');
      setEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  }

  async function patchProfile(payload: ProfileUpdate, successMessage: string) {
    try {
      await updateProfileMutation.mutateAsync(payload);
      toast.success(successMessage);
      router.refresh();
      return true;
    } catch (error: any) {
      toast.error(error.message);
      return false;
    }
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

  async function saveNotificationPreferences() {
    setSavingNotificationPrefs(true);
    try {
      await patchProfile(notificationPrefs, 'Notification preferences updated.');
    } finally {
      setSavingNotificationPrefs(false);
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

  const traditionLabel = TRADITIONS.find(t => t.value === (liveProfile as any)?.tradition);
  const identityRows = [
    { label: 'Tradition',    value: traditionLabel ? `${traditionLabel.emoji} ${traditionLabel.label}` : null, emoji: null },
    { label: sampr ? getSampradayaLabel((liveProfile as any)?.tradition) : 'Sampradaya', value: sampr?.label, emoji: '🏛️' },
    { label: devata ? getIshtaDevataLabel((liveProfile as any)?.tradition) : 'Ishta Devata', value: devata ? `${devata.emoji} ${devata.label}` : null, emoji: null },
    { label: 'Gotra',        value: liveProfile?.gotra,                                  emoji: '📿' },
    { label: 'Kul Devata',   value: (liveProfile as any)?.kul_devata,                   emoji: '🪔' },
    { label: 'Home Town',    value: (liveProfile as any)?.home_town,                    emoji: '🏡' },
    { label: 'Time Zone',    value: profileTimezone,                                emoji: '🕰️' },
  ].filter((r) => r.value);
  const pathRows = identityRows.filter((row) => ['Tradition', 'Gotra', 'Kul Devata'].includes(row.label));
  const practiceRows = identityRows.filter((row) => ['Sampradaya', 'Ishta Devata'].includes(row.label));
  const placeRows = [
    { label: 'Current place', value: [liveProfile?.city, liveProfile?.country].filter(Boolean).join(', '), emoji: '📍' },
    { label: 'Home Town', value: (liveProfile as any)?.home_town, emoji: '🏡' },
    { label: 'Time Zone', value: profileTimezone, emoji: '🕰️' },
  ].filter((row) => row.value);
  const languageRows = [
    { label: 'App language', value: getLanguageLabel(APP_LANGUAGES, (liveProfile as any)?.app_language), emoji: '🌐' },
    { label: 'Scripture view', value: getLanguageLabel(SCRIPTURE_SCRIPT_OPTIONS, (liveProfile as any)?.scripture_script), emoji: '📜' },
    { label: 'Transliteration', value: (liveProfile as any)?.show_transliteration ? 'Shown' : 'Hidden', emoji: '🔤' },
    { label: 'Meaning language', value: getLanguageLabel(MEANING_LANGUAGE_OPTIONS, (liveProfile as any)?.meaning_language), emoji: '🈯' },
  ];

  return (
    <div className="space-y-4 fade-in">

      {showAvatarPreview && avatarUrl && (
        <AvatarPreviewModal
          avatarUrl={avatarUrl}
          fullName={profile?.full_name ?? profile?.username ?? 'Profile photo'}
          onClose={() => setShowAvatarPreview(false)}
        />
      )}

      {/* ── Profile Completion Bar ── */}
      <CompletionBar profile={liveProfile} onEdit={() => setEditing(true)} />

      {/* ── Hero Card ── */}
      <div className="glass-panel rounded-2xl p-5">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            {/* Avatar with upload — label approach works on iOS Safari */}
            <div className="relative">
              <button
                type="button"
                onClick={() => avatarUrl && setShowAvatarPreview(true)}
                disabled={!avatarUrl}
                className={`relative w-16 h-16 rounded-full bg-[color:var(--brand-primary-soft)] border border-[rgba(212,166,70,0.16)] flex items-center justify-center text-[color:var(--brand-primary-strong)] text-xl font-medium overflow-hidden ${avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                title={avatarUrl ? 'View profile photo' : 'No profile photo yet'}
              >
                {avatarUrl
                  ? <Image src={avatarUrl} alt="avatar" fill sizes="64px" className="object-cover" />
                  : initials}
              </button>
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(212,166,70,0.16)] bg-[color:var(--surface-soft)] shadow-md ${uploading ? 'opacity-60' : 'cursor-pointer'}`}
                title="Change photo"
              >
                {uploading
                  ? <span className="w-3 h-3 border-2 border-[color:var(--brand-primary)] border-t-transparent rounded-full animate-spin" />
                  : <Camera size={12} className="text-[color:var(--brand-primary)]" />}
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
              <h1 className="type-screen-title">{liveProfile?.full_name}</h1>
              <p className="type-body">@{liveProfile?.username}</p>
              {(liveProfile?.city || liveProfile?.country) && (
                <p className="type-micro mt-0.5 flex items-center gap-1">
                  <MapPin size={10} />
                  {[liveProfile?.city, liveProfile?.country].filter(Boolean).join(', ')}
                </p>
              )}
            </div>
          </div>
          <button onClick={() => setEditing(!editing)}
            className="rounded-xl bg-[color:var(--brand-primary-soft)] p-2 text-[color:var(--brand-primary-strong)] transition hover:bg-[color:var(--brand-accent-soft)]">
            <Edit3 size={16} />
          </button>
        </div>

        <div className="grid grid-cols-3 gap-2">
          <MetricTile label="Threads" value={threadCount} className="bg-white/8 border-white/10" />
          <MetricTile label="Posts" value={postCount} className="bg-white/8 border-white/10" />
          <MetricTile label="Streak" value={`${streak}🔥`} className="bg-white/8 border-white/10" />
        </div>
      </div>

      {/* ── Seva Score ── */}
      <SevaScoreBar score={sevaScore} />

      <div className="grid gap-4">
        {(profile?.bio || pathRows.length > 0) && (
          <SurfaceSection
            eyebrow="My Path"
            title="Identity and belonging"
            description="Your dharmic profile."
          >
            {liveProfile?.bio ? (
              <div className="rounded-[1.35rem] bg-[var(--brand-primary-soft)] px-4 py-3">
                <p className="text-[10px] uppercase tracking-[0.16em] font-semibold theme-dim mb-2">About</p>
                <p className="text-sm theme-ink leading-relaxed">{liveProfile.bio}</p>
              </div>
            ) : null}
            {pathRows.length > 0 ? (
              <div className="divide-y divide-white/5">
                {pathRows.map(({ label, value, emoji }) => (
                  <div key={label} className="flex items-center justify-between py-2.5 gap-4">
                    <span className="text-sm theme-dim">{emoji ? `${emoji} ` : ''}{label}</span>
                    <span className="text-sm font-medium theme-ink text-right">{value}</span>
                  </div>
                ))}
              </div>
            ) : null}
          </SurfaceSection>
        )}

        {practiceRows.length > 0 && (
          <SurfaceSection
            eyebrow="My Practice"
            title="How you walk the path"
            description="Your practice details."
          >
            <div className="divide-y divide-white/5">
              {practiceRows.map(({ label, value, emoji }) => (
                <div key={label} className="flex items-center justify-between py-2.5 gap-4">
                  <span className="text-sm theme-dim">{emoji ? `${emoji} ` : ''}{label}</span>
                  <span className="text-sm font-medium theme-ink text-right">{value}</span>
                </div>
              ))}
            </div>
          </SurfaceSection>
        )}

        {placeRows.length > 0 && (
          <SurfaceSection
            eyebrow="My Place"
            title="Where sacred time follows you"
            description="Your place and time details."
          >
            <div className="divide-y divide-white/5">
              {placeRows.map(({ label, value, emoji }) => (
                <div key={label} className="flex items-center justify-between py-2.5 gap-4">
                  <span className="text-sm theme-dim">{emoji ? `${emoji} ` : ''}{label}</span>
                  <span className="text-sm font-medium theme-ink text-right">{value}</span>
                </div>
              ))}
            </div>
          </SurfaceSection>
        )}
      </div>

      <SurfaceSection
        eyebrow="Notifications"
        title="What should reach you"
        description="Control reminders and quiet hours."
      >
        <div className="space-y-4">
          {[
            {
              key: 'wants_shloka_reminders',
              title: 'Daily shloka reminders',
              description: 'Evening reminders for the day’s reading.',
            },
            {
              key: 'wants_festival_reminders',
              title: 'Festival reminders',
              description: 'Morning reminders for observances.',
            },
            {
              key: 'wants_community_notifications',
              title: 'Community updates',
              description: 'Mandali replies, RSVPs, and nearby activity.',
            },
            {
              key: 'wants_family_notifications',
              title: 'Family updates',
              description: 'Kul reminders, dates, and family activity.',
            },
          ].map((item) => {
            const checked = notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean;
            return (
              <label key={item.key} className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium theme-ink">{item.title}</p>
                  <p className="text-xs theme-dim mt-1 leading-relaxed">{item.description}</p>
                </div>
                <input
                  type="checkbox"
                  checked={checked}
                  onChange={(e) => setNotificationPrefs((current) => ({ ...current, [item.key]: e.target.checked }))}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
              </label>
            );
          })}

          <div className="flex flex-wrap items-center gap-3">
            <button
              onClick={saveNotificationPreferences}
              disabled={savingNotificationPrefs}
              className="glass-button-primary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm text-white font-semibold disabled:opacity-60"
            >
              <span>🔔</span>
              <span>{savingNotificationPrefs ? 'Saving…' : 'Save notification preferences'}</span>
            </button>
            <p className="text-xs theme-dim">
              Save the reminder choices above.
            </p>
          </div>

          <div className="rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-4 space-y-3">
            <button
              type="button"
              onClick={() => setShowNotificationAdvanced((current) => !current)}
              className="flex w-full items-center justify-between gap-3 text-left"
            >
              <div>
                <p className="text-sm font-medium theme-ink">Advanced notification controls</p>
                <p className="text-xs theme-dim mt-1">Quiet hours, device status, and a delivery check.</p>
              </div>
              <span className="type-chip rounded-full border border-white/8 px-3 py-1 text-[color:var(--text-cream)]">
                {showNotificationAdvanced ? 'Hide' : 'Show'}
              </span>
            </button>
            {showNotificationAdvanced ? (
              <>
                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 space-y-3">
                  <div>
                    <p className="text-sm font-medium theme-ink">Quiet hours</p>
                    <p className="text-xs theme-dim mt-1">
                      Reminders skip this local window.
                    </p>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-medium theme-dim mb-1.5">Start</label>
                      <select
                        value={notificationPrefs.notification_quiet_hours_start}
                        onChange={(e) => setNotificationPrefs((current) => ({ ...current, notification_quiet_hours_start: Number(e.target.value) }))}
                        className="surface-select px-3 py-2.5 outline-none text-sm"
                      >
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <option key={`start-${hour}`} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs font-medium theme-dim mb-1.5">End</label>
                      <select
                        value={notificationPrefs.notification_quiet_hours_end}
                        onChange={(e) => setNotificationPrefs((current) => ({ ...current, notification_quiet_hours_end: Number(e.target.value) }))}
                        className="surface-select px-3 py-2.5 outline-none text-sm"
                      >
                        {Array.from({ length: 24 }).map((_, hour) => (
                          <option key={`end-${hour}`} value={hour}>{String(hour).padStart(2, '0')}:00</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <p className="text-xs theme-dim">
                    Local time zone: {profileTimezone ?? 'UTC fallback until your browser reports a timezone'}
                  </p>
                </div>

                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 space-y-3">
                  <button
                    onClick={sendTestNotification}
                    disabled={sendingTestNotification}
                    className="glass-button-secondary inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium disabled:opacity-60"
                    style={{ color: 'var(--text-cream)' }}
                  >
                    <span>🔔</span>
                    <span>{sendingTestNotification ? 'Sending test notification…' : 'Send test notification'}</span>
                  </button>
                  <p className="text-xs theme-dim">
                    Use this only to verify the bell feed and browser push on this device.
                  </p>
                </div>

                <div className="rounded-2xl border border-white/6 bg-white/[0.03] px-4 py-4 space-y-3">
                  <button
                    type="button"
                    onClick={() => setShowNotificationDiagnostics((current) => !current)}
                    className="flex w-full items-center justify-between gap-3 text-left"
                  >
                    <div>
                      <p className="text-sm font-medium theme-ink">Notification diagnostics</p>
                      <p className="text-xs theme-dim mt-1">Permission, push link status, and reminder targeting.</p>
                    </div>
                    <span className="type-chip rounded-full border border-white/8 px-3 py-1 text-[color:var(--text-cream)]">
                      {showNotificationDiagnostics ? 'Hide' : 'Show'}
                    </span>
                  </button>
                  {showNotificationDiagnostics ? (
                    <>
                      <div className="grid gap-2 sm:grid-cols-2">
                        {[
                          { label: 'Browser permission', value: browserPermission },
                          { label: 'Push linked on this device', value: browserPushSubscriptionId ? 'Yes' : 'No' },
                          { label: 'Festival reminders', value: notificationPrefs.wants_festival_reminders ? 'On' : 'Off' },
                          { label: 'Shloka reminders', value: notificationPrefs.wants_shloka_reminders ? 'On' : 'Off' },
                          { label: 'Community updates', value: notificationPrefs.wants_community_notifications ? 'On' : 'Off' },
                          { label: 'Family updates', value: notificationPrefs.wants_family_notifications ? 'On' : 'Off' },
                        ].map((item) => (
                          <div key={item.label} className="rounded-xl bg-white/[0.04] px-3 py-3 border border-white/6">
                            <p className="text-[10px] uppercase tracking-[0.16em] theme-dim font-semibold">{item.label}</p>
                            <p className="text-sm font-medium theme-ink mt-1">{item.value}</p>
                          </div>
                        ))}
                      </div>
                      <p className="text-xs theme-dim">
                        Target windows: <span className="font-medium theme-ink">09:00</span> for festivals and <span className="font-medium theme-ink">19:00</span> for shloka reminders.
                      </p>
                    </>
                  ) : null}
                </div>
              </>
            ) : null}
          </div>
        </div>
      </SurfaceSection>

      <SurfaceSection
        eyebrow="Safety"
        title="Visibility and boundaries"
        description="Manage hidden, muted, and blocked activity."
      >

        {blockedProfiles.length === 0 && mutedProfiles.length === 0 && hiddenItems.length === 0 ? (
          <p className="text-sm theme-dim">
            Nothing hidden right now.
          </p>
        ) : (
          <div className="space-y-4">
            {blockedProfiles.length > 0 && (
              <div className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-semibold theme-ink">
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
                <div className="flex items-center gap-2 text-sm font-semibold theme-ink">
                  <BellOff size={15} className="text-[color:var(--brand-primary)]" />
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
                <div className="flex items-center gap-2 text-sm font-semibold theme-ink">
                  <EyeOff size={15} className="text-[color:var(--brand-primary)]" />
                  Hidden content
                </div>
                {hiddenItems.map((item) => {
                  const busy = safetyBusyKey === `hide:${item.content_type}:${item.content_id}`;
                  return (
                    <div key={`${item.content_type}:${item.content_id}`} className="rounded-2xl border border-white/8 bg-white/[0.03] px-3 py-3 flex items-center gap-3">
                      <div
                        className="w-10 h-10 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(124, 58, 45, 0.08)', color: 'var(--brand-primary)' }}
                      >
                        <EyeOff size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium theme-ink truncate">{item.title}</p>
                        <p className="text-xs theme-dim">{item.subtitle}</p>
                      </div>
                      <button
                        onClick={() => unhideContent(item.content_type, item.content_id)}
                        disabled={busy}
                        className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60"
                        style={{
                          border: '1px solid rgba(124, 58, 45, 0.18)',
                          color: 'var(--brand-primary)',
                          background: 'rgba(40,40,37,0.92)',
                        }}
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
      </SurfaceSection>

      <SurfaceSection
        eyebrow="Language"
        title="How sacred text should read"
        description="Keep app language, script view, and meaning preferences separate."
      >
        {/* Quick inline app language switcher */}
        <div className="mb-4">
          <p className="text-xs text-[color:var(--brand-muted)] mb-2">🌐 App language</p>
          <div className="flex gap-2">
            {APP_LANGUAGES.map((lang) => {
              const active = ((liveProfile as any)?.app_language ?? 'en') === lang.value;
              return (
                <button
                  key={lang.value}
                  onClick={() => patchProfile({ app_language: lang.value }, `Language set to ${lang.label} 🙏`)}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={active ? {
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
                    color: '#1c1c1a',
                    borderColor: 'transparent',
                  } : {
                    background: 'rgba(212,166,70,0.06)',
                    color: 'var(--brand-muted)',
                    borderColor: 'rgba(212,166,70,0.14)',
                  }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[color:var(--brand-muted)]/60 mt-1.5">Changes apply on next page load</p>
        </div>
        <div className="divide-y divide-white/5">
          {languageRows.slice(1).map(({ label, value, emoji }) => (
            <div key={label} className="flex items-center justify-between py-2.5 gap-4">
              <span className="text-sm theme-dim">{emoji ? `${emoji} ` : ''}{label}</span>
              <span className="text-sm font-medium theme-ink text-right">{value}</span>
            </div>
          ))}
        </div>
      </SurfaceSection>

      {/* ── Edit Form ── */}
      {editing && (
        <div
          className="surface-sheet rounded-2xl p-5 space-y-4 fade-in"
        >
          <h2 className="font-display font-semibold text-lg theme-ink">Edit Profile</h2>

          {/* ── Tradition — locked at signup, not editable ── */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium theme-muted">Tradition</label>
              <span className="flex items-center gap-1 text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                <Lock size={9} /> Set at signup
              </span>
            </div>
            {(() => {
              const t = TRADITIONS.find(t => t.value === form.tradition);
              return t ? (
                <div className="flex items-center gap-3 px-4 py-3 rounded-xl bg-white/[0.04] border border-white/8">
                  <span className="text-2xl">{t.emoji}</span>
                  <div>
                    <p className="font-semibold text-sm theme-ink">{t.label}</p>
                    <p className="text-xs theme-dim mt-0.5">{t.desc}</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm theme-dim italic">No tradition set — contact support to update.</p>
              );
            })()}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My path</p>
            {[
              { label: 'Full Name', key: 'full_name', placeholder: 'Your full name' },
              { label: 'Home Town', key: 'home_town', placeholder: 'Where you are from' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium theme-muted mb-1.5">{label}</label>
                <input type="text" placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="surface-input px-4 py-2.5 outline-none text-sm"
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400">My practice</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{sampradayaLabel}</label>
              <select value={form.sampradaya}
                onChange={(e) => setForm({ ...form, sampradaya: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}>
                <option value="">Select {sampradayaLabel.toLowerCase()}</option>
                {sampradayaOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{ishtaDevataLabel}</label>
              <select value={form.ishta_devata}
                onChange={(e) => setForm({ ...form, ishta_devata: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}>
                <option value="">Select {ishtaDevataLabel.toLowerCase()}</option>
                {ishtaDevataOptions.map((d) => <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>)}
              </select>
            </div>
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
                    className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm"
                    style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
                  />
                </div>
              ))}
            </>
          )}

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400">My place</p>
            {[
              { label: 'City', key: 'city', placeholder: 'Current city' },
              { label: 'Country', key: 'country', placeholder: 'Country' },
            ].map(({ label, key, placeholder }) => (
              <div key={key}>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
                <input type="text" placeholder={placeholder}
                  value={(form as Record<string, string>)[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm"
                  style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
                />
              </div>
            ))}
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400">My voice</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Custom Greeting (optional)</label>
              <input type="text" placeholder="e.g. Waheguru Ji Ka Khalsa, Namo Buddhaya…"
                value={form.custom_greeting}
                onChange={(e) => setForm({ ...form, custom_greeting: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
              />
              <p className="text-xs text-gray-400 mt-1">Overrides the auto greeting on your home screen</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Bio</label>
              <textarea placeholder="Share a little about your spiritual journey…"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                rows={3}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none resize-none text-sm"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold text-gray-400">Language and script</p>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">App language</label>
              <select
                value={form.app_language}
                onChange={(e) => setForm({ ...form, app_language: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
              >
                {APP_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Scripture view</label>
              <select
                value={form.scripture_script}
                onChange={(e) => setForm({ ...form, scripture_script: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
              >
                {SCRIPTURE_SCRIPT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-gray-100 px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium text-gray-900">Show transliteration</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">Keep Roman transliteration visible when available.</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(form.show_transliteration)}
                  onChange={(e) => setForm({ ...form, show_transliteration: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded border-gray-300"
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Meaning language</label>
              <select
                value={form.meaning_language}
                onChange={(e) => setForm({ ...form, meaning_language: e.target.value })}
                className="w-full px-4 py-2.5 rounded-xl border border-gray-200 outline-none text-sm bg-white"
                style={{ borderColor: 'rgba(17, 24, 39, 0.12)' }}
              >
                {MEANING_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={() => setEditing(false)}
              className="flex-1 py-3 border border-gray-200 text-gray-600 rounded-xl text-sm">
              Cancel
            </button>
            <button onClick={saveProfile} disabled={saving}
              className="flex-1 py-3 text-white font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
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
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60"
        style={{
          border: '1px solid rgba(124, 58, 45, 0.18)',
          color: 'var(--brand-primary)',
          background: 'rgba(255,255,255,0.85)',
        }}
      >
        {actionLabel}
      </button>
    </div>
  );
}

function AvatarPreviewModal({
  avatarUrl,
  fullName,
  onClose,
}: {
  avatarUrl: string;
  fullName: string;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 bg-black/75 backdrop-blur-sm px-4 py-6 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-2 right-0 z-10 w-10 h-10 rounded-full bg-white/90 text-gray-700 flex items-center justify-center shadow-lg"
          aria-label="Close profile photo"
        >
          <X size={18} />
        </button>
        <div className="glass-panel rounded-[2rem] p-3">
          <div className="relative aspect-square w-full overflow-hidden rounded-[1.6rem] bg-white/20">
            <Image
              src={avatarUrl}
              alt={`${fullName} profile photo`}
              fill
              sizes="(max-width: 768px) 92vw, 420px"
              className="object-cover"
              priority
            />
          </div>
          <p className="text-center text-sm font-medium text-gray-700 mt-3">
            {fullName}
          </p>
        </div>
      </div>
    </div>
  );
}

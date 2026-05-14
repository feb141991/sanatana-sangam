'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan, X, Download, Loader2, ChevronLeft, Monitor, Moon, Sun, Star, MessageSquare, MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { APP } from '@/lib/config';
import { createClient } from '@/lib/supabase';
import type { HiddenContentSummary, SafetyProfileSummary } from '@/lib/user-safety';
import { getInitials, TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getIshtaDevataLabel, getSampradayaLabel } from '@/lib/utils';
import { APP_LANGUAGES, MEANING_LANGUAGE_OPTIONS, SCRIPTURE_SCRIPT_OPTIONS, TRANSLITERATION_LANGUAGE_OPTIONS } from '@/lib/language-preferences';
import type { TraditionKey } from '@/lib/traditions';
import { useLocation } from '@/lib/LocationContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';
import { getPlayerId, getPermissionState, logoutFromOneSignal } from '@/lib/onesignal';
import type { Profile } from '@/types/database';
import { ageToAshrama, ageFromDob, getAshramaMeta, type LifeStage, type GenderContext } from '@/lib/ashrama';
import { MetricTile, SurfaceSection } from '@/components/ui';
import CircularProgress from '@/components/ui/CircularProgress';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { ProfileUpdate } from '@/lib/api/profile';
import { usePremium } from '@/hooks/usePremium';
import { THEME_OPTIONS, type ThemePreference } from '@/lib/theme-preferences';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { updateAppIcon } from '@/lib/app-icon';
import { formatError } from '@/lib/error-handler';
import { inviteFriendsToWhatsApp } from '@/lib/whatsapp';
import { SACRED_RELICS, getUnlockedRelics } from '@/lib/relics';

// ── Practice path options per tradition (mirrors OnboardingClient) ─────────────
function getPracticePathOptions(tradition: TraditionKey | '') {
  switch (tradition) {
    case 'sikh':
      return [
        { key: 'general' as GenderContext, icon: '☬', label: 'Sangat path', sub: 'Nitnem, simran, seva and sangat' },
        { key: 'female'  as GenderContext, icon: '🌸', label: 'Kaur path', sub: 'Life-stage guidance with Sikh context' },
      ];
    case 'buddhist':
      return [
        { key: 'general' as GenderContext, icon: '☸️', label: 'Dharma path', sub: 'Refuge, mindfulness and daily practice' },
        { key: 'female'  as GenderContext, icon: '🪷', label: 'Householder path', sub: 'Life-stage guidance with Buddhist context' },
      ];
    case 'jain':
      return [
        { key: 'general' as GenderContext, icon: '🤲', label: 'Jain path', sub: 'Ahimsa, svadhyaya and daily reflection' },
        { key: 'female'  as GenderContext, icon: '🌸', label: 'Shravika path', sub: 'Life-stage guidance with Jain context' },
      ];
    default:
      return [
        { key: 'general' as GenderContext, icon: '🌿', label: 'General path', sub: 'Traditional practice for all' },
        { key: 'female'  as GenderContext, icon: '🌸', label: 'Stridharma path', sub: "Women’s tradition-specific duties" },
      ];
  }
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
  { key: 'date_of_birth', label: 'Date of Birth' },
];

function calcCompletion(profile: Profile | null): { pct: number; missing: string[] } {
  if (!profile) return { pct: 0, missing: COMPLETION_FIELDS.map(f => f.label) };
  const missing = COMPLETION_FIELDS
    .filter(f => !(profile as any)[f.key])
    .map(f => f.label);
  const pct = Math.round(((COMPLETION_FIELDS.length - missing.length) / COMPLETION_FIELDS.length) * 100);
  return { pct, missing };
}

// ── Profile Completion Bar ────────────────────────────────────────────────────
function CompletionBar({ profile, onEdit }: { profile: Profile | null; onEdit: () => void }) {
  const { pct, missing } = calcCompletion(profile);
  if (pct === 100) return null;

  return (
    <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
      {/* Circular completion ring */}
      <CircularProgress
        pct={pct}
        accent="var(--brand-secondary)"
        size={56}
        strokeWidth={5}
        label={<span className="text-xs font-bold" style={{ color: 'var(--brand-ink)' }}>{pct}%</span>}
      />
      {/* Label + CTA */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between mb-0.5">
          <p className="type-card-heading">Profile complete</p>
          <button onClick={onEdit}
            className="type-chip rounded-full px-3 py-1 text-[#1c1c1a] transition"
            style={{ background: 'var(--brand-primary)' }}>
            Complete
          </button>
        </div>
        {missing.length > 0 && (
          <p className="type-micro">
            Add: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
          </p>
        )}
      </div>
    </div>
  );
}

// ── Invite Code Generator ────────────────────────────────────────────────
function generateInviteCode(userId: string): string {
  return userId.replace(/-/g, '').slice(0, 8).toUpperCase();
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
  const router      = useRouter();
  const supabase    = useRef(createClient()).current;
  const queryClient = useQueryClient();
  const { setLang } = useLanguage();
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } = useThemePreference();
  const isPro       = usePremium();
  const profileQuery = useProfileQuery(userId, profile);
  const updateProfileMutation = useUpdateProfileMutation(userId);
  const liveProfile = profileQuery.data ?? profile;
  const [editing,   setEditing]   = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sendingTestNotification, setSendingTestNotification] = useState(false);
  const [savingNotificationPrefs, setSavingNotificationPrefs] = useState(false);
  const [reportLoading, setReportLoading] = useState(false);
  const [showNotificationAdvanced, setShowNotificationAdvanced] = useState(false);
  const [safetyBusyKey, setSafetyBusyKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((profile as any)?.avatar_url ?? null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
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
    transliteration_language: (liveProfile as any)?.transliteration_language ?? 'en',
    date_of_birth:    (liveProfile as any)?.date_of_birth    ?? '',
    gender_context:   ((liveProfile as any)?.gender_context  ?? 'general') as GenderContext,
  });

  const [localAppIcon, setLocalAppIcon] = useState<'normal' | 'pro'>('normal');

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('shoonaya_app_icon') as 'normal' | 'pro';
      if (saved) setLocalAppIcon(saved);
    }
  }, []);

  useEffect(() => {
    updateAppIcon(localAppIcon === 'pro');
  }, [localAppIcon]);

  const activeTradition = (form.tradition || 'hindu') as TraditionKey;
  const sampradayaOptions = SAMPRADAYAS_BY_TRADITION[activeTradition] ?? SAMPRADAYAS_BY_TRADITION['hindu'];
  const ishtaDevataOptions = ISHTA_DEVATAS_BY_TRADITION[activeTradition] ?? ISHTA_DEVATAS_BY_TRADITION['hindu'];
  const sampradayaLabel = getSampradayaLabel(form.tradition);
  const ishtaDevataLabel = getIshtaDevataLabel(form.tradition);

  const { coords, city: liveCity, country: liveCountry, countryCode: liveCountryCode } = useLocation();

  const initials  = getInitials(liveProfile?.full_name ?? 'S');
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
    // date_of_birth: empty string → null (date column rejects empty strings)
    const { tradition: _locked, date_of_birth, ...rest } = form;
    const formToSave = {
      ...rest,
      date_of_birth: date_of_birth || null,
    };
    try {
      await updateProfileMutation.mutateAsync(formToSave);
      toast.success('Profile updated 🙏');
      setEditing(false);
      router.refresh();
    } catch (error: any) {
      toast.error(formatError(error));
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
      toast.error(formatError(error));
      return false;
    }
  }

  async function downloadReport() {
    setReportLoading(true);
    try {
      const res  = await fetch('/api/user/report');
      if (!res.ok) throw new Error('Could not generate report');
      const data = await res.json();

      const tradition = data.profile?.tradition ?? 'hindu';
      const TRADITION_EMOJI: Record<string, string> = {
        hindu: '🕉️', sikh: '☬', buddhist: '☸️', jain: '🤲',
      };
      const tEmoji = TRADITION_EMOJI[tradition] ?? '🙏';

      const formatMins = (m: number) =>
        m >= 60 ? `${Math.floor(m / 60)}h ${m % 60}m` : `${m}m`;

      const heatmapHtml = (data.heatmap ?? []).map((d: any) => {
        const level = d.nitya >= 7 ? '#d4a030' : d.nitya > 0 ? '#d4a03066' : d.japa ? '#7B1A1A66' : '#e5e7eb';
        return `<div title="${d.date}" style="width:18px;height:18px;border-radius:4px;background:${level}"></div>`;
      }).join('');

      const mantrasHtml = (data.japa?.top_mantras ?? []).map(([name, count]: [string, number]) =>
        `<li>${name} — <strong>${count}</strong> session${count !== 1 ? 's' : ''}</li>`
      ).join('');

      const html = `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<title>Sadhana Report – ${data.profile?.name}</title>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f9f5ef; color: #2c2a25; padding: 24px; max-width: 720px; margin: 0 auto; }
  h1 { font-size: 24px; font-weight: 700; color: #1c1c1a; }
  h2 { font-size: 15px; font-weight: 700; color: #7B1A1A; margin-bottom: 10px; text-transform: uppercase; letter-spacing: 0.06em; }
  .card { background: #fff; border-radius: 16px; padding: 18px; margin-bottom: 16px; border: 1px solid rgba(0,0,0,0.07); box-shadow: 0 1px 4px rgba(0,0,0,0.05); }
  .meta { font-size: 13px; color: #888; margin-top: 4px; }
  .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .stat { text-align: center; padding: 12px; background: #fef9ef; border-radius: 12px; border: 1px solid rgba(200,146,74,0.2); }
  .stat .num { font-size: 28px; font-weight: 800; color: #c8920a; }
  .stat .label { font-size: 11px; color: #888; margin-top: 3px; }
  .heatmap { display: flex; flex-wrap: wrap; gap: 3px; }
  ul { padding-left: 18px; font-size: 14px; line-height: 2; }
  .badge { display: inline-block; background: rgba(200,146,74,0.15); color: #7B1A1A; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; margin-left: 8px; }
  .footer { text-align: center; font-size: 11px; color: #aaa; margin-top: 24px; }
  @media print { body { padding: 0; } }
</style>
</head>
<body>
<div style="margin-bottom:20px">
  <h1>${tEmoji} Sadhana Report</h1>
  <p class="meta">${data.profile?.name} · ${data.period?.from} to ${data.period?.to}</p>
</div>

<div class="card">
  <h2>Japa</h2>
  <div class="grid">
    <div class="stat"><div class="num">${data.japa?.sessions ?? 0}</div><div class="label">Sessions</div></div>
    <div class="stat"><div class="num">${data.japa?.total_malas ?? 0}</div><div class="label">Malas (108 beads)</div></div>
    <div class="stat"><div class="num">${formatMins(data.japa?.duration_minutes ?? 0)}</div><div class="label">Time in Japa</div></div>
  </div>
  ${mantrasHtml ? `<ul style="margin-top:12px">${mantrasHtml}</ul>` : ''}
</div>

<div class="card">
  <h2>Nitya Karma</h2>
  <div class="grid">
    <div class="stat"><div class="num">${data.nitya?.active_days ?? 0}</div><div class="label">Active days</div></div>
    <div class="stat"><div class="num">${data.nitya?.full_days ?? 0}</div><div class="label">Full sequences</div></div>
    <div class="stat"><div class="num">${data.nitya?.current_streak ?? 0}</div><div class="label">Current streak</div></div>
  </div>
  <p style="font-size:13px;color:#888;margin-top:10px">Longest streak in period: <strong>${data.nitya?.longest_streak ?? 0} days</strong></p>
</div>

<div class="card">
  <h2>30-Day Heatmap</h2>
  <div class="heatmap">${heatmapHtml}</div>
  <div style="display:flex;gap:16px;margin-top:10px;font-size:11px;color:#888">
    <span><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#d4a030;margin-right:4px;vertical-align:middle"></span>Full Nitya</span>
    <span><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#d4a03066;margin-right:4px;vertical-align:middle"></span>Partial Nitya</span>
    <span><span style="display:inline-block;width:12px;height:12px;border-radius:3px;background:#7B1A1A66;margin-right:4px;vertical-align:middle"></span>Japa only</span>
  </div>
</div>

<div class="card">
  <h2>Community</h2>
  <div class="grid">
    <div class="stat"><div class="num">${data.community?.posts ?? 0}</div><div class="label">Posts</div></div>
    <div class="stat"><div class="num">${data.community?.threads ?? 0}</div><div class="label">Discussions started</div></div>
    <div class="stat"><div class="num">${data.profile?.seva_score ?? 0}</div><div class="label">Seva score</div></div>
  </div>
</div>

<div class="footer">Generated by Shoonaya · ${new Date().toLocaleDateString()}</div>
</body>
</html>`;

      const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
      const url  = URL.createObjectURL(blob);
      const a    = Object.assign(document.createElement('a'), {
        href:     url,
        download: `sadhana-report-${data.period?.from}-to-${data.period?.to}.html`,
      });
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded 📊');
    } catch {
      toast.error('Could not generate report. Try again.');
    } finally {
      setReportLoading(false);
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
      // Invalidate the React Query notifications cache so the bell badge and
      // list update immediately (Realtime may also catch it, but this is the
      // direct fallback if the Realtime channel hasn't connected yet).
      queryClient.invalidateQueries({ queryKey: queryKeys.notifications(userId) });
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

  const hasSafetyItems = blockedProfiles.length > 0 || mutedProfiles.length > 0 || hiddenItems.length > 0;
  const themeIconMap = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } satisfies Record<ThemePreference, typeof Monitor>;

  return (
    <div className="divine-home-shell min-h-screen bg-[var(--divine-bg)] -mx-3 sm:-mx-4 relative selection:bg-[#C5A059]/30">
      <div className="relative pb-24">
        
        {/* ── Zenith Profile Hero ────────────────────────────────────────────── */}
        <div className="relative min-h-[300px] overflow-hidden">
          {/* Atmospheric background (matches home hero vibe) */}
          <div className="absolute inset-0 bg-gradient-to-br from-[#1c1c1a] via-[#2c1a0e] to-[#1c1c1a] opacity-65 dark:opacity-85" />
          <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-[var(--divine-bg)] to-transparent z-10" />
          
          {/* Header Controls Overlay */}
          <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-4 pt-5 pointer-events-none">
            <button
              onClick={() => router.back()}
              className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center pointer-events-auto transition-transform active:scale-90"
            >
              <ChevronLeft size={20} className="text-[#F2EAD6]" />
            </button>
            <div className="flex items-center gap-2 pointer-events-auto">
              <Link
                href="/messages"
                className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center transition-transform active:scale-90"
                title="Direct Messages"
              >
                <MessageSquare size={18} className="text-[#F2EAD6]" />
              </Link>
              <button 
                onClick={() => setEditing(!editing)}
                className="w-10 h-10 rounded-full glass-panel border border-white/10 flex items-center justify-center transition-transform active:scale-90"
                title="Edit Profile"
              >
                <Edit3 size={18} className="text-[#F2EAD6]" />
              </button>
            </div>
          </div>

          {/* Hero Content */}
          <div className="relative z-20 flex flex-col items-center pt-16 pb-8 px-5">
            {/* Avatar Cluster */}
            <div className="relative mb-5">
              <motion.button
                type="button"
                onClick={() => avatarUrl && setShowAvatarPreview(true)}
                disabled={!avatarUrl}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`relative w-24 h-24 rounded-full bg-white/10 border-2 border-white/20 p-1 flex items-center justify-center overflow-hidden shadow-2xl ${avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
              >
                <div className="relative w-full h-full rounded-full overflow-hidden bg-white/5">
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="avatar" fill sizes="96px" className="object-cover" />
                    : <span className="text-3xl font-serif text-[#F2EAD6]">{initials}</span>}
                </div>
              </motion.button>
              
              <label
                htmlFor="avatar-upload"
                className={`absolute bottom-1 right-1 flex h-8 w-8 items-center justify-center rounded-full border border-white/20 bg-[#C5A059] shadow-lg transition-transform active:scale-75 ${uploading ? 'opacity-60' : 'cursor-pointer'}`}
              >
                {uploading
                  ? <Loader2 size={14} className="text-white animate-spin" />
                  : <Camera size={14} className="text-white" />}
              </label>
              <input id="avatar-upload" type="file" accept="image/*" className="hidden" disabled={uploading} onChange={uploadAvatar} />
            </div>

            <motion.div 
              initial={{ y: 10, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
              className="text-center"
            >
              <div className="flex items-center justify-center gap-2 mb-1">
                <h1 className="text-2xl font-serif text-[var(--divine-text)] dark:text-white leading-tight drop-shadow-md">
                  {liveProfile?.full_name}
                </h1>
                {isPro && (
                  <div className="px-2 py-0.5 rounded-full bg-amber-400/20 border border-amber-400/30 flex items-center gap-1">
                    <Star size={10} className="text-amber-400 fill-amber-400" />
                    <span className="text-[9px] font-bold text-amber-400 uppercase tracking-wider">Pro</span>
                  </div>
                )}
              </div>
              <p className="text-sm text-[var(--divine-text)] dark:text-white/60 mb-2 font-medium opacity-60 dark:opacity-100">@{liveProfile?.username}</p>
              
              {(liveProfile?.city || liveProfile?.country) && (
                <div className="flex items-center justify-center gap-1.5 text-[11px] font-semibold text-[#C5A059] uppercase tracking-widest">
                  <MapPin size={10} strokeWidth={2.5} />
                  {[liveProfile?.city, liveProfile?.country].filter(Boolean).join(', ')}
                </div>
              )}
            </motion.div>

            {/* WhatsApp Invite Button */}
            <motion.button
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.15 }}
              onClick={() => {
                const link = inviteFriendsToWhatsApp(liveProfile?.full_name || liveProfile?.username || 'A friend');
                window.open(link, '_blank');
              }}
              className="mt-6 flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#25D366] text-white text-xs font-bold shadow-lg shadow-[#25D366]/20 transition-transform active:scale-95"
            >
              <MessageCircle size={16} />
              Invite Mandali on WhatsApp
            </motion.button>
          </div>
        </div>

        <div className="px-5 -mt-8 space-y-4 relative z-30">
          {/* Metric Row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'Threads', value: threadCount },
              { label: 'Posts', value: postCount },
              { label: 'Streak', value: isPro ? `${streak}🔥` : '🔒' }
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + (i * 0.05) }}
                className="glass-panel border border-white/10 rounded-2xl p-3 text-center"
              >
                <p className="text-[10px] font-bold text-[#C5A059] uppercase tracking-widest mb-1 opacity-70">{m.label}</p>
                <p className="text-lg font-serif text-[var(--divine-text)] dark:text-white">{m.value}</p>
              </motion.div>
            ))}
          </div>

          {showAvatarPreview && avatarUrl && (
            <AvatarPreviewModal
              avatarUrl={avatarUrl}
              fullName={profile?.full_name ?? profile?.username ?? 'Profile photo'}
              onClose={() => setShowAvatarPreview(false)}
            />
          )}

          <CompletionBar profile={liveProfile} onEdit={() => setEditing(true)} />

          {/* ── Sacred Kosh (Treasury) ────────────────────────────────────────── */}
          <SurfaceSection
            eyebrow="Sacred Collection"
            title="Kosh"
            description="Your treasury of divine symbols unlocked through devotion."
          >
            <div className="grid grid-cols-4 gap-4">
              {SACRED_RELICS.map((relic) => {
                const unlockedRelics = getUnlockedRelics(streak, liveProfile?.seva_score ?? 0, liveProfile?.tradition ?? 'hindu');
                const isUnlocked = unlockedRelics.some(r => r.id === relic.id);
                const isActive = (liveProfile as any)?.active_symbol_id === relic.id;

                return (
                  <div key={relic.id} className="flex flex-col items-center group">
                    <button 
                      onClick={() => {
                        if (!isUnlocked) {
                          toast.error(`Maintain your streak to unlock ${relic.name} 🙏`);
                          return;
                        }
                        if (isActive) return;
                        patchProfile({ active_symbol_id: relic.id } as any, `${relic.name} set as active symbol ✨`);
                      }}
                      className={`relative w-14 h-14 rounded-full flex items-center justify-center transition-all duration-500 overflow-hidden ${
                        isUnlocked 
                          ? 'bg-gradient-to-br from-[#C5A059]/20 to-[#C5A059]/5 border border-[#C5A059]/30 shadow-lg shadow-[#C5A059]/10' 
                          : 'bg-black/5 dark:bg-white/5 border border-white/5 grayscale opacity-30'
                      }`}
                    >
                      {isUnlocked && (
                        <div className="absolute inset-0 rounded-full bg-[#C5A059]/5 animate-pulse" />
                      )}
                      
                      <div className="relative w-10 h-10 flex items-center justify-center">
                        {relic.imageUrl ? (
                          <Image 
                            src={relic.imageUrl} 
                            alt={relic.name} 
                            fill 
                            className={`object-contain transition-transform duration-500 ${isUnlocked ? 'group-hover:scale-110' : ''}`}
                          />
                        ) : (
                          <span className="text-xl">{isUnlocked ? '✨' : '🔒'}</span>
                        )}
                      </div>

                      {/* Active Indicator */}
                      {isActive && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-[#C5A059] rounded-full flex items-center justify-center border-2 border-[var(--divine-bg)] z-10">
                          <Star size={8} className="text-black fill-black" />
                        </div>
                      )}
                    </button>
                    <p className={`text-[9px] font-bold uppercase tracking-tighter mt-2 text-center line-clamp-1 transition-opacity ${isUnlocked ? 'opacity-100' : 'opacity-40'}`}>
                      {relic.name}
                    </p>
                  </div>
                );
              })}
            </div>
            
            {!SACRED_RELICS.some(r => getUnlockedRelics(streak, liveProfile?.seva_score ?? 0, liveProfile?.tradition ?? 'hindu').some(ur => ur.id === r.id)) && (
              <div className="mt-4 p-4 rounded-xl bg-black/5 dark:bg-white/5 border border-dashed border-white/10 text-center">
                <p className="text-xs text-[var(--brand-muted)]">Maintain a 3-day streak to unlock your first relic 🙏</p>
              </div>
            )}
          </SurfaceSection>

          <SurfaceSection
            eyebrow="Settings"
            title="App preferences"
            description="Only the choices needed for daily use."
          >
            <div className="space-y-5">
              <div>
                <p className="type-card-label mb-2">Theme</p>
                <div className="grid grid-cols-3 gap-2">
                  {THEME_OPTIONS.map((option) => {
                    const active = themePreference === option.value;
                    const Icon = themeIconMap[option.value];
                    return (
                      <button
                        key={option.value}
                        type="button"
                        onClick={() => setThemePreference(option.value)}
                        className="rounded-2xl border px-3 py-3 text-left transition motion-press"
                        style={{
                          background: active ? 'rgba(200,146,74,0.14)' : 'var(--card-bg)',
                          borderColor: active ? 'rgba(200,146,74,0.32)' : 'rgba(255,255,255,0.08)',
                        }}
                      >
                        <Icon size={16} style={{ color: active ? 'var(--brand-primary-strong)' : 'var(--text-dim)' }} />
                        <p className="mt-2 text-sm font-medium theme-ink">{option.label}</p>
                      </button>
                    );
                  })}
                </div>
                <p className="type-micro mt-2">Current surface: {resolvedTheme}</p>
              </div>

              <div>
                <p className="type-card-label mb-2">App language</p>
                <div className="flex gap-2">
                  {APP_LANGUAGES.map((lang) => {
                    const active = ((liveProfile as any)?.app_language ?? 'en') === lang.value;
                    return (
                      <button
                        key={lang.value}
                        onClick={() => {
                          const nextMeaningLanguage = lang.value === 'hi' || lang.value === 'pa' ? lang.value : 'en';
                          setLang(lang.value as AppLang);
                          setForm({
                            ...form,
                            app_language: lang.value,
                            meaning_language: nextMeaningLanguage,
                          });
                          patchProfile({
                            app_language: lang.value,
                            meaning_language: nextMeaningLanguage,
                          }, `Language set to ${lang.label}`);
                        }}
                        className="flex-1 rounded-xl border py-2 text-sm font-medium transition"
                        style={active ? {
                          background: 'var(--brand-primary)',
                          color: '#1c1c1a',
                          borderColor: 'transparent',
                        } : {
                          background: 'var(--card-bg)',
                          color: 'var(--text-muted-warm)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {lang.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <p className="type-card-label mb-2">Meaning language</p>
                <div className="flex gap-2">
                  {MEANING_LANGUAGE_OPTIONS.map((opt) => {
                    const active = (form.meaning_language ?? 'en') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setForm({ ...form, meaning_language: opt.value });
                          patchProfile({ meaning_language: opt.value }, `Meanings set to ${opt.label}`);
                        }}
                        className="flex-1 rounded-xl border py-2 text-sm font-medium transition"
                        style={active ? {
                          background: 'var(--brand-primary)',
                          color: '#1c1c1a',
                          borderColor: 'transparent',
                        } : {
                          background: 'var(--card-bg)',
                          color: 'var(--text-muted-warm)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {opt.label.replace(' meaning', '')}
                      </button>
                    );
                  })}
                </div>
                <p className="type-micro mt-2">This controls translations and explanations. Transliteration remains separate.</p>
              </div>

              {/* App Icon Selection (Pro Only) */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <p className="type-card-label">App Icon</p>
                  {!isPro && (
                     <div className="px-2 py-0.5 rounded-full bg-amber-400/10 border border-amber-400/20">
                       <span className="text-[8px] font-bold text-amber-400 uppercase tracking-widest">Pro Only</span>
                     </div>
                  )}
                </div>
                <div className="flex gap-4">
                  <button
                    onClick={() => {
                      setLocalAppIcon('normal');
                      localStorage.setItem('shoonaya_app_icon', 'normal');
                      toast.success('Default icon set 🙏');
                    }}
                    className={`relative w-24 flex flex-col items-center gap-2 p-1.5 rounded-2xl border transition-all
                      ${localAppIcon !== 'pro' ? 'border-[#C5A059] bg-[rgba(200,146,74,0.1)]' : 'border-black/5 dark:border-white/5 opacity-60'}
                    `}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-inner">
                      <Image src="/assets/images/logos/logo-normal.png" alt="Normal Icon" fill className="object-cover" />
                    </div>
                    <span className="text-[9px] font-bold uppercase tracking-widest theme-ink">Normal</span>
                  </button>

                  <button
                    disabled={!isPro}
                    onClick={() => {
                      setLocalAppIcon('pro');
                      localStorage.setItem('shoonaya_app_icon', 'pro');
                      toast.success('Pro icon set! ✨');
                    }}
                    className={`relative w-24 flex flex-col items-center gap-2 p-1.5 rounded-2xl border transition-all
                      ${localAppIcon === 'pro' ? 'border-amber-400 bg-amber-400/10 shadow-lg shadow-amber-400/10' : 'border-black/5 dark:border-white/5'}
                      ${!isPro ? 'grayscale opacity-40 cursor-not-allowed' : ''}
                    `}
                  >
                    <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow-inner">
                      <Image src="/assets/images/logos/logo-pro.png" alt="Pro Icon" fill className="object-cover" />
                    </div>
                    <span className={`text-[9px] font-bold uppercase tracking-widest ${isPro ? 'text-amber-500' : 'theme-ink'}`}>Pro</span>
                  </button>
                </div>
              </div>

              <div>
                <p className="type-card-label mb-2">Transliteration script</p>
                <div className="flex gap-2">
                  {TRANSLITERATION_LANGUAGE_OPTIONS.map((opt) => {
                    const active = (form.transliteration_language ?? 'en') === opt.value;
                    return (
                      <button
                        key={opt.value}
                        onClick={() => {
                          setForm({ ...form, transliteration_language: opt.value });
                          patchProfile({ transliteration_language: opt.value }, `Transliteration set to ${opt.label}`);
                        }}
                        className="flex-1 rounded-xl border py-2 text-sm font-medium transition"
                        style={active ? {
                          background: 'var(--brand-primary)',
                          color: '#1c1c1a',
                          borderColor: 'transparent',
                        } : {
                          background: 'var(--card-bg)',
                          color: 'var(--text-muted-warm)',
                          borderColor: 'rgba(255,255,255,0.08)',
                        }}
                      >
                        {opt.label}
                      </button>
                    );
                  })}
                </div>
                <p className="type-micro mt-2">Script used for shlokas and sacred chants.</p>
              </div>

              <div className="rounded-2xl surface-input border px-4 py-4 space-y-3">
                <button
                  type="button"
                  onClick={() => setShowNotificationAdvanced((current) => !current)}
                  className="flex w-full items-center justify-between gap-3 text-left"
                >
                  <div>
                    <p className="text-sm font-medium theme-ink">Notifications</p>
                    <p className="text-xs theme-dim mt-1">Daily, festival, community, and family reminders.</p>
                  </div>
                  <span className="type-chip rounded-full surface-input border px-3 py-1 text-[color:var(--text-cream)]">
                    {showNotificationAdvanced ? 'Hide' : 'Show'}
                  </span>
                </button>
                {showNotificationAdvanced ? (
                  <div className="space-y-3">
                    {[
                      { key: 'wants_shloka_reminders', title: 'Daily shloka' },
                      { key: 'wants_festival_reminders', title: 'Festival reminders' },
                      { key: 'wants_community_notifications', title: 'Community updates' },
                      { key: 'wants_family_notifications', title: 'Family updates' },
                    ].map((item) => {
                      const checked = notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean;
                      return (
                        <label key={item.key} className="flex items-center justify-between gap-4 rounded-xl border border-white/6 bg-white/[0.03] px-3 py-2.5 cursor-pointer">
                          <span className="text-sm theme-ink">{item.title}</span>
                          <input
                            type="checkbox"
                            checked={checked}
                            onChange={(e) => setNotificationPrefs((current) => ({ ...current, [item.key]: e.target.checked }))}
                            className="h-4 w-4 rounded"
                            style={{ accentColor: 'var(--brand-primary)' }}
                          />
                        </label>
                      );
                    })}
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
                    <div className="flex flex-wrap gap-2">
                      <button
                        onClick={saveNotificationPreferences}
                        disabled={savingNotificationPrefs}
                        className="glass-button-primary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                      >
                        {savingNotificationPrefs ? 'Saving...' : 'Save notifications'}
                      </button>
                      <button
                        onClick={sendTestNotification}
                        disabled={sendingTestNotification}
                        className="glass-button-secondary inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-medium disabled:opacity-60"
                        style={{ color: 'var(--text-cream)' }}
                      >
                        {sendingTestNotification ? 'Testing...' : 'Test'}
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </SurfaceSection>

          {hasSafetyItems ? (
            <SurfaceSection
              eyebrow="Safety"
              title="Visibility and boundaries"
              description="Manage hidden, muted, and blocked activity."
            >
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
                        <div key={`${item.content_type}:${item.content_id}`} className="rounded-2xl surface-input border px-3 py-3 flex items-center gap-3">
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
                              background: 'var(--card-bg)',
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
            </SurfaceSection>
          ) : null}

          {/* ── Edit Form ── */}
          {editing && (
            <div className="surface-sheet rounded-2xl p-5 space-y-4 fade-in">
              <h2 className="font-display font-semibold text-lg theme-ink">Edit Profile</h2>

              {/* ── Tradition — locked at signup, not editable ── */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium theme-muted">Tradition</label>
                  <span className="flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full"
                    style={{ background: 'rgba(200,146,74,0.12)', color: 'var(--brand-primary-strong)', border: '1px solid rgba(200,146,74,0.2)' }}>
                    <Lock size={9} /> Set at signup
                  </span>
                </div>
                {(() => {
                  const t = TRADITIONS.find(t => t.value === form.tradition);
                  return t ? (
                    <div className="flex items-center gap-3 px-4 py-3 rounded-xl surface-input border">
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
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My details</p>
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
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My practice</p>
                <div>
                  <label className="block text-sm font-medium theme-muted mb-1.5">{sampradayaLabel}</label>
                  <select value={form.sampradaya}
                    onChange={(e) => setForm({ ...form, sampradaya: e.target.value })}
                    className="surface-select px-4 py-2.5 outline-none text-sm">
                    <option value="">Select {sampradayaLabel.toLowerCase()}</option>
                    {sampradayaOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium theme-muted mb-1.5">{ishtaDevataLabel}</label>
                  <select value={form.ishta_devata}
                    onChange={(e) => setForm({ ...form, ishta_devata: e.target.value })}
                    className="surface-select px-4 py-2.5 outline-none text-sm">
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
                      <label className="block text-sm font-medium theme-muted mb-1.5">{label}</label>
                      <input type="text" placeholder={placeholder}
                        value={(form as Record<string, string>)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="surface-input px-4 py-2.5 outline-none text-sm"
                      />
                    </div>
                  ))}
                </>
              )}

              {/* ── My Stage — DOB + practice path ── */}
              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My stage</p>

                {/* Date of birth */}
                <div>
                  <label className="block text-sm font-medium theme-muted mb-1.5">Date of birth</label>
                  <input
                    type="date"
                    value={form.date_of_birth}
                    max={new Date().toISOString().split('T')[0]}
                    onChange={(e) => {
                      const dob = e.target.value;
                      setForm(prev => ({ ...prev, date_of_birth: dob }));
                    }}
                    className="surface-input px-4 py-2.5 outline-none text-sm"
                  />
                  {form.date_of_birth && (() => {
                    const suggested = ageToAshrama(form.date_of_birth);
                    const age       = ageFromDob(form.date_of_birth);
                    const meta      = getAshramaMeta(activeTradition, suggested as LifeStage, form.gender_context);
                    return (
                      <p className="text-xs mt-1.5 text-white/50">
                        {meta.icon} Age {age} — suggested stage:{' '}
                        <span style={{ color: meta.accent, fontWeight: 600 }}>{meta.label}</span>
                      </p>
                    );
                  })()}
                </div>

                {/* Practice path (gender context) */}
                <div>
                  <label className="block text-sm font-medium theme-muted mb-1.5">Practice path</label>
                  <div className="grid grid-cols-2 gap-2">
                    {getPracticePathOptions(activeTradition).map(opt => {
                      const sel = form.gender_context === opt.key;
                      return (
                        <button
                          key={opt.key}
                          type="button"
                          onClick={() => setForm({ ...form, gender_context: opt.key })}
                          className="rounded-2xl border px-3 py-3 text-left transition"
                          style={{
                            background:   sel ? 'rgba(200,146,74,0.14)' : 'var(--card-bg)',
                            borderColor:  sel ? 'rgba(200,146,74,0.32)' : 'rgba(255,255,255,0.08)',
                          }}
                        >
                          <div className="text-xl mb-1">{opt.icon}</div>
                          <p className="text-sm font-semibold theme-ink leading-tight">{opt.label}</p>
                          <p className="text-[11px] theme-dim mt-0.5 leading-snug">{opt.sub}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My voice</p>
                <div>
                  <label className="block text-sm font-medium theme-muted mb-1.5">Bio</label>
                  <textarea placeholder="Share a little about your spiritual journey…"
                    value={form.bio}
                    onChange={(e) => setForm({ ...form, bio: e.target.value })}
                    rows={3}
                    className="surface-input px-4 py-2.5 outline-none resize-none text-sm"
                  />
                </div>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-3 rounded-xl text-sm font-medium theme-muted border border-white/10 hover:bg-white/5 transition">
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 py-3 text-[#1c1c1a] font-semibold rounded-xl text-sm hover:opacity-90 disabled:opacity-50"
                  style={{ background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))' }}>
                  {saving ? 'Saving…' : 'Save Changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Account ── */}
          <div className="surface-card rounded-2xl p-4 space-y-3">
            <div>
              <p className="type-card-heading">Account</p>
              <p className="type-micro mt-1">Signed in as {userEmail}</p>
            </div>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={() => setInviteOpen(true)}
                className="glass-button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium"
                style={{ color: 'var(--text-cream)' }}
              >
                Invite family
              </button>
              <button
                onClick={downloadReport}
                disabled={reportLoading}
                className="glass-button-secondary inline-flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium disabled:opacity-60"
                style={{ color: 'var(--text-cream)' }}
              >
                {reportLoading ? <Loader2 size={15} className="animate-spin" /> : <Download size={15} />}
                Report
              </button>
              <button
                onClick={signOut}
                className="inline-flex items-center justify-center gap-2 rounded-xl border px-3 py-2.5 text-sm font-medium transition"
                style={{ borderColor: 'rgba(220,80,80,0.20)', color: 'rgba(220,80,80,0.82)' }}
              >
                <LogOut size={15} /> Sign out
              </button>
            </div>
            {/* ── Footer Info ── */}
            <div className="mt-8 mb-4 px-6 text-center space-y-4">
              <div className="flex flex-wrap justify-center gap-x-6 gap-y-2">
                {[
                  { href: '/about',      label: 'About'      },
                  { href: '/privacy',    label: 'Privacy'    },
                  { href: '/terms',      label: 'Terms'      },
                  { href: '/guidelines', label: 'Guidelines' },
                  { href: '/contact',    label: 'Contact'    },
                ].map(l => (
                  <Link key={l.href} href={l.href}
                    className="text-[11px] font-medium text-white/30 hover:text-white/60 transition-colors uppercase tracking-widest">
                    {l.label}
                  </Link>
                ))}
              </div>
              <p className="text-[10px] text-white/20">
                Built with 🙏 for the global Sanatani community
              </p>
            </div>
          </div>

          {/* ── Invite Modal ── */}
          <AnimatePresence>
            {inviteOpen && (() => {
              const code = generateInviteCode(userId);
              const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
              const link = `${baseUrl}/join?ref=${code}`;
              async function share() {
                const shareText = `Join me on Shoonaya — your dharmic home.\n\nInvite code: ${code}\n${link}`;
                if (typeof navigator !== 'undefined' && navigator.share) {
                  try { await navigator.share({ title: 'Join Shoonaya 🙏', text: shareText, url: link }); return; } catch {}
                }
                try { await navigator.clipboard.writeText(shareText); toast.success('Invite link copied! 🙏'); } catch { window.prompt('Copy your invite link:', link); }
              }
              return (
                <motion.div className="fixed inset-0 z-50 flex items-end" onClick={() => setInviteOpen(false)}
                  initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <motion.div className="w-full rounded-t-[2rem] p-6 space-y-5" onClick={e => e.stopPropagation()}
                    style={{ background: 'linear-gradient(180deg, var(--surface-raised), rgba(34,30,22,0.99))', borderTop: '1px solid rgba(200,146,74,0.20)', boxShadow: '0 -20px 48px rgba(0,0,0,0.38)' }}
                    initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                    transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}>
                    <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(200,146,74,0.28)' }} />
                    <div className="flex items-center justify-between">
                      <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>Invite Friends &amp; Family</h3>
                      <button onClick={() => setInviteOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,146,74,0.10)' }}>
                        <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
                      </button>
                    </div>
                    <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>Share Shoonaya with your family and friends using your personal invite code.</p>
                    <div className="rounded-[1.4rem] p-5 text-center border" style={{ background: 'rgba(200,146,74,0.08)', borderColor: 'rgba(200,146,74,0.18)' }}>
                      <p className="text-[10px] mb-2 font-semibold uppercase tracking-[0.16em]" style={{ color: 'var(--text-dim)' }}>Your Invite Code</p>
                      <p style={{ fontFamily: 'var(--font-serif)', fontSize: '2rem', fontWeight: 700, letterSpacing: '0.18em', color: 'var(--brand-primary)' }}>{code}</p>
                      <p className="text-[11px] mt-2" style={{ color: 'var(--text-dim)' }}>{link}</p>
                    </div>
                    <button onClick={share} className="w-full py-3.5 rounded-2xl font-semibold text-sm" style={{ background: 'var(--brand-primary)', color: '#1a1610' }}>
                      🙏 Share invite
                    </button>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>
    </div>
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
    <div className="rounded-2xl px-3 py-3 flex items-center gap-3" style={{ border: '1px solid rgba(200,146,74,0.12)', background: 'var(--card-bg)' }}>
      <div className="relative w-10 h-10 rounded-full bg-gradient-sacred text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
        {profile.avatar_url
          ? <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--text-cream)] truncate">{profile.full_name || profile.username}</p>
        <p className="text-xs text-[color:var(--brand-muted)] truncate">{profile.username ? `@${profile.username}` : 'Shoonaya member'}</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="px-3 py-1.5 rounded-full text-xs font-semibold transition disabled:opacity-60"
        style={{
          border: '1px solid rgba(124, 58, 45, 0.18)',
          color: 'var(--brand-primary)',
          background: 'rgba(200,146,74,0.08)',
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
          className="absolute -top-2 right-0 z-10 w-10 h-10 rounded-full text-[color:var(--text-muted-warm)] flex items-center justify-center shadow-lg"
          style={{ background: 'var(--surface-raised)' }}
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
          <p className="text-center text-sm font-medium text-[color:var(--text-muted-warm)] mt-3">
            {fullName}
          </p>
        </div>
      </div>
    </div>
  );
}

'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan, X, Download, Loader2, ChevronLeft, ChevronRight, Monitor, Moon, Sun, Star, MessageSquare, MessageCircle, Settings, Shield, Users, AlertCircle } from 'lucide-react';
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
    <div className="profile-card rounded-[2rem] p-5 flex items-center gap-5 relative overflow-hidden group">
      <div className="absolute inset-0 bg-[var(--brand-primary-soft)] opacity-0 group-hover:opacity-100 transition-opacity" />
      {/* Circular completion ring */}
      <div className="relative">
        <div className="absolute inset-0 bg-[#C5A059]/20 blur-xl rounded-full scale-150 opacity-50" />
        <CircularProgress
          pct={pct}
          accent="var(--brand-primary)"
          size={64}
          strokeWidth={6}
          label={<span className="text-[13px] font-semibold text-[var(--brand-primary)]">{pct}%</span>}
        />
      </div>
      {/* Label + CTA */}
      <div className="flex-1 min-w-0 z-10">
        <div className="flex items-center justify-between mb-1.5">
          <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-[var(--brand-primary)]">Profile strength</p>
          <button onClick={onEdit}
            className="px-4 py-1.5 rounded-full bg-[var(--brand-primary)] text-white text-[11px] font-medium transition-transform active:scale-95 shadow-sm">
            Complete
          </button>
        </div>
        {missing.length > 0 && (
          <p className="text-sm theme-muted leading-relaxed">
            Enhance your journey by adding: {missing.slice(0, 3).join(', ')}{missing.length > 3 ? ` +${missing.length - 3} more` : ''}
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
  const { setLang, lang: contextLang } = useLanguage();
  const { preference: themePreference, resolvedTheme, setPreference: setThemePreference } = useThemePreference();
  const isPro       = usePremium();
  const profileQuery = useProfileQuery(userId, profile);
  const updateProfileMutation = useUpdateProfileMutation(userId);
  const liveProfile = profileQuery.data ?? profile;
  const [editing,   setEditing]   = useState(false);
  const [koshOpen,  setKoshOpen]  = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [inviteOpen, setInviteOpen] = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [uploading, setUploading] = useState(false);
  const [showPhotoOptions, setShowPhotoOptions] = useState(false);
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
  const [isDeleting, setIsDeleting] = useState((liveProfile as any)?.is_deleting ?? false);
  const [deletionDate, setDeletionDate] = useState((liveProfile as any)?.deletion_requested_at ?? null);

  const [form, setForm] = useState({
    full_name:        liveProfile?.full_name        ?? '',
    bio:              liveProfile?.bio              ?? '',
    city:             liveProfile?.city             ?? '',
    country:          liveProfile?.country          ?? '',
    tradition:        (liveProfile as any)?.tradition        ?? '',
    sampradaya:       liveProfile?.sampradaya       ?? '',
    ishta_devata:     liveProfile?.ishta_devata     ?? '',
    spiritual_level:  liveProfile?.spiritual_level  ?? 'jigyasu',
    kul:              (liveProfile as any)?.legacy_family_name ?? '',
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

  // ── Kul State & Metadata ───────────────────────────────────────────────────
  const [kulData, setKulData] = useState<{ name: string; code: string } | null>(null);
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [repairing, setRepairing] = useState(false);

  // Proactive Kul Membership Repair & Sync
  useEffect(() => {
    if (!userId) return;
    
    async function syncMembership() {
      // 1. Repair orphaned memberships (handled for every user globally)
      await supabase.rpc('repair_kul_membership');
      
      // 2. Fetch fresh Kul name/code for the profile UI
      const { data: profileWithKul } = await supabase
        .from('profiles')
        .select('kul_id, kuls(name, invite_code)')
        .eq('id', userId)
        .single();
        
      if (profileWithKul?.kuls) {
        setKulData({ 
          name: (profileWithKul.kuls as any).name, 
          code: (profileWithKul.kuls as any).invite_code 
        });
      }
    }
    
    syncMembership().then(() => setRepairing(false));
  }, [userId, supabase]);

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
    setShowPhotoOptions(false);
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
    }
  }

  async function removeAvatar() {
    setUploading(true);
    setShowPhotoOptions(false);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ avatar_url: null })
        .eq('id', userId);
      if (error) throw error;
      setAvatarUrl(null);
      toast.success('Photo removed 🙏');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message ?? 'Removal failed');
    } finally {
      setUploading(false);
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

  async function requestAccountDeletion() {
    if (!confirm('Are you sure? Your account will be hidden and scheduled for permanent deletion in 30 days.')) return;
    
    setSaving(true);
    try {
      const now = new Date().toISOString();
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_deleting: true, 
          deletion_requested_at: now 
        })
        .eq('id', userId);

      if (error) throw error;

      // Create admin task
      await supabase.from('content_reports').insert({
        reported_by: userId,
        content_author_id: userId,
        content_type: 'account_deletion',
        content_id: userId,
        reason: 'User requested account deletion. Cool-off period started.',
        status: 'pending'
      });

      setIsDeleting(true);
      setDeletionDate(now);
      toast.success('Deletion scheduled. You have 30 days to cancel.');
    } catch (err: any) {
      toast.error(err.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  }

  async function cancelAccountDeletion() {
    setSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({ 
          is_deleting: false, 
          deletion_requested_at: null 
        })
        .eq('id', userId);

      if (error) throw error;

      setIsDeleting(false);
      setDeletionDate(null);
      toast.success('Welcome back! Your account deletion has been cancelled 🙏');
    } catch (err: any) {
      toast.error(err.message || 'Cancellation failed');
    } finally {
      setSaving(false);
    }
  }

  const hasSafetyItems = blockedProfiles.length > 0 || mutedProfiles.length > 0 || hiddenItems.length > 0;
  const themeIconMap = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } satisfies Record<ThemePreference, typeof Monitor>;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="profile-page divine-home-shell min-h-screen bg-[var(--surface-base)] -mx-3 sm:-mx-4 relative selection:bg-[var(--brand-primary-soft)]"
    >
      <style>{`
        .profile-page {
          --profile-shadow: 0 16px 36px rgba(62, 42, 31, 0.08);
        }
        .dark .profile-page {
          --profile-shadow: 0 18px 44px rgba(0, 0, 0, 0.34);
        }
        .profile-page .profile-card,
        .profile-page .clay-card {
          background: var(--card-bg);
          border: 1px solid var(--card-border);
          box-shadow: var(--profile-shadow);
          backdrop-filter: blur(18px);
          -webkit-backdrop-filter: blur(18px);
        }
        .profile-page .profile-soft {
          background: var(--card-bg-soft);
          border: 1px solid var(--card-border-soft);
        }
        .profile-page [class*="text-[#F2EAD6]"],
        .profile-page [class*="text-white/"] {
          color: var(--text-cream) !important;
        }
        .profile-page [class*="text-[#F2EAD6]/"],
        .profile-page [class*="text-white/1"],
        .profile-page [class*="text-white/2"],
        .profile-page [class*="text-white/3"],
        .profile-page [class*="text-white/4"],
        .profile-page [class*="text-white/5"],
        .profile-page [class*="text-white/6"],
        .profile-page [class*="text-white/7"],
        .profile-page [class*="text-white/8"] {
          color: var(--text-muted-warm) !important;
        }
        .profile-page [class*="text-[#C5A059]"] {
          color: var(--brand-primary) !important;
        }
        .profile-page [class*="bg-white/5"],
        .profile-page [class*="bg-white/10"],
        .profile-page [class*="bg-white/[0.03]"] {
          background: var(--card-bg-soft) !important;
        }
        .profile-page [class*="border-white/"] {
          border-color: var(--card-border) !important;
        }
        .profile-page [class*="bg-[#C5A059]"] {
          background: var(--brand-primary) !important;
        }
        .profile-page [class*="border-[#C5A059]"] {
          border-color: color-mix(in srgb, var(--brand-primary) 42%, transparent) !important;
        }
        .profile-page [class*="shadow-[#C5A059]"] {
          box-shadow: 0 12px 28px color-mix(in srgb, var(--brand-primary) 14%, transparent) !important;
        }
        .profile-page .profile-eyebrow {
          color: var(--brand-primary);
          font-size: 11px;
          font-weight: 500;
          letter-spacing: 0.08em;
          text-transform: uppercase;
        }
        @keyframes aura-pulse {
          0% { transform: translate(-50%, -50%) scale(1); opacity: 0.12; }
          50% { transform: translate(-50%, -50%) scale(1.16); opacity: 0.2; }
          100% { transform: translate(-50%, -50%) scale(1); opacity: 0.12; }
        }
        .sacred-aura {
          position: absolute;
          top: 50%;
          left: 50%;
          width: 240px;
          height: 240px;
          background: radial-gradient(circle, var(--brand-primary) 0%, transparent 70%);
          filter: blur(40px);
          animation: aura-pulse 8s ease-in-out infinite;
          pointer-events: none;
          z-index: 0;
        }
        .sacred-seal-ring {
          position: relative;
          z-index: 1;
          background: linear-gradient(135deg, var(--surface-raised), var(--brand-primary), var(--surface-soft));
          padding: 3px;
          border-radius: 999px;
          box-shadow: 0 16px 36px color-mix(in srgb, var(--brand-primary) 18%, transparent);
        }
        .sacred-seal-inner {
          background: var(--surface-raised);
          border-radius: 999px;
          width: 96px;
          height: 96px;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 1px solid var(--card-border);
          overflow: hidden;
        }
        .premium-serif {
          font-family: var(--font-serif);
          letter-spacing: 0;
        }
        .zenith-input {
          background: var(--surface-raised);
          border: 1px solid var(--card-border);
          border-radius: 1.25rem;
          padding: 0.875rem 1.25rem;
          color: var(--text-cream);
          font-size: 0.875rem;
          transition: all 0.3s ease;
        }
        .zenith-input:focus {
          background: var(--card-bg);
          border-color: color-mix(in srgb, var(--brand-primary) 45%, transparent);
          box-shadow: 0 0 0 3px var(--brand-primary-soft);
          outline: none;
        }
      `}</style>

      <div className="relative pb-24 min-h-screen bg-[var(--surface-base)]">
        
      {/* ── Immersive Zenith Hero (Borderless & Tightened) ── */}
      <div className="relative w-full overflow-hidden pt-8 pb-12">
        {/* Deep atmospheric backdrop - No corners, full bleed */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-[var(--surface-soft)] via-[var(--surface-base)] to-[var(--surface-base)]" />
          <motion.div 
            animate={{ 
              scale: [1, 1.2, 1],
              opacity: [0.1, 0.2, 0.1],
              x: [0, 20, 0]
            }}
            transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
            className="absolute -top-[20%] -left-[10%] w-[120%] h-[120%] bg-[var(--brand-primary-soft)] blur-[100px]"
          />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-[var(--surface-base)] to-transparent" />
        </div>

        {/* Header Controls Overlay */}
        <div className="absolute top-0 left-0 right-0 z-30 flex items-center justify-between px-6 pt-6 pointer-events-auto">
          <button
            onClick={() => router.back()}
            className="w-12 h-12 rounded-2xl clay-card flex items-center justify-center transition-all active:scale-90 hover:border-[#C5A059]/30"
          >
            <ChevronLeft size={22} className="text-[#F2EAD6]" />
          </button>
          <div className="flex items-center gap-3">
            <Link
              href="/messages"
              className="w-12 h-12 rounded-2xl clay-card flex items-center justify-center transition-all active:scale-90 hover:border-[#C5A059]/30"
              title="Direct Messages"
            >
              <MessageSquare size={20} className="text-[#F2EAD6]" />
            </Link>
            <button 
              onClick={() => setSettingsOpen(true)}
              className="w-12 h-12 rounded-2xl clay-card flex items-center justify-center transition-all active:scale-90 hover:border-[#C5A059]/30"
              title="App Settings"
            >
              <Settings size={20} className="text-[#F2EAD6]" />
            </button>
          </div>
        </div>

        <div className="max-w-xl mx-auto px-6 relative">
          <div className="flex flex-col items-center">
            {/* Avatar Section with Pulse */}
            <div className="relative mb-6">
              <motion.div 
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="sacred-seal-ring !w-32 !h-32"
              >
                <button
                  type="button"
                  onClick={() => avatarUrl && setShowAvatarPreview(true)}
                  disabled={!avatarUrl}
                  className={`sacred-seal-inner relative !w-28 !h-28 ${avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                >
                  {avatarUrl
                    ? <Image src={avatarUrl} alt="avatar" fill sizes="128px" className="object-cover transition-transform duration-700 hover:scale-110" />
                    : <span className="text-5xl font-serif text-[#C5A059]">{initials}</span>}
                </button>
              </motion.div>
              
              <button
                type="button"
                onClick={() => setShowPhotoOptions(true)}
                className={`absolute -bottom-1 -right-1 flex h-9 w-9 items-center justify-center rounded-xl border border-[#C5A059]/30 bg-[#C5A059] shadow-2xl shadow-[#C5A059]/40 transition-all active:scale-75 z-20 ${uploading ? 'opacity-60' : 'hover:scale-110'}`}
              >
                {uploading
                  ? <Loader2 size={16} className="text-black animate-spin" />
                  : <Camera size={16} className="text-black" />}
              </button>
            </div>

            <motion.div 
              initial={{ y: 15, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.15, type: 'spring', stiffness: 200 }}
              className="text-center space-y-3"
            >
                <div className="flex items-center justify-center gap-3">
                  <h1 className="text-3xl font-medium theme-ink premium-serif">
                    {liveProfile?.full_name}
                  </h1>
                  <button
                    onClick={() => setEditing(true)}
                    className="w-8 h-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center text-[#C5A059]/60 transition-all hover:bg-white/10 hover:text-[#C5A059] active:scale-90 shadow-lg"
                    title="Edit Identity"
                  >
                    <Edit3 size={14} />
                  </button>
                </div>
                <div className="flex items-center gap-3">
                  <span className="profile-eyebrow opacity-90">@{liveProfile?.username}</span>
                  {isPro && (
                    <div className="px-2.5 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-amber-200/10 border border-amber-400/30 flex items-center gap-1.5 shadow-lg shadow-amber-900/20">
                      <Star size={11} className="text-amber-400 fill-amber-400" />
                      <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest">Pro Member</span>
                    </div>
                  )}
                </div>
              
              {(liveProfile?.city || liveProfile?.country) && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-medium theme-muted">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#C5A059]/30" />
                  <MapPin size={11} className="text-[#C5A059]" />
                  <span>{[liveProfile?.city, liveProfile?.country].filter(Boolean).join(' · ')}</span>
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#C5A059]/30" />
                </div>
              )}
            </motion.div>
          </div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.1 }}
        className="max-w-xl mx-auto px-5 -mt-6 space-y-5 relative z-30 pb-32"
      >
          {/* Metric Row with Clay Cards */}
          {/* Metric Row (Compact Zenith) */}
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: 'Threads', value: threadCount },
              { label: 'Posts', value: postCount },
              { label: 'Streak', value: isPro ? `${streak}🔥` : '🔒' },
              { label: 'Kul', value: kulData ? 'Connected' : 'None' }
            ].map((m, i) => (
              <motion.div
                key={m.label}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.1 * i }}
                className={`clay-card rounded-2xl p-2.5 text-center transition-all ${m.label === 'Kul' && !kulData ? 'border-red-500/20' : 'hover:border-[#C5A059]/30'}`}
              >
                <p className="text-[11px] font-medium theme-dim mb-1">{m.label}</p>
                <p className="text-sm font-medium theme-ink truncate">{m.value}</p>
              </motion.div>
            ))}
          </div>

          <CompletionBar profile={liveProfile} onEdit={() => setEditing(true)} />

          {/* ── Zenith Action Grid (Tightened) ── */}
          <div className="grid grid-cols-2 gap-3">
            <motion.button
              onClick={() => setKoshOpen(true)}
              className="clay-card rounded-[2rem] p-5 flex flex-col items-center gap-2.5 group border-[#C5A059]/20"
            >
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-transparent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                <Star className="text-[#C5A059] group-hover:animate-pulse" size={20} />
              </div>
              <div className="text-center">
                <p className="text-base font-medium theme-ink premium-serif">Sacred kosh</p>
                <p className="text-xs theme-muted mt-0.5">Divine relics</p>
              </div>
            </motion.button>

            {kulData ? (
              <motion.button
                onClick={() => setShowInviteModal(true)}
                className="clay-card rounded-[2rem] p-5 flex flex-col items-center gap-2.5 group border-[#C5A059]/20"
              >
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-transparent flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Users className="text-[#C5A059]" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium theme-ink premium-serif">Sacred invite</p>
                  <p className="text-xs theme-muted mt-0.5">Invite to {kulData.name}</p>
                </div>
              </motion.button>
            ) : (
              <motion.button
                onClick={() => router.push('/kul')}
                className="clay-card rounded-[2rem] p-5 flex flex-col items-center gap-2.5 group border-white/5"
              >
                <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center shadow-inner group-hover:scale-110 transition-transform">
                  <Shield className="text-[#F2EAD6]/40" size={20} />
                </div>
                <div className="text-center">
                  <p className="text-base font-medium theme-ink premium-serif">Join Kul</p>
                  <p className="text-xs theme-muted mt-0.5">Start lineage</p>
                </div>
              </motion.button>
            )}
          </div>

          {showAvatarPreview && avatarUrl && (
            <AvatarPreviewModal
              avatarUrl={avatarUrl}
              fullName={profile?.full_name ?? profile?.username ?? 'Profile photo'}
              onClose={() => setShowAvatarPreview(false)}
            />
          )}

          <button 
            onClick={() => {
              const link = inviteFriendsToWhatsApp(liveProfile?.full_name || liveProfile?.username || 'A friend');
              window.open(link, '_blank');
            }}
            className="clay-card rounded-[1.5rem] p-4 flex items-center gap-4 group hover:bg-[#C5A059]/5"
          >
            <div className="w-10 h-10 rounded-xl bg-green-500/10 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
              <MessageCircle size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium theme-ink">Expand the Mandali</p>
              <p className="text-xs theme-muted mt-0.5">Invite on WhatsApp</p>
            </div>
            <ChevronRight size={16} className="text-white/20 group-hover:translate-x-1 transition-transform" />
          </button>

          {hasSafetyItems && (
            <div className="clay-card rounded-[2.5rem] p-6">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-10 h-10 rounded-xl bg-[#C5A059]/10 flex items-center justify-center border border-[#C5A059]/20">
                  <ShieldBan size={20} className="text-[#C5A059]" />
                </div>
                <div>
                  <h3 className="text-base font-medium theme-ink premium-serif">Safety and boundaries</h3>
                  <p className="text-xs theme-muted mt-0.5">Control your experience</p>
                </div>
              </div>
              <div className="space-y-3">
                {blockedProfiles.length > 0 && (
                   <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-[#F2EAD6]/70 transition-all hover:bg-white/10 hover:border-[#C5A059]/30">
                      <div className="flex items-center gap-3">
                        <Users size={14} className="text-[#C5A059]" />
                        <span>{blockedProfiles.length} Blocked Profiles</span>
                      </div>
                      <ChevronRight size={14} className="opacity-40" />
                   </button>
                )}
                {mutedProfiles.length > 0 && (
                   <button onClick={() => setSettingsOpen(true)} className="w-full flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 text-[11px] font-black uppercase tracking-widest text-[#F2EAD6]/70 transition-all hover:bg-white/10 hover:border-[#C5A059]/30">
                      <div className="flex items-center gap-3">
                        <BellOff size={14} className="text-[#C5A059]" />
                        <span>{mutedProfiles.length} Muted Profiles</span>
                      </div>
                      <ChevronRight size={14} className="opacity-40" />
                   </button>
                )}
              </div>
            </div>
          )}

          {/* ── Edit Form (Zenith Sheet) ── */}
          {editing && (
            <div className="clay-card rounded-[2.5rem] p-8 space-y-8 shadow-2xl fade-in relative overflow-hidden">
              <div className="absolute top-0 right-0 p-6">
                <button onClick={() => setEditing(false)} className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center transition-all hover:bg-white/10 active:scale-90">
                  <X size={20} className="text-[#F2EAD6]/40" />
                </button>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-2xl font-medium theme-ink premium-serif">Personal details</h2>
                <p className="text-sm theme-muted">Update your spiritual identity</p>
              </div>

              {/* ── Tradition — locked ── */}
              <div className="space-y-3">
                <div className="flex items-center justify-between px-1">
                  <label className="text-xs font-medium theme-muted">Spiritual tradition</label>
                  <span className="flex items-center gap-1.5 text-[11px] px-3 py-1 rounded-full bg-[var(--brand-primary-soft)] text-[var(--brand-primary)] border border-[var(--card-border)] font-medium">
                    <Lock size={10} /> Secured
                  </span>
                </div>
                {(() => {
                  const t = TRADITIONS.find(t => t.value === form.tradition);
                  return t ? (
                    <div className="flex items-center gap-4 px-5 py-4 rounded-[1.5rem] bg-white/[0.03] border border-[#C5A059]/20 shadow-inner">
                      <span className="text-3xl drop-shadow-md">{t.emoji}</span>
                      <div>
                        <p className="font-medium text-sm theme-ink">{t.label}</p>
                        <p className="text-xs theme-muted mt-0.5">{t.desc}</p>
                      </div>
                    </div>
                  ) : null;
                })()}
              </div>

              <div className="space-y-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { label: 'Full Name', key: 'full_name', placeholder: 'Your full name' },
                    { label: 'Home Town', key: 'home_town', placeholder: 'Where you are from' },
                  ].map(({ label, key, placeholder }) => (
                    <div key={key} className="space-y-2">
                      <label className="block text-xs font-medium theme-muted px-1">{label}</label>
                      <input type="text" placeholder={placeholder}
                        value={(form as Record<string, string>)[key]}
                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                        className="zenith-input w-full"
                      />
                    </div>
                  ))}
                </div>
              </div>

              <div className="space-y-6">
                <p className="text-sm font-medium text-[var(--brand-primary)]">Lineage and path</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium theme-muted px-1">{sampradayaLabel}</label>
                    <select value={form.sampradaya}
                      onChange={(e) => setForm({ ...form, sampradaya: e.target.value })}
                      className="zenith-input w-full appearance-none">
                      <option value="">Select {sampradayaLabel.toLowerCase()}</option>
                      {sampradayaOptions.map((s) => <option key={s.value} value={s.value}>{s.label}</option>)}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="block text-xs font-medium theme-muted px-1">{ishtaDevataLabel}</label>
                    <select value={form.ishta_devata}
                      onChange={(e) => setForm({ ...form, ishta_devata: e.target.value })}
                      className="zenith-input w-full appearance-none">
                      <option value="">Select {ishtaDevataLabel.toLowerCase()}</option>
                      {ishtaDevataOptions.map((d) => <option key={d.value} value={d.value}>{d.emoji} {d.label}</option>)}
                    </select>
                  </div>
                </div>
              </div>

              {/* ── Hindu-specific fields ── */}
              {(activeTradition === 'hindu') && (
                <div className="space-y-6">
                  <p className="text-sm font-medium text-[var(--brand-primary)]">Vansh identity</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {[
                      { label: 'Gotra',      key: 'gotra',      placeholder: 'e.g. Kashyapa'     },
                      { label: 'Kul Devata', key: 'kul_devata', placeholder: 'e.g. Shiva, Durga' },
                      { label: 'Family Name', key: 'kul',        placeholder: 'Kul / Vansh'    },
                    ].map(({ label, key, placeholder }) => (
                      <div key={key} className="space-y-2">
                        <label className="block text-xs font-medium theme-muted px-1">{label}</label>
                        <input type="text" placeholder={placeholder}
                          value={(form as Record<string, string>)[key]}
                          onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                          className="zenith-input w-full"
                        />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              <div className="space-y-6">
                <p className="text-sm font-medium text-[var(--brand-primary)]">Life stage</p>
                <div className="grid grid-cols-1 gap-6">
                  <div className="space-y-2">
                    <label className="block text-xs font-medium theme-muted px-1">Date of birth</label>
                    <input
                      type="date"
                      value={form.date_of_birth}
                      max={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setForm(prev => ({ ...prev, date_of_birth: e.target.value }))}
                      className="zenith-input w-full"
                      style={{ colorScheme: 'dark' }}
                    />
                    {form.date_of_birth && (() => {
                      const suggested = ageToAshrama(form.date_of_birth);
                      const age       = ageFromDob(form.date_of_birth);
                      const meta      = getAshramaMeta(activeTradition, suggested as LifeStage, form.gender_context);
                      return (
                        <div className="flex items-center gap-2 mt-3 px-3 py-2 rounded-xl bg-[#C5A059]/5 border border-[#C5A059]/10">
                          <span className="text-sm">{meta.icon}</span>
                          <p className="text-xs font-medium theme-muted">
                            Age {age} · Suggested stage: <span style={{ color: meta.accent }}>{meta.label}</span>
                          </p>
                        </div>
                      );
                    })()}
                  </div>

                  <div className="space-y-3">
                    <label className="block text-xs font-medium theme-muted px-1">Practice path</label>
                    <div className="grid grid-cols-2 gap-3">
                      {getPracticePathOptions(activeTradition).map(opt => {
                        const sel = form.gender_context === opt.key;
                        return (
                          <button
                            key={opt.key}
                            type="button"
                            onClick={() => setForm({ ...form, gender_context: opt.key })}
                            className={`rounded-2xl border p-4 text-left transition-all relative overflow-hidden ${
                              sel ? 'bg-[#C5A059]/10 border-[#C5A059]/40 shadow-lg shadow-[#C5A059]/10' : 'bg-white/5 border-white/5 opacity-60 hover:opacity-100'
                            }`}
                          >
                            <div className="text-xl mb-2">{opt.icon}</div>
                            <p className="text-sm font-medium theme-ink">{opt.label}</p>
                            <p className="text-xs theme-muted mt-1 leading-snug">{opt.sub}</p>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="block text-xs font-medium theme-muted px-1">Bio</label>
                <textarea placeholder="Share your spiritual journey…"
                  value={form.bio}
                  onChange={(e) => setForm({ ...form, bio: e.target.value })}
                  rows={4}
                  className="zenith-input w-full resize-none min-h-[100px]"
                />
              </div>

              <div className="flex gap-4 pt-6">
                <button onClick={() => setEditing(false)}
                  className="flex-1 py-4 rounded-2xl text-sm font-medium theme-muted border border-[var(--card-border)] transition-all hover:bg-[var(--card-bg-soft)] active:scale-95">
                  Cancel
                </button>
                <button onClick={saveProfile} disabled={saving}
                  className="flex-1 py-4 rounded-2xl text-sm font-medium bg-[var(--brand-primary)] text-white shadow-sm transition-all active:scale-95 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save changes'}
                </button>
              </div>
            </div>
          )}

          {/* ── Account Summary (Refined Zenith) ── */}
          <div className="clay-card rounded-[2.5rem] p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs font-medium theme-muted mb-1.5">Connected email</p>
                <p className="text-sm font-medium theme-ink break-all">{userEmail}</p>
              </div>
              <button
                onClick={signOut}
                className="w-12 h-12 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 transition-all active:scale-90 hover:bg-red-500/20 shadow-lg shadow-red-900/10"
                title="Sign Out"
              >
                <LogOut size={18} />
              </button>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setInviteOpen(true)}
                className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[var(--card-bg-soft)] border border-[var(--card-border)] text-sm font-medium theme-ink transition-all hover:border-[var(--brand-primary)]"
              >
                <Users size={16} className="text-[#C5A059]" />
                Invite
              </button>
              <button
                onClick={downloadReport}
                disabled={reportLoading}
                className="flex items-center justify-center gap-2.5 py-4 rounded-2xl bg-[var(--card-bg-soft)] border border-[var(--card-border)] text-sm font-medium theme-ink transition-all hover:border-[var(--brand-primary)] disabled:opacity-50"
              >
                {reportLoading ? <Loader2 size={16} className="animate-spin text-[#C5A059]" /> : <Download size={16} className="text-[#C5A059]" />}
                Report
              </button>
            </div>
          </div>

          {/* ── Footer ── */}
          <div className="py-8 text-center space-y-4">
            <div className="flex flex-wrap justify-center gap-x-5 gap-y-2">
              {[
                { href: '/about',      label: 'About'      },
                { href: '/privacy',    label: 'Privacy'    },
                { href: '/terms',      label: 'Terms'      },
                { href: '/contact',    label: 'Contact'    },
              ].map(l => (
                <Link key={l.href} href={l.href}
                  className="text-[9px] font-bold text-white/20 hover:text-[#C5A059] transition-colors uppercase tracking-[0.2em]">
                  {l.label}
                </Link>
              ))}
            </div>
            <p className="text-[9px] text-white/10 font-medium">
              Sanatan Sangam · Built with 🙏
            </p>
          </div>
        </motion.div>
      </div>

      {/* ── Drawers (Zenith Modals) ── */}
      <BottomDrawer
        isOpen={koshOpen}
        onClose={() => setKoshOpen(false)}
        title="Sacred Kosh"
        description="Your treasury of divine symbols and relics."
      >
        <div className="grid grid-cols-4 gap-5 py-6">
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
                  className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 overflow-hidden ${
                    isUnlocked 
                      ? 'bg-gradient-to-br from-[#C5A059]/25 to-[#C5A059]/5 border border-[#C5A059]/40 shadow-xl shadow-[#C5A059]/10' 
                      : 'bg-black/40 border border-white/10 grayscale opacity-40'
                  } ${!isActive && isUnlocked ? 'hover:scale-110 hover:border-[#C5A059]' : ''}`}
                >
                  {isUnlocked && (
                    <div className="absolute inset-0 bg-[#C5A059]/10 animate-pulse opacity-50" />
                  )}
                  
                  <div className="relative w-14 h-14 flex items-center justify-center">
                    {relic.imageUrl ? (
                      <Image 
                        src={relic.imageUrl} 
                        alt={relic.name} 
                        fill 
                        className={`object-contain transition-transform duration-700 ${isUnlocked ? 'group-hover:scale-110' : ''}`}
                      />
                    ) : (
                      <span className="text-2xl">{isUnlocked ? '✨' : '🔒'}</span>
                    )}
                  </div>

                  {isActive && (
                    <div className="absolute top-2 right-2 w-5 h-5 bg-[#C5A059] rounded-full flex items-center justify-center border-2 border-[#1a1610] z-10 shadow-lg">
                      <Star size={10} className="text-black fill-black" />
                    </div>
                  )}
                </button>
                <p className={`text-[10px] font-black uppercase tracking-widest mt-4 text-center line-clamp-1 transition-opacity ${isUnlocked ? 'opacity-100 text-[#C5A059]' : 'opacity-30'}`}>
                  {relic.name}
                </p>
              </div>
            );
          })}
        </div>
        {!SACRED_RELICS.some(r => getUnlockedRelics(streak, liveProfile?.seva_score ?? 0, liveProfile?.tradition ?? 'hindu').some(ur => ur.id === r.id)) && (
          <div className="mt-8 p-6 rounded-[2rem] bg-[#C5A059]/5 border border-dashed border-[#C5A059]/20 text-center">
            <p className="text-[12px] text-[#C5A059]/60 font-bold uppercase tracking-widest leading-relaxed">Continue your daily sadhana<br/>to unlock these relics 🙏</p>
          </div>
        )}
      </BottomDrawer>

      <BottomDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Sanatan Settings"
        description="Personalize your spiritual experience."
      >
        <div className="space-y-8 py-6">
          {/* Theme */}
          <div className="space-y-4">
            <p className="text-sm font-medium text-[var(--brand-primary)]">Visual theme</p>
            <div className="grid grid-cols-3 gap-3">
              {THEME_OPTIONS.map((option) => {
                const active = themePreference === option.value;
                const Icon = themeIconMap[option.value];
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setThemePreference(option.value)}
                    className={`flex flex-col items-center gap-3 p-4 rounded-2xl border transition-all duration-300 ${
                      active
                        ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                        : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted hover:border-[var(--brand-primary)]'
                    }`}
                  >
                    <Icon size={20} className={active ? 'text-[var(--brand-primary)]' : 'theme-muted'} />
                    <span className={`text-sm font-medium ${active ? 'text-[var(--brand-primary-strong)]' : 'theme-muted'}`}>
                      {option.label}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* App Icon */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#C5A059]">App Identity</p>
              {!isPro && (
                 <span className="text-[9px] font-black text-amber-400 uppercase tracking-widest bg-amber-400/10 px-3 py-1 rounded-full border border-amber-400/20">Pro Exclusive</span>
              )}
            </div>
            <div className="flex gap-4">
              {[
                { key: 'normal', img: '/assets/images/logos/logo-normal.png', label: 'Classic' },
                { key: 'pro', img: '/assets/images/logos/logo-pro.png', label: 'Divine Gold' },
              ].map((icon) => (
                <button
                  key={icon.key}
                  disabled={icon.key === 'pro' && !isPro}
                  onClick={() => {
                    setLocalAppIcon(icon.key as any);
                    localStorage.setItem('shoonaya_app_icon', icon.key);
                    toast.success(`${icon.label} icon set!`);
                  }}
                  className={`flex-1 flex flex-col items-center gap-3 p-3 rounded-2xl border transition-all duration-300 ${
                    localAppIcon === icon.key ? 'border-[#C5A059] bg-[#C5A059]/15 shadow-xl shadow-[#C5A059]/10' : 'border-white/5 bg-white/5 opacity-60 hover:opacity-100'
                  } ${icon.key === 'pro' && !isPro ? 'grayscale opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <Image src={icon.img} alt={icon.label} fill className="object-cover" />
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#F2EAD6]/40">{icon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#C5A059]">Interface</p>
              <div className="flex flex-col gap-2">
                {APP_LANGUAGES.map((lang) => {
                  const active = contextLang === lang.value;
                  return (
                    <button
                      key={lang.value}
                      onClick={() => {
                        const nextMeaningLanguage = lang.value === 'hi' || lang.value === 'pa' ? lang.value : 'en';
                        setLang(lang.value as AppLang);
                        patchProfile({ app_language: lang.value, meaning_language: nextMeaningLanguage }, `Language: ${lang.label}`);
                      }}
                      className={`px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-widest border transition-all ${
                        active ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-lg shadow-[#C5A059]/20' : 'bg-white/5 border-white/5 text-[#F2EAD6]/40'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#C5A059]">Scripture</p>
              <div className="flex flex-col gap-2">
                {MEANING_LANGUAGE_OPTIONS.map((opt) => {
                  const active = (form.meaning_language ?? 'en') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => patchProfile({ meaning_language: opt.value }, `Meanings: ${opt.label}`)}
                      className={`px-4 py-3 rounded-xl text-left text-xs font-black uppercase tracking-widest border transition-all ${
                        active ? 'bg-[#C5A059] text-black border-[#C5A059] shadow-lg shadow-[#C5A059]/20' : 'bg-white/5 border-white/5 text-[#F2EAD6]/40'
                      }`}
                    >
                      {opt.label.replace(' meaning', '')}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div className="space-y-4">
             <p className="text-sm font-medium text-[var(--brand-primary)]">Divine reminders</p>
             <div className="grid grid-cols-2 gap-3">
                {[
                  { key: 'wants_shloka_reminders', label: 'Daily Wisdom' },
                  { key: 'wants_festival_reminders', label: 'Festivals' },
                  { key: 'wants_community_notifications', label: 'Community' },
                  { key: 'wants_family_notifications', label: 'Family' },
                ].map((item) => {
                  const checked = notificationPrefs[item.key as keyof typeof notificationPrefs] as boolean;
                  return (
                    <button
                      key={item.key}
                      onClick={() => {
                        const next = !checked;
                        setNotificationPrefs(prev => ({ ...prev, [item.key]: next }));
                        patchProfile({ [item.key]: next }, `${item.label} ${next ? 'enabled' : 'disabled'}`);
                      }}
                      className={`flex items-center justify-between px-5 py-4 rounded-2xl border transition-all duration-300 ${
                        checked
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                          : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted'
                      }`}
                    >
                      <span className="text-sm font-medium">{item.label}</span>
                      <div className={`w-2.5 h-2.5 rounded-full shadow-sm ${checked ? 'bg-[var(--brand-primary)]' : 'bg-[var(--text-dim)]/30'}`} />
                    </button>
                  );
                })}
             </div>
             <button
               onClick={sendTestNotification}
               disabled={sendingTestNotification}
               className="w-full py-4 rounded-2xl bg-[var(--card-bg-soft)] border border-[var(--card-border)] text-sm font-medium theme-ink transition-all hover:border-[var(--brand-primary)] active:scale-95 disabled:opacity-50"
             >
               {sendingTestNotification ? 'Ascending...' : 'Send Test Notification'}
             </button>
          </div>

          {/* Safety Sections if exist */}
          {hasSafetyItems && (
            <div className="space-y-4">
              <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#C5A059]">Moderation & Safety</p>
              <div className="space-y-3">
                {blockedProfiles.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                      <span className="text-[12px] font-bold text-[#F2EAD6]/70 truncate max-w-[140px]">{p.full_name || p.username}</span>
                      <button onClick={() => unblockProfile(p.id)} className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-4 py-2 rounded-full border border-[#C5A059]/30 transition-all hover:bg-[#C5A059]/10">Unblock</button>
                   </div>
                ))}
                {mutedProfiles.map(p => (
                   <div key={p.id} className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/10 shadow-inner">
                      <span className="text-[12px] font-bold text-[#F2EAD6]/70 truncate max-w-[140px]">{p.full_name || p.username}</span>
                      <button onClick={() => unmuteProfile(p.id)} className="text-[10px] font-black uppercase tracking-widest text-[#C5A059] px-4 py-2 rounded-full border border-[#C5A059]/30 transition-all hover:bg-[#C5A059]/10">Unmute</button>
                   </div>
                ))}
              </div>
            </div>
          )}

          {/* Data Management (L-02) */}
          <div className="pt-6 border-t border-white/10 space-y-4">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-[#C5A059]/60 px-1">Privacy & Data</p>
            <button 
              onClick={async () => {
                const { data, error } = await supabase.rpc('export_user_data');
                if (error) return toast.error('Export failed: ' + error.message);
                const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `shoonaya_data_${new Date().toISOString().split('T')[0]}.json`;
                a.click();
                toast.success('Data exported successfully! 🙏');
              }}
              className="w-full flex items-center justify-between p-5 rounded-2xl bg-white/5 border border-white/5 text-[#F2EAD6]/80 hover:bg-white/10 transition-all group"
            >
              <div className="flex flex-col items-start">
                <span className="text-[11px] font-black uppercase tracking-widest">Download My Data</span>
                <span className="text-[9px] font-bold opacity-40 uppercase tracking-wider mt-1">Export your spiritual records</span>
              </div>
              <Download size={18} className="text-[#C5A059]/40 group-hover:scale-110 transition-transform" />
            </button>
          </div>

          {/* Account Deletion */}
          <div className="pt-8 border-t border-white/10">
            <p className="text-[10px] uppercase tracking-[0.25em] font-black text-red-500/60 mb-4 px-1">Danger Zone</p>
            {isDeleting ? (
              <div className="p-6 rounded-2xl bg-red-500/10 border border-red-500/20 space-y-4 shadow-xl">
                <p className="text-[11px] text-red-400 font-bold uppercase tracking-wider leading-relaxed">
                  Account scheduled for deletion on<br/>{new Date(new Date(deletionDate!).getTime() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
                </p>
                <button 
                  onClick={cancelAccountDeletion}
                  className="w-full py-4 rounded-xl bg-white/10 border border-white/20 text-[10px] font-black uppercase tracking-[0.2em] text-white hover:bg-white/20 transition-all active:scale-95"
                >
                  Cancel Deletion Request
                </button>
              </div>
            ) : (
              <button 
                onClick={requestAccountDeletion}
                className="w-full flex items-center justify-between p-5 rounded-2xl bg-red-500/5 border border-red-500/10 text-red-500/60 hover:bg-red-500/10 transition-all duration-300 group shadow-lg"
              >
                <div className="flex flex-col items-start">
                  <span className="text-[11px] font-black uppercase tracking-widest group-hover:text-red-500 transition-colors">Delete Account</span>
                  <span className="text-[9px] font-bold opacity-60 uppercase tracking-wider mt-1">30-day cool-off period</span>
                </div>
                <AlertCircle size={18} className="group-hover:scale-110 transition-transform" />
              </button>
            )}
          </div>
        </div>
      </BottomDrawer>

      <AnimatePresence>
        {inviteOpen && (() => {
          const code = generateInviteCode(userId);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
          const link = `${baseUrl}/join?ref=${code}`;
          
          const onCopy = async () => {
            try {
              await navigator.clipboard.writeText(link);
              toast.success('Invite link copied! 🙏');
            } catch {
              toast.error('Failed to copy');
            }
          };

          const onShare = async () => {
            const shareText = `Join me on Shoonaya — your dharmic home.\n\nInvite code: ${code}\n${link}`;
            if (typeof navigator !== 'undefined' && navigator.share) {
              try {
                await navigator.share({ title: 'Join Shoonaya 🙏', text: shareText, url: link });
              } catch (err) {
                if ((err as Error).name !== 'AbortError') onCopy();
              }
            } else {
              onCopy();
            }
          };

          return (
            <motion.div className="fixed inset-0 z-[150] flex items-end" onClick={() => setInviteOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <div className="absolute inset-0 bg-black/80 backdrop-blur-md" />
              <motion.div className="relative w-full rounded-t-[3.5rem] p-10 space-y-8" onClick={e => e.stopPropagation()}
                style={{ background: 'var(--surface-raised)', borderTop: '1px solid var(--card-border)', boxShadow: 'var(--profile-shadow)' }}
                initial={{ y: "100%" }} animate={{ y: 0 }} exit={{ y: "100%" }}
                transition={{ type: 'spring', damping: 28, stiffness: 180 }}>
                <div className="w-16 h-1.5 rounded-full mx-auto mb-4 bg-[#C5A059]/30" />
                <div className="flex items-center justify-between mb-2">
                  <div className="space-y-1">
                    <h3 className="text-3xl font-medium theme-ink premium-serif">Expand the circle</h3>
                    <p className="text-sm theme-muted">Invite your Mandali</p>
                  </div>
                  <button onClick={() => setInviteOpen(false)} className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 transition-all hover:bg-white/10 active:scale-90">
                    <X size={22} className="text-[#F2EAD6]/40" />
                  </button>
                </div>
                
                <div className="space-y-6">
                  <p className="text-sm theme-muted leading-relaxed">Your devotion grows when shared. Invite your family and close friends to the Shoonaya community.</p>
                  
                  <div className="relative group cursor-pointer" onClick={onCopy}>
                    <div className="rounded-[2.5rem] p-10 text-center border bg-[#C5A059]/5 border-[#C5A059]/20 shadow-inner overflow-hidden relative">
                      <div className="absolute inset-0 bg-gradient-to-br from-[#C5A059]/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <p className="text-[11px] mb-4 font-black uppercase tracking-[0.3em] text-[#C5A059]/40 relative z-10">Personal Invite Code</p>
                      <p className="text-5xl font-serif font-black tracking-[0.15em] text-[#C5A059] uppercase drop-shadow-2xl relative z-10">{code}</p>
                      <div className="absolute top-4 right-4 text-[#C5A059]/40 group-hover:text-[#C5A059] transition-colors">
                        <Star size={16} />
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <button onClick={onCopy} className="py-5 rounded-2xl font-medium text-sm bg-[var(--card-bg-soft)] border border-[var(--card-border)] theme-ink transition-all hover:border-[var(--brand-primary)] active:scale-95 flex items-center justify-center gap-2">
                      Copy Link
                    </button>
                    <button onClick={onShare} className="py-5 rounded-2xl font-medium text-sm bg-[var(--brand-primary)] text-white shadow-sm transition-all active:scale-95 flex items-center justify-center gap-2">
                      🙏 Share Now
                    </button>
                  </div>
                </div>
              </motion.div>
            </motion.div>
          );
        })()}
      </AnimatePresence>

      {/* ── Kul Invite Modal (Sacred Invite) ── */}
      <AnimatePresence>
        {showInviteModal && kulData && (
          <div className="fixed inset-0 z-[300] flex items-end justify-center px-4 pb-12">
            <motion.div 
              initial={{ opacity: 0 }} 
              animate={{ opacity: 1 }} 
              exit={{ opacity: 0 }}
              onClick={() => setShowInviteModal(false)}
              className="absolute inset-0 bg-black/80 backdrop-blur-xl" 
            />
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="relative w-full max-w-lg clay-card rounded-[3rem] p-8 space-y-8 border-[#C5A059]/30 shadow-[0_-20px_60px_rgba(0,0,0,0.5)] overflow-hidden"
            >
              {/* Decorative Aura */}
              <div className="absolute -top-24 -left-24 w-64 h-64 bg-[#C5A059]/10 blur-[80px] rounded-full pointer-events-none" />
              
              <div className="text-center space-y-2">
                <div className="w-20 h-20 rounded-[2rem] bg-gradient-to-br from-[#C5A059]/30 to-transparent flex items-center justify-center mx-auto mb-4 border border-[#C5A059]/20 shadow-inner">
                  <Users className="text-[#C5A059]" size={32} />
                </div>
                <h2 className="text-3xl font-medium theme-ink premium-serif">Sacred invite</h2>
                <p className="text-sm theme-muted">Invite seekers to {kulData.name}</p>
              </div>

              <div className="space-y-4">
                <div className="p-6 rounded-[2rem] bg-black/40 border border-white/5 space-y-3 text-center shadow-inner">
                  <p className="text-xs theme-muted">Your Kul invite code</p>
                  <p className="text-4xl font-serif text-[var(--brand-primary)] tracking-[0.18em] drop-shadow-lg">{kulData.code}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <button 
                    onClick={() => {
                      const link = `https://shoonaya.app/kul/join?code=${kulData.code}`;
                      navigator.clipboard.writeText(link);
                      toast.success('Join link copied 🙏');
                    }}
                    className="flex flex-col items-center gap-2 p-5 rounded-[2rem] bg-white/5 border border-white/5 hover:bg-white/10 hover:border-[#C5A059]/30 transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-[#C5A059]/10 flex items-center justify-center text-[#C5A059] group-hover:scale-110 transition-transform">
                      <Download className="rotate-[-90deg]" size={18} />
                    </div>
                    <span className="text-xs font-medium theme-ink">Copy link</span>
                  </button>

                  <button 
                    onClick={() => {
                      const text = `🙏 Namaste! Join my Kul "${kulData.name}" on Shoonaya. \n\nJoin link: https://shoonaya.app/kul/join?code=${kulData.code}`;
                      window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
                    }}
                    className="flex flex-col items-center gap-2 p-5 rounded-[2rem] bg-green-500/10 border border-green-500/20 hover:bg-green-500/20 transition-all active:scale-95 group"
                  >
                    <div className="w-10 h-10 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 group-hover:scale-110 transition-transform">
                      <MessageCircle size={18} />
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-widest text-green-500">WhatsApp</span>
                  </button>
                </div>
              </div>

              <button 
                onClick={() => setShowInviteModal(false)}
                className="w-full py-5 rounded-[2rem] bg-[var(--card-bg-soft)] theme-muted text-sm font-medium hover:bg-[var(--brand-primary-soft)] transition-all active:scale-[0.98]"
              >
                Close Portal
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
      <BottomDrawer
        isOpen={showPhotoOptions}
        onClose={() => setShowPhotoOptions(false)}
        title="Photo Identity"
        description="Choose how you present your presence."
      >
        <div className="space-y-4 py-6">
          <label className="flex items-center gap-4 p-5 rounded-[1.5rem] bg-[#C5A059]/10 border border-[#C5A059]/30 cursor-pointer active:scale-95 transition-all">
            <div className="w-10 h-10 rounded-xl bg-[#C5A059] flex items-center justify-center text-black shadow-lg">
              <Download size={20} />
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium theme-ink">Upload from device</p>
              <p className="text-xs theme-muted mt-0.5">Gallery or camera</p>
            </div>
            <input type="file" accept="image/*" className="hidden" onChange={uploadAvatar} />
          </label>

          <button 
            onClick={removeAvatar}
            disabled={!avatarUrl}
            className="w-full flex items-center gap-4 p-5 rounded-[1.5rem] bg-red-500/5 border border-red-500/10 active:scale-95 transition-all disabled:opacity-20"
          >
            <div className="w-10 h-10 rounded-xl bg-red-500/20 flex items-center justify-center text-red-500 shadow-lg">
              <X size={20} />
            </div>
            <div className="flex-1 text-left">
              <p className="text-sm font-medium theme-ink">Remove current photo</p>
              <p className="text-xs text-red-500 mt-0.5">Reset to initials</p>
            </div>
          </button>
        </div>
      </BottomDrawer>
    </motion.div>
  );
}

function BottomDrawer({
  isOpen,
  onClose,
  title,
  description,
  children
}: {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[150] flex items-end"
          onClick={onClose}
        >
          <div className="absolute inset-0 bg-black/80 backdrop-blur-xl" />
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ type: 'spring', damping: 28, stiffness: 180 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-h-[90vh] overflow-y-auto rounded-t-[3.5rem] p-10 pb-16"
            style={{ 
              background: 'var(--surface-raised)',
              borderTop: '1px solid var(--card-border)',
              boxShadow: 'var(--profile-shadow)'
            }}
          >
            <div className="w-16 h-1.5 rounded-full mx-auto mb-10 bg-[var(--brand-primary-soft)]" />
            <div className="flex items-center justify-between mb-2">
              <div className="space-y-1">
                <h3 className="text-3xl font-medium theme-ink premium-serif">{title}</h3>
                {description && <p className="text-sm theme-muted">{description}</p>}
              </div>
              <button
                onClick={onClose}
                className="w-12 h-12 rounded-2xl bg-[var(--card-bg-soft)] flex items-center justify-center border border-[var(--card-border)] transition-all active:scale-90 hover:bg-[var(--brand-primary-soft)]"
              >
                <X size={24} className="theme-muted" />
              </button>
            </div>
            
            <div className="custom-scrollbar mt-4">
              {children}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
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
    <div className="rounded-[1.5rem] px-5 py-4 flex items-center gap-4 group transition-all profile-card">
      <div className="relative w-12 h-12 rounded-2xl bg-[var(--brand-primary)] text-white flex items-center justify-center text-sm font-medium overflow-hidden flex-shrink-0 shadow-lg group-hover:scale-105 transition-transform">
        {profile.avatar_url
          ? <Image src={profile.avatar_url} alt="" fill sizes="48px" className="object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium theme-ink truncate">{profile.full_name || profile.username}</p>
        <p className="text-xs theme-muted truncate">{profile.username ? `@${profile.username}` : 'Shoonaya member'}</p>
      </div>
      <button
        onClick={onAction}
        disabled={disabled}
        className="px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-40"
        style={{
          border: '1px solid rgba(197, 160, 89, 0.3)',
          color: '#C5A059',
          background: 'rgba(197, 160, 89, 0.08)',
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
      className="fixed inset-0 z-[200] bg-black/75 backdrop-blur-md px-6 py-10 flex items-center justify-center"
      onClick={onClose}
    >
      <div className="relative w-full max-w-lg" onClick={(e) => e.stopPropagation()}>
        <button
          type="button"
          onClick={onClose}
          className="absolute -top-16 right-0 z-10 w-12 h-12 rounded-2xl bg-[var(--surface-raised)] theme-ink flex items-center justify-center transition-all hover:bg-[var(--card-bg)] active:scale-90 border border-[var(--card-border)]"
          aria-label="Close"
        >
          <X size={24} />
        </button>
        <motion.div 
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="clay-card rounded-[3rem] p-6 shadow-2xl border-white/10"
        >
          <div className="relative aspect-square w-full overflow-hidden rounded-[2.5rem] shadow-inner">
            <Image
              src={avatarUrl}
              alt={fullName}
              fill
              sizes="(max-width: 768px) 90vw, 500px"
              className="object-cover"
              priority
            />
          </div>
          <div className="text-center mt-6 space-y-1">
            <p className="text-2xl font-medium theme-ink premium-serif">
              {fullName}
            </p>
            <p className="text-xs theme-muted">Profile photo</p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}

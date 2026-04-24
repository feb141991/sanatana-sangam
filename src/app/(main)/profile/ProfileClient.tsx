'use client';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan, X, Download, BarChart2, Loader2, ChevronLeft, LayoutGrid, ChevronRight, Monitor, Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { APP } from '@/lib/config';
import { createClient } from '@/lib/supabase';
import type { HiddenContentSummary, SafetyProfileSummary } from '@/lib/user-safety';
import { getInitials, ISHTA_DEVATAS, SAMPRADAYAS, SPIRITUAL_LEVELS, TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getIshtaDevataLabel, getSampradayaLabel } from '@/lib/utils';
import { APP_LANGUAGES, MEANING_LANGUAGE_OPTIONS, SCRIPTURE_SCRIPT_OPTIONS, getLanguageLabel } from '@/lib/language-preferences';
import type { TraditionKey } from '@/lib/traditions';
import { useLocation } from '@/lib/LocationContext';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';
import { getPlayerId, getPermissionState, logoutFromOneSignal } from '@/lib/onesignal';
import type { Profile } from '@/types/database';
import { MetricTile, SurfaceSection } from '@/components/ui';
import CircularProgress from '@/components/ui/CircularProgress';
import { useProfileQuery, useUpdateProfileMutation } from '@/hooks/useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import type { ProfileUpdate } from '@/lib/api/profile';
import { usePremium } from '@/hooks/usePremium';
import { THEME_OPTIONS, type ThemePreference } from '@/lib/theme-preferences';
import { useThemePreference } from '@/components/providers/ThemeProvider';

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
    <div className="glass-panel rounded-2xl p-4 flex items-center gap-4">
      {/* Circular seva-progress ring */}
      <CircularProgress
        pct={pct}
        accent="var(--brand-primary)"
        size={64}
        strokeWidth={5}
        label={<span className="text-2xl leading-none">{badge.emoji}</span>}
      />
      {/* Label + score */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center justify-between">
          <div>
            <p className="type-card-heading">{badge.label}</p>
            <p className="type-card-label">Seva level</p>
          </div>
          <div className="text-right">
            <p className="type-metric">{score}</p>
            <p className="type-micro">seva points</p>
          </div>
        </div>
        {nextLevel && (
          <p className="type-micro mt-1.5">
            {nextLevel.min - score} pts to {nextLevel.label}
          </p>
        )}
      </div>
    </div>
  );
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

// ── Home Customisation ───────────────────────────────────────────────────
const HOME_EXPLORE_CARDS = [
  { label: 'Tirtha',    icon: '🛕', href: '/tirtha-map', desc: 'Find sacred places near you'  },
  { label: 'Mandali',   icon: '🏡', href: '/mandali',    desc: 'Your local sangam'             },
  { label: 'Kul',       icon: '❤️', href: '/kul',        desc: 'Family sadhana together'       },
  { label: 'Pathshala', icon: '📖', href: '/library',    desc: 'Tradition-first study tracks'  },
];
const HOME_DEFAULT_CARD_ORDER = HOME_EXPLORE_CARDS.map(c => c.href);
const HOME_CARD_MAP = Object.fromEntries(HOME_EXPLORE_CARDS.map(c => [c.href, c]));

const HOME_SECTIONS = [
  { key: 'vichaar-sabha',  icon: '💬', label: 'Vichaar Sabha',  desc: 'Community discussion forum' },
  { key: 'invite-friends', icon: '🙏', label: 'Invite Friends', desc: 'Spread the light of dharma' },
];

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
  const [showNotificationDiagnostics, setShowNotificationDiagnostics] = useState(false);
  const [safetyBusyKey, setSafetyBusyKey] = useState<string | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>((profile as any)?.avatar_url ?? null);
  const [showAvatarPreview, setShowAvatarPreview] = useState(false);
  const [browserPermission, setBrowserPermission] = useState<NotificationPermission>('default');
  const [browserPushSubscriptionId, setBrowserPushSubscriptionId] = useState<string | null>(null);
  const [blockedProfiles, setBlockedProfiles] = useState(initialBlockedProfiles);
  const [mutedProfiles, setMutedProfiles] = useState(initialMutedProfiles);
  const [hiddenItems, setHiddenItems] = useState(initialHiddenItems);
  // ── Home layout customisation (synced via localStorage) ──────────────────
  const [homeCardOrder, setHomeCardOrder] = useState<string[]>(() => {
    if (typeof window === 'undefined') return HOME_DEFAULT_CARD_ORDER;
    try {
      const saved = localStorage.getItem('home_card_order');
      if (saved) {
        const parsed = JSON.parse(saved) as string[];
        const merged = [...parsed.filter((h: string) => HOME_DEFAULT_CARD_ORDER.includes(h)), ...HOME_DEFAULT_CARD_ORDER.filter(h => !parsed.includes(h))];
        return merged;
      }
    } catch { /* ignore */ }
    return HOME_DEFAULT_CARD_ORDER;
  });
  const [homeHiddenCards, setHomeHiddenCards] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('home_hidden_cards');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });
  const [homeHiddenSections, setHomeHiddenSections] = useState<Set<string>>(() => {
    if (typeof window === 'undefined') return new Set();
    try {
      const saved = localStorage.getItem('home_hidden_sections');
      return saved ? new Set(JSON.parse(saved) as string[]) : new Set<string>();
    } catch { return new Set<string>(); }
  });

  function homeToggleCard(href: string) {
    setHomeHiddenCards(prev => {
      const next = new Set(prev);
      if (next.has(href)) next.delete(href); else next.add(href);
      try { localStorage.setItem('home_hidden_cards', JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  function homeMoveCard(href: string, dir: 'up' | 'down') {
    setHomeCardOrder(prev => {
      const idx = prev.indexOf(href);
      if (idx < 0) return prev;
      const next = [...prev];
      if (dir === 'up' && idx > 0) [next[idx - 1], next[idx]] = [next[idx], next[idx - 1]];
      else if (dir === 'down' && idx < next.length - 1) [next[idx], next[idx + 1]] = [next[idx + 1], next[idx]];
      try { localStorage.setItem('home_card_order', JSON.stringify(next)); } catch {}
      return next;
    });
  }
  function homeToggleSection(key: string) {
    setHomeHiddenSections(prev => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key); else next.add(key);
      try { localStorage.setItem('home_hidden_sections', JSON.stringify([...next])); } catch {}
      return next;
    });
  }
  const homeOrderedCards = homeCardOrder.map(h => HOME_CARD_MAP[h]).filter(Boolean);

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

<div class="footer">Generated by Sanatana Sangam · ${new Date().toLocaleDateString()}</div>
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
  const themeIconMap = {
    system: Monitor,
    dark: Moon,
    light: Sun,
  } satisfies Record<ThemePreference, typeof Monitor>;

  return (
    <div className="space-y-4 fade-in">

      {/* Back button */}
      <div className="flex items-center gap-3 px-1 pt-1">
        <button
          onClick={() => router.back()}
          aria-label="Go back"
          className="w-9 h-9 rounded-full flex items-center justify-center transition-all flex-shrink-0"
          style={{
            background: 'rgba(200,146,74,0.10)',
            border: '1px solid rgba(200,146,74,0.20)',
          }}
        >
          <ChevronLeft size={18} style={{ color: 'rgba(200,146,74,0.80)' }} />
        </button>
      </div>

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
                className={`relative w-16 h-16 rounded-full bg-[color:var(--brand-primary-soft)] border border-[rgba(200,146,74,0.16)] flex items-center justify-center text-[color:var(--brand-primary-strong)] text-xl font-medium overflow-hidden ${avatarUrl ? 'cursor-zoom-in' : 'cursor-default'}`}
                title={avatarUrl ? 'View profile photo' : 'No profile photo yet'}
              >
                {avatarUrl
                  ? <Image src={avatarUrl} alt="avatar" fill sizes="64px" className="object-cover" />
                  : initials}
              </button>
              <label
                htmlFor="avatar-upload"
                className={`absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-[rgba(200,146,74,0.16)] bg-[color:var(--surface-soft)] shadow-md ${uploading ? 'opacity-60' : 'cursor-pointer'}`}
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
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="type-screen-title">{liveProfile?.full_name}</h1>
                {isPro && (
                  <span
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold tracking-wide flex-shrink-0"
                    style={{
                      background: 'linear-gradient(135deg, #d4a818 0%, #c8920a 60%, #b07a08 100%)',
                      color: '#1c1c1a',
                      boxShadow: '0 0 8px rgba(200,146,74,0.35)',
                    }}
                  >
                    ✦ SANGAM PRO
                  </span>
                )}
              </div>
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
          {isPro ? (
            <MetricTile label="Streak" value={`${streak}🔥`} className="bg-white/8 border-white/10" />
          ) : (
            <MetricTile
              label="Streak"
              value="🔒 Pro"
              className="bg-white/8 border-white/10 opacity-50 cursor-pointer"
            />
          )}
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
                  onClick={() => {
                    // Update context immediately for instant UI feedback
                    setLang(lang.value as AppLang);
                    // Persist to DB + trigger server re-render
                    patchProfile({ app_language: lang.value }, `Language set to ${lang.label} 🙏`);
                  }}
                  className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all border"
                  style={active ? {
                    background: 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
                    color: '#1c1c1a',
                    borderColor: 'transparent',
                  } : {
                    background: 'rgba(200,146,74,0.06)',
                    color: 'var(--brand-muted)',
                    borderColor: 'rgba(200,146,74,0.14)',
                  }}
                >
                  {lang.label}
                </button>
              );
            })}
          </div>
          <p className="text-[10px] text-[color:var(--brand-muted)]/60 mt-1.5">Changes take effect immediately</p>
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

      <SurfaceSection
        eyebrow="Appearance"
        title="Theme"
        description={`Current app surface: ${resolvedTheme}.`}
      >
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
                  background: active ? 'rgba(200,146,74,0.14)' : 'rgba(255,255,255,0.04)',
                  borderColor: active ? 'rgba(200,146,74,0.32)' : 'rgba(255,255,255,0.08)',
                }}
              >
                <Icon size={16} style={{ color: active ? 'var(--brand-primary-strong)' : 'var(--text-dim)' }} />
                <p className="mt-2 text-sm font-medium theme-ink">{option.label}</p>
                <p className="mt-0.5 text-xs theme-dim leading-snug">{option.description}</p>
              </button>
            );
          })}
        </div>
      </SurfaceSection>

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

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My place</p>
            {[
              { label: 'City', key: 'city', placeholder: 'Current city' },
              { label: 'Country', key: 'country', placeholder: 'Country' },
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
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">My voice</p>
            <div>
              <label className="block text-sm font-medium theme-muted mb-1.5">Custom Greeting (optional)</label>
              <input type="text" placeholder="e.g. Waheguru Ji Ka Khalsa, Namo Buddhaya…"
                value={form.custom_greeting}
                onChange={(e) => setForm({ ...form, custom_greeting: e.target.value })}
                className="surface-input px-4 py-2.5 outline-none text-sm"
              />
              <p className="text-xs theme-dim mt-1">Overrides the auto greeting on your home screen</p>
            </div>

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

          <div className="space-y-3">
            <p className="text-[10px] uppercase tracking-[0.18em] font-semibold theme-dim">Language and script</p>
            <div>
              <label className="block text-sm font-medium theme-muted mb-1.5">App language</label>
              <select
                value={form.app_language}
                onChange={(e) => setForm({ ...form, app_language: e.target.value })}
                className="surface-select px-4 py-2.5 outline-none text-sm"
              >
                {APP_LANGUAGES.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium theme-muted mb-1.5">Scripture view</label>
              <select
                value={form.scripture_script}
                onChange={(e) => setForm({ ...form, scripture_script: e.target.value })}
                className="surface-select px-4 py-2.5 outline-none text-sm"
              >
                {SCRIPTURE_SCRIPT_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </div>
            <div>
              <label className="flex items-start justify-between gap-4 rounded-2xl border border-white/8 bg-white/[0.03] px-4 py-3 cursor-pointer">
                <div>
                  <p className="text-sm font-medium theme-ink">Show transliteration</p>
                  <p className="text-xs theme-dim mt-1 leading-relaxed">Keep Roman transliteration visible when available.</p>
                </div>
                <input
                  type="checkbox"
                  checked={Boolean(form.show_transliteration)}
                  onChange={(e) => setForm({ ...form, show_transliteration: e.target.checked })}
                  className="mt-1 h-4 w-4 rounded"
                  style={{ accentColor: 'var(--brand-primary)' }}
                />
              </label>
            </div>
            <div>
              <label className="block text-sm font-medium theme-muted mb-1.5">Meaning language</label>
              <select
                value={form.meaning_language}
                onChange={(e) => setForm({ ...form, meaning_language: e.target.value })}
                className="surface-select px-4 py-2.5 outline-none text-sm"
              >
                {MEANING_LANGUAGE_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
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

      {/* ── Customize Home ── */}
      <SurfaceSection
        eyebrow="Customise"
        title="Your home layout"
        description="Reorder and show or hide cards on your home screen."
      >
        {/* Explore Cards */}
        <div className="space-y-2">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-1" style={{ color: 'var(--text-dim)' }}>
            Explore Cards
          </p>
          {homeOrderedCards.map((item, idx) => {
            const hidden = homeHiddenCards.has(item.href);
            return (
              <div
                key={item.href}
                className="flex items-center gap-2 rounded-2xl px-3 py-2.5 transition-all"
                style={{
                  background: hidden ? 'rgba(255,255,255,0.03)' : 'rgba(200,146,74,0.08)',
                  border: `1px solid ${hidden ? 'rgba(255,255,255,0.08)' : 'rgba(200,146,74,0.20)'}`,
                }}
              >
                {/* Up / Down arrows */}
                <div className="flex flex-col gap-0.5 flex-shrink-0">
                  <button
                    onClick={() => homeMoveCard(item.href, 'up')}
                    disabled={idx === 0}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition disabled:opacity-25"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    aria-label="Move up"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 9V3M3 6l3-3 3 3" stroke="rgba(200,146,74,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                  <button
                    onClick={() => homeMoveCard(item.href, 'down')}
                    disabled={idx === homeOrderedCards.length - 1}
                    className="w-6 h-6 rounded-lg flex items-center justify-center transition disabled:opacity-25"
                    style={{ background: 'rgba(255,255,255,0.07)' }}
                    aria-label="Move down"
                  >
                    <svg width="10" height="10" viewBox="0 0 12 12" fill="none">
                      <path d="M6 3v6M3 6l3 3 3-3" stroke="rgba(200,146,74,0.75)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>

                {/* Icon + label */}
                <span className="text-lg leading-none flex-shrink-0">{item.icon}</span>
                <div className="flex-1 min-w-0 text-left">
                  <p className="text-sm font-semibold truncate" style={{ color: hidden ? 'var(--text-dim)' : 'var(--text-cream)' }}>
                    {item.label}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: 'var(--text-dim)' }}>{item.desc}</p>
                </div>

                {/* Toggle switch */}
                <button
                  onClick={() => homeToggleCard(item.href)}
                  className="flex-shrink-0"
                  aria-label={hidden ? 'Show card' : 'Hide card'}
                >
                  <div
                    className="w-11 h-6 rounded-full transition-all flex items-center px-0.5"
                    style={{ background: hidden ? 'rgba(255,255,255,0.10)' : 'rgba(200,146,74,0.55)' }}
                  >
                    <div
                      className="w-5 h-5 rounded-full transition-all"
                      style={{
                        background: '#fff',
                        transform: hidden ? 'translateX(0)' : 'translateX(20px)',
                        boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                      }}
                    />
                  </div>
                </button>
              </div>
            );
          })}

          {/* Reset buttons */}
          <div className="flex gap-2 pt-1">
            {homeHiddenCards.size > 0 && (
              <button
                onClick={() => {
                  setHomeHiddenCards(new Set());
                  try { localStorage.removeItem('home_hidden_cards'); } catch {}
                }}
                className="flex-1 py-2 rounded-2xl text-xs font-semibold"
                style={{ background: 'rgba(200,146,74,0.10)', border: '1px solid rgba(200,146,74,0.18)', color: 'var(--text-muted-warm)' }}
              >
                Show all
              </button>
            )}
            <button
              onClick={() => {
                setHomeCardOrder(HOME_DEFAULT_CARD_ORDER);
                try { localStorage.removeItem('home_card_order'); } catch {}
              }}
              className="flex-1 py-2 rounded-2xl text-xs font-semibold"
              style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)', color: 'var(--text-dim)' }}
            >
              Reset order
            </button>
          </div>
        </div>

        {/* Sections */}
        <div className="space-y-2 mt-4">
          <p className="text-[10px] font-semibold uppercase tracking-[0.15em] px-1" style={{ color: 'var(--text-dim)' }}>
            Sections
          </p>
          {HOME_SECTIONS.map(({ key, icon, label, desc }) => {
            const hidden = homeHiddenSections.has(key);
            return (
              <button
                key={key}
                onClick={() => homeToggleSection(key)}
                className="w-full flex items-center gap-3 rounded-2xl px-4 py-3 transition-all motion-press"
                style={{
                  background: hidden ? 'rgba(255,255,255,0.03)' : 'rgba(200,146,74,0.08)',
                  border: `1px solid ${hidden ? 'rgba(255,255,255,0.08)' : 'rgba(200,146,74,0.20)'}`,
                }}
              >
                <span className="text-xl flex-shrink-0">{icon}</span>
                <div className="flex-1 text-left">
                  <p className="text-sm font-semibold" style={{ color: hidden ? 'var(--text-dim)' : 'var(--text-cream)' }}>{label}</p>
                  <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>{desc}</p>
                </div>
                <div
                  className="w-11 h-6 rounded-full transition-all flex-shrink-0 flex items-center px-0.5"
                  style={{ background: hidden ? 'rgba(255,255,255,0.10)' : 'rgba(200,146,74,0.55)' }}
                >
                  <div
                    className="w-5 h-5 rounded-full transition-all"
                    style={{
                      background: '#fff',
                      transform: hidden ? 'translateX(0)' : 'translateX(20px)',
                      boxShadow: '0 1px 4px rgba(0,0,0,0.25)',
                    }}
                  />
                </div>
              </button>
            );
          })}
        </div>

        {/* Link back to home to see effect */}
        <div className="flex items-center gap-2 mt-3 px-1">
          <LayoutGrid size={11} style={{ color: 'var(--text-dim)' }} />
          <p className="text-[10px]" style={{ color: 'var(--text-dim)' }}>
            Changes apply instantly on your home screen.
          </p>
        </div>
      </SurfaceSection>

      {/* ── Sadhana Report ── */}
      <SurfaceSection
        eyebrow="My Progress"
        title="30-day sadhana report"
        description="Download a summary of your japa, nitya karma, and community activity for the past month."
      >
        <div className="flex items-start gap-4">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center flex-shrink-0"
            style={{ background: 'rgba(200,146,74,0.12)', color: 'var(--brand-primary-strong)' }}
          >
            <BarChart2 size={22} />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium theme-ink">Japa sessions, Nitya Karma streaks, and community contribution — all in one file you can save or print.</p>
            <p className="text-xs theme-dim mt-1">Covers the last 30 days · Downloads as HTML</p>
          </div>
        </div>
        <button
          onClick={downloadReport}
          disabled={reportLoading}
          className="mt-3 w-full inline-flex items-center justify-center gap-2 px-5 py-3 rounded-2xl text-sm font-semibold transition disabled:opacity-60"
          style={{
            background: reportLoading
              ? 'rgba(200,146,74,0.12)'
              : 'linear-gradient(135deg, var(--brand-primary), var(--brand-primary-strong))',
            color: reportLoading ? 'var(--brand-muted)' : '#1c1c1a',
          }}
        >
          {reportLoading
            ? <><Loader2 size={16} className="animate-spin" /> Generating…</>
            : <><Download size={16} /> Download Report</>}
        </button>
      </SurfaceSection>

      {/* ── Invite Friends ── */}
      <button
        onClick={() => setInviteOpen(true)}
        className="w-full rounded-[1.6rem] border p-4 flex items-center gap-4 transition motion-press"
        style={{
          background: 'linear-gradient(150deg, rgba(30,22,14,0.97), rgba(22,16,8,0.96))',
          borderColor: 'rgba(200,146,74,0.20)',
          boxShadow: '0 8px 24px rgba(0,0,0,0.18)',
        }}
      >
        <div className="w-11 h-11 rounded-[0.9rem] flex items-center justify-center text-2xl flex-shrink-0"
          style={{ background: 'rgba(200,146,74,0.12)' }}>
          🙏
        </div>
        <div className="text-left">
          <p style={{ fontFamily: 'var(--font-serif)', fontSize: '1rem', fontWeight: 600, color: 'var(--text-cream)' }}>
            Invite Friends &amp; Family
          </p>
          <p className="text-xs mt-0.5" style={{ color: 'var(--text-dim)' }}>Spread the light of dharma</p>
        </div>
      </button>

      {/* ── Account ── */}
      <div className="rounded-2xl border p-4 space-y-3" style={{ background: 'rgba(22, 18, 12, 0.9)', borderColor: 'rgba(255,255,255,0.07)' }}>
        <div className="text-sm" style={{ color: 'var(--text-dim)' }}>
          Signed in as <span className="font-medium" style={{ color: 'var(--text-muted)' }}>{userEmail}</span>
        </div>
        <button onClick={signOut}
          className="flex items-center gap-2 text-sm font-medium transition"
          style={{ color: 'rgba(220,80,80,0.8)' }}>
          <LogOut size={15} /> Sign out
        </button>
      </div>

      {/* ── Invite Modal ── */}
      <AnimatePresence>
        {inviteOpen && (() => {
          const code = generateInviteCode(userId);
          const baseUrl = typeof window !== 'undefined' ? window.location.origin : APP.BASE_URL;
          const link = `${baseUrl}/join?ref=${code}`;
          async function share() {
            const shareText = `Join me on Sanatana Sangam — your dharmic home.\n\nInvite code: ${code}\n${link}`;
            if (typeof navigator !== 'undefined' && navigator.share) {
              try { await navigator.share({ title: 'Join Sanatana Sangam 🙏', text: shareText, url: link }); return; } catch {}
            }
            try { await navigator.clipboard.writeText(shareText); toast.success('Invite link copied! 🙏'); } catch { window.prompt('Copy your invite link:', link); }
          }
          return (
            <motion.div className="fixed inset-0 z-50 flex items-end" onClick={() => setInviteOpen(false)}
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <motion.div className="w-full rounded-t-[2rem] p-6 space-y-5" onClick={e => e.stopPropagation()}
                style={{ background: 'linear-gradient(180deg, rgba(44,38,28,0.99), rgba(34,30,22,0.99))', borderTop: '1px solid rgba(200,146,74,0.20)', boxShadow: '0 -20px 48px rgba(0,0,0,0.38)' }}
                initial={{ y: 32, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}
                transition={{ duration: 0.32, ease: [0.34, 1.26, 0.64, 1] }}>
                <div className="w-10 h-1 rounded-full mx-auto mb-1" style={{ background: 'rgba(200,146,74,0.28)' }} />
                <div className="flex items-center justify-between">
                  <h3 style={{ fontFamily: 'var(--font-serif)', fontSize: '1.25rem', fontWeight: 600, color: 'var(--text-cream)' }}>Invite Friends &amp; Family</h3>
                  <button onClick={() => setInviteOpen(false)} className="w-8 h-8 rounded-full flex items-center justify-center" style={{ background: 'rgba(200,146,74,0.10)' }}>
                    <X size={15} style={{ color: 'var(--text-muted-warm)' }} />
                  </button>
                </div>
                <p className="text-sm leading-relaxed" style={{ color: 'var(--text-muted-warm)' }}>Share Sanatana Sangam with your family and friends using your personal invite code.</p>
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
    <div className="rounded-2xl px-3 py-3 flex items-center gap-3" style={{ border: '1px solid rgba(200,146,74,0.12)', background: 'rgba(255,255,255,0.04)' }}>
      <div className="relative w-10 h-10 rounded-full bg-gradient-sacred text-white flex items-center justify-center text-xs font-bold overflow-hidden flex-shrink-0">
        {profile.avatar_url
          ? <Image src={profile.avatar_url} alt="" fill sizes="40px" className="object-cover" />
          : initials}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[color:var(--text-cream)] truncate">{profile.full_name || profile.username}</p>
        <p className="text-xs text-[color:var(--brand-muted)] truncate">{profile.username ? `@${profile.username}` : 'Sanatana Sangam member'}</p>
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

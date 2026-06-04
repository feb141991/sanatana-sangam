'use client';

import SacredIcon, { SacredIconName } from '@/components/ui/SacredIcon';

import Image from 'next/image';
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { BellOff, EyeOff, LogOut, Edit3, MapPin, Lock, Camera, ShieldBan, X, Download, Loader2, ChevronLeft, ChevronRight, Monitor, Moon, Sun, Star, MessageSquare, MessageCircle, Settings, Shield, Users, AlertCircle, Share2 } from 'lucide-react';
import Link from 'next/link';
import { Twitter, Link as LinkIcon } from 'lucide-react';
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
import TierBadge from '@/components/ui/TierBadge';
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
import { getRelicFrame } from '@/lib/relic-frames';
import SadhanaHighlightsCard from '@/components/profile/SadhanaHighlightsCard';
import { InviteModal } from '@/app/(main)/home/sections/InviteModal';

import SocialShareDrawer from '@/components/profile/SocialShareDrawer';
import InviteCard from '@/components/home/InviteCard';

const PATH_LABELS: Record<string, string> = {
  universal: 'Universal path',
  hindu:     'Hindu path',
  sikh:      'Sikh path',
  buddhist:  'Buddhist path',
  jain:      'Jain path',
};

// ── Relic emoji map (copied inline from KoshClient) ─────────────────────────
const RELIC_EMOJI: Record<string, string> = {
  // Universal
  'diya-bronze':         '🪔',
  'clay-kalash':         '🏺',
  'incense-sandalwood':  '🪷',
  'camphor-flame':       '🕯️',
  'mindful-bell':        '🔔',
  'copper-lota':         '🫙',
  'asana-kusha':         '🌿',
  'sacred-mala':         '📿',
  'shankha-conch':       '🐚',
  'prarthana-pothi':     '📖',
  'the-sage-halo':       '✨',
  // Hindu
  'ganesha-modak':       '🍡',
  'vibhuti-ash':         '🌫️',
  'trishula-gold':       '🔱',
  'krishna-flute':       '🎶',
  'rama-bow':            '🏹',
  'peacock-feather':     '🦚',
  'durga-shield':        '🛡️',
  'ananta-shesha':       '🐍',
  'tulsi-leaf':          '🌱',
  'shiva-damaru':        '🥁',
  'nandi-devotion':      '🐂',
  'brahma-lotus':        '🪷',
  'hanuman-gada':        '🏏',
  'sudarshana-chakra':   '🌀',
  'ganga-kalash':        '🏺',
  'rishi-kamandalu':     '🫙',
  'chintamani-gem':      '💎',
  // Sikh
  'steel-kara':          '⭕',
  'sacred-kirpan':       '⚔️',
  'khanda-gold':         '☬',
  'sikh-chaur':          '🌾',
  'kartarpur-nishan':    '🚩',
  'wooden-kangha':       '🪥',
  'nishan-sahib':        '🏴',
  'deg-teg':             '⚔️',
  'gurbani-pothi':       '📜',
  // Buddhist
  'lotus-bloom':         '🌸',
  'alms-bowl':           '🍵',
  'dharma-wheel-gold':   '☸️',
  'treasure-vase':       '🫙',
  'golden-fish':         '🐟',
  'bodhi-leaf':          '🍃',
  'prayer-wheel':        '☸️',
  'vajra-scepter':       '⚡',
  'parasol-royalty':     '☂️',
  // Jain
  'jain-swastika':       '🔯',
  'peacock-brush':       '🦚',
  'siddhashila-moon':    '🌙',
  'ahimsa-hand':         '🤲',
  'three-jewels':        '💎',
  'siddhachakra-wheel':  '🔵',
  'jain-kalasha':        '🏺',
};

function relicEmoji(id: string | null | undefined): string | null {
  if (!id) return null;
  return RELIC_EMOJI[id] ?? '🔱';
}

const ASHRAMA_DESCRIPTIONS: Record<string, string> = {
  brahmacharya: "Brahmacharya is the sacred stage of learning, self-discipline, and spiritual preparation. During these formative years, a seeker focuses on acquiring wisdom, cultivating physical and mental purity, and mastering the senses under the guidance of truth. It is a period of laying a secure foundation through study, contemplation, and consistent daily rituals, paving the path for a life of purpose, virtue, and deep spiritual awareness.",
  grihastha: "Grihastha is the householder stage of active service, family, and community responsibility. In this phase, the seeker integrates spiritual practice with worldly duties, supporting family, society, and ancestral lineages. It is a profound path of karma yoga, where every action is performed as a selfless offering. Sadhana is not abandoned but is integrated into the rhythm of daily duties, fostering patience, love, and spiritual maturity.",
  vanaprastha: "Vanaprastha is the transition stage of gradual retirement and turning inward. As worldly responsibilities are handed down to the next generation, the seeker withdraws from active societal ambitions to focus on deeper contemplation, meditation, and spiritual study. It is a time of sharing wisdom, letting go of attachments, and simplifying life, preparing the soul for the ultimate journey of self-realization and formless union.",
  sannyasa: "Sannyasa is the stage of complete renunciation and absolute spiritual freedom. The renunciate breaks all worldly bonds, dedicating the remainder of life solely to the pursuit of Moksha—liberation. Moving beyond personal identity, family ties, and possessions, the sannyasi beholds the Divine in all beings and walks as a pure channel of peace, wisdom, and selfless love, completely absorbed in the contemplation of the ultimate reality."
};

const ASHRAMA_BULLETS: Record<string, string[]> = {
  brahmacharya: [
    "Develop a robust foundation of learning and scripture through Pathshala and study of sacred verses.",
    "Cultivate steady concentration and mental clarity through daily Japa mala practice."
  ],
  grihastha: [
    "Your sadhana supports family and community — Kul and Mandali are your path.",
    "Perform karma yoga and build consistency through daily Nitya and Seva point tracking."
  ],
  vanaprastha: [
    "Deepen your meditation and study by tracking your progress and streaks on long-term pathshala paths.",
    "Engage in selfless service and ancestral remembrance using custom vrat, tithi, and lunar panchang timing."
  ],
  sannyasa: [
    "Embrace the formless path with pure, unattached Japa mala focus and silent meditation tracking.",
    "Accumulate spiritual treasury by equipping sacred relics and guiding seekers in the community."
  ]
};

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');

  const rawData = window.atob(base64);
  const outputArray = new Uint8Array(rawData.length);

  for (let i = 0; i < rawData.length; ++i) {
    outputArray[i] = rawData.charCodeAt(i);
  }
  return outputArray;
}

// ── Practice path options per tradition (mirrors OnboardingClient) ─────────────
function getPracticePathOptions(tradition: TraditionKey | '') {
  switch (tradition) {
    case 'sikh':
      return [
        { key: 'general' as GenderContext, icon: 'sparkles' as SacredIconName, label: 'Sangat path', sub: 'Nitnem, simran, seva and sangat' },
        { key: 'female'  as GenderContext, icon: 'flower' as SacredIconName, label: 'Kaur path', sub: 'Life-stage guidance with Sikh context' },
      ];
    case 'buddhist':
      return [
        { key: 'general' as GenderContext, icon: 'compass' as SacredIconName, label: 'Dharma path', sub: 'Refuge, mindfulness and daily practice' },
        { key: 'female'  as GenderContext, icon: 'flower' as SacredIconName, label: 'Householder path', sub: 'Life-stage guidance with Buddhist context' },
      ];
    case 'jain':
      return [
        { key: 'general' as GenderContext, icon: 'heart' as SacredIconName, label: 'Jain path', sub: 'Ahimsa, svadhyaya and daily reflection' },
        { key: 'female'  as GenderContext, icon: 'flower' as SacredIconName, label: 'Shravika path', sub: 'Life-stage guidance with Jain context' },
      ];
    default:
      return [
        { key: 'general' as GenderContext, icon: 'tree' as SacredIconName, label: 'General path', sub: 'Traditional practice for all' },
        { key: 'female'  as GenderContext, icon: 'flower' as SacredIconName, label: 'Stridharma path', sub: "Women’s tradition-specific duties" },
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
  totalBeads,
  totalRounds,
  totalMinutes,
  totalSessions,
  streak: initialHighlightsStreak,
  topMantra,
  nityaDays,
  pathshalaEntries,
  bookmarkedVerses,
  showSadhanaHighlights: initialShowSadhanaHighlights,
  isOwnProfile,
}: {
  profile:     Profile | null;
  threadCount: number;
  postCount:   number;
  userId:      string;
  userEmail:   string;
  blockedProfiles: SafetyProfileSummary[];
  mutedProfiles: SafetyProfileSummary[];
  hiddenItems: HiddenContentSummary[];
  totalBeads: number;
  totalRounds: number;
  totalMinutes: number;
  totalSessions: number;
  streak: number;
  topMantra: string | null;
  nityaDays: number;
  pathshalaEntries: number;
  bookmarkedVerses: number;
  showSadhanaHighlights: boolean;
  isOwnProfile: boolean;
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
  const [socialShareOpen, setSocialShareOpen] = useState(false);
  const [ashramaInfoOpen, setAshramaInfoOpen] = useState(false);
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
  const [showSadhanaHighlights, setShowSadhanaHighlights] = useState(initialShowSadhanaHighlights);
  const [isDeleting, setIsDeleting] = useState((liveProfile as any)?.is_deleting ?? false);
  const [deletionDate, setDeletionDate] = useState((liveProfile as any)?.deletion_requested_at ?? null);
  const [newRelicIds, setNewRelicIds] = useState<string[]>([]);

  const [reminderEnabled, setReminderEnabled] = useState<boolean>(
    (profile as any)?.japa_reminder_enabled ?? false
  );
  const [reminderTime, setReminderTime] = useState<string>(
    (profile as any)?.japa_reminder_time ?? '07:00'
  );

  useEffect(() => {
    if (!process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY) {
      console.warn('NEXT_PUBLIC_VAPID_PUBLIC_KEY environment variable is not set. Japa Reminders will be hidden.');
    }
  }, []);

  async function handleToggleReminder() {
    const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!vapidKey) return;

    if (!reminderEnabled) {
      try {
        const permission = await Notification.requestPermission();
        if (permission !== 'granted') {
          toast.error('Enable notifications in browser settings');
          return;
        }

        if (!('serviceWorker' in navigator)) {
          toast.error('Push notifications are not supported in this browser.');
          return;
        }

        const registration = await navigator.serviceWorker.ready;
        const subscription = await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(vapidKey),
        });

        const p256dh = subscription.getKey('p256dh');
        const auth = subscription.getKey('auth');

        const p256dhStr = p256dh ? btoa(String.fromCharCode(...new Uint8Array(p256dh))) : '';
        const authStr = auth ? btoa(String.fromCharCode(...new Uint8Array(auth))) : '';

        const subRes = await fetch('/api/push/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            endpoint: subscription.endpoint,
            p256dh: p256dhStr,
            auth: authStr,
          }),
        });

        if (!subRes.ok) throw new Error('Failed to save push subscription');

        const prefRes = await fetch('/api/push/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ japa_reminder_enabled: true }),
        });

        if (!prefRes.ok) throw new Error('Failed to save push preferences');

        setReminderEnabled(true);
        toast.success('Japa reminder enabled 🙏');
      } catch (err: any) {
        console.error('Failed to enable japa reminder:', err);
        toast.error(err.message || 'Failed to enable japa reminder');
      }
    } else {
      try {
        const prefRes = await fetch('/api/push/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ japa_reminder_enabled: false }),
        });

        if (!prefRes.ok) throw new Error('Failed to save push preferences');

        if ('serviceWorker' in navigator) {
          const registration = await navigator.serviceWorker.ready;
          const subscription = await registration.pushManager.getSubscription();
          if (subscription) {
            await fetch('/api/push/subscribe', {
              method: 'DELETE',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ endpoint: subscription.endpoint }),
            }).catch(() => {});
            
            await subscription.unsubscribe().catch(() => {});
          }
        }

        setReminderEnabled(false);
        toast.success('Japa reminder disabled');
      } catch (err: any) {
        console.error('Failed to disable japa reminder:', err);
        toast.error(err.message || 'Failed to disable japa reminder');
      }
    }
  }

  async function handleTimeChange(newTime: string) {
    setReminderTime(newTime);
    try {
      const res = await fetch('/api/push/preferences', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ japa_reminder_time: newTime }),
      });
      if (!res.ok) throw new Error('Failed to update reminder time');
      toast.success(`Reminder time set to ${newTime} 🙏`);
    } catch (err: any) {
      toast.error(err.message || 'Failed to update reminder time');
    }
  }

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
  const streak    = initialHighlightsStreak;
  const profileTradition = (liveProfile as any)?.tradition ?? 'hindu';
  const visibleRelics = SACRED_RELICS.filter((relic) => relic.tradition === 'universal' || relic.tradition === profileTradition);
  const unlockedRelics = getUnlockedRelics(streak, liveProfile?.seva_score ?? 0, profileTradition);
  const unlockedCount = unlockedRelics.length;
  const totalVisible = visibleRelics.length;
  const activeRelic = SACRED_RELICS.find((relic) => relic.id === (liveProfile as any)?.active_symbol_id) ?? null;
  const relicFrame = getRelicFrame((liveProfile as any)?.active_symbol_id);

  // Ashrama life stage — computed from DOB
  const profileDob = (liveProfile as any)?.date_of_birth ?? '';
  const ashramaStage = profileDob ? ageToAshrama(profileDob) : 'grihastha' as const;
  const ashramaMeta = getAshramaMeta(profileTradition, ashramaStage, (liveProfile as any)?.gender_context ?? 'general');

  useEffect(() => {
    if (!koshOpen || typeof window === 'undefined') return;
    const raw = localStorage.getItem('shoonaya_last_seen_relic_count');
    const lastSeenCount = Number.isFinite(Number(raw)) ? Math.max(0, Number(raw)) : 0;
    if (unlockedCount > lastSeenCount) {
      setNewRelicIds(unlockedRelics.slice(lastSeenCount).map((relic) => relic.id));
    } else {
      setNewRelicIds([]);
    }
  }, [koshOpen, unlockedCount, unlockedRelics]);

  useEffect(() => {
    if (koshOpen || typeof window === 'undefined') return;
    localStorage.setItem('shoonaya_last_seen_relic_count', String(unlockedCount));
    setNewRelicIds([]);
  }, [koshOpen, unlockedCount]);

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
  const profileCountryCode = (liveProfile as any)?.country_code ?? null;
  const profileTimezone = (liveProfile as any)?.timezone ?? null;
  const onesignalPlayerId = (liveProfile as any)?.onesignal_player_id ?? null;
  const [notificationPrefs, setNotificationPrefs] = useState({
    wants_festival_reminders: (liveProfile as any)?.wants_festival_reminders ?? true,
    wants_shloka_reminders: (liveProfile as any)?.wants_shloka_reminders ?? true,
    wants_nitya_reminders: (liveProfile as any)?.wants_nitya_reminders ?? true,
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
    // kul → legacy_family_name (profiles has no 'kul' column)
    // kul_devata → stored separately, not a profiles column
    // date_of_birth: empty string → null (date column rejects empty strings)
    const { tradition: _locked, date_of_birth, kul, kul_devata, ...rest } = form;
    const formToSave = {
      ...rest,
      date_of_birth: date_of_birth || null,
      legacy_family_name: kul || null,
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
  .stat { text-align: center; padding: 12px; background: #fef9ef; border-radius: 12px; border: 1px solid rgba(197, 160, 89,0.2); }
  .stat .num { font-size: 28px; font-weight: 800; color: #c8920a; }
  .stat .label { font-size: 11px; color: #888; margin-top: 3px; }
  .heatmap { display: flex; flex-wrap: wrap; gap: 3px; }
  ul { padding-left: 18px; font-size: 14px; line-height: 2; }
  .badge { display: inline-block; background: rgba(197, 160, 89,0.15); color: #7B1A1A; border-radius: 999px; padding: 2px 10px; font-size: 12px; font-weight: 600; margin-left: 8px; }
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

  async function toggleHighlights() {
    const next = !showSadhanaHighlights;
    setShowSadhanaHighlights(next);
    try {
      const res = await fetch('/api/user/highlights-consent', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ show: next }),
      });
      if (!res.ok) throw new Error('Could not update highlights setting');
    } catch (error) {
      setShowSadhanaHighlights(!next);
      toast.error(formatError(error));
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
                style={{
                  borderRadius: '50%',
                  border: relicFrame?.border ?? '2px solid rgba(197,160,89,0.2)',
                  boxShadow: relicFrame?.shadow ?? 'none',
                  transition: 'border 0.4s ease, box-shadow 0.4s ease',
                }}
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
                <div className="flex items-center justify-center gap-3 flex-wrap">
                  <h1 className="text-3xl font-medium theme-ink premium-serif flex items-center gap-2 flex-wrap justify-center">
                    <span>{liveProfile?.full_name}</span>
                    {liveProfile?.active_symbol_id && (
                      <span
                        className="px-2 py-0.5 rounded-full text-[13px] inline-flex items-center justify-center"
                        style={{
                          background: 'rgba(197,160,89,0.12)',
                          border: '1px solid rgba(197,160,89,0.22)',
                        }}
                      >
                        {relicEmoji(liveProfile.active_symbol_id)}
                      </span>
                    )}
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

                {activeRelic ? (
                  <button
                    type="button"
                    onClick={() => setKoshOpen(true)}
                    className="mx-auto flex items-center gap-1.5 px-2 py-1 rounded-full bg-white/[0.04] border border-amber-500/20 transition-colors hover:bg-white/[0.06]"
                    title="Open Sacred Kosh"
                  >
                    <div className="relative h-6 w-6 overflow-hidden rounded-full border border-amber-500/30">
                      <Image src={activeRelic.imageUrl} alt={activeRelic.name} fill sizes="24px" className="object-contain" />
                    </div>
                    <span className="text-[10px] font-medium text-amber-400/70">{activeRelic.name}</span>
                  </button>
                ) : unlockedCount > 0 ? (
                  <button
                    type="button"
                    onClick={() => setKoshOpen(true)}
                    className="mx-auto text-[10px] text-white/30 transition-colors hover:text-white/50"
                  >
                    Tap Kosh to equip your relic
                  </button>
                ) : null}
              
              {(liveProfile?.city || liveProfile?.country) && (
                <div className="mt-4 flex items-center justify-center gap-2 text-[12px] font-medium theme-muted">
                  <div className="w-8 h-px bg-gradient-to-r from-transparent to-[#C5A059]/30" />
                  <MapPin size={11} className="text-[#C5A059]" />
                  <span>{[liveProfile?.city, liveProfile?.country].filter(Boolean).join(' · ')}</span>
                  <div className="w-8 h-px bg-gradient-to-l from-transparent to-[#C5A059]/30" />
                </div>
              )}
              <div className="mt-6 flex justify-center">
                <TierBadge sevaScore={liveProfile?.seva_score ?? 0} size="lg" showProgress={true} />
              </div>
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
          <SadhanaHighlightsCard
            tradition={(liveProfile as any)?.tradition ?? 'hindu'}
            totalBeads={totalBeads}
            totalRounds={totalRounds}
            totalMinutes={totalMinutes}
            totalSessions={totalSessions}
            streak={streak}
            topMantra={topMantra}
            nityaDays={nityaDays}
            pathshalaEntries={pathshalaEntries}
            bookmarkedVerses={bookmarkedVerses}
            showHighlights={showSadhanaHighlights}
            onToggleHighlights={toggleHighlights}
            isOwnProfile={isOwnProfile}
          />

          {/* Metric Row — Redesigned: Streak / Seva / Relics / Ashrama */}
          <div className="grid grid-cols-4 gap-2">
            {([
              { label: 'Streak', value: String(streak), suffix: '🔥', href: '/my-progress' },
              { label: 'Seva', value: String(liveProfile?.seva_score ?? 0), suffix: '', href: '/my-progress' },
              { label: 'Relics', value: `${unlockedCount}/${totalVisible}`, suffix: '', href: '/kosh' },
              { label: 'Ashrama', value: ashramaMeta.label, suffix: '', href: '#ashrama' },
            ] as { label: string; value: string; suffix: string; href: string }[]).map((m, i) => (
              <Link
                key={m.label}
                href={m.href}
                className="active:scale-95 transition-transform block"
              >
                <motion.div
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.1 * i }}
                  className="clay-card rounded-2xl p-2.5 text-center transition-all hover:border-[#C5A059]/30 h-full flex flex-col justify-between items-center"
                >
                  <p className="text-[11px] font-medium theme-dim mb-1">{m.label}</p>
                  <p className="text-sm font-medium theme-ink truncate">{m.value}{m.suffix}</p>
                  <div className="flex justify-center mt-1">
                    <ChevronRight size={10} className="opacity-25" />
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>

          {/* Ashrama Life Stage Card */}
          {profileDob && (
            <motion.div
              id="ashrama"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.25 }}
            >
              <button
                type="button"
                onClick={() => setAshramaInfoOpen(true)}
                className="w-full clay-card rounded-2xl p-4 flex items-center gap-4 text-left transition-all active:scale-[0.98] hover:border-[#C5A059]/30"
                style={{ borderLeft: `2px solid ${ashramaMeta.accent}50` }}
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: `${ashramaMeta.accent}18` }}
                >
                  <SacredIcon name={ashramaMeta.icon} size={20} style={{ color: ashramaMeta.accent }} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-bold tracking-[0.18em] uppercase theme-dim mb-0.5">Life Stage</p>
                  <p className="text-[15px] font-medium theme-ink premium-serif leading-tight">{ashramaMeta.label}</p>
                  <p className="text-[12px] theme-muted mt-0.5 leading-snug truncate">{ashramaMeta.subtitle}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-[10px] theme-dim">{ashramaMeta.ageRange}</p>
                </div>
              </button>
            </motion.div>
          )}

          <CompletionBar profile={liveProfile} onEdit={() => setEditing(true)} />

          {/* ── Sacred Kosh — Inline Relic Scroll ── */}
          <div className="clay-card rounded-2xl p-4 border-[#C5A059]/15">
            <div className="flex items-center justify-between mb-3">
              <div>
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C5A059]/60">Sacred Kosh</p>
                <p className="text-[15px] font-medium theme-ink premium-serif">Your relics</p>
              </div>
              <button
                onClick={() => setKoshOpen(true)}
                className="text-[11px] text-[#C5A059]/70 hover:text-[#C5A059] transition-colors font-medium"
              >
                View all →
              </button>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-1" style={{ scrollbarWidth: 'none' }}>
              {visibleRelics.map((relic) => {
                const isUnlocked = unlockedRelics.some((r) => r.id === relic.id);
                const isActive = (liveProfile as any)?.active_symbol_id === relic.id;
                return (
                  <button
                    key={relic.id}
                    type="button"
                    onClick={() => isUnlocked && setKoshOpen(true)}
                    className="flex-shrink-0 flex flex-col items-center gap-1.5"
                  >
                    <div
                      className={`w-14 h-14 rounded-full flex items-center justify-center border transition-all ${
                        isActive
                          ? 'border-[#C5A059]/60 bg-[#C5A059]/10 shadow-lg shadow-[#C5A059]/20'
                          : isUnlocked
                          ? 'border-white/10 bg-white/5 hover:border-[#C5A059]/30'
                          : 'border-white/5 bg-white/[0.03]'
                      }`}
                    >
                      {isUnlocked ? (
                        <div className="relative w-9 h-9">
                          <Image src={relic.imageUrl} alt={relic.name} fill sizes="36px" className="object-contain" />
                        </div>
                      ) : (
                        <Lock size={13} className="text-white/20" />
                      )}
                    </div>
                    <p className={`text-[9px] text-center leading-tight max-w-[56px] ${isUnlocked ? 'theme-muted' : 'text-white/20'}`}>
                      {relic.name}
                    </p>
                  </button>
                );
              })}
            </div>
            <p className="text-[9px] theme-dim mt-2.5 text-center">{unlockedCount} of {totalVisible} relics unlocked</p>
            {!(liveProfile as any)?.active_symbol_id && (
              <p className="text-[11px] text-center mt-2" style={{ color: 'var(--text-dim)' }}>
                Tap a relic to equip it — it will appear on your profile and in the leaderboard
              </p>
            )}
          </div>

          {/* ── Kul Card ── */}
          {kulData ? (
            <motion.button
              onClick={() => setShowInviteModal(true)}
              className="clay-card rounded-2xl p-4 w-full flex items-center gap-4 border-[#C5A059]/20 transition-all hover:border-[#C5A059]/40"
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#C5A059]/20 to-transparent flex items-center justify-center shadow-inner flex-shrink-0">
                <Users className="text-[#C5A059]" size={18} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-[#C5A059]/60">Sacred Invite</p>
                <p className="text-[15px] font-medium theme-ink premium-serif leading-tight">Invite to {kulData.name}</p>
              </div>
              <ChevronRight size={16} className="text-[#C5A059]/40 flex-shrink-0" />
            </motion.button>
          ) : (
            <motion.button
              onClick={() => router.push('/kul')}
              className="clay-card rounded-2xl p-4 w-full flex items-center gap-4 border-white/5 transition-all hover:border-white/10"
            >
              <div className="w-10 h-10 rounded-full bg-white/5 flex items-center justify-center shadow-inner flex-shrink-0">
                <Shield className="text-[#F2EAD6]/40" size={18} />
              </div>
              <div className="text-left flex-1 min-w-0">
                <p className="text-[10px] font-bold tracking-[0.18em] uppercase text-white/20">Lineage</p>
                <p className="text-[15px] font-medium theme-ink premium-serif leading-tight">Join your Kul</p>
                <p className="text-[12px] theme-dim mt-0.5">Connect with your ancestral lineage</p>
              </div>
              <ChevronRight size={16} className="text-white/20 flex-shrink-0" />
            </motion.button>
          )}

          {showAvatarPreview && avatarUrl && (
            <AvatarPreviewModal
              avatarUrl={avatarUrl}
              fullName={profile?.full_name ?? profile?.username ?? 'Profile photo'}
              onClose={() => setShowAvatarPreview(false)}
            />
          )}

          {/* Invite & Refer — referral card */}
          <div className="-mx-1">
            <InviteCard
              userId={userId}
              userName={liveProfile?.full_name ?? undefined}
              tradition={profileTradition}
            />
          </div>

          {/* Redesigned Share your practice Card */}
          <button
            type="button"
            onClick={() => setSocialShareOpen(true)}
            className="w-full text-left rounded-[2rem] p-5 relative overflow-hidden transition-all active:scale-[0.98] border border-[#C5A059]/25 hover:border-[#C5A059]/40"
            style={{
              background: 'linear-gradient(180deg, rgba(197,160,89,0.06) 0%, transparent 100%)',
            }}
          >
            {/* Top section with emoji & glow */}
            <div className="relative flex flex-col items-center justify-center mb-4 pt-4">
              <div
                className="pointer-events-none absolute w-24 h-24 rounded-full"
                style={{
                  background: 'radial-gradient(circle, rgba(197,160,89,0.18) 0%, transparent 70%)',
                  filter: 'blur(10px)',
                  top: '50%',
                  left: '50%',
                  transform: 'translate(-50%, -50%)',
                }}
              />
              <span className="text-[2.5rem] leading-none z-10 select-none">
                {TRADITIONS.find((t) => t.value === profileTradition)?.emoji ?? '🔱'}
              </span>
            </div>

            {/* Display name */}
            <p className="font-serif text-lg text-center theme-ink font-bold leading-tight">
              {liveProfile?.full_name ?? liveProfile?.username ?? "Your Practice"}
            </p>

            {/* Subtitle with live values */}
            <p className="text-xs text-center tracking-widest theme-muted mt-1.5 uppercase font-medium">
              {streak}-day streak · {liveProfile?.seva_score ?? 0} seva · {PATH_LABELS[profileTradition] ?? 'Universal path'}
            </p>

            {/* Three Share Action Pills */}
            <div className="mt-6 flex justify-center gap-6 w-full border-t border-white/5 pt-5">
              {/* WhatsApp */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
                  style={{
                    background: 'rgba(34,197,94,0.08)',
                    border: `1px solid rgba(34,197,94,0.2)`,
                    color: '#22c55e',
                  }}
                >
                  <MessageCircle size={22} />
                </div>
                <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">WhatsApp</span>
              </div>

              {/* X/Twitter */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.05)',
                    border: `1px solid rgba(255,255,255,0.15)`,
                    color: 'var(--brand-ink)',
                  }}
                >
                  <Twitter size={22} />
                </div>
                <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">X / Twitter</span>
              </div>

              {/* Copy Link */}
              <div className="flex flex-col items-center gap-1.5">
                <div
                  className="w-16 h-16 rounded-2xl flex items-center justify-center transition-transform hover:scale-105"
                  style={{
                    background: 'rgba(197,160,89,0.08)',
                    border: `1px solid rgba(197,160,89,0.2)`,
                    color: 'var(--brand-primary)',
                  }}
                >
                  <LinkIcon size={22} />
                </div>
                <span className="text-[9px] theme-muted font-bold uppercase tracking-wider">Copy Link</span>
              </div>
            </div>
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

          {/* ── Edit Form — now a BottomDrawer (see drawers section below) ── */}

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
               aria-label="Action">
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
              Shoonaya · Built with 🙏
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
        {(() => {
          const userTradition = liveProfile?.tradition ?? 'hindu';
          const visibleRelics = SACRED_RELICS.filter(r => r.tradition === 'universal' || r.tradition === userTradition);
          const unlockedRelics = getUnlockedRelics(streak, liveProfile?.seva_score ?? 0, userTradition);
          const nextRelic = visibleRelics.find(r => !unlockedRelics.some(u => u.id === r.id));
          const unlockedCount = unlockedRelics.length;

          return (
            <div className="flex flex-col w-full py-6">
              {nextRelic && (
                <div className="bg-white/[0.04] border border-[#C5A059]/15 rounded-2xl p-4 mb-5 flex items-center gap-4">
                  <div className="w-14 h-14 relative flex-shrink-0 bg-[var(--card-bg-soft)] rounded-[1.25rem] border border-[var(--card-border)] overflow-hidden flex items-center justify-center grayscale opacity-40">
                    {nextRelic.imageUrl ? (
                      <Image src={nextRelic.imageUrl} alt={nextRelic.name} fill className="object-contain" />
                    ) : (
                      <span className="text-2xl">🔒</span>
                    )}
                  </div>
                  <div className="flex-1 min-w-0 flex flex-col justify-center">
                    <span className="text-[10px] font-bold text-[#C5A059] uppercase tracking-wider mb-1.5 block">Next: {nextRelic.name}</span>
                    <div className="w-full bg-white/[0.04] h-2.5 rounded-full overflow-hidden mb-1.5 border border-white/[0.02]">
                      <motion.div 
                        initial={{ width: 0 }}
                        animate={{ width: `${Math.min(100, Math.max(0, nextRelic.milestoneType === 'streak' ? (streak / nextRelic.milestoneValue) * 100 : ((liveProfile?.seva_score ?? 0) / nextRelic.milestoneValue) * 100))}%` }}
                        transition={{ duration: 1, ease: 'easeOut', delay: 0.2 }}
                        className="h-full bg-[#C5A059] rounded-full"
                      />
                    </div>
                    <div className="flex justify-between items-center text-[11px] text-white/40 font-medium">
                      <span>{nextRelic.milestoneType === 'streak' ? `Day ${streak} of ${nextRelic.milestoneValue}` : `${liveProfile?.seva_score ?? 0} / ${nextRelic.milestoneValue} pts`}</span>
                      <span>{nextRelic.milestoneType === 'streak' ? `${nextRelic.milestoneValue - streak} more days away` : `${nextRelic.milestoneValue - (liveProfile?.seva_score ?? 0)} more pts away`}</span>
                    </div>
                  </div>
                </div>
              )}
              
              <div className="grid grid-cols-4 gap-5">
                {visibleRelics.map((relic) => {
                  const isUnlocked = unlockedRelics.some(r => r.id === relic.id);
                  const isActive = (liveProfile as any)?.active_symbol_id === relic.id;
                  const isNew = newRelicIds.includes(relic.id);

                  return (
                    <div key={relic.id} className="flex flex-col items-center group">
                      <button 
                        onClick={() => {
                          if (!isUnlocked) {
                            if (relic.milestoneType === 'streak') {
                              toast.error(`${relic.milestoneValue - streak} more day${(relic.milestoneValue - streak) !== 1 ? 's' : ''} of streak to unlock ${relic.name} 🙏`);
                            } else {
                              toast.error(`${relic.milestoneValue - (liveProfile?.seva_score ?? 0)} more seva points to unlock ${relic.name} 🙏`);
                            }
                            return;
                          }
                          if (isActive) return;
                          patchProfile({ active_symbol_id: relic.id } as any, `${relic.name} set as active symbol ✨`);
                        }}
                        className={`relative w-20 h-20 rounded-[2rem] flex items-center justify-center transition-all duration-500 overflow-hidden ${
                          isActive
                            ? 'bg-[var(--brand-primary-soft)] border border-[var(--brand-primary)] shadow-sm'
                            : isUnlocked
                              ? 'bg-[var(--card-bg-soft)] border border-[var(--card-border)]'
                              : 'bg-[var(--card-bg-soft)] border border-[var(--card-border)] grayscale opacity-40'
                        } ${!isActive && isUnlocked ? 'hover:scale-110 hover:border-[var(--brand-primary)]' : ''}`}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-[var(--brand-primary-soft)] animate-pulse opacity-70" />
                        )}

                        {isNew && (
                          <div className="absolute top-1 left-1 rounded bg-amber-400 px-1 text-[8px] font-bold uppercase text-black">
                            New
                          </div>
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
                          <div className="absolute top-2 right-2 w-5 h-5 bg-[var(--brand-primary)] rounded-full flex items-center justify-center border-2 border-[var(--surface-raised)] z-10 shadow-lg">
                            <Star size={10} className="text-white fill-white" />
                          </div>
                        )}
                      </button>
                      <p className={`text-xs font-medium mt-4 text-center line-clamp-1 transition-opacity ${isActive ? 'text-[var(--brand-primary-strong)]' : isUnlocked ? 'theme-ink' : 'theme-muted opacity-40'}`}>
                        {relic.name}
                      </p>
                    </div>
                  );
                })}
              </div>
              {unlockedCount === 0 && (
                <div className="mt-8 p-6 rounded-[2rem] bg-[#C5A059]/5 border border-dashed border-[#C5A059]/20 text-center">
                  <p className="text-[12px] text-[#C5A059]/60 font-bold uppercase tracking-widest leading-relaxed">Continue your daily sadhana<br/>to unlock these relics 🙏</p>
                </div>
              )}
            </div>
          );
        })()}
      </BottomDrawer>

      {/* Ashrama Life Stage Drawer */}
      <BottomDrawer
        isOpen={ashramaInfoOpen}
        onClose={() => setAshramaInfoOpen(false)}
        title="Ashrama Life Stage"
        description="Understanding your current dharmic stage of life."
      >
        <div className="flex flex-col items-center text-center py-6">
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
            style={{ background: `${ashramaMeta.accent}18` }}
          >
            <SacredIcon name={ashramaMeta.icon} size={32} style={{ color: ashramaMeta.accent }} />
          </div>
          <h2 className="font-serif text-2xl font-bold theme-ink leading-tight">
            {ashramaMeta.label}
          </h2>
          <span
            className="mt-2 inline-block px-3 py-1 rounded-full text-xs font-semibold tracking-wider"
            style={{
              background: 'var(--card-bg-soft)',
              color: 'var(--brand-primary)',
              border: '1px solid var(--card-border)',
            }}
          >
            {ashramaMeta.ageRange}
          </span>
          <p className="mt-6 text-sm theme-muted leading-relaxed max-w-md">
            {ASHRAMA_DESCRIPTIONS[ashramaStage]}
          </p>

          <div className="w-full text-left mt-8 space-y-4 border-t border-white/5 pt-6">
            <h3 className="text-xs font-bold uppercase tracking-widest text-[#C5A059]">
              What this means for your practice
            </h3>
            <ul className="space-y-3">
              {(ASHRAMA_BULLETS[ashramaStage] ?? []).map((bullet, idx) => (
                <li key={idx} className="flex gap-3 text-sm theme-muted leading-relaxed">
                  <span className="text-[#C5A059]">•</span>
                  <span>{bullet}</span>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </BottomDrawer>

      {/* ── Edit Profile Drawer ── */}
      <BottomDrawer
        isOpen={editing}
        onClose={() => setEditing(false)}
        title="Personal details"
        description="Update your spiritual identity"
      >
        <div className="space-y-8 py-2">
          <div className="space-y-3">
            <label className="text-xs font-medium theme-muted">Spiritual Level</label>
            <div className="pt-1">
              <TierBadge sevaScore={liveProfile?.seva_score ?? 0} size="md" />
            </div>
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

          {(activeTradition === 'hindu') && (
            <div className="space-y-6">
              <p className="text-sm font-medium text-[var(--brand-primary)]">Vansh identity</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {[
                  { label: 'Gotra',       key: 'gotra',      placeholder: 'e.g. Kashyapa'     },
                  { label: 'Kul Devata',  key: 'kul_devata', placeholder: 'e.g. Shiva, Durga' },
                  { label: 'Family Name', key: 'kul',        placeholder: 'Kul / Vansh'       },
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
                      <SacredIcon name={meta.icon} size={16} strokeWidth={1.7} />
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
                          sel
                            ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                            : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted hover:border-[var(--brand-primary)]'
                        }`}
                      >
                        <div className="mb-2"><SacredIcon name={opt.icon} size={22} strokeWidth={1.6} /></div>
                        <p className={`text-sm font-medium ${sel ? 'text-[var(--brand-primary-strong)]' : 'theme-ink'}`}>{opt.label}</p>
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

          <div className="flex gap-4 pt-4">
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
      </BottomDrawer>

      <BottomDrawer
        isOpen={settingsOpen}
        onClose={() => setSettingsOpen(false)}
        title="Shoonaya Settings"
        description="Personalize your spiritual experience."
      >
        <div className="space-y-8 py-6">

          {/* Subscription & Billing */}
          <div>
            <p className="text-sm font-medium text-[var(--brand-primary)] mb-3">Plan & Billing</p>
            <Link
              href="/settings/subscription"
              onClick={() => setSettingsOpen(false)}
              className="flex items-center justify-between w-full px-4 py-3.5 rounded-2xl border transition-all"
              style={{
                background: 'rgba(197,160,89,0.06)',
                borderColor: 'rgba(197,160,89,0.18)',
              }}
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: 'rgba(197,160,89,0.12)' }}>
                  <span style={{ color: '#C5A059', fontSize: 14 }}>✦</span>
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--divine-text)' }}>
                    {isPro ? 'Zenith Plan' : 'Seeker (Free)'}
                  </p>
                  <p className="text-[11px]" style={{ color: 'rgba(197,160,89,0.6)' }}>
                    {isPro ? 'Manage, cancel or change plan' : 'Upgrade to Zenith'}
                  </p>
                </div>
              </div>
              <span style={{ color: '#C5A059', fontSize: 18 }}>›</span>
            </Link>
          </div>

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
              <p className="text-sm font-medium text-[var(--brand-primary)]">App identity</p>
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
                    localAppIcon === icon.key
                      ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                      : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted hover:border-[var(--brand-primary)]'
                  } ${icon.key === 'pro' && !isPro ? 'grayscale opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className="relative w-14 h-14 rounded-2xl overflow-hidden shadow-2xl border border-white/10">
                    <Image src={icon.img} alt={icon.label} fill className="object-cover" />
                  </div>
                  <span className={`text-sm font-medium ${localAppIcon === icon.key ? 'text-[var(--brand-primary-strong)]' : 'theme-muted'}`}>{icon.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Languages */}
          <div className="grid grid-cols-2 gap-6">
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--brand-primary)]">Interface</p>
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
                      className={`px-4 py-3 rounded-xl text-left text-sm font-medium border transition-all ${
                        active
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                          : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted hover:border-[var(--brand-primary)]'
                      }`}
                    >
                      {lang.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="space-y-4">
              <p className="text-sm font-medium text-[var(--brand-primary)]">Scripture</p>
              <div className="flex flex-col gap-2">
                {MEANING_LANGUAGE_OPTIONS.map((opt) => {
                  const active = (form.meaning_language ?? 'en') === opt.value;
                  return (
                    <button
                      key={opt.value}
                      onClick={() => patchProfile({ meaning_language: opt.value }, `Meanings: ${opt.label}`)}
                      className={`px-4 py-3 rounded-xl text-left text-sm font-medium border transition-all ${
                        active
                          ? 'bg-[var(--brand-primary-soft)] border-[var(--brand-primary)] text-[var(--brand-primary-strong)] shadow-sm'
                          : 'bg-[var(--card-bg-soft)] border-[var(--card-border)] theme-muted hover:border-[var(--brand-primary)]'
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
                  { key: 'wants_nitya_reminders', label: 'Nitya' },
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

             {/* Japa Daily Reminder Section */}
             {process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY && (
               <div className="space-y-3 pt-2">
                 <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-soft)] shadow-sm">
                   <div>
                     <p className="text-sm font-medium theme-ink">Japa Reminder</p>
                     <p className="text-xs theme-muted mt-0.5">Daily nudge if you haven&apos;t done Japa</p>
                   </div>
                   <button
                     type="button"
                     onClick={handleToggleReminder}
                     className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
                       reminderEnabled ? 'bg-[var(--brand-primary)]' : 'bg-[var(--text-dim)]/30'
                     }`}
                     aria-label="Toggle Japa Reminder"
                   >
                     <span
                       className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
                         reminderEnabled ? 'translate-x-5' : 'translate-x-0'
                       }`}
                     />
                   </button>
                 </div>

                 {reminderEnabled && (
                   <div className="flex items-center justify-between px-5 py-4 rounded-2xl border border-[var(--card-border)] bg-[var(--card-bg-soft)] shadow-sm">
                     <span className="text-sm font-medium theme-ink">Remind me at</span>
                     <input
                       type="time"
                       value={reminderTime}
                       onChange={(e) => handleTimeChange(e.target.value)}
                       className="rounded-lg border border-[var(--brand-primary)] bg-transparent px-3 py-1.5 text-sm theme-ink outline-none focus:ring-1 focus:ring-[var(--brand-primary)]"
                     />
                   </div>
                 )}
               </div>
             )}

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
                try {
                  setReportLoading(true);
                  const res = await fetch('/api/user/export');
                  if (!res.ok) {
                    const data = await res.json().catch(() => null);
                    throw new Error(data?.error || 'Export failed');
                  }

                  const blob = await res.blob();
                  const disposition = res.headers.get('Content-Disposition') ?? '';
                  const match = disposition.match(/filename=([^;]+)/i);
                  const fileName = match?.[1]?.replace(/["']/g, '') || `shoonaya-export-${new Date().toISOString().split('T')[0]}.json`;
                  const url = URL.createObjectURL(blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = fileName;
                  document.body.appendChild(link);
                  link.click();
                  link.remove();
                  URL.revokeObjectURL(url);
                  toast.success('Your data export has been downloaded');
                } catch (error) {
                  toast.error(error instanceof Error ? error.message : 'Export failed');
                } finally {
                  setReportLoading(false);
                }
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
        {inviteOpen && (
          <InviteModal userId={userId} onClose={() => setInviteOpen(false)} />
        )}
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
                      const base = typeof window !== 'undefined'
                        ? window.location.origin
                        : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com');
                      const link = `${base}/kul/join?code=${kulData.code}`;
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
                      const base = typeof window !== 'undefined'
                        ? window.location.origin
                        : (process.env.NEXT_PUBLIC_APP_URL ?? 'https://shoonaya.com');
                      const text = `🙏 Namaste! Join my Kul "${kulData.name}" on Shoonaya. \n\nJoin link: ${base}/kul/join?code=${kulData.code}`;
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
      {/* Social Share Drawer */}
      <AnimatePresence>
        {socialShareOpen && (
          <SocialShareDrawer
            userId={userId}
            userName={liveProfile?.full_name ?? liveProfile?.username ?? 'Seeker'}
            streak={initialHighlightsStreak}
            tradition={(liveProfile as any)?.tradition ?? null}
            onClose={() => setSocialShareOpen(false)}
          />
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

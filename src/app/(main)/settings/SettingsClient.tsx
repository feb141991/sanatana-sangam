'use client';

import Link from 'next/link';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import toast from 'react-hot-toast';
import { ChevronLeft, ChevronRight, AlertTriangle, Palette, Languages, Sparkles } from 'lucide-react';
import { Button, Input } from '@/components/ui';
import { APP_LANGUAGES, TRANSLITERATION_LANGUAGE_OPTIONS } from '@/lib/language-preferences';
import { THEME_OPTIONS, type ThemePreference } from '@/lib/theme-preferences';
import { useThemePreference } from '@/components/providers/ThemeProvider';
import { useLanguage } from '@/lib/i18n/LanguageContext';
import type { AppLang } from '@/lib/i18n/translations';
import { TRADITIONS } from '@/lib/utils';
import type { TraditionKey } from '@/lib/traditions';
import { useUpdateProfileMutation } from '@/hooks/useProfile';
import type { Database } from '@/types/database';
import InviteCard from '@/components/home/InviteCard';

type SubscriptionStatus = Database['public']['Tables']['profiles']['Row']['subscription_status'];
type TransliterationLanguage = Database['public']['Tables']['profiles']['Row']['transliteration_language'];

type NotificationPreferencesState = {
  japa_reminder_enabled: boolean;
  japa_reminder_time: string;
  quiz_reminder_enabled: boolean;
  quiz_reminder_time: string;
  nitya_reminder_enabled: boolean;
  nitya_reminder_time: string;
};

type SectionCopy = {
  pageTitle: string;
  pageSubtitle: string;
  appearanceEyebrow: string;
  appearanceTitle: string;
  appearanceDescription: string;
  languageEyebrow: string;
  languageTitle: string;
  languageDescription: string;
  appLanguageLabel: string;
  transliterationLabel: string;
  saveLanguage: string;
  traditionEyebrow: string;
  traditionTitle: string;
  traditionDescription: string;
  saveTradition: string;
  notificationsEyebrow: string;
  notificationsTitle: string;
  notificationsDescription: string;
  japaReminder: string;
  japaReminderHint: string;
  quizReminder: string;
  quizReminderHint: string;
  nityaReminder: string;
  nityaReminderHint: string;
  accountEyebrow: string;
  accountTitle: string;
  accountDescription: string;
  subscriptionLink: string;
  subscriptionHint: string;
  deleteAccountLink: string;
  deleteAccountHint: string;
  freeBadge: string;
  proBadge: string;
  saved: string;
  saveFailed: string;
  traditionWarning: string;
};

const COPY: Record<AppLang, SectionCopy> = {
  en: {
    pageTitle: 'Settings',
    pageSubtitle: 'Account preferences for your daily practice.',
    appearanceEyebrow: 'Appearance',
    appearanceTitle: 'Theme',
    appearanceDescription: 'Apply your visual preference immediately across Shoonaya.',
    languageEyebrow: 'Language & Script',
    languageTitle: 'Reading preferences',
    languageDescription: 'Choose the app language and your preferred transliteration display.',
    appLanguageLabel: 'App language',
    transliterationLabel: 'Transliteration script',
    saveLanguage: 'Save language',
    traditionEyebrow: 'Tradition',
    traditionTitle: 'Primary path',
    traditionDescription: 'This guides your daily quiz, recommendations, and sacred framing.',
    saveTradition: 'Save tradition',
    notificationsEyebrow: 'Notifications',
    notificationsTitle: 'Reminder rhythm',
    notificationsDescription: 'Keep one stable cadence for Japa, quiz, and nitya karma.',
    japaReminder: 'Morning sadhana reminder',
    japaReminderHint: 'A quiet nudge for Japa practice.',
    quizReminder: 'Daily quiz reminder',
    quizReminderHint: 'Prompt for your daily reflection quiz.',
    nityaReminder: 'Nitya karma reminder',
    nityaReminderHint: 'A reminder to keep your daily duties steady.',
    accountEyebrow: 'Account',
    accountTitle: 'Membership and control',
    accountDescription: 'Manage your subscription or close the account permanently.',
    subscriptionLink: 'Subscription',
    subscriptionHint: 'Manage plan, billing, and renewal.',
    deleteAccountLink: 'Delete account',
    deleteAccountHint: 'Permanent removal of your progress and data.',
    freeBadge: 'Free',
    proBadge: 'Pro',
    saved: 'Saved ✓',
    saveFailed: 'Could not save',
    traditionWarning: 'Changing tradition will update your daily quiz and recommendations.',
  },
  hi: {
    pageTitle: 'सेटिंग्स',
    pageSubtitle: 'आपकी दैनिक साधना के लिए खाता प्राथमिकताएँ।',
    appearanceEyebrow: 'दिखावट',
    appearanceTitle: 'थीम',
    appearanceDescription: 'Shoonaya में अपनी दृश्य पसंद तुरंत लागू करें।',
    languageEyebrow: 'भाषा और लिपि',
    languageTitle: 'पठन प्राथमिकताएँ',
    languageDescription: 'ऐप की भाषा और अपनी पसंदीदा लिप्यंतरण शैली चुनें।',
    appLanguageLabel: 'ऐप भाषा',
    transliterationLabel: 'लिप्यंतरण लिपि',
    saveLanguage: 'भाषा सहेजें',
    traditionEyebrow: 'परंपरा',
    traditionTitle: 'मुख्य मार्ग',
    traditionDescription: 'इसी आधार पर आपका दैनिक क्विज़ और सुझाव बदलते हैं।',
    saveTradition: 'परंपरा सहेजें',
    notificationsEyebrow: 'सूचनाएँ',
    notificationsTitle: 'स्मरण ताल',
    notificationsDescription: 'जप, क्विज़ और नित्य कर्म के लिए एक स्थिर लय रखें।',
    japaReminder: 'सुबह साधना स्मरण',
    japaReminderHint: 'जप अभ्यास के लिए एक शांत संकेत।',
    quizReminder: 'दैनिक क्विज़ स्मरण',
    quizReminderHint: 'दैनिक चिंतन क्विज़ के लिए संकेत।',
    nityaReminder: 'नित्य कर्म स्मरण',
    nityaReminderHint: 'दैनिक कर्तव्य स्थिर रखने का स्मरण।',
    accountEyebrow: 'खाता',
    accountTitle: 'सदस्यता और नियंत्रण',
    accountDescription: 'अपनी सदस्यता प्रबंधित करें या खाता स्थायी रूप से बंद करें।',
    subscriptionLink: 'सदस्यता',
    subscriptionHint: 'प्लान, बिलिंग और नवीनीकरण प्रबंधित करें।',
    deleteAccountLink: 'खाता हटाएँ',
    deleteAccountHint: 'आपकी प्रगति और डेटा स्थायी रूप से हट जाएँगे।',
    freeBadge: 'फ्री',
    proBadge: 'प्रो',
    saved: 'सहेजा गया ✓',
    saveFailed: 'सहेजा नहीं जा सका',
    traditionWarning: 'परंपरा बदलने पर आपका दैनिक क्विज़ और सुझाव अपडेट होंगे।',
  },
  pa: {
    pageTitle: 'ਸੈਟਿੰਗਜ਼',
    pageSubtitle: 'ਤੁਹਾਡੀ ਰੋਜ਼ਾਨਾ ਸਾਧਨਾ ਲਈ ਖਾਤਾ ਪਸੰਦਾਂ।',
    appearanceEyebrow: 'ਦਿਖਾਵਟ',
    appearanceTitle: 'ਥੀਮ',
    appearanceDescription: 'Shoonaya ਵਿੱਚ ਆਪਣੀ ਦ੍ਰਿਸ਼ ਪਸੰਦ ਤੁਰੰਤ ਲਾਗੂ ਕਰੋ।',
    languageEyebrow: 'ਭਾਸ਼ਾ ਅਤੇ ਲਿਪੀ',
    languageTitle: 'ਪੜ੍ਹਨ ਦੀਆਂ ਪਸੰਦਾਂ',
    languageDescription: 'ਐਪ ਦੀ ਭਾਸ਼ਾ ਅਤੇ ਆਪਣੀ ਲਿਪਿਆੰਤਰਨ ਪਸੰਦ ਚੁਣੋ।',
    appLanguageLabel: 'ਐਪ ਭਾਸ਼ਾ',
    transliterationLabel: 'ਲਿਪਿਆੰਤਰਨ ਲਿਪੀ',
    saveLanguage: 'ਭਾਸ਼ਾ ਸੰਭਾਲੋ',
    traditionEyebrow: 'ਪਰੰਪਰਾ',
    traditionTitle: 'ਮੁੱਖ ਮਾਰਗ',
    traditionDescription: 'ਇਸ ਨਾਲ ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਕੁਇਜ਼ ਅਤੇ ਸਿਫ਼ਾਰਸ਼ਾਂ ਬਦਲਣਗੀਆਂ।',
    saveTradition: 'ਪਰੰਪਰਾ ਸੰਭਾਲੋ',
    notificationsEyebrow: 'ਸੂਚਨਾਵਾਂ',
    notificationsTitle: 'ਯਾਦ ਦਿਵਾਉਣ ਦੀ ਲਹਿਰ',
    notificationsDescription: 'ਜਪ, ਕੁਇਜ਼ ਅਤੇ ਨਿੱਤ ਕਰਮ ਲਈ ਇਕ ਸਥਿਰ ਰਿਥਮ ਰੱਖੋ।',
    japaReminder: 'ਸਵੇਰੇ ਸਾਧਨਾ ਯਾਦ ਦਿਹਾਣੀ',
    japaReminderHint: 'ਜਪ ਅਭਿਆਸ ਲਈ ਸ਼ਾਂਤ ਸੱਦਾ।',
    quizReminder: 'ਰੋਜ਼ਾਨਾ ਕੁਇਜ਼ ਯਾਦ ਦਿਹਾਣੀ',
    quizReminderHint: 'ਰੋਜ਼ਾਨਾ ਵਿਚਾਰ ਕੁਇਜ਼ ਲਈ ਸੰਕੇਤ।',
    nityaReminder: 'ਨਿੱਤ ਕਰਮ ਯਾਦ ਦਿਹਾਣੀ',
    nityaReminderHint: 'ਰੋਜ਼ਾਨਾ ਫਰਜ਼ਾਂ ਨੂੰ ਸਥਿਰ ਰੱਖਣ ਲਈ ਸੰਕੇਤ।',
    accountEyebrow: 'ਖਾਤਾ',
    accountTitle: 'ਮੈਂਬਰਸ਼ਿਪ ਅਤੇ ਨਿਯੰਤਰਣ',
    accountDescription: 'ਆਪਣੀ ਮੈਂਬਰਸ਼ਿਪ ਸੰਭਾਲੋ ਜਾਂ ਖਾਤਾ ਸਦਾ ਲਈ ਬੰਦ ਕਰੋ।',
    subscriptionLink: 'ਮੈਂਬਰਸ਼ਿਪ',
    subscriptionHint: 'ਪਲਾਨ, ਬਿਲਿੰਗ ਅਤੇ ਰੀਨਿਊਅਲ ਸੰਭਾਲੋ।',
    deleteAccountLink: 'ਖਾਤਾ ਮਿਟਾਓ',
    deleteAccountHint: 'ਤੁਹਾਡੀ ਤਰੱਕੀ ਅਤੇ ਡਾਟਾ ਸਦਾ ਲਈ ਮਿਟ ਜਾਣਗੇ।',
    freeBadge: 'ਫ੍ਰੀ',
    proBadge: 'ਪ੍ਰੋ',
    saved: 'ਸੰਭਾਲਿਆ ਗਿਆ ✓',
    saveFailed: 'ਸੰਭਾਲਿਆ ਨਹੀਂ ਜਾ ਸਕਿਆ',
    traditionWarning: 'ਪਰੰਪਰਾ ਬਦਲਣ ਨਾਲ ਤੁਹਾਡਾ ਰੋਜ਼ਾਨਾ ਕੁਇਜ਼ ਅਤੇ ਸਿਫ਼ਾਰਸ਼ਾਂ ਅੱਪਡੇਟ ਹੋਣਗੀਆਂ।',
  },
};

const APP_LANGUAGE_LABELS: Record<AppLang, string> = {
  en: 'English',
  hi: 'हिन्दी',
  pa: 'ਪੰਜਾਬੀ',
};

const TRANSLITERATION_LABELS: Record<Extract<TransliterationLanguage, string>, string> = {
  en: 'English (Roman)',
  hi: 'हिन्दी (देवनागरी)',
  pa: 'ਪੰਜਾਬੀ',
};

function showSavedToast(message: string) {
  toast.success(message, {
    style: {
      background: 'var(--card-bg)',
      color: 'var(--brand-primary)',
      border: '1px solid var(--card-border)',
    },
  });
}

function showErrorToast(message: string) {
  toast.error(message, {
    style: {
      background: 'var(--card-bg)',
      color: 'var(--text-cream)',
      border: '1px solid var(--card-border)',
    },
  });
}

function sameNotificationState(
  a: NotificationPreferencesState,
  b: NotificationPreferencesState
) {
  return (
    a.japa_reminder_enabled === b.japa_reminder_enabled
    && a.japa_reminder_time === b.japa_reminder_time
    && a.quiz_reminder_enabled === b.quiz_reminder_enabled
    && a.quiz_reminder_time === b.quiz_reminder_time
    && a.nitya_reminder_enabled === b.nitya_reminder_enabled
    && a.nitya_reminder_time === b.nitya_reminder_time
  );
}

function isTraditionKey(value: string): value is TraditionKey {
  return TRADITIONS.some((option) => option.value === value);
}

function isAppLang(value: string): value is AppLang {
  return APP_LANGUAGES.some((option) => option.value === value);
}

function isTransliterationLanguage(value: string): value is TransliterationLanguage {
  return TRANSLITERATION_LANGUAGE_OPTIONS.some((option) => option.value === value);
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: ReadonlyArray<{ value: string; label: string }>;
}) {
  return (
    <label className="block space-y-2">
      <span className="text-xs font-medium text-[color:var(--text-dim)]">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="min-h-11 w-full rounded-2xl px-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--brand-primary)]"
        style={{
          background: 'var(--surface-soft)',
          border: '1px solid var(--card-border)',
          color: 'var(--text-cream)',
        }}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  );
}

function SettingsSection({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <section
      className="rounded-2xl border p-5 space-y-4"
      style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
    >
      <div className="space-y-1">
        <p className="text-[10px] uppercase tracking-[0.18em] text-[color:var(--text-dim)]">{eyebrow}</p>
        <h2 className="text-lg font-semibold text-[color:var(--text-cream)]">{title}</h2>
        {description ? (
          <p className="text-sm text-[color:var(--text-muted-warm)]">{description}</p>
        ) : null}
      </div>
      {children}
    </section>
  );
}

function ThemeOptionCard({
  option,
  active,
  onClick,
}: {
  option: { value: ThemePreference; label: string; description: string };
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="rounded-2xl border p-4 text-left transition"
      style={{
        background: active ? 'var(--brand-primary-soft)' : 'var(--surface-soft)',
        borderColor: active ? 'var(--brand-primary)' : 'var(--card-border)',
      }}
    >
      <p className="text-sm font-semibold text-[color:var(--text-cream)]">{option.label}</p>
      <p className="mt-1 text-xs text-[color:var(--text-dim)]">{option.description}</p>
    </button>
  );
}

function ReminderRow({
  label,
  hint,
  enabled,
  time,
  onToggle,
  onTimeChange,
}: {
  label: string;
  hint: string;
  enabled: boolean;
  time: string;
  onToggle: () => void;
  onTimeChange: (value: string) => void;
}) {
  return (
    <div className="rounded-2xl border p-4" style={{ borderColor: 'var(--card-border)', background: 'var(--surface-soft)' }}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[color:var(--text-cream)]">{label}</p>
          <p className="mt-1 text-xs text-[color:var(--text-dim)]">{hint}</p>
        </div>
        <button
          type="button"
          onClick={onToggle}
          aria-pressed={enabled}
          className="relative h-7 w-12 rounded-full transition"
          style={{ background: enabled ? 'var(--brand-primary)' : 'var(--card-border)' }}
        >
          <span
            className="absolute top-1 h-5 w-5 rounded-full transition"
            style={{
              left: enabled ? 'calc(100% - 1.5rem)' : '0.25rem',
              background: 'var(--card-bg)',
            }}
          />
        </button>
      </div>
      {enabled ? (
        <div className="mt-3">
          <Input type="time" value={time} onChange={(event) => onTimeChange(event.target.value)} />
        </div>
      ) : null}
    </div>
  );
}

export default function SettingsClient({
  userId,
  initialTradition,
  initialTransliterationLanguage,
  initialJapaReminderEnabled,
  initialJapaReminderTime,
  initialQuizReminderEnabled,
  initialQuizReminderTime,
  initialNityaReminderEnabled,
  initialNityaReminderTime,
  subscriptionStatus,
}: {
  userId: string;
  initialTradition: string | null;
  initialTransliterationLanguage: TransliterationLanguage | null;
  initialJapaReminderEnabled: boolean;
  initialJapaReminderTime: string;
  initialQuizReminderEnabled: boolean;
  initialQuizReminderTime: string;
  initialNityaReminderEnabled: boolean;
  initialNityaReminderTime: string;
  subscriptionStatus: SubscriptionStatus;
}) {
  const router = useRouter();
  const { preference, setPreference } = useThemePreference();
  const { lang, setLang } = useLanguage();
  const profileMutation = useUpdateProfileMutation(userId);

  const copy = COPY[lang];
  const [languageState, setLanguageState] = useState({
    appLanguage: lang,
    transliterationLanguage: (initialTransliterationLanguage ?? 'en') as TransliterationLanguage,
  });
  const [savedLanguageState, setSavedLanguageState] = useState({
    appLanguage: lang,
    transliterationLanguage: (initialTransliterationLanguage ?? 'en') as TransliterationLanguage,
  });
  const [traditionState, setTraditionState] = useState<TraditionKey>(
    (initialTradition as TraditionKey | null) ?? 'hindu'
  );
  const [savedTraditionState, setSavedTraditionState] = useState<TraditionKey>(
    (initialTradition as TraditionKey | null) ?? 'hindu'
  );
  const [notificationState, setNotificationState] = useState<NotificationPreferencesState>({
    japa_reminder_enabled: initialJapaReminderEnabled,
    japa_reminder_time: initialJapaReminderTime,
    quiz_reminder_enabled: initialQuizReminderEnabled,
    quiz_reminder_time: initialQuizReminderTime,
    nitya_reminder_enabled: initialNityaReminderEnabled,
    nitya_reminder_time: initialNityaReminderTime,
  });
  const [savedNotificationState, setSavedNotificationState] = useState<NotificationPreferencesState>({
    japa_reminder_enabled: initialJapaReminderEnabled,
    japa_reminder_time: initialJapaReminderTime,
    quiz_reminder_enabled: initialQuizReminderEnabled,
    quiz_reminder_time: initialQuizReminderTime,
    nitya_reminder_enabled: initialNityaReminderEnabled,
    nitya_reminder_time: initialNityaReminderTime,
  });
  const [savingLanguage, setSavingLanguage] = useState(false);
  const [savingTradition, setSavingTradition] = useState(false);
  const savedNotificationRef = useRef(savedNotificationState);
  const hasMountedNotificationRef = useRef(false);

  useEffect(() => {
    savedNotificationRef.current = savedNotificationState;
  }, [savedNotificationState]);

  useEffect(() => {
    if (!hasMountedNotificationRef.current) {
      hasMountedNotificationRef.current = true;
      return;
    }

    if (sameNotificationState(notificationState, savedNotificationRef.current)) {
      return;
    }

    const timer = window.setTimeout(async () => {
      const snapshot = notificationState;
      try {
        const response = await fetch('/api/push/preferences', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(snapshot),
        });

        if (!response.ok) {
          throw new Error('save_failed');
        }

        setSavedNotificationState(snapshot);
        showSavedToast(copy.saved);
      } catch {
        setNotificationState(savedNotificationRef.current);
        showErrorToast(copy.saveFailed);
      }
    }, 800);

    return () => window.clearTimeout(timer);
  }, [copy.saveFailed, copy.saved, notificationState]);

  const languageDirty = useMemo(
    () => languageState.appLanguage !== savedLanguageState.appLanguage
      || languageState.transliterationLanguage !== savedLanguageState.transliterationLanguage,
    [languageState, savedLanguageState]
  );

  const traditionDirty = traditionState !== savedTraditionState;
  const isProPlan = subscriptionStatus === 'pro' || subscriptionStatus === 'grace' || subscriptionStatus === 'kul_pro';

  async function handleSaveLanguage() {
    if (!languageDirty || savingLanguage) return;

    const previousLanguage = savedLanguageState.appLanguage;
    const nextLanguage = languageState.appLanguage;

    setSavingLanguage(true);
    setLang(nextLanguage);

    try {
      await profileMutation.mutateAsync({
        app_language: nextLanguage,
        transliteration_language: languageState.transliterationLanguage,
      });
      setSavedLanguageState(languageState);
      showSavedToast(copy.saved);
    } catch {
      setLang(previousLanguage);
      setLanguageState(savedLanguageState);
      showErrorToast(copy.saveFailed);
    } finally {
      setSavingLanguage(false);
    }
  }

  async function handleSaveTradition() {
    if (!traditionDirty || savingTradition) return;

    setSavingTradition(true);
    try {
      await profileMutation.mutateAsync({ tradition: traditionState });
      setSavedTraditionState(traditionState);
      showSavedToast(copy.saved);
    } catch {
      setTraditionState(savedTraditionState);
      showErrorToast(copy.saveFailed);
    } finally {
      setSavingTradition(false);
    }
  }

  function handleTraditionChange(nextTradition: string) {
    if (!isTraditionKey(nextTradition)) return;
    const typedTradition = nextTradition;
    setTraditionState(typedTradition);
    if (typedTradition !== savedTraditionState) {
      toast(copy.traditionWarning, {
        icon: '⚠️',
        style: {
          background: 'var(--card-bg)',
          color: 'var(--text-cream)',
          border: '1px solid var(--card-border)',
        },
      });
    }
  }

  return (
    <div className="min-h-screen pb-24" style={{ background: 'var(--divine-bg)', color: 'var(--text-cream)' }}>
      <div
        className="sticky top-0 z-40 flex items-center gap-4 border-b px-5 pb-4 pt-12 backdrop-blur-xl"
        style={{ background: 'var(--divine-bg)', borderColor: 'var(--card-border)' }}
      >
        <button
          type="button"
          onClick={() => router.push('/profile')}
          className="flex h-10 w-10 items-center justify-center rounded-full border"
          style={{ background: 'var(--card-bg)', borderColor: 'var(--card-border)' }}
        >
          <ChevronLeft size={18} color="var(--brand-primary)" />
        </button>
        <div>
          <h1 className="text-xl font-semibold text-[color:var(--text-cream)]">{copy.pageTitle}</h1>
          <p className="text-sm text-[color:var(--text-dim)]">{copy.pageSubtitle}</p>
        </div>
      </div>

      <div className="mx-auto max-w-md space-y-5 px-5 pt-6">
        <SettingsSection
          eyebrow={copy.appearanceEyebrow}
          title={copy.appearanceTitle}
          description={copy.appearanceDescription}
        >
          <div className="grid grid-cols-1 gap-3">
            {THEME_OPTIONS.map((option) => (
              <ThemeOptionCard
                key={option.value}
                option={option}
                active={preference === option.value}
                onClick={() => setPreference(option.value)}
              />
            ))}
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow={copy.languageEyebrow}
          title={copy.languageTitle}
          description={copy.languageDescription}
        >
          <div className="space-y-4">
            <SelectField
              label={copy.appLanguageLabel}
              value={languageState.appLanguage}
              onChange={(value) => {
                if (!isAppLang(value)) return;
                setLanguageState((current) => ({ ...current, appLanguage: value }));
              }}
              options={APP_LANGUAGES.map((option) => ({
                value: option.value,
                label: APP_LANGUAGE_LABELS[option.value],
              }))}
            />
            <SelectField
              label={copy.transliterationLabel}
              value={languageState.transliterationLanguage ?? 'en'}
              onChange={(value) => {
                if (!isTransliterationLanguage(value)) return;
                setLanguageState((current) => ({
                  ...current,
                  transliterationLanguage: value,
                }));
              }}
              options={TRANSLITERATION_LANGUAGE_OPTIONS.map((option) => ({
                value: option.value,
                label: TRANSLITERATION_LABELS[option.value],
              }))}
            />
            <Button onClick={handleSaveLanguage} disabled={!languageDirty || savingLanguage}>
              <Languages size={16} />
              {copy.saveLanguage}
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow={copy.traditionEyebrow}
          title={copy.traditionTitle}
          description={copy.traditionDescription}
        >
          <div className="space-y-4">
            <SelectField
              label={copy.traditionTitle}
              value={traditionState}
              onChange={handleTraditionChange}
              options={TRADITIONS.map((option) => ({
                value: option.value,
                label: `${option.emoji} ${option.label}`,
              }))}
            />
            <Button onClick={handleSaveTradition} disabled={!traditionDirty || savingTradition}>
              <Sparkles size={16} />
              {copy.saveTradition}
            </Button>
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow={copy.notificationsEyebrow}
          title={copy.notificationsTitle}
          description={copy.notificationsDescription}
        >
          <div className="space-y-3">
            <ReminderRow
              label={copy.japaReminder}
              hint={copy.japaReminderHint}
              enabled={notificationState.japa_reminder_enabled}
              time={notificationState.japa_reminder_time}
              onToggle={() => setNotificationState((current) => ({
                ...current,
                japa_reminder_enabled: !current.japa_reminder_enabled,
              }))}
              onTimeChange={(value) => setNotificationState((current) => ({
                ...current,
                japa_reminder_time: value,
              }))}
            />
            <ReminderRow
              label={copy.quizReminder}
              hint={copy.quizReminderHint}
              enabled={notificationState.quiz_reminder_enabled}
              time={notificationState.quiz_reminder_time}
              onToggle={() => setNotificationState((current) => ({
                ...current,
                quiz_reminder_enabled: !current.quiz_reminder_enabled,
              }))}
              onTimeChange={(value) => setNotificationState((current) => ({
                ...current,
                quiz_reminder_time: value,
              }))}
            />
            <ReminderRow
              label={copy.nityaReminder}
              hint={copy.nityaReminderHint}
              enabled={notificationState.nitya_reminder_enabled}
              time={notificationState.nitya_reminder_time}
              onToggle={() => setNotificationState((current) => ({
                ...current,
                nitya_reminder_enabled: !current.nitya_reminder_enabled,
              }))}
              onTimeChange={(value) => setNotificationState((current) => ({
                ...current,
                nitya_reminder_time: value,
              }))}
            />
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow={copy.accountEyebrow}
          title={copy.accountTitle}
          description={copy.accountDescription}
        >
          <div className="space-y-3">
            <Link
              href="/settings/subscription"
              className="flex items-center justify-between rounded-2xl border p-4"
              style={{ background: 'var(--surface-soft)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'var(--brand-primary-soft)' }}>
                  <Palette size={18} color="var(--brand-primary)" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--text-cream)]">{copy.subscriptionLink}</p>
                  <p className="text-xs text-[color:var(--text-dim)]">{copy.subscriptionHint}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span
                  className="rounded-full px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.14em]"
                  style={{
                    background: isProPlan ? 'var(--brand-primary-soft)' : 'var(--surface-soft)',
                    color: isProPlan ? 'var(--brand-primary)' : 'var(--text-dim)',
                    border: '1px solid var(--card-border)',
                  }}
                >
                  {isProPlan ? copy.proBadge : copy.freeBadge}
                </span>
                <ChevronRight size={18} color="var(--text-dim)" />
              </div>
            </Link>

            <Link
              href="/settings/delete-account"
              className="flex items-center justify-between rounded-2xl border p-4"
              style={{ background: 'var(--surface-soft)', borderColor: 'var(--card-border)' }}
            >
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-2xl" style={{ background: 'var(--surface-soft)' }}>
                  <AlertTriangle size={18} color="var(--text-dim)" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[color:var(--text-cream)]">{copy.deleteAccountLink}</p>
                  <p className="text-xs text-[color:var(--text-dim)]">{copy.deleteAccountHint}</p>
                </div>
              </div>
              <ChevronRight size={18} color="var(--text-dim)" />
            </Link>
          </div>
        </SettingsSection>

        <SettingsSection
          eyebrow="Invite"
          title="Invite a friend"
          description="Share Shoonaya with someone on their dharmic path."
        >
          <InviteCard userId={userId} tradition={initialTradition} />
        </SettingsSection>
      </div>
    </div>
  );
}

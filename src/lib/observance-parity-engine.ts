import {
  generateObservanceScheduleCandidates,
  type ObservanceProfile,
  type ScheduledObservanceRow,
} from './observance-scheduler';
import type { ReviewedObservance } from './observance-notification-source';
import {
  canSendInLocalWindow,
  getLocalDateIso,
  isoDateDiff,
  resolveTimeZone,
} from './sacred-time';
import { shiftCivilDate } from './observance-timing';

export type LegacyNotification = {
  user_id: string;
  category: 'festival' | 'vrat';
  observance_id: string;
  slug: string;
  days_away: number;
  local_date: string;
  notification_key: string;
  title: string;
};

export type ParityMatrixResult = {
  startDate: string;
  endDate: string;
  totalDays: number;
  profileCount: number;
  observanceCount: number;
  legacyTotalSent: number;
  scheduledTotalCandidates: number;
  exactMatchesCount: number;
  coverageAdditionsCount: number; // users who receive alerts because of local timezone accuracy or D0
  preferenceSuppressedCount: number; // users protected by granular Stage O2 preferences
  quietHoursSuppressedCount: number;
  incompleteSeriesSuppressedCount: number;
  audienceSuppressedCount: number;
  budgetExemptionCompliance: number; // percentage (should be 100%)
  keyCollisionCount: number; // should be 0
  suppressedReasonsSummary: Record<string, number>;
  profiles: ObservanceProfile[];
  observances: ReviewedObservance[];
  scheduledCandidates: ScheduledObservanceRow[];
  legacyNotifications: LegacyNotification[];
};

export const REPRESENTATIVE_PROFILES: ObservanceProfile[] = [
  {
    id: 'devotee-in-surya-all',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [0, 1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  },
  {
    id: 'devotee-in-smartha-female',
    tradition: 'hindu',
    calendar_profile: 'north_indian_purnimanta',
    sampradaya: 'smartha',
    gender_context: 'female',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '07:30',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  },
  {
    id: 'devotee-uk-gaudiya-male',
    tradition: 'hindu',
    calendar_profile: 'drik',
    sampradaya: 'gaudiya',
    gender_context: 'not_female',
    timezone: 'Europe/London',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [0, 1],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: 23,
    notification_quiet_hours_end: 7,
    is_deleting: false,
  },
  {
    id: 'devotee-us-ny-female',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'female',
    timezone: 'America/New_York',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:30',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  },
  {
    id: 'devotee-us-la-male',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'not_female',
    timezone: 'America/Los_Angeles',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [0, 1, 7],
    observance_reminder_time: '09:00',
    notification_quiet_hours_start: 23,
    notification_quiet_hours_end: 7,
    is_deleting: false,
  },
  {
    id: 'devotee-au-sydney-general',
    tradition: 'hindu',
    calendar_profile: 'south_indian_amanta',
    sampradaya: 'standard',
    gender_context: 'general',
    timezone: 'Australia/Sydney',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  },
  {
    id: 'devotee-festivals-only',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: false,
    wants_tithi_reminders: false,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
  {
    id: 'devotee-vrats-only',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'female',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: false,
    wants_vrat_reminders: true,
    wants_tithi_reminders: false,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
  {
    id: 'devotee-quiet-hours-conflict',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '05:00', // Falls inside quiet hours (22:00 to 06:00)
    notification_quiet_hours_start: 22,
    notification_quiet_hours_end: 6,
    is_deleting: false,
  },
  {
    id: 'devotee-account-deleting',
    tradition: 'hindu',
    calendar_profile: 'surya-siddhanta',
    sampradaya: 'standard',
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: true,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: true, // Should be suppressed 100%
  },
  {
    id: 'devotee-sikh-punjab',
    tradition: 'sikh',
    calendar_profile: null,
    sampradaya: null,
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: false,
    wants_tithi_reminders: false,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
  {
    id: 'devotee-jain-gujarat',
    tradition: 'jain',
    calendar_profile: null,
    sampradaya: null,
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: true,
    wants_tithi_reminders: false,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
  {
    id: 'devotee-buddhist-ladakh',
    tradition: 'buddhist',
    calendar_profile: null,
    sampradaya: null,
    gender_context: 'general',
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: false,
    wants_tithi_reminders: false,
    observance_reminder_lead_days: [1, 7],
    observance_reminder_time: '08:00',
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
  {
    id: 'devotee-legacy-unset',
    tradition: 'hindu',
    calendar_profile: null,
    sampradaya: null,
    gender_context: null,
    timezone: 'Asia/Kolkata',
    wants_festival_reminders: true,
    wants_vrat_reminders: null, // Tests legacy fallback
    wants_tithi_reminders: null,
    observance_reminder_lead_days: null,
    observance_reminder_time: null,
    notification_quiet_hours_start: null,
    notification_quiet_hours_end: null,
    is_deleting: false,
  },
];

export const REPRESENTATIVE_60DAY_OBSERVANCES: ReviewedObservance[] = [
  // Major & Regional Festivals
  {
    id: 'occ-karva-chauth-2026',
    slug: 'karva-chauth',
    name: 'Karva Chauth',
    emoji: '🌙',
    date: '2026-10-28',
    type: 'vrat',
    tradition: 'hindu',
    description: 'Sacred fast dedicated to prayer and family longevity',
    sourceEligible: true,
    route_kind: 'vrat',
    route_slug: 'karva-chauth',
  },
  {
    id: 'occ-ahoi-ashtami-2026',
    slug: 'ahoi-ashtami',
    name: 'Ahoi Ashtami',
    emoji: '🪔',
    date: '2026-11-01',
    type: 'vrat',
    tradition: 'hindu',
    description: 'Fast observed by mothers for well-being of their children',
    sourceEligible: true,
    route_kind: 'vrat',
    route_slug: 'ahoi-ashtami',
  },
  {
    id: 'occ-rama-ekadashi-2026',
    slug: 'ekadashi',
    name: 'Rama Ekadashi',
    emoji: '🌾',
    date: '2026-11-05',
    type: 'vrat',
    tradition: 'hindu',
    description: 'Auspicious Ekadashi fast occurring during Kartik Krishna Paksha',
    sourceEligible: true,
    route_kind: 'vrat',
    route_slug: 'ekadashi',
  },
  {
    id: 'occ-dhanteras-2026',
    slug: 'dhanteras',
    name: 'Dhanteras',
    emoji: '🪙',
    date: '2026-11-06',
    type: 'major',
    tradition: 'hindu',
    description: 'Day of auspicious beginnings, health, and Dhanvantari remembrance',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'dhanteras',
  },
  {
    id: 'occ-diwali-2026',
    slug: 'diwali',
    name: 'Diwali',
    emoji: '🪔',
    date: '2026-11-08',
    type: 'major',
    tradition: 'hindu',
    description: 'The supreme festival of lights, celebrating the victory of light over darkness',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'diwali',
  },
  {
    id: 'occ-govardhan-puja-2026',
    slug: 'govardhan-puja',
    name: 'Govardhan Puja',
    emoji: '⛰️',
    date: '2026-11-09',
    type: 'major',
    tradition: 'hindu',
    description: 'Celebration of Lord Krishna lifting the Govardhan hill',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'govardhan-puja',
  },
  {
    id: 'occ-bhai-dooj-2026',
    slug: 'bhai-dooj',
    name: 'Bhai Dooj',
    emoji: '🌸',
    date: '2026-11-10',
    type: 'major',
    tradition: 'hindu',
    description: 'Sacred day celebrating sibling devotion and love',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'bhai-dooj',
  },
  {
    id: 'occ-chhath-puja-2026',
    slug: 'chhath-puja',
    name: 'Chhath Puja',
    emoji: '🌅',
    date: '2026-11-15',
    type: 'regional',
    tradition: 'hindu',
    description: 'Ancient Vedic festival dedicated to Lord Surya and Chhathi Maiya',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'chhath-puja',
  },
  {
    id: 'occ-devaprabodhini-ekadashi-2026',
    slug: 'ekadashi',
    name: 'Devaprabodhini Ekadashi',
    emoji: '🌾',
    date: '2026-11-20',
    type: 'vrat',
    tradition: 'hindu',
    description: 'Awakening of Lord Vishnu marking the end of Chaturmas',
    sourceEligible: true,
    route_kind: 'vrat',
    route_slug: 'ekadashi',
  },
  {
    id: 'occ-guru-nanak-jayanti-2026',
    slug: 'guru-nanak-jayanti',
    name: 'Guru Nanak Jayanti',
    emoji: '☬',
    date: '2026-11-24',
    type: 'major',
    tradition: 'sikh',
    description: 'Prakash Utsav marking the birth of Guru Nanak Dev Ji',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'guru-nanak-jayanti',
  },
  {
    id: 'occ-kartik-purnima-2026',
    slug: 'purnima-vrat',
    name: 'Kartik Purnima',
    emoji: '🌕',
    date: '2026-11-24',
    type: 'vrat',
    tradition: 'hindu',
    description: 'Dev Deepavali and sacred full moon of Kartik month',
    sourceEligible: true,
    route_kind: 'vrat',
    route_slug: 'purnima-vrat',
  },
  {
    id: 'occ-mahavira-nirvana-2026',
    slug: 'mahavira-nirvana',
    name: 'Mahavira Nirvana',
    emoji: '🪔',
    date: '2026-11-08',
    type: 'major',
    tradition: 'jain',
    description: 'Jain Diwali celebration marking the liberation of Bhagwan Mahavira',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'mahavira-nirvana',
  },
  {
    id: 'occ-kathina-2026',
    slug: 'kathina',
    name: 'Kathina Celebration',
    emoji: '☸️',
    date: '2026-11-24',
    type: 'major',
    tradition: 'buddhist',
    description: 'Traditional robe offering ceremony at the conclusion of Vassa',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'kathina',
  },
  // Incomplete series simulation (e.g. Navratri day with under-review sibling)
  {
    id: 'occ-disputed-series-day-2026',
    slug: 'navratri-day-incomplete',
    name: 'Navratri Incomplete Day',
    emoji: '🔱',
    date: '2026-10-15',
    type: 'major',
    tradition: 'hindu',
    description: 'Multi-day child occurrence with an unresolved sibling',
    sourceEligible: true,
    route_kind: 'festival',
    route_slug: 'navratri-day-incomplete',
  },
];

export const INCOMPLETE_SERIES_IDS = new Set<string>(['occ-disputed-series-day-2026']);

/**
 * Simulates legacy cron direct sends for a single run at a given UTC instant.
 * Legacy run characteristics:
 * - Runs once daily at 07:00 UTC
 * - Filters users by `canSendInLocalWindow(now, tz, 9)` (~9am local)
 * - Only checks fixed offsets: daysAway === 1 or daysAway === 7
 * - Checks single shared `wants_festival_reminders !== false`
 * - Tradition matching: userTradition == null || festivalTradition == null || festivalTradition == userTradition
 */
export function simulateLegacyCronDirectSends(
  users: ObservanceProfile[],
  observances: ReviewedObservance[],
  runUtcTime: Date
): LegacyNotification[] {
  const notifications: LegacyNotification[] = [];

  for (const user of users) {
    if (user.is_deleting) continue;
    if (user.wants_festival_reminders === false) continue;

    const tz = resolveTimeZone(user.timezone);
    if (!canSendInLocalWindow(runUtcTime, tz, 9, user.notification_quiet_hours_start ?? null, user.notification_quiet_hours_end ?? null)) {
      continue;
    }

    const localDate = getLocalDateIso(runUtcTime, tz);

    for (const obs of observances) {
      if (obs.id && INCOMPLETE_SERIES_IDS.has(obs.id)) continue;

      const isVrat = obs.type === 'vrat';
      const category = isVrat ? 'vrat' : 'festival';

      // Tradition match
      if (user.tradition && obs.tradition && obs.tradition !== 'all' && obs.tradition !== user.tradition) {
        continue;
      }

      // Legacy women-focused vrat check
      if (obs.slug === 'karva-chauth' || obs.slug === 'ahoi-ashtami') {
        if (user.gender_context !== 'female') continue;
      }

      const daysAway = isoDateDiff(obs.date, localDate);
      if (daysAway !== 1 && daysAway !== 7) continue;

      const key = `${category}:${obs.id}:${daysAway}:${localDate}`;
      notifications.push({
        user_id: user.id,
        category,
        observance_id: obs.id ?? '',
        slug: obs.slug,
        days_away: daysAway,
        local_date: localDate,
        notification_key: key,
        title: daysAway === 1 ? `${obs.emoji} ${obs.name} — Tomorrow!` : `${obs.emoji} ${obs.name} — In 7 days`,
      });
    }
  }

  return notifications;
}

/**
 * Runs a complete 60-day shadow comparison across all representative profiles.
 */
export function run60DayObservanceParityAudit(
  startDateStr: string = '2026-10-01',
  daysCount: number = 60
): ParityMatrixResult {
  const users = REPRESENTATIVE_PROFILES;
  const observances = REPRESENTATIVE_60DAY_OBSERVANCES;

  const allScheduledCandidates: ScheduledObservanceRow[] = [];
  const allLegacyNotifications: LegacyNotification[] = [];
  const suppressedReasonsSummary: Record<string, number> = {};

  let exactMatchesCount = 0;
  let coverageAdditionsCount = 0;
  let preferenceSuppressedCount = 0;
  let quietHoursSuppressedCount = 0;
  let incompleteSeriesSuppressedCount = 0;
  let audienceSuppressedCount = 0;
  let keyCollisionCount = 0;

  const endDateStr = shiftCivilDate(startDateStr, daysCount);

  // 1. Simulate legacy cron day-by-day (legacy runs daily at 07:00 UTC)
  for (let d = 0; d < daysCount; d++) {
    const currentCivilDate = shiftCivilDate(startDateStr, d);
    const legacyRunInstant = new Date(`${currentCivilDate}T07:00:00.000Z`);
    const legacySent = simulateLegacyCronDirectSends(users, observances, legacyRunInstant);
    allLegacyNotifications.push(...legacySent);
  }

  // 2. Run scheduled candidate generator once for the start of the horizon
  const scheduleRunInstant = new Date(`${startDateStr}T00:00:00.000Z`);
  const scheduleResult = generateObservanceScheduleCandidates({
    users,
    observances,
    incompleteSeriesIds: INCOMPLETE_SERIES_IDS,
    now: scheduleRunInstant,
  });

  allScheduledCandidates.push(...scheduleResult.candidates);

  for (const [reason, count] of Object.entries(scheduleResult.stats.suppressedReasons)) {
    suppressedReasonsSummary[reason] = count;
    if (reason.startsWith('preference_disabled_')) preferenceSuppressedCount += count;
    if (reason === 'quiet_hours_conflict') quietHoursSuppressedCount += count;
    if (reason === 'incomplete_series') incompleteSeriesSuppressedCount += count;
    if (reason === 'audience_not_applicable') audienceSuppressedCount += count;
  }

  // Deduplicate scheduled candidates by (user_id, notification_key)
  const scheduledKeyMap = new Map<string, ScheduledObservanceRow>();
  for (const cand of allScheduledCandidates) {
    const uniqueKey = `${cand.user_id}::${cand.notification_key}`;
    scheduledKeyMap.set(uniqueKey, cand);
  }
  const deduplicatedScheduled = Array.from(scheduledKeyMap.values());

  // Deduplicate legacy notifications by (user_id, notification_key)
  const legacyKeyMap = new Map<string, LegacyNotification>();
  for (const leg of allLegacyNotifications) {
    const uniqueKey = `${leg.user_id}::${leg.notification_key}`;
    legacyKeyMap.set(uniqueKey, leg);
  }
  const deduplicatedLegacy = Array.from(legacyKeyMap.values());

  // Compare semantic events: (user_id, slug, days_away, targetDate)
  const legacySemanticSet = new Set<string>();
  for (const leg of deduplicatedLegacy) {
    const targetDate = shiftCivilDate(leg.local_date, leg.days_away);
    legacySemanticSet.add(`${leg.user_id}::${leg.slug}::${leg.days_away}::${targetDate}`);
  }

  for (const cand of deduplicatedScheduled) {
    const targetDate = shiftCivilDate(cand.metadata.local_date, cand.metadata.days_away);
    const semanticKey = `${cand.user_id}::${cand.metadata.slug}::${cand.metadata.days_away}::${targetDate}`;

    if (legacySemanticSet.has(semanticKey)) {
      exactMatchesCount++;
    } else {
      coverageAdditionsCount++;
    }

    // Check key collision: scheduled keys must start with observance-v1:
    if (!cand.notification_key.startsWith('observance-v1:')) {
      keyCollisionCount++;
    }
  }

  // Budget exemption check
  let budgetCompliantCount = 0;
  for (const cand of deduplicatedScheduled) {
    if (cand.metadata.budget_class === 'explicit_observance' && cand.metadata.budget_exempt === true) {
      budgetCompliantCount++;
    }
  }
  const budgetExemptionCompliance = deduplicatedScheduled.length > 0
    ? (budgetCompliantCount / deduplicatedScheduled.length) * 100
    : 100;

  return {
    startDate: startDateStr,
    endDate: endDateStr,
    totalDays: daysCount,
    profileCount: users.length,
    observanceCount: observances.length,
    legacyTotalSent: deduplicatedLegacy.length,
    scheduledTotalCandidates: deduplicatedScheduled.length,
    exactMatchesCount,
    coverageAdditionsCount,
    preferenceSuppressedCount,
    quietHoursSuppressedCount,
    incompleteSeriesSuppressedCount,
    audienceSuppressedCount,
    budgetExemptionCompliance,
    keyCollisionCount,
    suppressedReasonsSummary,
    profiles: users,
    observances,
    scheduledCandidates: deduplicatedScheduled,
    legacyNotifications: deduplicatedLegacy,
  };
}

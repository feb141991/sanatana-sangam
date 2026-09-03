import { createAdminClient } from '@/lib/supabase-admin';

export interface PlaceholderDef {
  key: string;
  label: string;
  sample: string;
  description: string;
}

export interface NotificationTemplateItem {
  id: string;
  routine: string;
  tradition: 'hindu' | 'sikh' | 'buddhist' | 'jain' | 'all';
  category: 'daily_routine' | 'sadhana' | 'aarti' | 'calendar';
  name: string;
  description: string;
  titleTemplate: string;
  bodyTemplate: string;
  defaultTitle: string;
  defaultBody: string;
  placeholders: PlaceholderDef[];
  isActive: boolean;
  updatedAt?: string;
  updatedBy?: string | null;
}

export const DEFAULT_NOTIFICATION_TEMPLATES: NotificationTemplateItem[] = [
  // ── 1. Daily Sacred Routine ──
  {
    id: 'brahma_muhurta:hindu',
    routine: 'brahma_muhurta',
    tradition: 'hindu',
    category: 'daily_routine',
    name: 'Brahma Muhurta (Hindu)',
    description: 'Pre-dawn auspicious meditation & sadhana opening window',
    titleTemplate: '🌅 Brahma Muhurta — The Sacred Hour Opens',
    bodyTemplate: 'This is the most auspicious time for sadhana. Rise, bathe, and begin your morning sequence while the world sleeps.',
    defaultTitle: '🌅 Brahma Muhurta — The Sacred Hour Opens',
    defaultBody: 'This is the most auspicious time for sadhana. Rise, bathe, and begin your morning sequence while the world sleeps.',
    placeholders: [
      { key: 'userName', label: 'Seeker Name', sample: 'Sadhak', description: 'Name of the devotee' },
      { key: 'tithi', label: 'Current Tithi', sample: 'Shukla Ekadashi', description: 'Astronomical lunar day' },
    ],
    isActive: true,
  },
  {
    id: 'brahma_muhurta:sikh',
    routine: 'brahma_muhurta',
    tradition: 'sikh',
    category: 'daily_routine',
    name: 'Amrit Vela (Sikh)',
    description: 'Pre-dawn Nitnem and remembrance of Waheguru',
    titleTemplate: '☬ Amrit Vela — The Ambrosial Hour',
    bodyTemplate: "Waheguru's grace flows most freely now. Begin your Nitnem before the mind fills with the day's noise.",
    defaultTitle: '☬ Amrit Vela — The Ambrosial Hour',
    defaultBody: "Waheguru's grace flows most freely now. Begin your Nitnem before the mind fills with the day's noise.",
    placeholders: [
      { key: 'userName', label: 'Seeker Name', sample: 'Gurpreet', description: 'Name of the devotee' },
    ],
    isActive: true,
  },
  {
    id: 'brahma_muhurta:buddhist',
    routine: 'brahma_muhurta',
    tradition: 'buddhist',
    category: 'daily_routine',
    name: 'Dawn Sitting (Buddhist)',
    description: 'Early morning sitting practice and mindfulness',
    titleTemplate: '☸️ Dawn — Your Practice Window',
    bodyTemplate: 'The mind is clearest before the world stirs. Sit now. Even fifteen minutes in this stillness is worth much more.',
    defaultTitle: '☸️ Dawn — Your Practice Window',
    defaultBody: 'The mind is clearest before the world stirs. Sit now. Even fifteen minutes in this stillness is worth much more.',
    placeholders: [],
    isActive: true,
  },
  {
    id: 'brahma_muhurta:jain',
    routine: 'brahma_muhurta',
    tradition: 'jain',
    category: 'daily_routine',
    name: 'Brahma Muhurta (Jain)',
    description: 'Pre-dawn reflection and Navkar Mantra recitation',
    titleTemplate: '🤲 Brahma Muhurta — Begin Pratikraman',
    bodyTemplate: 'Jai Jinendra! The pre-dawn hour is auspicious for reflection and Navkar Mantra. Begin with a purified heart.',
    defaultTitle: '🤲 Brahma Muhurta — Begin Pratikraman',
    defaultBody: 'Jai Jinendra! The pre-dawn hour is auspicious for reflection and Navkar Mantra. Begin with a purified heart.',
    placeholders: [],
    isActive: true,
  },
  {
    id: 'madhyahn:hindu',
    routine: 'madhyahn',
    tradition: 'hindu',
    category: 'daily_routine',
    name: 'Midday Madhyahn Sandhya (Hindu)',
    description: 'Noon pause and Surya Namaskar reminder',
    titleTemplate: '🌞 Madhyahn Sandhya — 2 minutes',
    bodyTemplate: 'Pause at noon. Offer the midday Surya namaskar. Brief and complete.',
    defaultTitle: '🌞 Madhyahn Sandhya — 2 minutes',
    defaultBody: 'Pause at noon. Offer the midday Surya namaskar. Brief and complete.',
    placeholders: [],
    isActive: true,
  },
  {
    id: 'madhyahn:sikh',
    routine: 'madhyahn',
    tradition: 'sikh',
    category: 'daily_routine',
    name: 'Midday Simran (Sikh)',
    description: 'Afternoon remembrance of Naam',
    titleTemplate: '🌞 Midday Simran',
    bodyTemplate: "Waheguru's naam in the afternoon — brief and complete.",
    defaultTitle: '🌞 Midday Simran',
    defaultBody: "Waheguru's naam in the afternoon — brief and complete.",
    placeholders: [],
    isActive: true,
  },
  {
    id: 'sandhya:hindu',
    routine: 'sandhya',
    tradition: 'hindu',
    category: 'daily_routine',
    name: 'Sandhya Diya (Hindu)',
    description: 'Sunset prayer and lamp lighting reminder',
    titleTemplate: '🪔 Sandhya Diya — the day closes',
    bodyTemplate: 'Light the lamp. Offer the evening prayer. The day returns to the one who gave it.',
    defaultTitle: '🪔 Sandhya Diya — the day closes',
    defaultBody: 'Light the lamp. Offer the evening prayer. The day returns to the one who gave it.',
    placeholders: [],
    isActive: true,
  },
  {
    id: 'sandhya:sikh',
    routine: 'sandhya',
    tradition: 'sikh',
    category: 'daily_routine',
    name: 'Rehras Sahib (Sikh)',
    description: 'Sunset Rehras Sahib prayer reminder',
    titleTemplate: '🪔 Rehras Sahib',
    bodyTemplate: 'The sun is setting. Rehras Sahib closes the day with grace.',
    defaultTitle: '🪔 Rehras Sahib',
    defaultBody: 'The sun is setting. Rehras Sahib closes the day with grace.',
    placeholders: [],
    isActive: true,
  },
  {
    id: 'mood_evening:all',
    routine: 'mood_evening',
    tradition: 'all',
    category: 'daily_routine',
    name: 'Nightly Mood & Reflection',
    description: 'Evening gratitude and spiritual check-in',
    titleTemplate: 'Evening check-in 🌙',
    bodyTemplate: 'How has your inner journey been today? Let scripture meet your mood.',
    defaultTitle: 'Evening check-in 🌙',
    defaultBody: 'How has your inner journey been today? Let scripture meet your mood.',
    placeholders: [
      { key: 'userName', label: 'Seeker Name', sample: 'Sadhak', description: 'Name of devotee' },
    ],
    isActive: true,
  },

  // ── 2. Sadhana & Spiritual Practice ──
  {
    id: 'japa:all',
    routine: 'japa',
    tradition: 'all',
    category: 'sadhana',
    name: 'Daily Japa Mala Reminder',
    description: 'Daily mantra chanting reminder to maintain streak',
    titleTemplate: '🔔 Time for Japa',
    bodyTemplate: 'Your daily Japa practice awaits. Keep your streak alive 🙏',
    defaultTitle: '🔔 Time for Japa',
    defaultBody: 'Your daily Japa practice awaits. Keep your streak alive 🙏',
    placeholders: [
      { key: 'streak', label: 'Current Streak', sample: '7', description: 'Number of consecutive practice days' },
      { key: 'mantraName', label: 'Preferred Mantra', sample: 'Maha Mrityunjaya', description: 'Devotee favorite mantra' },
    ],
    isActive: true,
  },
  {
    id: 'shloka:all',
    routine: 'shloka',
    tradition: 'all',
    category: 'sadhana',
    name: 'Daily Sacred Shloka & Streak',
    description: 'Daily verse reading notification',
    titleTemplate: '{{symbol}} {{sacredTextLabel}} awaits',
    bodyTemplate: "{{streakMessage}} Take a moment for today's {{shlokaWord}}.{{tithiSuffix}}",
    defaultTitle: '{{symbol}} {{sacredTextLabel}} awaits',
    defaultBody: "{{streakMessage}} Take a moment for today's {{shlokaWord}}.{{tithiSuffix}}",
    placeholders: [
      { key: 'symbol', label: 'Tradition Symbol', sample: '🕉️', description: 'Sacred glyph for tradition' },
      { key: 'sacredTextLabel', label: 'Scripture Name', sample: 'Bhagavad Gita', description: 'Target sacred text' },
      { key: 'streakMessage', label: 'Streak Message', sample: "Don't break your 14-day streak! 🔥", description: 'Dynamic streak incentive' },
      { key: 'shlokaWord', label: 'Verse Term', sample: 'shloka', description: 'Tradition term (shloka/shabad/sutra)' },
      { key: 'tithiSuffix', label: 'Tithi Suffix', sample: ' Today is Shukla Ekadashi — powerful for reading.', description: 'Optional lunar day boost' },
    ],
    isActive: true,
  },
  {
    id: 'sankalpa:all',
    routine: 'sankalpa',
    tradition: 'all',
    category: 'sadhana',
    name: 'Sankalpa Mid-Point Check-in',
    description: 'Encouragement when reaching 50% of committed spiritual vow',
    titleTemplate: '⚡ Sankalpa Shakti — Halfway There!',
    bodyTemplate: '{{aiEncouragement}}',
    defaultTitle: '⚡ Sankalpa Shakti — Halfway There!',
    defaultBody: '{{aiEncouragement}}',
    placeholders: [
      { key: 'aiEncouragement', label: 'AI Dharma Mitra Note', sample: 'You have walked half the path of your 21-day Sankalpa. Let your abhyasa remain steadfast 🙏', description: 'AI personalized contemplation' },
      { key: 'targetDays', label: 'Target Days', sample: '21', description: 'Total duration of sankalpa' },
      { key: 'sankalpaText', label: 'Sankalpa Title', sample: 'Daily Morning Japa', description: 'The vow text' },
    ],
    isActive: true,
  },
  {
    id: 'guided_plan:all',
    routine: 'guided_plan',
    tradition: 'all',
    category: 'sadhana',
    name: 'Guided Pathshala Plan Nudge',
    description: 'Notification for step-by-step spiritual curriculum courses',
    titleTemplate: '{{emoji}} Day {{dayNumber}} — {{dayTitle}}',
    bodyTemplate: 'Your next contemplation step is ready. 5 minutes to ground your day.',
    defaultTitle: '{{emoji}} Day {{dayNumber}} — {{dayTitle}}',
    defaultBody: 'Your next contemplation step is ready. 5 minutes to ground your day.',
    placeholders: [
      { key: 'emoji', label: 'Plan Icon', sample: '🌿', description: 'Course emoji' },
      { key: 'dayNumber', label: 'Day Number', sample: '5', description: 'Current day in plan' },
      { key: 'dayTitle', label: 'Lesson Title', sample: 'The 3 Gunas of Nature', description: 'Title of the contemplation' },
    ],
    isActive: true,
  },

  // ── 3. Temples & Live Aarti ──
  {
    id: 'aarti_morning:all',
    routine: 'aarti_morning',
    tradition: 'all',
    category: 'aarti',
    name: 'Morning Mangala Aarti Alert',
    description: 'Notification when subscribed temple begins morning aarti',
    titleTemplate: '🌅 Mangal Aarti — {{templeShort}}',
    bodyTemplate: 'Morning aarti at {{aartiTime}} has begun. Join the darshan. 🙏',
    defaultTitle: '🌅 Mangal Aarti — {{templeShort}}',
    defaultBody: 'Morning aarti at {{aartiTime}} has begun. Join the darshan. 🙏',
    placeholders: [
      { key: 'templeShort', label: 'Temple Name', sample: 'Kashi Vishwanath', description: 'Short name of temple' },
      { key: 'aartiTime', label: 'Aarti Time', sample: '4:00 AM', description: 'Official schedule time' },
    ],
    isActive: true,
  },
  {
    id: 'aarti_evening:all',
    routine: 'aarti_evening',
    tradition: 'all',
    category: 'aarti',
    name: 'Evening Sandhya Aarti Alert',
    description: 'Notification when subscribed temple begins evening aarti',
    titleTemplate: '🪔 Sandhya Aarti — {{templeShort}}',
    bodyTemplate: 'Evening aarti at {{aartiTime}} is beginning. Offer your prayers. 🙏',
    defaultTitle: '🪔 Sandhya Aarti — {{templeShort}}',
    defaultBody: 'Evening aarti at {{aartiTime}} is beginning. Offer your prayers. 🙏',
    placeholders: [
      { key: 'templeShort', label: 'Temple Name', sample: 'Somnath Jyotirlinga', description: 'Short name of temple' },
      { key: 'aartiTime', label: 'Aarti Time', sample: '7:00 PM', description: 'Official schedule time' },
    ],
    isActive: true,
  },

  // ── 4. Calendar, Vrats & Festivals ──
  {
    id: 'vrat_eve:all',
    routine: 'vrat',
    tradition: 'all',
    category: 'calendar',
    name: 'Vrat Eve (D-1 Preparation)',
    description: 'Reminder on the day before an upcoming sacred fast',
    titleTemplate: '🌿 Tomorrow is {{vratName}}',
    bodyTemplate: 'Prepare for your sacred fast. Fasting window begins at sunrise. Parana window: {{paranaWindow}}.',
    defaultTitle: '🌿 Tomorrow is {{vratName}}',
    defaultBody: 'Prepare for your sacred fast. Fasting window begins at sunrise. Parana window: {{paranaWindow}}.',
    placeholders: [
      { key: 'vratName', label: 'Vrat Name', sample: 'Nirjala Ekadashi', description: 'Name of the fast' },
      { key: 'paranaWindow', label: 'Parana Window', sample: '05:42 AM – 08:15 AM', description: 'Time window to break fast' },
    ],
    isActive: true,
  },
  {
    id: 'vrat_day:all',
    routine: 'vrat',
    tradition: 'all',
    category: 'calendar',
    name: 'Vrat Day (D0 Observance)',
    description: 'Reminder on the morning of a sacred fast',
    titleTemplate: '🌿 Today is {{vratName}}',
    bodyTemplate: 'May this sacred observance bring clarity and peace. Review your parana breaking-fast timings.',
    defaultTitle: '🌿 Today is {{vratName}}',
    defaultBody: 'May this sacred observance bring clarity and peace. Review your parana breaking-fast timings.',
    placeholders: [
      { key: 'vratName', label: 'Vrat Name', sample: 'Pradosha Vrat', description: 'Name of the fast' },
    ],
    isActive: true,
  },
  {
    id: 'festival_d1:all',
    routine: 'festival',
    tradition: 'all',
    category: 'calendar',
    name: 'Festival Eve (D-1)',
    description: 'Celebration alert on the eve of a major festival',
    titleTemplate: '🪔 Tomorrow is {{festivalName}}',
    bodyTemplate: 'The sacred celebration of {{festivalName}} begins tomorrow. Shubh {{festivalName}}! ✨',
    defaultTitle: '🪔 Tomorrow is {{festivalName}}',
    defaultBody: 'The sacred celebration of {{festivalName}} begins tomorrow. Shubh {{festivalName}}! ✨',
    placeholders: [
      { key: 'festivalName', label: 'Festival Name', sample: 'Diwali', description: 'Name of festival' },
    ],
    isActive: true,
  },
  {
    id: 'festival_d0:all',
    routine: 'festival',
    tradition: 'all',
    category: 'calendar',
    name: 'Festival Day (D0)',
    description: 'Festive greeting and celebration on festival day',
    titleTemplate: '🪔 Shubh {{festivalName}}!',
    bodyTemplate: 'Wishing you and your family a blessed and joyous {{festivalName}}. Join today’s sacred celebrations 🙏',
    defaultTitle: '🪔 Shubh {{festivalName}}!',
    defaultBody: 'Wishing you and your family a blessed and joyous {{festivalName}}. Join today’s sacred celebrations 🙏',
    placeholders: [
      { key: 'festivalName', label: 'Festival Name', sample: 'Maha Shivratri', description: 'Name of festival' },
    ],
    isActive: true,
  },
];

// In-Memory Cache to ensure zero database latency on hot cron dispatches
let cachedTemplates: Map<string, { title: string; body: string; updatedAt: number }> | null = null;
let cacheLoadedAt = 0;
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 mins

export function interpolateTemplate(template: string, data: Record<string, string | number | null | undefined>): string {
  if (!template) return '';
  return template.replace(/\{\{\s*(\w+)\s*\}\}|\{\s*(\w+)\s*\}/g, (_, key1, key2) => {
    const key = key1 || key2;
    const value = data[key];
    return value !== null && value !== undefined ? String(value) : '';
  });
}

export async function getActiveNotificationTemplates(): Promise<Map<string, { title: string; body: string }>> {
  const now = Date.now();
  if (cachedTemplates && now - cacheLoadedAt < CACHE_TTL_MS) {
    return cachedTemplates;
  }

  const map = new Map<string, { title: string; body: string }>();

  // Initialize with hardcoded baseline defaults
  for (const item of DEFAULT_NOTIFICATION_TEMPLATES) {
    map.set(item.id, { title: item.titleTemplate, body: item.bodyTemplate });
  }

  try {
    const supabase = createAdminClient();
    const { data: rows, error } = await supabase
      .from('notification_templates' as any)
      .select('id, title_template, body_template, is_active');

    // `notification_templates` is not yet in src/types/database.ts (it's
    // defined by an unapplied migration -- see that file's own header note
    // on schema drift), so the typed client can't resolve a row shape for
    // it and infers `never` even with `.from(... as any)` above. Cast the
    // result explicitly instead of loosening the client's typing further.
    const typedRows = rows as unknown as Array<{
      id: string;
      title_template: string | null;
      body_template: string | null;
      is_active: boolean | null;
    }> | null;

    if (!error && Array.isArray(typedRows)) {
      for (const row of typedRows) {
        if (row.is_active && row.title_template && row.body_template) {
          map.set(row.id, { title: row.title_template, body: row.body_template });
        }
      }
    }
  } catch {
    // If DB is unreachable, seamlessly proceed with code baseline
  }

  cachedTemplates = map as any;
  cacheLoadedAt = now;
  return map;
}

export function invalidateNotificationTemplateCache(): void {
  cachedTemplates = null;
  cacheLoadedAt = 0;
}

export async function resolveNotificationCopy(
  routine: string,
  tradition: string = 'all',
  fallback: { title: string; body: string },
  contextVars: Record<string, string | number | null | undefined> = {}
): Promise<{ title: string; body: string }> {
  const templates = await getActiveNotificationTemplates();
  const specificKey = `${routine}:${tradition}`;
  const universalKey = `${routine}:all`;

  const template = templates.get(specificKey) || templates.get(universalKey) || {
    title: fallback.title,
    body: fallback.body,
  };

  return {
    title: interpolateTemplate(template.title, contextVars) || fallback.title,
    body: interpolateTemplate(template.body, contextVars) || fallback.body,
  };
}

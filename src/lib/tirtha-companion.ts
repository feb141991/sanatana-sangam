import type { Temple } from '@/lib/overpass';
import { FESTIVALS_2026, daysUntil, type Festival } from '@/lib/festivals';
import { getTraditionMeta } from '@/lib/tradition-config';

export type TirthaPrivacy = 'private' | 'family' | 'mandali' | 'public';
export type TirthaMood = 'gratitude' | 'calm' | 'clarity' | 'seva' | 'family_blessing' | 'remembrance';

export interface TirthaSaveRow {
  id: string;
  place_id: string;
  created_at: string;
  note: string | null;
}

export interface TirthaVisitRow {
  id: string;
  place_id: string;
  visited_at: string;
  privacy: TirthaPrivacy;
  darshan_mood: TirthaMood | string | null;
  intention: string | null;
  reflection: string | null;
  companions: string | null;
  pradakshina_count: number | null;
  seva_note: string | null;
}

export const TIRTHA_MOODS: Array<{ id: TirthaMood; label: string; prompt: string }> = [
  { id: 'gratitude', label: 'Gratitude', prompt: 'I received thankfulness.' },
  { id: 'calm', label: 'Calm', prompt: 'My mind became quieter.' },
  { id: 'clarity', label: 'Clarity', prompt: 'Something became clearer.' },
  { id: 'seva', label: 'Seva', prompt: 'I felt called to serve.' },
  { id: 'family_blessing', label: 'Family blessing', prompt: 'I carried my family with me.' },
  { id: 'remembrance', label: 'Remembrance', prompt: 'I remembered what matters.' },
];

export const TIRTHA_PRIVACY_OPTIONS: Array<{ id: TirthaPrivacy; label: string; description: string }> = [
  { id: 'private', label: 'Private', description: 'Only visible in your Tirtha Passport.' },
  { id: 'family', label: 'Family', description: 'For future Kul memory sharing.' },
  { id: 'mandali', label: 'Mandali', description: 'For future local community signals.' },
  { id: 'public', label: 'Public', description: 'May appear as a delayed public visit signal.' },
];

export function tirthaPlaceId(temple: Temple) {
  return `overpass:${temple.id}`;
}

export function templeToPlaceRow(temple: Temple, userId?: string | null) {
  return {
    id: tirthaPlaceId(temple),
    source: 'overpass',
    source_id: String(temple.id),
    name: temple.name,
    tradition: temple.tradition,
    lat: temple.lat,
    lon: temple.lon,
    address: temple.address ?? null,
    website: temple.website ?? null,
    phone: temple.phone ?? null,
    opening_hours: temple.opening ?? null,
    deity: temple.deity ?? null,
    sampradaya: temple.sampradaya ?? null,
    source_confidence: 'community_import',
    created_by: userId ?? null,
    updated_at: new Date().toISOString(),
  };
}

export function getVisitPreparation(temple: Temple) {
  const meta = getTraditionMeta(temple.tradition);
  const common = ['Carry patience', 'Confirm timings before travel', 'Keep phone quiet'];

  if (temple.tradition === 'sikh') {
    return {
      title: 'Prepare for sangat',
      etiquette: ['Cover your head', 'Remove shoes', 'Sit with sangat respectfully', 'Ask before taking photos'],
      offerings: ['Langar seva', 'Rumala Sahib seva where available', 'Quiet simran'],
      practical: ['Check langar hours', 'Look for parking and entry signs', ...common],
      photoPolicy: 'Ask before photos inside the darbar hall',
      seva: 'Langar, cleaning, shoe seva, or community support',
      rhythm: meta.visitRhythm.items,
    };
  }

  if (temple.tradition === 'buddhist') {
    return {
      title: 'Prepare for stillness',
      etiquette: ['Remove shoes where requested', 'Keep voices low', 'Bow only as comfortable', 'Avoid flash photos'],
      offerings: ['Dana', 'Flowers', 'Candle or lamp where permitted', 'Silent meditation'],
      practical: ['Check meditation session times', 'Arrive early', ...common],
      photoPolicy: 'Often allowed in outer areas, but ask first',
      seva: 'Dana, meditation support, cleaning, or event volunteering',
      rhythm: meta.visitRhythm.items,
    };
  }

  if (temple.tradition === 'jain') {
    return {
      title: 'Prepare for jina darshan',
      etiquette: ['Remove leather items where required', 'Observe silence', 'Respect food and purity rules', 'Ask before photos'],
      offerings: ['Ashtaprakari puja where appropriate', 'Samayika', 'Pratikraman', 'Ahimsa seva'],
      practical: ['Check bhojanshala or pratikraman timings', 'Confirm sect-specific rules', ...common],
      photoPolicy: 'Usually ask first; many derasars restrict inner photos',
      seva: 'Ahimsa seva, bhojanshala support, pratikraman participation',
      rhythm: meta.visitRhythm.items,
    };
  }

  return {
    title: 'Prepare for darshan',
    etiquette: ['Remove shoes', 'Dress respectfully', 'Ask before photos', 'Follow local queue and prasad rules'],
    offerings: ['Flowers', 'Prasad', 'Annadaan', 'Seva', 'Quiet japa'],
    practical: ['Check aarti or darshan timings', 'Look for family-friendly access', ...common],
    photoPolicy: 'Photo policy varies; ask before inner-sanctum photos',
    seva: 'Annadaan, cleaning, volunteering, or temple support',
    rhythm: meta.visitRhythm.items,
  };
}

function normalize(input: string) {
  return input.toLowerCase();
}

export function getSeasonalTirthaCue(tradition?: string | null, today: Date = new Date()) {
  const relevant = FESTIVALS_2026
    .map((festival) => ({ festival, days: daysUntil(festival.date, today) }))
    .filter(({ festival, days }) => days >= 0 && days <= 14 && (!tradition || tradition === 'other' || festival.tradition === tradition || festival.tradition === 'all'))
    .sort((a, b) => a.days - b.days)[0];

  if (relevant) {
    const { festival, days } = relevant;
    return {
      label: days === 0 ? `${festival.name} today` : `${festival.name} in ${days} day${days === 1 ? '' : 's'}`,
      description: seasonalDescription(festival),
      filterHint: seasonalFilterHint(festival),
      festival,
    };
  }

  const weekday = today.getDay();
  if (weekday === 1) return { label: 'Monday Shiva rhythm', description: 'If this fits your path, Shiva mandirs can be a meaningful visit today.', filterHint: 'shiva', festival: null };
  if (weekday === 4) return { label: 'Thursday guru rhythm', description: 'Look for satsang, Guru, Sai, Vishnu, or sangat spaces depending on your tradition.', filterHint: 'guru', festival: null };
  if (weekday === 6 || weekday === 0) return { label: 'Weekend yatra window', description: 'Plan one nearby visit with family or a quiet solo darshan.', filterHint: 'family', festival: null };

  return { label: 'Sacred places near you', description: 'Choose one place to save, prepare for, or visit when the time feels right.', filterHint: 'nearby', festival: null };
}

function seasonalDescription(festival: Festival) {
  const name = normalize(festival.name);
  if (festival.tradition === 'sikh' || name.includes('gurpurab') || name.includes('baisakhi')) return 'Gurdwaras, sangat, kirtan, and langar may be especially meaningful.';
  if (festival.tradition === 'buddhist' || name.includes('vesak') || name.includes('purnima')) return 'Viharas, meditation centers, chanting, and dana are especially relevant.';
  if (festival.tradition === 'jain' || name.includes('paryush') || name.includes('mahavir')) return 'Jain temples, pratikraman, samayika, and ahimsa seva are especially relevant.';
  if (name.includes('shiv')) return 'Shiva mandirs, night vigil, japa, and simple offerings are especially relevant.';
  if (name.includes('navratri') || name.includes('durga')) return 'Devi temples and family-friendly darshan routes are especially relevant.';
  if (name.includes('janmashtami') || name.includes('ekadashi')) return 'Krishna and Vishnu temples, kirtan, and vrata guidance are especially relevant.';
  return 'Use this season to choose a nearby sacred place with intention.';
}

function seasonalFilterHint(festival: Festival) {
  const name = normalize(festival.name);
  if (festival.tradition === 'sikh') return 'gurudwara';
  if (festival.tradition === 'buddhist') return 'vihara';
  if (festival.tradition === 'jain') return 'jain';
  if (name.includes('shiv')) return 'shiva';
  if (name.includes('durga') || name.includes('navratri')) return 'devi';
  if (name.includes('krishna') || name.includes('ekadashi')) return 'krishna';
  return festival.tradition;
}

export function templeMatchesSmartFilter(temple: Temple, filter: string, saved: boolean, visited: boolean) {
  if (filter === 'all') return true;
  if (filter === 'saved') return saved;
  if (filter === 'visited') return visited;
  if (filter === 'open') return true;
  if (filter === 'live') return false;

  const haystack = normalize([temple.name, temple.tradition, temple.deity, temple.sampradaya, temple.address].filter(Boolean).join(' '));
  return haystack.includes(normalize(filter));
}

export function buildTirthaShareText(temple: Temple, mood?: string | null) {
  const meta = getTraditionMeta(temple.tradition);
  const place = `${temple.name}${temple.address ? `, ${temple.address}` : ''}`;
  const received = mood ? `\nI received: ${mood.replace(/_/g, ' ')}.` : '';
  return `I saved a sacred visit at ${place} on Shoonaya.${received}\n\n${meta.badgeLabel} · Tirtha Passport`;
}

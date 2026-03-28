import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRelativeTime(date: string | Date): string {
  const now = new Date();
  const then = new Date(date);
  const diffMs = now.getTime() - then.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return then.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' });
}

export function getInitials(name: string): string {
  return name
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);
}

// Re-export tradition-aware data from traditions.ts
export { TRADITIONS, SAMPRADAYAS_BY_TRADITION, ISHTA_DEVATAS_BY_TRADITION, getGreeting, getIshtaDevataLabel, getSampradayaLabel } from './traditions';

// Backward-compat flat lists (used by legacy components)
export const SAMPRADAYAS = [
  { value: 'vaishnava',    label: 'Vaishnava' },
  { value: 'shaiva',       label: 'Shaiva' },
  { value: 'shakta',       label: 'Shakta' },
  { value: 'smarta',       label: 'Smarta' },
  { value: 'iskcon',       label: 'ISKCON' },
  { value: 'swaminarayan', label: 'Swaminarayan' },
  { value: 'arya_samaj',   label: 'Arya Samaj' },
  { value: 'veerashaiva',  label: 'Veerashaiva' },
  { value: 'khalsa',       label: 'Khalsa (Sikh)' },
  { value: 'nanakpanthi',  label: 'Nanakpanthi (Sikh)' },
  { value: 'theravada',    label: 'Theravada (Buddhist)' },
  { value: 'mahayana',     label: 'Mahayana (Buddhist)' },
  { value: 'digambara',    label: 'Digambara (Jain)' },
  { value: 'shvetambara',  label: 'Shvetambara (Jain)' },
  { value: 'other',        label: 'Other / Exploring' },
];

export const ISHTA_DEVATAS = [
  { value: 'krishna',          label: 'Shri Krishna',    emoji: '🦚' },
  { value: 'vishnu',           label: 'Shri Vishnu',     emoji: '🌺' },
  { value: 'rama',             label: 'Shri Rama',       emoji: '🏹' },
  { value: 'shiva',            label: 'Shri Shiva',      emoji: '🔱' },
  { value: 'durga',            label: 'Maa Durga',       emoji: '⚔️' },
  { value: 'lakshmi',          label: 'Maa Lakshmi',     emoji: '🪷' },
  { value: 'saraswati',        label: 'Maa Saraswati',   emoji: '🎶' },
  { value: 'ganesha',          label: 'Shri Ganesha',    emoji: '🐘' },
  { value: 'hanuman',          label: 'Shri Hanuman',    emoji: '🙏' },
  { value: 'waheguru',         label: 'Waheguru',        emoji: '☬' },
  { value: 'buddha',           label: 'Shakyamuni Buddha', emoji: '☸️' },
  { value: 'avalokiteshvara',  label: 'Avalokiteshvara', emoji: '🪷' },
  { value: 'mahavir',          label: 'Bhagwan Mahavir', emoji: '🤲' },
  { value: 'other',            label: 'Other',           emoji: '✨' },
];

export const SPIRITUAL_LEVELS = [
  { value: 'jigyasu',   label: 'Nava-Jigyasu',  desc: 'Curious beginner — just starting to explore' },
  { value: 'sadhaka',   label: 'Sadhaka',        desc: 'Regular practitioner — actively on the path' },
  { value: 'anubhavi',  label: 'Anubhavi',       desc: 'Experienced — deep in practice and study' },
];

export const FORUM_CATEGORIES = [
  { value: 'prashnottari',  label: 'Prashnottari',         desc: 'Q&A — ask any spiritual or dharmic question',       emoji: '❓' },
  { value: 'katha',         label: 'Katha Corner',          desc: 'Stories, parables and family traditions',            emoji: '📖' },
  { value: 'shastra',       label: 'Shastra Svadhyaya',     desc: 'Scripture study — line-by-line reflections',         emoji: '📜' },
  { value: 'sampradaya',    label: 'Sampradaya Rooms',      desc: 'Hindu tradition-specific discussions',               emoji: '🏛️' },
  { value: 'sikh_vichar',   label: 'Sikh Vichar',           desc: 'Gurbani, Sikh history and Gurmat discussions',       emoji: '☬' },
  { value: 'bauddh_darshan',label: 'Bauddh Darshan',        desc: 'Buddhist philosophy, meditation and Dhamma',         emoji: '☸️' },
  { value: 'jain_darshan',  label: 'Jain Darshan',          desc: 'Jain philosophy, ahimsa and Mahavir teachings',      emoji: '🤲' },
  { value: 'modern_life',   label: 'Dharma & Modern Life',  desc: 'How to live dharma in the modern world',             emoji: '🌍' },
  { value: 'jijnasa',       label: 'Jijnasa Zone',          desc: 'For those curious about Sanatan traditions — non-judgmental entry point', emoji: '🌱' },
];

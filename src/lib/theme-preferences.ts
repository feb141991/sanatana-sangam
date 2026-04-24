export type ThemePreference = 'system' | 'dark' | 'light';

export const THEME_STORAGE_KEY = 'sangam_theme_preference';

export const THEME_OPTIONS: { value: ThemePreference; label: string; description: string }[] = [
  { value: 'system', label: 'System', description: 'Follow this device' },
  { value: 'dark', label: 'Dark', description: 'Temple evening mode' },
  { value: 'light', label: 'Light', description: 'Calm daylight mode' },
];

export function isThemePreference(value: unknown): value is ThemePreference {
  return value === 'system' || value === 'dark' || value === 'light';
}

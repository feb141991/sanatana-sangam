export type MvpThemeKey = 'pathshala' | 'bhakti' | 'kul' | 'mandali' | 'tirtha' | 'panchang';

export type MvpTheme = {
  eyebrow: string;
  accent: string;
  accentStrong: string;
  border: string;
  iconWell: string;
  surface: string;
  aura: string;
};

export const MVP_THEMES: Record<MvpThemeKey, MvpTheme> = {
  pathshala: {
    eyebrow: 'Study',
    accent: '#8a6a2f',
    accentStrong: '#6f5421',
    border: 'rgba(138, 106, 47, 0.16)',
    iconWell: 'rgba(138, 106, 47, 0.1)',
    surface: 'linear-gradient(135deg, #f6f0e7 0%, #fffdfa 100%)',
    aura: 'radial-gradient(circle at 18% 12%, rgba(138, 106, 47, 0.18), transparent 34%), radial-gradient(circle at 82% 18%, rgba(124, 58, 45, 0.12), transparent 32%)',
  },
  bhakti: {
    eyebrow: 'Practice',
    accent: 'var(--brand-primary)',
    accentStrong: 'var(--brand-primary-strong)',
    border: 'rgba(124, 58, 45, 0.14)',
    iconWell: 'rgba(124, 58, 45, 0.08)',
    surface: 'linear-gradient(135deg, #f4ece6 0%, #fffdfb 100%)',
    aura: 'radial-gradient(circle at 20% 12%, rgba(124, 58, 45, 0.16), transparent 32%), radial-gradient(circle at 82% 16%, rgba(107, 138, 122, 0.1), transparent 30%)',
  },
  kul: {
    eyebrow: 'Family',
    accent: 'var(--brand-secondary)',
    accentStrong: '#557060',
    border: 'rgba(107, 138, 122, 0.18)',
    iconWell: 'rgba(107, 138, 122, 0.1)',
    surface: 'linear-gradient(135deg, #eef2ef 0%, #ffffff 100%)',
    aura: 'radial-gradient(circle at 18% 14%, rgba(107, 138, 122, 0.18), transparent 32%), radial-gradient(circle at 82% 18%, rgba(124, 58, 45, 0.08), transparent 30%)',
  },
  mandali: {
    eyebrow: 'Community',
    accent: 'var(--brand-earth)',
    accentStrong: '#56493f',
    border: 'rgba(107, 90, 77, 0.16)',
    iconWell: 'rgba(107, 90, 77, 0.1)',
    surface: 'linear-gradient(135deg, #f3efea 0%, #ffffff 100%)',
    aura: 'radial-gradient(circle at 18% 14%, rgba(107, 90, 77, 0.16), transparent 32%), radial-gradient(circle at 80% 18%, rgba(124, 58, 45, 0.08), transparent 30%)',
  },
  tirtha: {
    eyebrow: 'Discovery',
    accent: '#7a5e2a',
    accentStrong: '#604a22',
    border: 'rgba(111, 84, 33, 0.16)',
    iconWell: 'rgba(111, 84, 33, 0.1)',
    surface: 'linear-gradient(135deg, #f3eee7 0%, #fffdf9 100%)',
    aura: 'radial-gradient(circle at 16% 14%, rgba(111, 84, 33, 0.16), transparent 32%), radial-gradient(circle at 82% 18%, rgba(124, 58, 45, 0.08), transparent 30%)',
  },
  panchang: {
    eyebrow: 'Sacred Time',
    accent: 'var(--brand-primary)',
    accentStrong: 'var(--brand-primary-strong)',
    border: 'rgba(124, 58, 45, 0.16)',
    iconWell: 'rgba(124, 58, 45, 0.1)',
    surface: 'linear-gradient(135deg, #f8efe7 0%, #fffdfa 100%)',
    aura: 'radial-gradient(circle at 16% 14%, rgba(124, 58, 45, 0.16), transparent 32%), radial-gradient(circle at 84% 18%, rgba(107, 138, 122, 0.1), transparent 30%)',
  },
};

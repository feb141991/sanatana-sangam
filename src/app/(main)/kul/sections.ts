export const KUL_SECTION_VIEWS = ['members', 'tasks', 'sabha', 'vansh', 'events', 'sanskara'] as const;

export type KulSectionView = typeof KUL_SECTION_VIEWS[number];

export function isKulSectionView(value: string): value is KulSectionView {
  return KUL_SECTION_VIEWS.includes(value as KulSectionView);
}

export type MandaliPromptLanguage = 'en' | 'hi' | 'pa';

export type MandaliPromptText = {
  id: string;
  text_en: string;
  text_hi: string | null;
  text_pa: string | null;
};

export function normalizeMandaliPromptLanguage(value?: string | null): MandaliPromptLanguage {
  return value === 'hi' || value === 'pa' ? value : 'en';
}

/** The shared Mandali rotation changes at 00:00 UTC for every circle. */
export function getMandaliPromptDate(now: Date = new Date()): string {
  return now.toISOString().slice(0, 10);
}

export function selectMandaliPromptForDate(
  prompts: MandaliPromptText[],
  promptDate: string,
): MandaliPromptText | null {
  if (prompts.length === 0) return null;

  const ordered = [...prompts].sort((left, right) => left.id.localeCompare(right.id));
  const epochDay = Math.floor(Date.parse(`${promptDate}T00:00:00.000Z`) / 86_400_000);
  if (!Number.isFinite(epochDay)) return null;
  return ordered[((epochDay % ordered.length) + ordered.length) % ordered.length];
}

export function localizeMandaliPrompt(
  prompt: MandaliPromptText,
  language?: string | null,
): string {
  switch (normalizeMandaliPromptLanguage(language)) {
    case 'hi':
      return prompt.text_hi?.trim() || prompt.text_en;
    case 'pa':
      return prompt.text_pa?.trim() || prompt.text_en;
    case 'en':
      return prompt.text_en;
  }
}

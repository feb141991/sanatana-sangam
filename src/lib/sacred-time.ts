export function isValidTimeZone(timeZone: string | null | undefined): boolean {
  if (!timeZone) return false;
  try {
    new Intl.DateTimeFormat('en-GB', { timeZone }).format(new Date());
    return true;
  } catch {
    return false;
  }
}

export function resolveTimeZone(timeZone: string | null | undefined): string {
  return isValidTimeZone(timeZone) ? timeZone! : 'UTC';
}

function getParts(date: Date, timeZone: string) {
  const formatter = new Intl.DateTimeFormat('en-GB', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });

  const parts = formatter.formatToParts(date);
  const part = (type: string) => parts.find((item) => item.type === type)?.value ?? '';

  return {
    year: Number(part('year')),
    month: Number(part('month')),
    day: Number(part('day')),
    hour: Number(part('hour')),
    minute: Number(part('minute')),
  };
}

export function getLocalDateIso(date: Date, timeZone: string): string {
  const { year, month, day } = getParts(date, resolveTimeZone(timeZone));
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export function getLocalHour(date: Date, timeZone: string): number {
  return getParts(date, resolveTimeZone(timeZone)).hour;
}

export function isLocalHour(date: Date, timeZone: string, targetHour: number): boolean {
  return getLocalHour(date, timeZone) === targetHour;
}

export function isoDateDiff(targetDateIso: string, baseDateIso: string): number {
  const target = new Date(`${targetDateIso}T00:00:00Z`);
  const base = new Date(`${baseDateIso}T00:00:00Z`);
  return Math.round((target.getTime() - base.getTime()) / 86_400_000);
}

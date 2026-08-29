export const HOME_OBSERVANCE_LOOKAHEAD_DAYS = 16;

export function getHomeObservanceWindowEnd(today: string): string {
  const date = new Date(`${today}T12:00:00Z`);
  date.setUTCDate(date.getUTCDate() + HOME_OBSERVANCE_LOOKAHEAD_DAYS);
  return date.toISOString().slice(0, 10);
}

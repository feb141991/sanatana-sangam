export function generateActivityGrid(activeDates: string[], todayStr: string, length: number = 28): boolean[] {
  const dateSet = new Set(activeDates);
  // Use UTC-noon arithmetic entirely in UTC to avoid local/UTC date mismatch across timezones
  const todayMs = Date.UTC(
    parseInt(todayStr.slice(0, 4)),
    parseInt(todayStr.slice(5, 7)) - 1,
    parseInt(todayStr.slice(8, 10)),
    12, 0, 0
  );
  return Array.from({ length }, (_, i) => {
    const ms = todayMs - ((length - 1) - i) * 86_400_000;
    const d  = new Date(ms);
    const dateStr = d.toISOString().slice(0, 10);
    return dateSet.has(dateStr);
  });
}

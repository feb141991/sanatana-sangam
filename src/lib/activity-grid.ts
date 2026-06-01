export function generateActivityGrid(activeDates: string[], todayStr: string, length: number = 28): boolean[] {
  const dateSet = new Set(activeDates);
  return Array.from({ length }, (_, i) => {
    const d = new Date(todayStr + 'T12:00:00Z');
    d.setDate(d.getDate() - ((length - 1) - i));
    return dateSet.has(d.toISOString().split('T')[0]);
  });
}

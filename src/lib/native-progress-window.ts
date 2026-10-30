/** Matches the existing Progress window, inclusive of today and 181 prior days. */
export function nativeProgressWindow(now = new Date()) {
  const start = new Date(now);
  start.setDate(start.getDate() - 181);
  return { today: now.toISOString().slice(0, 10), start182d: start.toISOString().slice(0, 10) };
}
